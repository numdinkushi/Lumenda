/**
 * Thin wrapper around @stacks/connect for wallet connect, disconnect, and contract calls.
 * Keeps all Stacks Connect usage in one place (DRY).
 * 
 * Note: We use dynamic imports to avoid SSR issues, but the modal should still work.
 */

import { getContractAddresses } from "@/config/contracts";
import type { ContractCallParams } from "@/lib/contracts";
import { getStoredAddress, setStoredAddress } from "./storage";

// Lazy load @stacks/connect to avoid SSR issues
// Note: Package must be installed: npm install @stacks/connect
let connectModulePromise: Promise<Record<string, unknown>> | null = null;

/**
 * Get @stacks/connect module. Only imports when actually called (not at module load time).
 * 
 * IMPORTANT: @stacks/connect must be installed for this to work:
 *   npm install @stacks/connect
 * 
 * Uses runtime string construction to prevent Next.js/Turbopack from analyzing this import at build time.
 */
export function getConnectModule(): Promise<Record<string, unknown>> {
  if (!connectModulePromise) {
    // Try to import @stacks/connect dynamically
    // If package is not installed, this will fail with a clear error
    // Next.js/Turbopack will analyze this at build time, so package must be installed
    // 
    // To install: npm install @stacks/connect
    connectModulePromise = (async () => {
      try {
        const mod = await import("@stacks/connect");
        if (!mod || typeof mod !== "object") {
          throw new Error("@stacks/connect module is invalid");
        }
        return mod as Record<string, unknown>;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes("Cannot find module") || errorMessage.includes("not found")) {
          throw new Error("@stacks/connect not installed. Run: npm install @stacks/connect");
        }
        throw new Error(`Failed to load @stacks/connect: ${errorMessage}`);
      }
    })();
  }
  return connectModulePromise;
}

/** Result of a successful connect: address to use for the session */
export interface ConnectResult {
  address: string;
}

/**
 * Connect to Stacks wallet (Leather, Hiro, etc.) and return the selected address.
 * Persists address in localStorage for session restore.
 * 
 * Based on official docs: https://docs.stacks.co/stacks-connect/connect-wallet
 */
