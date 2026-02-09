/**
 * Lumenda remittance + escrow contract read/write helpers.
 * Re-exports from lib/contracts for backward compatibility.
 * @deprecated Import from @/lib/contracts instead
 */

// Re-export everything from the new contracts module
export {
  getFeeRate,
  getTransferCount,
  getTransferStatus,
  getTransfer,
  getPausedStatus,
  buildInitiateTransferParams,
  buildCompleteTransferParams,
  buildCancelTransferParams,
  type Transfer,
} from "@/lib/contracts";

// Legacy re-exports for escrow (if needed)
export {
  getEscrowInfo,
  type EscrowInfo,
} from "@/lib/contracts";

// Legacy type export
export type { ContractCallParams } from "@/lib/contracts";
