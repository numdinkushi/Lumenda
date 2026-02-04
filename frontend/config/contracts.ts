/**
 * Lumenda contract addresses and network config for frontend.
 * Uses NEXT_PUBLIC_STACKS_NETWORK to choose testnet vs mainnet; falls back to testnet.
 * Override with NEXT_PUBLIC_STACKS_DEPLOYER_ADDRESS to use a different deployer (contract IDs are derived).
 */

import testnetAddresses from "./addresses.testnet.json";
import mainnetAddresses from "./addresses.mainnet.json";

export type StacksNetwork = "testnet" | "mainnet";

export interface ContractAddresses {
  network: StacksNetwork;
  deployer: string;
  contracts: {
    escrow: string;
    remittance: string;
  };
  rpcUrl: string;
  explorerUrl: string;
}

const testnet = testnetAddresses as ContractAddresses;
const mainnet = mainnetAddresses as ContractAddresses;

function getNetwork(): StacksNetwork {
  const env = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_STACKS_NETWORK : undefined;
  if (env === "mainnet") return "mainnet";
  return "testnet";
}

/**
 * Returns the current contract addresses for the configured network.
 * Set NEXT_PUBLIC_STACKS_DEPLOYER_ADDRESS to override the deployer (e.g. after a new deploy).
 */
export function getContractAddresses(): ContractAddresses {
  const network = getNetwork();
  const base = network === "mainnet" ? mainnet : testnet;
  const deployerOverride =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_STACKS_DEPLOYER_ADDRESS : undefined;
  const deployer = (deployerOverride?.trim() || base.deployer) as string;
  if (!deployer && network === "mainnet") {
    return base;
  }
  return {
    ...base,
    network,
    deployer,
    contracts: {
      escrow: deployer ? `${deployer}.escrow` : base.contracts.escrow,
      remittance: deployer ? `${deployer}.remittance` : base.contracts.remittance,
    },
  };
}

export { testnet as testnetAddresses, mainnet as mainnetAddresses };