export async function connectWallet(): Promise<ConnectResult | null> {
  // Clear any placeholder addresses before connecting
  const { clearPlaceholderAddresses } = await import("./storage");
  clearPlaceholderAddresses();

  try {
    // Import @stacks/connect - match the exact API from docs
    const connectModule = await getConnectModule();
    
    if (!connectModule || typeof connectModule !== "object") {
      throw new Error("@stacks/connect module is invalid");
    }
    
    console.log("[stacks-connect] Module loaded, exports:", Object.keys(connectModule));

    const mod = connectModule as Record<string, unknown>;
    
    // Check if already connected first (per docs example)
    if (typeof mod.isConnected === "function") {
      const isConnectedFn = mod.isConnected as () => boolean;
      if (isConnectedFn()) {
        console.log("[stacks-connect] Already connected, getting Stacks address from localStorage...");
        // Get address from localStorage (per docs: getLocalStorage())
        // IMPORTANT: This app is Stacks-only, so we MUST use the STX address, not BTC
        if (typeof mod.getLocalStorage === "function") {
          const userData = (mod.getLocalStorage as () => { addresses?: { stx?: Array<{ address: string }>; btc?: Array<{ address: string }> } } | null)();
          if (userData?.addresses?.stx && userData.addresses.stx.length > 0) {
            const addr = userData.addresses.stx[0].address;
            // Validate it's a Stacks address (starts with ST)
            if (addr && typeof addr === "string" && addr.startsWith("ST")) {
              console.log("[stacks-connect] Found existing Stacks connection, address:", addr);
              setStoredAddress(addr);
              return { address: addr };
            }
            console.warn("[stacks-connect] Found STX address but invalid format:", addr);
          }
        }
      }
    }
    
    // Use connect() - per docs: const response = await connect();
    // Docs show: connect() returns { addresses: { stx: [{ address }], btc: [...] } }
    if (typeof mod.connect === "function") {
      console.log("[stacks-connect] Calling connect() - wallet modal should appear...");
      
      try {
        // Per docs: connect() takes no parameters
        const connectFn = mod.connect as () => Promise<unknown>;
        const response = await connectFn();
        console.log("[stacks-connect] connect() response:", JSON.stringify(response, null, 2));
        
        // Handle different possible response shapes
        const responseObj = response as Record<string, unknown>;
        
        // Helper function to extract and validate Stacks address
        const extractStacksAddress = (value: unknown): string | null => {
          // Direct string (if address is returned directly)
          if (typeof value === "string" && value.startsWith("ST") && value.length > 0) {
            return value;
          }
          
          // Object with address property
          if (value && typeof value === "object" && "address" in value) {
            const addr = (value as { address: unknown }).address;
            if (typeof addr === "string" && addr.startsWith("ST") && addr.length > 0) {
              return addr;
            }
          }
          
          // Array of addresses
          if (Array.isArray(value) && value.length > 0) {
            for (const item of value) {
              const addr = extractStacksAddress(item);
              if (addr) return addr;
            }
          }
          
          return null;
        };
        
        // Try multiple possible response formats
        
        // Format 1: { addresses: { stx: [{ address }], btc: [...] } }
        if (responseObj.addresses && typeof responseObj.addresses === "object") {
          const addresses = responseObj.addresses as Record<string, unknown>;
          
          // Check stx array
          if (addresses.stx) {
            const stxAddr = extractStacksAddress(addresses.stx);
            if (stxAddr) {
              console.log("[stacks-connect] Successfully connected with Stacks address (stx format):", stxAddr);
              setStoredAddress(stxAddr);
              return { address: stxAddr };
            }
          }
          
          // Check if addresses object has direct address property
          const directAddr = extractStacksAddress(addresses);
          if (directAddr) {
            console.log("[stacks-connect] Successfully connected with Stacks address (direct format):", directAddr);
            setStoredAddress(directAddr);
            return { address: directAddr };
          }
        }
        
        // Format 2: { addresses: [...] } (array format)
        if (Array.isArray(responseObj.addresses) && responseObj.addresses.length > 0) {
          const addr = extractStacksAddress(responseObj.addresses);
          if (addr) {
            console.log("[stacks-connect] Successfully connected with Stacks address (array format):", addr);
            setStoredAddress(addr);
            return { address: addr };
          }
        }
        
        // Format 3: Direct address property
        if (responseObj.address) {
          const addr = extractStacksAddress(responseObj.address);
          if (addr) {
            console.log("[stacks-connect] Successfully connected with Stacks address (direct property):", addr);
            setStoredAddress(addr);
            return { address: addr };
          }
        }
        
        // Format 4: Check if response itself is an address string
        if (typeof response === "string" && response.startsWith("ST")) {
          console.log("[stacks-connect] Successfully connected with Stacks address (string response):", response);
          setStoredAddress(response);
          return { address: response };
        }
        
        // If we get here, log the full response for debugging
        console.warn("[stacks-connect] connect() succeeded but couldn't extract Stacks address. Response:", JSON.stringify(response, null, 2));
        throw new Error("Wallet connected but no Stacks (STX) address found. This app requires a Stacks account. Check console for details.");
      } catch (connectErr) {
        console.error("[stacks-connect] connect() failed:", connectErr);
        const errMsg = connectErr instanceof Error ? connectErr.message : String(connectErr);
        // Check if user cancelled
        if (errMsg.toLowerCase().includes("cancel") || errMsg.toLowerCase().includes("reject") || errMsg.toLowerCase().includes("denied")) {
          throw new Error("Connection cancelled by user");
        }
        // Check if no wallet found
        if (errMsg.toLowerCase().includes("provider") || errMsg.toLowerCase().includes("wallet") || errMsg.toLowerCase().includes("extension")) {
          throw new Error("No Stacks wallet extension found. Please install Leather (https://leather.io) or Hiro (https://www.hiro.so/wallet) wallet extension.");
        }
        throw new Error(`Wallet connection failed: ${errMsg}`);
      }
    }

    // If connect() doesn't exist, the package version might be wrong
    console.error("[stacks-connect] Module doesn't export connect()");
    throw new Error("Wallet connection API not available. Make sure @stacks/connect v8+ is installed: npm install @stacks/connect@latest");
  } catch (err) {
    console.error("[stacks-connect] connect failed:", err);
    // Re-throw with better error message
    if (err instanceof Error && (err.message.includes("Wallet connection") || err.message.includes("@stacks/connect") || err.message.includes("cancelled") || err.message.includes("No Stacks wallet"))) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Wallet connection failed: ${message}`);
  }
}

/**
 * Disconnect wallet and clear stored address.
 */
export async function disconnectWallet(): Promise<void> {
  try {
    const connectModule = await getConnectModule();
    const mod = connectModule as { disconnect?: () => Promise<void> };
    if (typeof mod.disconnect === "function") {
      await mod.disconnect();
    }
  } catch {
    // ignore
  }
  setStoredAddress(null);
}

/**
 * Return the currently stored address if any (e.g. from a previous connect).
 */
export function getCachedAddress(): string | null {
  return getStoredAddress();
}

/**
 * Request the wallet to sign and broadcast a contract call.
 * Returns txid on success, null on cancel or error.
 *
 * Leather expects: contract (fully qualified "address.name"), functionName, functionArgs.
 * Passing network ensures the wallet looks up the contract on the correct chain (testnet/mainnet);
 * otherwise "Not a valid contract" can appear if the wallet is on a different network.
 * @see https://leather.io/posts/api-stx-callcontract
 */
export async function requestContractCall(
  params: ContractCallParams
): Promise<string | null> {
  try {
    const connectModule = await getConnectModule();
    const mod = connectModule as {
      request?: (
        method: string,
        opts: Record<string, unknown>
      ) => Promise<{ txId?: string; txid?: string } | undefined>;
    };
    if (typeof mod.request !== "function") return null;

    const { network } = getContractAddresses();
    const contract = `${params.contractAddress}.${params.contractName}`;
    const payload: Record<string, unknown> = {
      contract,
      functionName: params.functionName,
      functionArgs: params.functionArgs,
      // Allow STX transfers - required for remittance contract which transfers STX internally
      // Without this, transactions fail with "Post-condition check failure" because
      // the contract moves STX from sender to contract, which violates default strict post-conditions
      postConditionMode: "allow",
    };
    // Ensure wallet uses the same network as app (avoids "Not a valid contract" on testnet)
    if (network) payload.network = network;

    // Add timeout to prevent hanging if wallet popup is closed
    // 5 minutes should be enough for user to approve, but prevents infinite waiting
    const timeoutMs = 5 * 60 * 1000; // 5 minutes
    const requestPromise = mod.request("stx_callContract", payload);
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Transaction request timed out. The wallet popup may have been closed. Please try again."));
      }, timeoutMs);
    });

    const result = await Promise.race([requestPromise, timeoutPromise]);

    return result?.txId ?? result?.txid ?? null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isUserRejection =
      /rejected|denied|cancel|user said no|timeout|closed/i.test(msg) || 
      msg === "User rejected request" ||
      msg.includes("timed out");
    
    if (!isUserRejection) {
      console.error("[stacks-connect] requestContractCall failed:", err);
    }
    
    // Rethrow user rejections/timeouts so the hook can show appropriate message
    if (isUserRejection) {
      throw new Error(msg.includes("timed out") ? msg : "Transaction cancelled or wallet closed");
    }
    return null;
  }
}

