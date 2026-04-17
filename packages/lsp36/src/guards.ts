import { signedAuthorizationSchema } from "./schemas";
import type { SignedAuthorization } from "./types";

/**
 * Type guard — checks if data is a valid SignedAuthorization.
 * Never throws on any input.
 */
export function isSignedAuthorization(
	data: unknown,
): data is SignedAuthorization {
	return signedAuthorizationSchema.safeParse(data).success;
}
