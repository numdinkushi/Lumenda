/**
 * STX amount conversion and formatting.
 * 1 STX = 1_000_000 micro-STX.
 */

const STX_DECIMALS = 6;
const MICRO_STX_PER_STX = 1_000_000;

export function stxToMicroStx(stx: number | string): bigint {
  const n = typeof stx === "string" ? parseFloat(stx) : stx;
  if (Number.isNaN(n) || n < 0) return BigInt(0);
  return BigInt(Math.round(n * MICRO_STX_PER_STX));
}

export function microStxToStx(microStx: bigint | number): number {
  const m = typeof microStx === "number" ? BigInt(microStx) : microStx;
  return Number(m) / MICRO_STX_PER_STX;
}

export function formatStx(microStx: bigint | number): string {
  return microStxToStx(microStx).toFixed(STX_DECIMALS);
}

export function parseStxInput(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) return BigInt(0);
  const n = parseFloat(trimmed);
  return Number.isNaN(n) ? BigInt(0) : stxToMicroStx(n);
}

/**
 * Remittance contract error codes to user-friendly messages.
 */
const REMITTANCE_ERROR_MESSAGES: Record<number, string> = {
  100: "Transfer not found",
  101: "Transfer already completed",
  102: "Transfer already cancelled",
  103: "Invalid transfer status",
  106: "Sender and recipient cannot be the same",
  200: "Escrow not found",
  201: "Escrow already locked for this transfer",
  202: "Escrow not locked",
  203: "Insufficient escrow balance",
  300: "Not authorized to perform this action",
  301: "Only the contract owner can do this",
  303: "Contract is paused",
  400: "Invalid input",
  403: "Amount must be greater than zero",
  404: "Amount too large",
};

export function remittanceErrorToMessage(errorCode: number): string {
  return REMITTANCE_ERROR_MESSAGES[errorCode] ?? `Transaction failed (error ${errorCode})`;
}
