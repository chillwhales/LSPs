/**
 * Transformers Utility Tests (Encoding/Decoding)
 */

import { describe, expect, it } from "vitest";
import {
	base64ToArrayBuffer,
	base64ToBlob,
	base64ToBytes,
	base64ToUtf8,
	bytesToBase64,
	urlBase64ToUint8Array,
	utf8ToBase64,
} from "./transformers";

describe("transformers utilities", () => {
	describe("base64 encoding/decoding", () => {
		describe("utf8ToBase64 and base64ToUtf8", () => {
			it("should encode and decode UTF-8", () => {
				const text = "Hello World";
				const encoded = utf8ToBase64(text);
				expect(base64ToUtf8(encoded)).toBe(text);
			});

			it("should handle special characters", () => {
				const text = "Hello \u4e16\u754c \ud83c\udf0d";
				const encoded = utf8ToBase64(text);
				expect(base64ToUtf8(encoded)).toBe(text);
			});
		});

		describe("bytesToBase64 and base64ToBytes", () => {
			it("should encode and decode bytes", () => {
				const bytes = new Uint8Array([72, 101, 108, 108, 111]);
				const encoded = bytesToBase64(bytes);
				const decoded = base64ToBytes(encoded);
				expect(decoded).toEqual(bytes);
			});
		});

		describe("base64ToBlob", () => {
			it("should convert base64 to Blob", () => {
				const base64 = "SGVsbG8=";
				const blob = base64ToBlob(base64, "text/plain");
				expect(blob).toBeInstanceOf(Blob);
				expect(blob.type).toBe("text/plain");
			});
		});

		describe("base64ToArrayBuffer", () => {
			it("should convert base64 to ArrayBuffer", () => {
				const base64 = "SGVsbG8=";
				const buffer = base64ToArrayBuffer(base64);
				expect(buffer).toBeInstanceOf(ArrayBuffer);
				expect(buffer.byteLength).toBeGreaterThan(0);
			});

			it("should handle data URLs", () => {
				const dataUrl = "data:text/plain;base64,SGVsbG8=";
				const buffer = base64ToArrayBuffer(dataUrl);
				expect(buffer.byteLength).toBe(5);
			});
		});

		describe("urlBase64ToUint8Array", () => {
			it("should convert URL-safe base64 to Uint8Array", () => {
				const urlSafeBase64 = "SGVsbG8";
				const result = urlBase64ToUint8Array(urlSafeBase64);
				expect(result).toBeInstanceOf(Uint8Array);
			});
		});
	});
});
