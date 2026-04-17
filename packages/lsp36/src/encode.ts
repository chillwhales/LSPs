import type { Hex } from "viem";
import { encodeAbiParameters, encodePacked, keccak256 } from "viem";
import type { SignedAuthorization } from "./types";

const SIGNED_AUTHORIZATION_ABI_TUPLE = [
	{
		type: "tuple",
		components: [
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
	},
] as const;

const STATIC_ABI_TYPES: Record<string, readonly [{ type: string }]> = {
	address: [{ type: "address" }],
	uint256: [{ type: "uint256" }],
	uint128: [{ type: "uint128" }],
	uint64: [{ type: "uint64" }],
	uint48: [{ type: "uint48" }],
	uint32: [{ type: "uint32" }],
	uint16: [{ type: "uint16" }],
	uint8: [{ type: "uint8" }],
	int256: [{ type: "int256" }],
	bool: [{ type: "bool" }],
	bytes32: [{ type: "bytes32" }],
	bytes4: [{ type: "bytes4" }],
};

export function encodeParamValue(type: string, value: unknown): Hex {
	const staticAbi = STATIC_ABI_TYPES[type];
	if (staticAbi) {
		return encodeAbiParameters(
			staticAbi as readonly [{ type: string }],
			[value],
		);
	}
	if (type === "bytes" || type === "string") {
		return keccak256(encodePacked([type as "bytes" | "string"], [value as Hex | string]));
	}
	throw new Error(`Unsupported param type: ${type}`);
}

export function buildWildcardMask(indices: number[]): bigint {
	let mask = 0n;
	for (const i of indices) {
		if (i < 0 || i > 255) {
			throw new RangeError(`Wildcard index must be in [0, 255], got ${i}`);
		}
		mask |= 1n << BigInt(i);
	}
	return mask;
}

export function buildDynamicMask(indices: number[]): bigint {
	let mask = 0n;
	for (const i of indices) {
		if (i < 0 || i > 255) {
			throw new RangeError(`Dynamic mask index must be in [0, 255], got ${i}`);
		}
		mask |= 1n << BigInt(i);
	}
	return mask;
}

export function isWildcarded(mask: bigint, index: number): boolean {
	return (mask & (1n << BigInt(index))) !== 0n;
}

export function getWildcardedIndices(mask: bigint): number[] {
	const indices: number[] = [];
	for (let i = 0; i < 256; i++) {
		if ((mask & (1n << BigInt(i))) !== 0n) {
			indices.push(i);
		}
	}
	return indices;
}

export function encodeTrailingBytes(
	auth: SignedAuthorization,
	signature: Hex,
): Hex {
	const sigBytes = signature.slice(2);
	if (sigBytes.length !== 130) {
		throw new Error(`Signature must be 65 bytes (130 hex chars), got ${sigBytes.length / 2}`);
	}

	const encoded = encodeAbiParameters(SIGNED_AUTHORIZATION_ABI_TUPLE, [
		{
			signer: auth.signer as `0x${string}`,
			target: auth.target as `0x${string}`,
			selector: auth.selector as `0x${string}`,
			paramValues: auth.paramValues as readonly `0x${string}`[],
			paramWildcards: auth.paramWildcards,
			paramDynamicMask: auth.paramDynamicMask,
			valueIsWildcard: auth.valueIsWildcard,
			value: auth.value,
			signatureId: auth.signatureId as `0x${string}`,
			validAfter: Number(auth.validAfter),
			validBefore: Number(auth.validBefore),
			nonce: auth.nonce,
		},
	]);

	return `0x${encoded.slice(2)}${sigBytes}00` as Hex;
}

export function encodePreApprovedTrailingBytes(signatureId: Hex): Hex {
	const idBytes = signatureId.slice(2);
	if (idBytes.length !== 64) {
		throw new Error(`signatureId must be 32 bytes (64 hex chars), got ${idBytes.length / 2}`);
	}
	return `0x${idBytes}01` as Hex;
}
