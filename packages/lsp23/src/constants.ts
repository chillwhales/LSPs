/**
 * LUKSO Mainnet contract addresses for LSP23 deployment.
 * These are constants specific to the LUKSO network.
 */

/** LSP23 Linked Contracts Factory */
export const LSP23_FACTORY_ADDRESS =
  "0x2300000A84D25dF63081feAa37ba6b62C4c89a30";

/** LSP23 Post Deployment Module */
export const LSP23_POST_DEPLOYMENT_MODULE =
  "0x000000000066093407b6704B89793beFfD0D8F00";

/** Universal Receiver Delegate */
export const UNIVERSAL_RECEIVER_ADDRESS =
  "0x7870C5B8BC9572A8001C3f96f7ff59961B23500D";

/** Standard implementation contracts for proxy patterns */
export const IMPLEMENTATIONS = {
  /** Universal Profile implementation contract */
  UNIVERSAL_PROFILE: "0x3024D38EA2434BA6635003Dc1BDC0daB5882ED4F",
  /** LSP6 Key Manager implementation contract */
  LSP6_KEY_MANAGER: "0x2Fe3AeD98684E7351aD2D408A43cE09a738BF8a4",
} as const;
