/**
 * LSP6 Key Manager Implementation Deployments
 *
 * Deterministic CREATE2 addresses — same on every chain where deployed.
 */

export const LSP6_KEY_MANAGER_INIT = {
	"0.14.0": {
		address: "0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4",
		chains: [42, 4201, 1, 11155111, 8453, 84532, 10],
	},
	"0.12.1": {
		address: "0xa75684d7D048704a2DB851D05Ba0c3cbe226264C",
		chains: [42, 4201, 1, 11155111, 8453, 84532, 42161],
	},
} as const;
