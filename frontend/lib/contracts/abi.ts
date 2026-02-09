/**
 * ABI resolution: fetch from deployed contract (Hiro RPC) with fallback to local JSON.
 * GET /v2/contracts/interface/{contract_address}/{contract_name}
 * @see https://docs.hiro.so/stacks/rpc-api/smart-contracts/interface
 */

import type { ClarityAbi } from "./types";
import { getRpcUrl } from "@/constants/contracts";

const LOCAL_ABIS: Record<string, () => Promise<{ default: ClarityAbi }>> = {
  remittance: () => import("@/config/abis/remittance.json").then((m) => m as { default: ClarityAbi }),
  escrow: () => import("@/config/abis/escrow.json").then((m) => m as { default: ClarityAbi }),
};

/**
 * Fetch contract ABI from the deployed contract via Hiro RPC.
 * Use when you want to always use the on-chain interface (e.g. after upgrades).
 */
export async function fetchAbiFromRpc(
  contractAddress: string,
  contractName: string
): Promise<ClarityAbi> {
  const rpcUrl = getRpcUrl();
  const url = `${rpcUrl}/v2/contracts/interface/${contractAddress}/${contractName}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch ABI (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as ClarityAbi;
  if (!data?.functions) throw new Error("Invalid ABI: missing functions");
  return data;
}

/**
 * Get ABI from local JSON (config/abis). Prefer this for known contracts to avoid RPC.
 * Keys: "remittance" | "escrow"
 */
export async function getLocalAbi(contractKey: "remittance" | "escrow"): Promise<ClarityAbi> {
  const loader = LOCAL_ABIS[contractKey];
  if (!loader) throw new Error(`Unknown contract key: ${contractKey}`);
  const mod = await loader();
  return mod.default;
}

/**
 * Get ABI for a contract: try RPC first, fall back to local.
 * Pass contractKey for fallback; contractAddress/contractName for RPC.
 */
export async function getAbi(
  contractAddress: string,
  contractName: string,
  contractKey?: "remittance" | "escrow"
): Promise<ClarityAbi> {
  try {
    return await fetchAbiFromRpc(contractAddress, contractName);
  } catch {
    if (contractKey) return getLocalAbi(contractKey);
    throw new Error(
      `Could not load ABI for ${contractAddress}.${contractName} and no local fallback (contractKey) provided.`
    );
  }
}
