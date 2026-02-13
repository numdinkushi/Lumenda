import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * User operations for tracking user activity and statistics.
 */

/**
 * Get or create a user record.
 */
export const getOrCreateUser = mutation({
  args: { 
    address: v.string(),
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
  },
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_address_and_network", (q) =>
        q.eq("address", args.address).eq("network", args.network)
      )
      .first();

    if (existing) {
      // Update last active timestamp
      await ctx.db.patch(existing._id, {
        lastActiveAt: now,
      });
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      address: args.address,
      network: args.network,
      firstSeenAt: now,
      lastActiveAt: now,
      totalTransfersSent: 0,
      totalTransfersReceived: 0,
      totalAmountSent: "0",
      totalAmountReceived: "0",
    });
  },
});

/**
 * Get user by address.
 */
export const getUser = query({
  args: { 
    address: v.string(),
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_address_and_network", (q) =>
        q.eq("address", args.address).eq("network", args.network)
      )
      .first();
  },
});

/**
 * Update user statistics when a transfer is created.
 */
export const updateUserStats = mutation({
  args: {
    address: v.string(),
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
    isSender: v.boolean(),
    amount: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_address_and_network", (q) =>
        q.eq("address", args.address).eq("network", args.network)
      )
      .first();

    if (!user) {
      // User should exist, but create if not - inline the logic since we can't call mutations from mutations
      const now = Math.floor(Date.now() / 1000);
      await ctx.db.insert("users", {
        address: args.address,
        network: args.network,
        firstSeenAt: now,
        lastActiveAt: now,
        totalTransfersSent: 0,
        totalTransfersReceived: 0,
        totalAmountSent: "0",
        totalAmountReceived: "0",
      });
      return;
    }

    const currentAmount = BigInt(user[args.isSender ? "totalAmountSent" : "totalAmountReceived"]);
    const newAmount = currentAmount + BigInt(args.amount);

    await ctx.db.patch(user._id, {
      [args.isSender ? "totalTransfersSent" : "totalTransfersReceived"]:
        user[args.isSender ? "totalTransfersSent" : "totalTransfersReceived"] + 1,
      [args.isSender ? "totalAmountSent" : "totalAmountReceived"]: newAmount.toString(),
      lastActiveAt: Math.floor(Date.now() / 1000),
    });
  },
});

/**
 * Recalculate user statistics from transactions table.
 * Calculates stats from successful transactions:
 * - Sent: successful "initiate" transactions where user is sender
 * - Received: successful "complete" transactions where user is recipient
 */
export const recalculateUserStats = mutation({
  args: {
    address: v.string(),
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
  },
  handler: async (ctx, args) => {
    // Get all successful "initiate" transactions where user is the sender
    const sentTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_address", (q) => q.eq("userAddress", args.address))
      .filter((q) =>
        q.and(
          q.eq(q.field("transactionType"), "initiate"),
          q.eq(q.field("status"), "success"),
          q.eq(q.field("network"), args.network)
        )
      )
      .collect();

    // Get all successful "complete" transactions where user is the recipient
    // For "complete" transactions, userAddress is the recipient (the one who completed it)
    const receivedTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_address", (q) => q.eq("userAddress", args.address))
      .filter((q) =>
        q.and(
          q.eq(q.field("transactionType"), "complete"),
          q.eq(q.field("status"), "success"),
          q.eq(q.field("network"), args.network)
        )
      )
      .collect();

    // Calculate totals from transactions
    let totalAmountSent = BigInt(0);
    let totalAmountReceived = BigInt(0);

    for (const tx of sentTransactions) {
      if (tx.metadata?.amount) {
        totalAmountSent += BigInt(tx.metadata.amount);
      }
    }

    for (const tx of receivedTransactions) {
      if (tx.metadata?.amount) {
        totalAmountReceived += BigInt(tx.metadata.amount);
      }
    }

    // Get or create user
    const user = await ctx.db
      .query("users")
      .withIndex("by_address_and_network", (q) =>
        q.eq("address", args.address).eq("network", args.network)
      )
      .first();

    const now = Math.floor(Date.now() / 1000);

    if (user) {
      // Update existing user
      await ctx.db.patch(user._id, {
        totalTransfersSent: sentTransactions.length,
        totalTransfersReceived: receivedTransactions.length,
        totalAmountSent: totalAmountSent.toString(),
        totalAmountReceived: totalAmountReceived.toString(),
        lastActiveAt: now,
      });
      return user._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        address: args.address,
        network: args.network,
        firstSeenAt: now,
        lastActiveAt: now,
        totalTransfersSent: sentTransactions.length,
        totalTransfersReceived: receivedTransactions.length,
        totalAmountSent: totalAmountSent.toString(),
        totalAmountReceived: totalAmountReceived.toString(),
      });
    }
  },
});
