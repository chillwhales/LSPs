/**
 * @chillwhales/lsp3
 *
 * LSP3 Universal Profile Metadata
 * Schemas, types, guards, and utility functions for profile metadata on LUKSO.
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp3-profile-metadata
 */

export { lsp3ProfileSchema } from "./schemas";
export type { LSP3Profile } from "./types";
export { isLsp3ProfileSchema } from "./guards";
export { getProfileImageUrl, getProfileDisplayName } from "./profile-utils";
