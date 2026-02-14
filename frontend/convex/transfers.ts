import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Transfer operations for caching transfer data from the contract.
 * Provides fast access to transfer history without querying the contract directly.
 */

/**
 * Store or update a transfer record.
 * Called when syncing transfer data from the contract.
 */
export const upsertTransfer = mutation({
  args: {
    transferId: v.number(),
    sender: v.string(),
    recipient: v.string(),
    amount: v.string(),
    fee: v.string(),
    totalAmount: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
    contractAddress: v.string(),
  },
  handler: async (ctx, args) => {

    // Check if transfer already exists
    const existing = await ctx.db
      .query("transfers")
      .withIndex("by_transfer_id", (q) => q.eq("transferId", args.transferId))
      .first();

    const now = Math.floor(Date.now() / 1000);
    const statusChanged = existing && existing.status !== args.status;
    const previousStatus = existing?.status;

    if (existing) {
      // Update existing transfer
      await ctx.db.patch(existing._id, {
        sender: args.sender,
        recipient: args.recipient,
        amount: args.amount,
        fee: args.fee,
        totalAmount: args.totalAmount,
        status: args.status,
        completedAt: args.completedAt,
        cancelledAt: args.cancelledAt,
        lastSyncedAt: now,
      });
      return { _id: existing._id, wasNew: false, statusChanged: statusChanged ?? false, previousStatus };
    }

    // Create new transfer
    const _id = await ctx.db.insert("transfers", {
      transferId: args.transferId,
      sender: args.sender,
      recipient: args.recipient,
      amount: args.amount,
      fee: args.fee,
      totalAmount: args.totalAmount,
      status: args.status,
      createdAt: args.createdAt,
      completedAt: args.completedAt,
      cancelledAt: args.cancelledAt,
      network: args.network,
      contractAddress: args.contractAddress,
      lastSyncedAt: now,
    });
    return { _id, wasNew: true, statusChanged: false, previousStatus: undefined };
  },
});

/**
 * Get transfer by transfer ID.
 */
export const getTransfer = query({
  args: { transferId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transfers")
      .withIndex("by_transfer_id", (q) => q.eq("transferId", args.transferId))
      .first();
  },
});

/**
 * Get all transfers for a user (as sender or recipient).
 */
export const getTransfersByUser = query({
  args: {
    userAddress: v.string(),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get transfers where user is sender (with status filter if provided)
    const sentQuery = ctx.db
      .query("transfers")
      .withIndex("by_sender", (q) => q.eq("sender", args.userAddress));
    
    const sent = args.status
      ? (await sentQuery.collect()).filter((t) => t.status === args.status)
      : await sentQuery.collect();

    // Get transfers where user is recipient (with status filter if provided)
    const receivedQuery = ctx.db
      .query("transfers")
      .withIndex("by_recipient", (q) => q.eq("recipient", args.userAddress));
    
    const received = args.status
      ? (await receivedQuery.collect()).filter((t) => t.status === args.status)
      : await receivedQuery.collect();

    // Combine and deduplicate using Map (preserves insertion order for recent items)
    const transferMap = new Map<number, typeof sent[0]>();
    
    // Add received first (typically more recent), then sent
    for (const t of received) {
      transferMap.set(t.transferId, t);
    }
    for (const t of sent) {
      transferMap.set(t.transferId, t);
    }

    // Convert to array and sort by creation time descending
    const uniqueTransfers = Array.from(transferMap.values());
    uniqueTransfers.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit if provided
    if (args.limit) {
      return uniqueTransfers.slice(0, args.limit);
    }

    return uniqueTransfers;
  },
});

/**
 * Get pending transfers for a user (as recipient).
 */
export const getPendingTransfersForUser = query({
  args: { userAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transfers")
      .withIndex("by_recipient_and_status", (q) =>
        q.eq("recipient", args.userAddress).eq("status", "pending")
      )
      .collect();
  },
});

/**
 * Get transfers by status.
 */
export const getTransfersByStatus = query({
  args: {
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("cancelled")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("transfers")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    // Sort by creation time descending
    results.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit if provided
    if (args.limit) {
      return results.slice(0, args.limit);
    }

    return results;
  },
});
