/**
 * Shared types for contract interactions.
 * Keeps ABI shape and call params in one place (DRY).
 */

/** Clarity ABI as returned by Hiro RPC or local JSON. */
export interface ClarityAbi {
  functions: Array<{
    name: string;
    access: string;
    args: Array<{ name: string; type: unknown }>;
    outputs: { type: unknown };
  }>;
  variables: unknown[];
  maps: unknown[];
  fungible_tokens: unknown[];
  non_fungible_tokens: unknown[];
}

/** Params for requesting a contract call via wallet (e.g. stx_callContract). */
export interface ContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: string[];
}

/** Transfer record from remittance contract get-transfer. */
export interface Transfer {
  id: number;
  sender: string;
  recipient: string;
  amount: string;
  fee: string;
  createdAt: number;
  completedAt: number | null;
  cancelledAt: number | null;
  status: string;
}

/** Escrow record from escrow contract get-escrow-info. */
export interface EscrowInfo {
  sender: string;
  recipient: string;
  amount: string;
  lockedAt: number;
  status: string;
}

/** Contract identifier: "address.name". */
export type ContractId = string;
