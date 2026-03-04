/**
 * LSP23 Linked Contracts Factory Deployments
 *
 * Singleton contracts — deterministic CREATE2 addresses.
 */

export const LSP23_FACTORY = {
	address: "0x2300000A84D25dF63081feAa37ba6b62C4c89a30",
	chains: [42, 4201, 1, 11155111, 8453, 84532, 42161, 10],
} as const;

export const UP_INIT_POST_DEPLOYMENT_MODULE = {
	address: "0x000000000066093407b6704B89793beFfD0D8F00",
	chains: [42, 4201, 1, 11155111, 8453, 84532, 42161, 10],
} as const;

export const UP_POST_DEPLOYMENT_MODULE = {
	address: "0x0000005aD606bcFEF9Ea6D0BbE5b79847054BcD7",
	chains: [4201, 10],
} as const;
