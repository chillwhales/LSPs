import { LSP6_KEY_MANAGER_INIT } from "@chillwhales/lsp6";
import { UP_INIT } from "@chillwhales/up";
import { isHex } from "viem";
import { describe, expect, it } from "vitest";

import { generateDeployParams } from "./deploy";

const VALID_SALT = `0x${"00".repeat(32)}`;
const VALID_CONTROLLER = "0x1234567890AbcdEF1234567890aBcdef12345678" as const;

describe("generateDeployParams", () => {
	it("returns object with universalProfileInitStruct, keyManagerInitStruct, initializeEncodedBytes", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(result).toHaveProperty("universalProfileInitStruct");
		expect(result).toHaveProperty("keyManagerInitStruct");
		expect(result).toHaveProperty("initializeEncodedBytes");
	});

	it("universalProfileInitStruct.fundingAmount is 0n", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(result.universalProfileInitStruct.fundingAmount).toBe(BigInt(0));
	});

	it("universalProfileInitStruct.implementationContract matches UP_INIT v0.14.0", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(
			result.universalProfileInitStruct.implementationContract.toLowerCase(),
		).toBe(UP_INIT["0.14.0"].address.toLowerCase());
	});

	it("keyManagerInitStruct.addPrimaryContractAddress is true", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(result.keyManagerInitStruct.addPrimaryContractAddress).toBe(true);
	});

	it("keyManagerInitStruct.implementationContract matches LSP6_KEY_MANAGER_INIT v0.14.0", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(
			result.keyManagerInitStruct.implementationContract.toLowerCase(),
		).toBe(LSP6_KEY_MANAGER_INIT["0.14.0"].address.toLowerCase());
	});

	it("initializeEncodedBytes is valid hex string", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(isHex(result.initializeEncodedBytes)).toBe(true);
	});

	it("keyManagerInitStruct.fundingAmount is 0n", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(result.keyManagerInitStruct.fundingAmount).toBe(BigInt(0));
	});

	it("universalProfileInitStruct.salt matches input salt", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(result.universalProfileInitStruct.salt).toBe(VALID_SALT);
	});

	it("universalProfileInitStruct.initializationCalldata is valid hex", () => {
		const result = generateDeployParams({
			salt: VALID_SALT,
			controllerAddress: VALID_CONTROLLER,
		});

		expect(
			isHex(result.universalProfileInitStruct.initializationCalldata),
		).toBe(true);
	});
});
