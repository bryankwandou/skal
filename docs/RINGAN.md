# Ringan

Ringan is the research baseline: the smallest custom token program we could write in Pinocchio. Source: `src/lib.rs`.

| | |
|---|---|
| Program size | 1,352 bytes |
| Supply | 21,000,000 (6 decimals), minted once to the genesis holder |
| Mint authority | none exists |
| Holder account | 48 bytes: `owner [0..32] · amount u64 [32..40] · unlock_ts i64 [40..48]` |
| On-chain cost | 0.00861 SOL |

## Instructions

Accounts are always `[holder, owner (signer), to?]`. Data is a `u8` tag followed by little-endian `u64`/`i64`.

| Tag | Name | Accounts | Effect |
|---|---|---|---|
| 0 | Open | `holder, owner` | Sets the owner; the genesis holder also receives the full supply |
| 1 | Transfer | `from, owner, to` + `u64` | Fails if `from` is locked or `to` is not opened |
| 2 | Lock | `holder, owner` + `i64` | Locks the balance until a Unix time; can only be extended |

## Why SKAL does not use it

Ringan is not an SPL token, so wallets, explorers and DEXes do not recognise it. SKAL uses Token-2022 for compatibility and puts the custom logic only in the vault. Ringan stays in the repo as the measurement of how far size and cost can go.

The program deliberately skips the "holder is owned by this program" check: the runtime already rejects writes to accounts owned by other programs, and every successful path writes to the holder.
