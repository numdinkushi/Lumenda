/**
 * Generic read-only contract caller using config addresses.
 * All contract reads go through this for consistent error handling and RPC usage.
 */

import { getContractAddresses } from "@/config/contracts";
import { callReadOnlyFunction } from "@/lib/utils/contract-helpers";
import type { ClarityValue } from "@stacks/transactions";

export interface ContractMeta {
  address: string;
  name: string;
}

function parseContractId(contractId: string): ContractMeta {
  const [address, ...nameParts] = contractId.split(".");
  return { address: address ?? "", name: nameParts.join(".") || "" };
}

/**
 * Call a read-only function on a contract by its full ID (e.g. "ST2P...remittance").
 * Uses deployer as sender for the read call.
 */
export async function callRead(
  contractId: string,
  functionName: string,
  args: string[] = []
): Promise<ClarityValue> {
  const { address, name } = parseContractId(contractId);
  return callReadOnlyFunction(address, name, functionName, args);
}

/**
 * Get remittance contract ID from config.
 */
export function getRemittanceContractId(): string {
  return getContractAddresses().contracts.remittance;
}

/**
 * Get escrow contract ID from config.
 */
export function getEscrowContractId(): string {
  return getContractAddresses().contracts.escrow;
}
