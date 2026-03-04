/**
 * Universal Profile Implementation Deployments
 *
 * Deterministic CREATE2 addresses — same on every chain where deployed.
 */

export const UP_INIT = {
	"0.14.0": {
		address: "0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F",
		chains: [42, 4201, 1, 11155111, 8453, 84532, 10],
	},
	"0.12.1": {
		address: "0x52c90985AF970D4E0DC26Cb5D052505278aF32A9",
		chains: [42, 4201, 1, 11155111, 8453, 84532, 42161],
	},
} as const;
