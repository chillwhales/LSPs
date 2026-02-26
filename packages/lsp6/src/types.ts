import type { Address, Hex } from "viem";
import { z } from "zod";

import { permissionSchema } from "./schemas";

/**
 * LSP6 Permission name type
 * Inferred from the permissionSchema enum
 */
export type LSP6Permission = z.infer<typeof permissionSchema>;

/**
 * Parsed AllowedCall entry from CompactBytesArray
 *
 * @see https://docs.lukso.tech/standards/universal-profile/lsp6-key-manager#allowed-calls
 */
export interface AllowedCall {
  callTypes: Hex;
  address: Address;
  interfaceId: Hex;
  functionSelector: Hex;
}
