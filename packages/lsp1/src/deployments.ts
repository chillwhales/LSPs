/**
 * LSP1 Universal Receiver Delegate Deployments
 *
 * Deterministic CREATE2 addresses — same on every chain where deployed.
 */

export const LSP1_UNIVERSAL_RECEIVER_DELEGATE = {
	"0.14.0": {
		address: "0x7870C5B8BC9572A8001C3f96f7ff59961B23500D",
		chains: [42, 4201, 1, 11155111, 8453, 84532, 10],
	},
	"0.12.1": {
		address: "0xA5467dfe7019bF2C7C5F7A707711B9d4cAD118c8",
		chains: [42, 4201, 1, 11155111, 8453, 84532, 42161],
	},
} as const;
