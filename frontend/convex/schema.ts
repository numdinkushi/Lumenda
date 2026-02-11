import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema for Lumenda remittance application.
 * Tracks transactions, transfers, and users to provide reliable
 * transaction history and explorer links.
 */

export default defineSchema({
  /**
   * Transactions table: Stores blockchain transaction IDs and metadata
   * Links contract calls to their on-chain transaction IDs
   */
  transactions: defineTable({
    // Transaction ID from Stacks blockchain
    txId: v.string(),
    
    // Transfer ID from remittance contract
    transferId: v.number(),
    
    // Transaction type: initiate, complete, cancel
    transactionType: v.union(
      v.literal("initiate"),
      v.literal("complete"),
      v.literal("cancel")
    ),
    
    // User address (sender or recipient depending on transaction type)
    userAddress: v.string(),
    
    // Contract address and name
    contractAddress: v.string(),
    contractName: v.string(),
    
    // Function name called
    functionName: v.string(),
    
    // Transaction status from blockchain
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("abort_by_response"),
      v.literal("abort_by_post_condition")
    ),
    
    // Block height when transaction was included
    blockHeight: v.optional(v.number()),
    
    // Timestamp from blockchain (Unix timestamp in seconds)
    timestamp: v.number(),
    
    // Network: testnet or mainnet
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
    
    // Explorer URL for this transaction
    explorerUrl: v.optional(v.string()),
    
    // Additional metadata
    metadata: v.optional(
      v.object({
        fee: v.optional(v.string()),
        amount: v.optional(v.string()),
        recipient: v.optional(v.string()),
        sender: v.optional(v.string()),
      })
    ),
  })
    .index("by_transfer_id", ["transferId"])
    .index("by_user_address", ["userAddress"])
    .index("by_tx_id", ["txId"])
    .index("by_transfer_and_type", ["transferId", "transactionType"])
    .index("by_user_and_type", ["userAddress", "transactionType"])
    .index("by_timestamp", ["timestamp"]),

  /**
   * Transfers table: Cached transfer data from contract
   * Provides fast access to transfer history without querying contract
   */
  transfers: defineTable({
    // Transfer ID from remittance contract
    transferId: v.number(),
    
    // Sender address
    sender: v.string(),
    
    // Recipient address
    recipient: v.string(),
    
    // Transfer amount (in micro-STX, as string to handle large numbers)
    amount: v.string(),
    
    // Fee amount (in micro-STX)
    fee: v.string(),
    
    // Total amount (amount + fee)
    totalAmount: v.string(),
    
    // Status: pending, completed, cancelled
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    
    // Block height when transfer was created
    createdAt: v.number(),
    
    // Block height when transfer was completed (if applicable)
    completedAt: v.optional(v.number()),
    
    // Block height when transfer was cancelled (if applicable)
    cancelledAt: v.optional(v.number()),
    
    // Network: testnet or mainnet
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
    
    // Contract address
    contractAddress: v.string(),
    
    // Last synced timestamp (Unix seconds)
    lastSyncedAt: v.number(),
  })
    .index("by_transfer_id", ["transferId"])
    .index("by_sender", ["sender"])
    .index("by_recipient", ["recipient"])
    .index("by_status", ["status"])
    .index("by_sender_and_status", ["sender", "status"])
    .index("by_recipient_and_status", ["recipient", "status"])
    .index("by_created_at", ["createdAt"]),

  /**
   * Users table: Tracks user addresses and their activity
   * Useful for analytics and user-specific queries
   */
  users: defineTable({
    // Stacks address
    address: v.string(),
    
    // Network: testnet or mainnet
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
    
    // First seen timestamp
    firstSeenAt: v.number(),
    
    // Last active timestamp
    lastActiveAt: v.number(),
    
    // Total transfers sent
    totalTransfersSent: v.number(),
    
    // Total transfers received
    totalTransfersReceived: v.number(),
    
    // Total amount sent (in micro-STX, as string)
    totalAmountSent: v.string(),
    
    // Total amount received (in micro-STX, as string)
    totalAmountReceived: v.string(),
  })
    .index("by_address", ["address"])
    .index("by_address_and_network", ["address", "network"]),
});
