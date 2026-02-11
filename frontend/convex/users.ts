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
      // User should exist, but create if not
      await getOrCreateUser(ctx, { address: args.address, network: args.network });
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
