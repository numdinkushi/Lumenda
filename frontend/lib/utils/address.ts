/**
 * Address utility functions for formatting and displaying Stacks addresses.
 */

/**
 * Truncate an address to show first N and last M characters.
 * @param address - The full address string
 * @param start - Number of characters to show at the start (default: 6)
 * @param end - Number of characters to show at the end (default: 4)
 * @returns Truncated address string
 */
export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address || address.length <= start + end) return address;
  return `${address.slice(0, start)}…${address.slice(-end)}`;
}

/**
 * Copy text to clipboard with toast notification.
 * @param text - Text to copy
 * @param onSuccess - Optional success callback
 * @param onError - Optional error callback
 */
export async function copyToClipboard(
  text: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    onSuccess?.();
    return true;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Failed to copy");
    onError?.(error);
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}
