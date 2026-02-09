/**
 * Remittance contract read/write operations.
 * DRY module for all remittance contract interactions.
 */

import {
  Cl,
  ClarityType,
  cvToHex,
  hexToCV,
  principalToString,
  type ClarityValue,
  type PrincipalCV,
  type TupleCV,
} from "@stacks/transactions";
import { getContractAddresses } from "@/config/contracts";
import { callReadOnlyFunction } from "@/lib/utils/contract-helpers";
import type { ContractCallParams, Transfer } from "./types";

/**
 * Get remittance contract address and name from config.
 */
function getRemittanceAddressAndName(): { address: string; name: string } {
  const { contracts } = getContractAddresses();
  const [address, name] = contracts.remittance.split(".");
  return { address: address ?? "", name: name ?? "remittance" };
}

/**
 * Parse transfer tuple from contract response.
 */
function tupleToTransfer(transferId: number, t: TupleCV): Transfer {
  const d = t.data as Record<string, ClarityValue>;
  const principal = (v: ClarityValue) => principalToString(v as PrincipalCV);
  const uint = (v: ClarityValue) => String((v as { value: bigint }).value);
  const optUint = (v: ClarityValue) => {
    if ((v as { type: number }).type === ClarityType.OptionalSome && "value" in v) {
      const some = v as { value: { value: bigint } };
      return Number(some.value.value);
    }
    return null;
  };
  const str = (v: ClarityValue) =>
    "data" in v && typeof (v as { data: string }).data === "string"
      ? (v as { data: string }).data
      : "";
  return {
    id: transferId,
    sender: principal(d.sender),
    recipient: principal(d.recipient),
    amount: uint(d.amount),
    fee: uint(d.fee),
    createdAt: Number((d["created-at"] as { value: bigint }).value),
    completedAt: optUint(d["completed-at"]),
    cancelledAt: optUint(d["cancelled-at"]),
    status: str(d.status),
  };
}

// --- Read-only functions ---

/**
 * Get the current fee rate (in basis points).
 */
export async function getFeeRate(): Promise<bigint> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callReadOnlyFunction(address, name, "get-fee-rate", []);
  return (cv as { value: bigint }).value;
}

/**
 * Get the total number of transfers.
 */
export async function getTransferCount(): Promise<number> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callReadOnlyFunction(address, name, "get-transfer-count", []);
  return Number((cv as { value: bigint }).value);
}

/**
 * Get transfer status by ID.
 */
export async function getTransferStatus(transferId: number): Promise<string | null> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callReadOnlyFunction(address, name, "get-transfer-status", [
    cvToHex(Cl.uint(transferId)),
  ]);
  if (cv.type === ClarityType.OptionalSome && "value" in cv) {
    const inner = (cv as { value: ClarityValue }).value;
    if ("data" in inner && typeof (inner as { data: string }).data === "string")
      return (inner as { data: string }).data;
  }
  return null;
}

/**
 * Get transfer by ID.
 */
export async function getTransfer(transferId: number): Promise<Transfer | null> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callReadOnlyFunction(address, name, "get-transfer", [
    cvToHex(Cl.uint(transferId)),
  ]);
  if (cv.type === ClarityType.OptionalSome && "value" in cv) {
    return tupleToTransfer(transferId, (cv as { value: TupleCV }).value);
  }
  return null;
}

/**
 * Get paused status of the contract.
 */
export async function getPausedStatus(): Promise<boolean> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callReadOnlyFunction(address, name, "get-paused-status", []);
  return "value" in cv ? (cv as unknown as { value: boolean }).value : false;
}

// --- Write function builders (for wallet calls) ---

/**
 * Build contract call params for initiating a transfer.
 */
export function buildInitiateTransferParams(
  recipient: string,
  amountMicroStx: bigint
): ContractCallParams {
  const { address, name } = getRemittanceAddressAndName();
  return {
    contractAddress: address,
    contractName: name,
    functionName: "initiate-transfer",
    functionArgs: [cvToHex(Cl.principal(recipient)), cvToHex(Cl.uint(amountMicroStx))],
  };
}

/**
 * Build contract call params for completing a transfer.
 */
export function buildCompleteTransferParams(transferId: number): ContractCallParams {
  const { address, name } = getRemittanceAddressAndName();
  return {
    contractAddress: address,
    contractName: name,
    functionName: "complete-transfer",
    functionArgs: [cvToHex(Cl.uint(transferId))],
  };
}

/**
 * Build contract call params for cancelling a transfer.
 */
export function buildCancelTransferParams(transferId: number): ContractCallParams {
  const { address, name } = getRemittanceAddressAndName();
  return {
    contractAddress: address,
    contractName: name,
    functionName: "cancel-transfer",
    functionArgs: [cvToHex(Cl.uint(transferId))],
  };
}
