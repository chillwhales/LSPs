/** Domain name for LSP36 EIP-712 signatures */
export const LSP36_DOMAIN_NAME = "LSP36SignedAuthorization";

/** Domain version for LSP36 EIP-712 signatures */
export const LSP36_DOMAIN_VERSION = "1";

/** EIP-712 type string — must match keccak256 input in LSP36Constants.sol character-for-character */
export const SIGNED_AUTHORIZATION_TYPE_STRING =
	"SignedAuthorization(address signer,address target,bytes4 selector,bytes32[] paramValues,uint256 paramWildcards,uint256 paramDynamicMask,bool valueIsWildcard,uint256 value,bytes32 signatureId,uint48 validAfter,uint48 validBefore,uint256 nonce)";

/** Full verification mode — all parameters checked on-chain */
export const MODE_FULL_VERIFICATION = 0x00 as const;

/** Pre-approved mode — signer pre-approved, lighter verification */
export const MODE_PRE_APPROVED = 0x01 as const;

/** EIP-1271 magic value for valid signature */
export const EIP1271_MAGIC_VALUE = "0x1626ba7e" as const;

/** Maximum value for uint48 fields (2^48 - 1) */
export const MAX_UINT48 = 281474976710655n;

/** EIP-712 primary type name */
export const LSP36_PRIMARY_TYPE = "SignedAuthorization" as const;

/** EIP-712 types object for SignedAuthorization — all 12 fields */
export const LSP36_EIP712_TYPES = {
	SignedAuthorization: [
		{ name: "signer", type: "address" },
		{ name: "target", type: "address" },
		{ name: "selector", type: "bytes4" },
		{ name: "paramValues", type: "bytes32[]" },
		{ name: "paramWildcards", type: "uint256" },
		{ name: "paramDynamicMask", type: "uint256" },
		{ name: "valueIsWildcard", type: "bool" },
		{ name: "value", type: "uint256" },
		{ name: "signatureId", type: "bytes32" },
		{ name: "validAfter", type: "uint48" },
		{ name: "validBefore", type: "uint48" },
		{ name: "nonce", type: "uint256" },
	],
} as const;
