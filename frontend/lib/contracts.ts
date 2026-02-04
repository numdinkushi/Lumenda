/**
 * Contract config and ABIs for frontend interactions with Lumenda Stacks contracts.
 * Import addresses via getContractAddresses() and ABIs via getEscrowAbi() / getRemittanceAbi().
 */

import { getContractAddresses, type ContractAddresses } from "@/config/contracts";
import escrowAbi from "@/config/abis/escrow.json";
import remittanceAbi from "@/config/abis/remittance.json";

// Re-export so callers can use one entry point
export { getContractAddresses, type ContractAddresses } from "@/config/contracts";

export type ClarityAbi = {
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
};

/** Escrow contract ABI for contract calls and read-only calls */
export function getEscrowAbi(): ClarityAbi {
  return escrowAbi as ClarityAbi;
}

/** Remittance contract ABI for contract calls and read-only calls */
export function getRemittanceAbi(): ClarityAbi {
  return remittanceAbi as ClarityAbi;
}

/** Convenience: addresses + escrow ABI + remittance ABI */
export function getContractsConfig(): {
  addresses: ContractAddresses;
  escrowAbi: ClarityAbi;
  remittanceAbi: ClarityAbi;
} {
  return {
    addresses: getContractAddresses(),
    escrowAbi: getEscrowAbi(),
    remittanceAbi: getRemittanceAbi(),
  };
}
