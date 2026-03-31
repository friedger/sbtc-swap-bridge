// Contract addresses and names
export const XBTC_CONTRACT_ADDRESS =
  "SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR";
export const XBTC_CONTRACT_NAME = "Wrapped-Bitcoin";
export const XBTC_ASSET_NAME = "wrapped-bitcoin";

export const SBTC_CONTRACT_ADDRESS =
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4";
export const SBTC_CONTRACT_NAME = "sbtc-token";
export const SBTC_ASSET_NAME = "sbtc-token";

export const SWXBTC_CONTRACT_ADDRESS =
  "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
export const SWXBTC_CONTRACT_NAME = "swapping-xbtc-v4";
export const SWXBTC_ASSET_NAME = "swapping-xbtc";

export const SWAP_CONTRACT_ADDRESS =
  "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
export const SWAP_CONTRACT_NAME = "xbtc-sbtc-swap-v4";

export const SBTC_REGISTRY_CONTRACT_ADDRESS =
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4";
export const SBTC_REGISTRY_CONTRACT_NAME = "sbtc-registry";
export const KNOWN_PEG_ADDRESS= "0204cff1ade0cc7f74d1b5a2b7c7bee653cfb5e6c0dce360795d314c829c4aaf52";

export const DUAL_STACKING_CONTRACT_ID = 'SP1HFCRKEJ8BYW4D0E3FAWHFDX8A25PPAA83HWWZ9.dual-stacking-v3_0_0';

// Custodian address
export const CUSTODIAN_ADDRESS = "SP2P6VX3JCD0VCP00VSNWW2KN27HERMVB1NBY68Z3";
export const DEPLOYER_ADDRESS = "SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9";
// Full contract identifiers
export const SWAP_CONTRACT_ID = `${SWAP_CONTRACT_ADDRESS}.${SWAP_CONTRACT_NAME}`;
export const XBTC_CONTRACT_ID = `${XBTC_CONTRACT_ADDRESS}.${XBTC_CONTRACT_NAME}`;
export const SBTC_CONTRACT_ID = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}`;
export const SWXBTC_CONTRACT_ID = `${SWXBTC_CONTRACT_ADDRESS}.${SWXBTC_CONTRACT_NAME}`;

// API URLs
export const STACKS_API_URL = "https://api.mainnet.hiro.so";
export const STACKS_WS_URL = "wss://api.mainnet.hiro.so";

// External links
export const EXPLORER_CONTRACT_URL = `https://explorer.hiro.so/txid/${SWAP_CONTRACT_ID}?chain=mainnet`;
export const EXPLORER_XBTC_URL = `https://explorer.hiro.so/txid/${XBTC_CONTRACT_ID}?chain=mainnet`;
export const EXPLORER_SWXBTC_URL = `https://explorer.hiro.so/txid/${SWXBTC_CONTRACT_ID}?chain=mainnet`;
export const EXPLORER_SBTC_URL = `https://explorer.hiro.so/txid/${SBTC_CONTRACT_ID}?chain=mainnet`;
export const EXPLORER_ADDRESS_URL = "https://explorer.hiro.so/address";
export const EXPLORER_TX_BASE_URL = "https://explorer.hiro.so/txid";
export const GITHUB_REPO_URL = "https://github.com/friedger/sbtc-swap-bridge";
export const FAST_POOL_URL = "https://fastpool.org/";

// Network
export const NETWORK = "mainnet";
