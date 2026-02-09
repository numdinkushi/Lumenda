/**
 * Escrow contract read operations.
 * DRY module for all escrow contract interactions.
 */

import { Cl, ClarityType, cvToHex, hexToCV, principalToString } from "@stacks/transactions";
import type { ClarityValue, PrincipalCV, TupleCV } from "@stacks/transactions";
import { getContractAddresses } from "@/config/contracts";
import { callReadOnlyFunction } from "@/lib/utils/contract-helpers";
import type { EscrowInfo } from "./types";

/**
 * Get escrow contract address and name from config.
 */
function getEscrowAddressAndName(): { address: string; name: string } {
  const { contracts } = getContractAddresses();
  const [address, name] = contracts.escrow.split(".");
  return { address: address ?? "", name: name ?? "escrow" };
}

/**
 * Parse escrow info tuple from contract response.
 */
function tupleToEscrowInfo(t: TupleCV): EscrowInfo {
  const d = t.data as Record<string, ClarityValue>;
  const principal = (v: ClarityValue) => principalToString(v as PrincipalCV);
  const uint = (v: ClarityValue) => String((v as { value: bigint }).value);
  const str = (v: ClarityValue) =>
    "data" in v && typeof (v as { data: string }).data === "string"
      ? (v as { data: string }).data
      : "";
  return {
    sender: principal(d.sender),
    recipient: principal(d.recipient),
    amount: uint(d.amount),
    lockedAt: Number((d["locked-at"] as { value: bigint }).value),
    status: str(d.status),
  };
}

// --- Read-only functions ---

/**
 * Get escrow info by transfer ID.
 */
export async function getEscrowInfo(transferId: number): Promise<EscrowInfo | null> {
  const { address, name } = getEscrowAddressAndName();
  const cv = await callReadOnlyFunction(address, name, "get-escrow-info", [
    cvToHex(Cl.uint(transferId)),
  ]);
  if (cv.type === ClarityType.OptionalSome && "value" in cv)
    return tupleToEscrowInfo((cv as { value: TupleCV }).value);
  return null;
}
