# xBTC → sBTC Swap Agent Instructions

This file describes how an AI agent can autonomously perform the xBTC → sBTC swap on the Stacks mainnet using an MCP tool capable of signing and broadcasting Stacks transactions.

---

## Overview

The swap converts **xBTC** (Wrapped Bitcoin, a SIP-010 fungible token) into **sBTC** (wrapped Bitcoin, a SIP-010 fungible token on Stacks) via a two-step on-chain process through the `xbtc-sbtc-swap-v4` contract.

---

## Network

- **Network:** Stacks mainnet
- **Stacks API:** `https://api.mainnet.hiro.so`

---

## Contract Addresses

| Token / Contract   | Contract ID                                                             |
|--------------------|-------------------------------------------------------------------------|
| Swap contract      | `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.xbtc-sbtc-swap-v4`         |
| xBTC token         | `SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin`            |
| sBTC token         | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token`                |
| swxBTC (receipt)   | `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.swapping-xbtc-v4`          |

---

## Required Inputs

Before starting the swap, the agent must know:

1. **User STX address** — the `SP...` address that holds xBTC and will receive sBTC.
2. **Amount** (in satoshis, integer) — the number of xBTC units (8 decimals, so 1 BTC = 100000000) to swap. Typically the full xBTC balance of the user.

---

## Pre-flight Checks (Read-Only Calls)

Before submitting any transaction, verify the following via read-only contract calls or the Stacks API:

| Check | How | Required condition |
|---|---|---|
| User xBTC balance | `GET https://api.mainnet.hiro.so/extended/v1/address/{userAddress}/balances` → `fungible_tokens["SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin::wrapped-bitcoin"].balance` | Must be > 0 to proceed with Step 1 |
| User swxBTC balance | Same endpoint → `fungible_tokens["SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.swapping-xbtc-v4::swapping-xbtc"].balance` | Must be > 0 to proceed with Step 2 |
| Contract sBTC balance | Same endpoint for contract address `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9` → `fungible_tokens["SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token"].balance` | Must be ≥ user swxBTC balance for Step 2 to succeed |

---

## Step 1: Deposit xBTC

**Goal:** Send the user's xBTC to the swap contract. The contract mints an equal amount of swxBTC to the user as a receipt.

**Contract call:**
- **Contract:** `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.xbtc-sbtc-swap-v4`
- **Function:** `deposit-xbtc`
- **Arguments:** `[uint amount]` — amount in satoshis
- **Post-condition (deny mode):** The user's address sends exactly `amount` of `SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin::wrapped-bitcoin`

**After submission:** Wait for the transaction to be confirmed (status = `success`) before proceeding to Step 2. Poll `GET https://api.mainnet.hiro.so/extended/v1/tx/{txid}` and check `tx_status`. Then wait for the contract to hold sBTC, this usually takes 24 hours.

---

## Step 2: Claim sBTC

**Goal:** Burn the user's swxBTC receipt tokens. The contract sends an equal amount of sBTC to the user.

**Contract call:**
- **Contract:** `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.xbtc-sbtc-swap-v4`
- **Function:** `claim-sbtc`
- **Arguments:** none
- **Post-conditions (deny mode):**
  1. The swap contract sends ≥ `amount` of `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token::sbtc-token`
  2. The user sends ≤ `amount` of `SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.swapping-xbtc-v4::swapping-xbtc`

**After submission:** Verify completion by checking the user's sBTC balance has increased.

---

## Optional: Cancel Swap (Withdraw xBTC)

If Step 2 cannot be completed (e.g., insufficient sBTC liquidity in the contract), the user can cancel and recover their xBTC:

- **Function:** `withdraw-xbtc`
- **Arguments:** `[uint amount]`
- **Post-conditions (deny mode):**
  1. Contract sends exactly `amount` of xBTC to user
  2. User burns exactly `amount` of swxBTC

---

## Agent Decision Flow

```
1. Fetch user xBTC balance
   ├── balance == 0 AND user swxBTC balance == 0 → Nothing to do, exit
   ├── balance == 0 AND user swxBTC balance > 0 → Skip to Step 2
   └── balance > 0 → Execute Step 1 (deposit-xbtc)
          └── Wait for confirmation
              └── Fetch contract sBTC balance
                  ├── contract sBTC > 0 → Execute Step 2 (claim-sbtc)
                  └── contract sBTC = 0 → Wait and go to Fetch contract sBTC balance; optionally withdraw-xbtc to cancel
```

---

## Transaction Status Polling

Poll until `tx_status` is `success` or `abort_by_response`:

```
GET https://api.mainnet.hiro.so/extended/v1/tx/{txid}
```

Response field: `tx_status` — possible values: `pending`, `success`, `abort_by_response`, `abort_by_post_condition`.

---

## Notes

- All token amounts use **8 decimal places** (satoshi units). 1 BTC = `100000000`.
- The swap is **1:1**: 1 xBTC → 1 swxBTC → 1 sBTC (no fees in the contract itself, only Stacks network fees in STX).
- The agent's signing address must have enough **STX** to pay transaction fees for both steps.
- The `claim-sbtc` function uses the minimum of the caller's **entire** swxBTC balance and the contracts sBTC balance.
