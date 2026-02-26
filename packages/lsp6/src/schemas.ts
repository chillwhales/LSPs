import { LSP6PermissionName, PERMISSIONS } from "@lukso/lsp6-contracts";
import { z } from "zod";

/**
 * LSP6 Permission name schema
 * Validates LSP6 permission names from the LSP6 contracts package
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp6-key-manager
 */
const permissionKeys = Object.keys(PERMISSIONS) as [
  LSP6PermissionName,
  ...LSP6PermissionName[],
];

export const permissionSchema = z.enum(permissionKeys);
