import type { Hex } from "viem";
import { decodeAbiParameters } from "viem";
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

type DecodeResult =
	| { mode: 0; auth: SignedAuthorization; signature: Hex }
	| { mode: 1; signatureId: Hex };

export function decodeTrailingBytes(data: Hex): DecodeResult {
	if (!data || data.length < 4) {
		throw new Error("Trailing bytes data is too short");
	}

	const hexBody = data.slice(2);
	const modeByte = parseInt(hexBody.slice(-2), 16);

	if (modeByte === 0x00) {
		// mode 0x00: ABI-encoded struct + r[32]||s[32]||v[1] + 0x00
		// 65 bytes signature + 1 byte mode = 66 bytes = 132 hex chars from end
		if (hexBody.length < 132) {
			throw new Error(
				"Mode 0x00 trailing bytes too short: need at least 66 bytes for signature + mode",
			);
		}

		const sigHex = hexBody.slice(hexBody.length - 132, hexBody.length - 2);
		const signature = `0x${sigHex}` as Hex;

		const encodedHex = hexBody.slice(0, hexBody.length - 132);
		if (encodedHex.length === 0) {
			throw new Error("Mode 0x00 trailing bytes missing ABI-encoded struct");
		}

		const decoded = decodeAbiParameters(
			SIGNED_AUTHORIZATION_ABI_TUPLE,
			`0x${encodedHex}` as Hex,
		);

		const tuple = decoded[0];
		const auth: SignedAuthorization = {
			signer: tuple.signer,
			target: tuple.target,
			selector: tuple.selector as `0x${string}`,
			paramValues: [...tuple.paramValues] as `0x${string}`[],
			paramWildcards: tuple.paramWildcards,
			paramDynamicMask: tuple.paramDynamicMask,
			valueIsWildcard: tuple.valueIsWildcard,
			value: tuple.value,
			signatureId: tuple.signatureId,
			validAfter: BigInt(tuple.validAfter),
			validBefore: BigInt(tuple.validBefore),
			nonce: tuple.nonce,
		};

		return { mode: 0, auth, signature };
	}

	if (modeByte === 0x01) {
		// mode 0x01: signatureId[32] + 0x01
		// 32 bytes signatureId + 1 byte mode = 33 bytes = 66 hex chars
		if (hexBody.length < 66) {
			throw new Error(
				"Mode 0x01 trailing bytes too short: need at least 33 bytes for signatureId + mode",
			);
		}

		const idHex = hexBody.slice(hexBody.length - 66, hexBody.length - 2);
		const signatureId = `0x${idHex}` as Hex;

		return { mode: 1, signatureId };
	}

	throw new Error(`Unknown trailing bytes mode: 0x${modeByte.toString(16).padStart(2, "0")}`);
}
