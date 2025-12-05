// Contract addresses and names
export const XBTC_CONTRACT_ADDRESS = 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR';
export const XBTC_CONTRACT_NAME = 'Wrapped-Bitcoin';
export const XBTC_ASSET_NAME = 'wrapped-bitcoin';

export const SBTC_CONTRACT_ADDRESS = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
export const SBTC_CONTRACT_NAME = 'sbtc-token';
export const SBTC_ASSET_NAME = 'sbtc-token';

export const SWAP_CONTRACT_ADDRESS = 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9';
export const SWAP_CONTRACT_NAME = 'xbtc-sbtc-swap';

// Full contract identifiers
export const SWAP_CONTRACT_ID = `${SWAP_CONTRACT_ADDRESS}.${SWAP_CONTRACT_NAME}`;
export const XBTC_CONTRACT_ID = `${XBTC_CONTRACT_ADDRESS}.${XBTC_CONTRACT_NAME}`;
export const SBTC_CONTRACT_ID = `${SBTC_CONTRACT_ADDRESS}.${SBTC_CONTRACT_NAME}`;

// API URLs
export const STACKS_API_URL = 'https://api.mainnet.hiro.so';

// External links
export const EXPLORER_CONTRACT_URL = `https://explorer.hiro.so/txid/${SWAP_CONTRACT_ID}?chain=mainnet`;
export const GITHUB_REPO_URL = 'https://github.com/friedger/sbtc-swap-bridge';

// Network
export const NETWORK = 'mainnet';
