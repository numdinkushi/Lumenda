/** Types for @stacks/connect v8+. Based on official docs: https://docs.stacks.co/stacks-connect/connect-wallet */
declare module "@stacks/connect" {
  // Per docs: const response = await connect();
  // Returns: { addresses: { stx: [{ address }], btc: [...] } }
  export interface ConnectResponse {
    addresses: {
      stx: Array<{ address: string }>;
      btc: Array<{ address: string }>;
    };
  }

  // Per docs: const accounts = await request('stx_getAccounts');
  export interface GetAccountsResponse {
    addresses: Array<{
      address: string;
      publicKey: string;
      gaiaHubUrl?: string;
    }>;
  }

  // Per docs: const response = await request('stx_transferStx', { amount, recipient, memo });
  export interface TransferResponse {
    txid: string;
  }

  // Per docs: const response = await connect();
  export function connect(): Promise<ConnectResponse>;
  
  // Per docs: disconnect();
  export function disconnect(): Promise<void>;
  
  // Per docs: if (isConnected()) { ... }
  export function isConnected(): boolean;
  
  // Per docs: const userData = getLocalStorage();
  export function getLocalStorage(): { addresses?: { stx?: Array<{ address: string }>; btc?: Array<{ address: string }> } } | null;
  
  // Per docs: const accounts = await request('stx_getAccounts');
  // Per docs: const response = await request('stx_transferStx', { amount, recipient, memo });
  // Leather API: request('stx_callContract', { contract: 'address.name', functionName, functionArgs })
  // @see https://leather.io/posts/api-stx-callcontract
  export function request(
    method: string,
    options?: Record<string, unknown>
  ): Promise<GetAccountsResponse | TransferResponse | { txId?: string; txid?: string } | undefined>;
}
