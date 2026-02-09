/**
 * lib/contracts module - Single source of truth for all contract interactions.
 * 
 * Exports:
 * - Types: ClarityAbi, ContractCallParams, Transfer, EscrowInfo, ContractId
 * - ABI utilities: fetchAbiFromRpc, getLocalAbi, getAbi
 * - Reader utilities: callRead, getRemittanceContractId, getEscrowContractId
 * - Remittance: all remittance contract functions
 * - Escrow: all escrow contract functions
 */

// Types
export type {
  ClarityAbi,
  ContractCallParams,
  Transfer,
  EscrowInfo,
  ContractId,
} from "./types";

// ABI utilities
export {
  fetchAbiFromRpc,
  getLocalAbi,
  getAbi,
} from "./abi";

// Reader utilities
export {
  callRead,
  getRemittanceContractId,
  getEscrowContractId,
  type ContractMeta,
} from "./reader";

// Remittance contract functions
export {
  getFeeRate,
  getTransferCount,
  getTransferStatus,
  getTransfer,
  getPausedStatus,
  buildInitiateTransferParams,
  buildCompleteTransferParams,
  buildCancelTransferParams,
} from "./remittance";

// Escrow contract functions
export {
  getEscrowInfo,
} from "./escrow";
