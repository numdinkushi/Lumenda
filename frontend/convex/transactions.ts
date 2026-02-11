import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Transaction operations for tracking blockchain transactions.
 * Provides reliable mapping between transfer IDs and transaction IDs.
 */

/**
 * Store a new transaction record.
 * Called when a transaction is submitted to the blockchain.
 */
export const createTransaction = mutation({
    args: {
    txId: v.string(),
    transferId: v.number(),
    transactionType: v.union(
      v.literal("initiate"),
      v.literal("complete"),
      v.literal("cancel")
    ),
    userAddress: v.string(),
    contractAddress: v.string(),
    contractName: v.string(),
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("abort_by_response"),
      v.literal("abort_by_post_condition")
    ),
    timestamp: v.number(),
    blockHeight: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        fee: v.optional(v.string()),
        amount: v.optional(v.string()),
        recipient: v.optional(v.string()),
        sender: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const explorerUrl = args.network === "testnet" 
      ? "https://explorer.stacks.co" 
      : "https://explorer.stacks.co";

    // Check if transaction already exists
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_tx_id", (q) => q.eq("txId", args.txId))
      .first();

    if (existing) {
      // Update existing transaction
      return await ctx.db.patch(existing._id, {
        status: args.status,
        blockHeight: args.blockHeight,
        timestamp: args.timestamp,
        metadata: args.metadata,
      });
    }

    // Create new transaction
    const fullExplorerUrl = args.txId
      ? `${explorerUrl}/txid/${args.txId}${
          args.network === "testnet" ? "?chain=testnet" : ""
        }`
      : undefined;

    return await ctx.db.insert("transactions", {
      txId: args.txId,
      transferId: args.transferId,
      transactionType: args.transactionType,
      userAddress: args.userAddress,
      contractAddress: args.contractAddress,
      contractName: args.contractName,
      functionName:
        args.transactionType === "initiate"
          ? "initiate-transfer"
          : args.transactionType === "complete"
            ? "complete-transfer"
            : "cancel-transfer",
      status: args.status,
      blockHeight: args.blockHeight,
      timestamp: args.timestamp,
      network: args.network,
      explorerUrl: fullExplorerUrl,
      metadata: args.metadata,
    });
  },
});

/**
 * Get transaction by transaction ID.
 */
export const getTransactionByTxId = query({
  args: { txId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_tx_id", (q) => q.eq("txId", args.txId))
      .first();
  },
});

/**
 * Get all transactions for a specific transfer.
 */
export const getTransactionsByTransferId = query({
  args: { transferId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_transfer_id", (q) => q.eq("transferId", args.transferId))
      .collect();
  },
});

/**
 * Get transaction by transfer ID and type.
 */
export const getTransactionByTransferAndType = query({
  args: {
    transferId: v.number(),
    transactionType: v.union(
      v.literal("initiate"),
      v.literal("complete"),
      v.literal("cancel")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_transfer_and_type", (q) =>
        q.eq("transferId", args.transferId).eq("transactionType", args.transactionType)
      )
      .first();
  },
});

/**
 * Get all transactions for a user address.
 */
export const getTransactionsByUser = query({
  args: {
    userAddress: v.string(),
    transactionType: v.optional(
      v.union(v.literal("initiate"), v.literal("complete"), v.literal("cancel"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;
    
    if (args.transactionType) {
      // TypeScript needs the type narrowed - store in const with explicit type
      const transactionType: "initiate" | "complete" | "cancel" = args.transactionType;
      results = await ctx.db
        .query("transactions")
        .withIndex("by_user_and_type", (q) =>
          q.eq("userAddress", args.userAddress).eq("transactionType", transactionType)
        )
        .collect();
    } else {
      results = await ctx.db
        .query("transactions")
        .withIndex("by_user_address", (q) => q.eq("userAddress", args.userAddress))
        .collect();
    }
    
    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if provided
    if (args.limit) {
      return results.slice(0, args.limit);
    }
    
    return results;
  },
});

/**
 * Update transaction status (e.g., when pending transaction confirms).
 */
export const updateTransactionStatus = mutation({
  args: {
    txId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("abort_by_response"),
      v.literal("abort_by_post_condition")
    ),
    blockHeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db
      .query("transactions")
      .withIndex("by_tx_id", (q) => q.eq("txId", args.txId))
      .first();

    if (!transaction) {
      throw new Error(`Transaction ${args.txId} not found`);
    }

    return await ctx.db.patch(transaction._id, {
      status: args.status,
      blockHeight: args.blockHeight,
    });
  },
});
