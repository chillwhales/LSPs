import type { z } from "zod";
import type { signedAuthorizationSchema } from "./schemas";

/** Inferred TypeScript type for a SignedAuthorization */
export type SignedAuthorization = z.infer<typeof signedAuthorizationSchema>;

/** LSP36 verification mode flag */
export type LSP36Mode = typeof import("./constants").MODE_FULL_VERIFICATION | typeof import("./constants").MODE_PRE_APPROVED;
