/**
 * Lumenda remittance + escrow contract read/write helpers.
 * Read-only calls use the Hiro API; writes build params for wallet (e.g. @stacks/connect).
 */

import {
  Cl,
  ClarityType,
  cvToHex,
  hexToCV,
  principalToString,
} from "@stacks/transactions";
import type { ClarityValue, PrincipalCV, TupleCV } from "@stacks/transactions";
import { getContractAddresses } from "@/config/contracts";

// --- Types from contract (get-transfer tuple, get-escrow-info tuple) ---

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

export interface EscrowInfo {
  sender: string;
  recipient: string;
  amount: string;
  lockedAt: number;
  status: string;
}

// --- Helpers to parse contract IDs and call read-only API ---

function getRemittanceAddressAndName(): { address: string; name: string } {
  const { contracts } = getContractAddresses();
  const [address, name] = contracts.remittance.split(".");
  return { address: address ?? "", name: name ?? "remittance" };
}

function getEscrowAddressAndName(): { address: string; name: string } {
  const { contracts } = getContractAddresses();
  const [address, name] = contracts.escrow.split(".");
  return { address: address ?? "", name: name ?? "escrow" };
}

async function callRead(
  contractAddress: string,
  contractName: string,
  functionName: string,
  args: string[] = []
): Promise<ClarityValue> {
  const { rpcUrl } = getContractAddresses();
  const sender = getContractAddresses().deployer;
  const url = `${rpcUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender, arguments: args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Read failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { okay: boolean; result?: string; cause?: string };
  if (!json.okay || json.result === undefined) {
    throw new Error(json.cause ?? "Read-only call failed");
  }
  return hexToCV(json.result);
}

// --- Remittance read-only ---

export async function getFeeRate(): Promise<bigint> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callRead(address, name, "get-fee-rate", []);
  return (cv as { value: bigint }).value;
}

export async function getTransferCount(): Promise<number> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callRead(address, name, "get-transfer-count", []);
  return Number((cv as { value: bigint }).value);
}

export async function getTransferStatus(transferId: number): Promise<string | null> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callRead(address, name, "get-transfer-status", [
    cvToHex(Cl.uint(transferId)),
  ]);
  if (cv.type === ClarityType.OptionalSome && "value" in cv) {
    const inner = (cv as { value: ClarityValue }).value;
    if ("data" in inner && typeof (inner as { data: string }).data === "string")
      return (inner as { data: string }).data;
  }
  return null;
}

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

export async function getTransfer(transferId: number): Promise<Transfer | null> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callRead(address, name, "get-transfer", [cvToHex(Cl.uint(transferId))]);
  if (cv.type === ClarityType.OptionalSome && "value" in cv) {
    return tupleToTransfer(transferId, (cv as { value: TupleCV }).value);
  }
  return null;
}

export async function getPausedStatus(): Promise<boolean> {
  const { address, name } = getRemittanceAddressAndName();
  const cv = await callRead(address, name, "get-paused-status", []);
  return "value" in cv ? (cv as unknown as { value: boolean }).value : false;
}

// --- Escrow read-only ---

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

export async function getEscrowInfo(transferId: number): Promise<EscrowInfo | null> {
  const { address, name } = getEscrowAddressAndName();
  const cv = await callRead(address, name, "get-escrow-info", [cvToHex(Cl.uint(transferId))]);
  if (cv.type === ClarityType.OptionalSome && "value" in cv)
    return tupleToEscrowInfo((cv as { value: TupleCV }).value);
  return null;
}

// --- Build contract call payloads for wallet (initiate, complete, cancel) ---

export interface ContractCallParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: string[];
}

function getRemittanceCallParams(
  functionName: string,
  functionArgs: ClarityValue[]
): ContractCallParams {
  const { address, name } = getRemittanceAddressAndName();
  return {
    contractAddress: address,
    contractName: name,
    functionName,
    functionArgs: functionArgs.map((arg) => cvToHex(arg)),
  };
}

export function buildInitiateTransferParams(
  recipient: string,
  amountMicroStx: bigint
): ContractCallParams {
  return getRemittanceCallParams("initiate-transfer", [
    Cl.principal(recipient),
    Cl.uint(amountMicroStx),
  ]);
}

export function buildCompleteTransferParams(transferId: number): ContractCallParams {
  return getRemittanceCallParams("complete-transfer", [Cl.uint(transferId)]);
}

export function buildCancelTransferParams(transferId: number): ContractCallParams {
  return getRemittanceCallParams("cancel-transfer", [Cl.uint(transferId)]);
}

