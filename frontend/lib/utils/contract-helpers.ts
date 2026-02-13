/**
 * Contract interaction utilities using @stacks/transactions.
 * Uses the official callReadOnlyFunction with an explicit network so the contract
 * is looked up on the correct chain (see https://docs.stacks.co/stacks.js/contract-calls).
 */

import {
  Cl,
  ClarityType,
  cvToHex,
  hexToCV,
  principalToString,
  type ClarityValue,
  type PrincipalCV,
} from "@stacks/transactions";
import { callReadOnlyFunction as stacksCallReadOnly } from "@stacks/transactions";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { getExplorerUrl } from "@/constants/contracts";
import { getContractAddresses } from "@/config/contracts";
import { NETWORK_ERROR_MESSAGE } from "@/lib/utils/contract-errors";

export function getStacksNetwork(): StacksTestnet | StacksMainnet {
  const { network, rpcUrl } = getContractAddresses();
  if (network === "mainnet") {
    return new StacksMainnet(rpcUrl ? { url: rpcUrl } : undefined);
  }
  return new StacksTestnet(rpcUrl ? { url: rpcUrl } : undefined);
}

/**
 * Call a read-only contract function via the Stacks.js API with explicit network.
 * Passing the network ensures the correct chain is used (default in the library is mainnet).
 */
export async function callReadOnlyFunction(
  contractAddress: string,
  contractName: string,
  functionName: string,
  args: string[] = []
): Promise<ClarityValue> {
  const { deployer } = getContractAddresses();
  const fullContractId = `${contractAddress}.${contractName}`;
  const network = getStacksNetwork();

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log(`[Contract Call] ${fullContractId}::${functionName} (network: ${getContractAddresses().network})`);
  }

  const functionArgs = args.map((hex) => hexToCV(hex));

  try {
    return await stacksCallReadOnly({
      network,
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderAddress: deployer,
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    if (
      cause.includes("No contract source data found") ||
      cause.includes("No contract interface data found")
    ) {
      const { network: networkName } = getContractAddresses();
      const explorerLink = `${getExplorerUrl()}/address/${contractAddress}?chain=${networkName}`;
      throw new Error(
        `Contract not deployed: ${contractName}. The API could not find contract data. ` +
        `Verify on explorer: ${explorerLink} and ensure you're on ${networkName}.`
      );
    }
    if (cause.includes("NoSuchContract")) {
      const contractMatch = cause.match(/NoSuchContract\("([^"]+)"\)/);
      const contractIdFromError = contractMatch ? contractMatch[1] : fullContractId;
      const { network: networkName } = getContractAddresses();
      const explorerLink = `${getExplorerUrl()}/address/${contractAddress}?chain=${networkName}`;
      throw new Error(
        `Contract not deployed: ${contractIdFromError}. The API returned NoSuchContract. ` +
        `Open /verify and compare with explorer: ${explorerLink}. ` +
        `Set NEXT_PUBLIC_STACKS_NETWORK=${networkName} and restart dev server.`
      );
    }
    if (cause.includes("fetch") || cause.includes("Failed to fetch") || cause.includes("Network")) {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Parse principal from ClarityValue
 */
export function parsePrincipal(cv: ClarityValue): string {
  return principalToString(cv as PrincipalCV);
}

/**
 * Parse uint from ClarityValue
 */
export function parseUint(cv: ClarityValue): bigint {
  return (cv as { value: bigint; }).value;
}

/**
 * Parse optional uint from ClarityValue
 */
export function parseOptionalUint(cv: ClarityValue): number | null {
  if (cv.type === ClarityType.OptionalSome && "value" in cv) {
    const some = cv as { value: { value: bigint; }; };
    return Number(some.value.value);
  }
  return null;
}

/**
 * Parse string from ClarityValue
 */
export function parseString(cv: ClarityValue): string {
  return "data" in cv && typeof (cv as { data: string; }).data === "string"
    ? (cv as { data: string; }).data
    : "";
}

/**
 * Parse boolean from ClarityValue
 */
export function parseBoolean(cv: ClarityValue): boolean {
  return "value" in cv ? (cv as unknown as { value: boolean; }).value : false;
}

/**
 * Build ClarityValue for principal
 */
export function buildPrincipal(principal: string): ClarityValue {
  return Cl.principal(principal);
}

/**
 * Build ClarityValue for uint
 */
export function buildUint(value: bigint | number): ClarityValue {
  return Cl.uint(value);
}

/**
 * Convert ClarityValue to hex string for contract calls
 */
export function clarityValueToHex(cv: ClarityValue): string {
  return cvToHex(cv);
}
