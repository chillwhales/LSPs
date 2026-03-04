/**
 * LUKSO Network Chain Registry
 *
 * Chain name ↔ chain ID mapping for all networks where LUKSO contracts are deployed.
 * All contract addresses are deterministic (CREATE2) — same address on every chain.
 */

export const CHAINS = {
	lukso: { id: 42, name: "LUKSO", type: "mainnet" },
	"lukso-testnet": { id: 4201, name: "LUKSO Testnet", type: "testnet" },
	ethereum: { id: 1, name: "Ethereum", type: "mainnet" },
	sepolia: { id: 11155111, name: "Sepolia", type: "testnet" },
	base: { id: 8453, name: "Base", type: "mainnet" },
	"base-sepolia": { id: 84532, name: "Base Sepolia", type: "testnet" },
	arbitrum: { id: 42161, name: "Arbitrum", type: "mainnet" },
	optimism: { id: 10, name: "Optimism", type: "mainnet" },
} as const;

export type ChainName = keyof typeof CHAINS;
export type ChainId = (typeof CHAINS)[ChainName]["id"];
