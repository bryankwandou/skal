# Blueprint

## Goal

Ship a token where the usual rug vectors are closed by code, not by promises, inside a hard on-chain budget of 0.03 SOL for token and vault (target 0.01 SOL), then list it on a DEX without depositing SOL.

Status: live on mainnet since 2026-10-17. Addresses are in [DEPLOYMENTS.md](DEPLOYMENTS.md).

| Rug vector | Closed by |
|---|---|
| Infinite mint | Mint authority set to `null` in the launch transaction |
| Wallet freeze | Freeze authority `null` from mint creation |
| Creator dump | 14% creator allocation held by a stateless vesting vault |
| Metadata swap | Token-2022 on-mint metadata, update authority removed |
| Liquidity pull | Pool position permanently locked in the pool's creation transaction |

## Token distribution

| Share | Amount (SKAL) | Where |
|---|---|---|
| 14% | 140,000,000,000 | Vesting vault: 90-day cliff, linear to day 365 |
| 70% | 700,000,000,000 | Meteora DAMM v2 pool, single-sided, position permanently locked |
| 16% | 160,000,000,000 | Community distribution |

Supply is fixed at 1,000,000,000,000 SKAL with 6 decimals.

## Vault design

`vault/src/lib.rs`, Pinocchio, `no_std`, no allocator, 2,472 bytes after stripping section headers.

- **No state account.** The schedule is the address: `vault_pda = PDA([dest_token, total ‖ start ‖ end], bump)`. Changing any number derives a different PDA that holds nothing.
- **One instruction, `Release`.** Accounts `[vault_token (w), mint, dest_token (w), vault_pda, token_program]`; data `total u64 | start i64 | end i64 | decimals u8 | bump u8` (26 bytes).
- **Permissionless.** Anyone may call it; tokens can only go to `dest_token`.
- **Math.** `vested = (total / d) * e + (total % d) * e / d` with `d = end - start`, `e = now - start`. No 128-bit multiply, no overflow for any `u64` total.
- **Token program pinned** to Token-2022 so the PDA signature cannot be replayed into another program.

## Costs (mainnet rent rates, measured)

| Step | SOL |
|---|---|
| Mint launch: mint + metadata, 2 ATAs, mint-to, revoke authorities | 0.00540 |
| Vault program deploy (2,472 bytes) | 0.01430 |
| **Token and vault (the 0.03 SOL budget)** | **0.01970** |
| DEX pool: pool, position, position NFT, 4 token accounts (rent only) | 0.01800 |
| **Everything on-chain** | **0.03770** |

The pool is outside the 0.03 SOL budget. Raydium CPMM was rejected because its creation fee alone is 0.15 SOL.

## Liquidity design

- **Venue.** Meteora DAMM v2, which supports Token-2022 and charges no pool creation fee.
- **Single-sided.** The pool was seeded with 700B SKAL and 0 SOL at a start price of 1e-11 SOL per SKAL (a 10 SOL fully diluted value). The start price equals the pool's minimum price, which is what lets one side be empty. SOL enters only when someone buys.
- **Locked.** `createCustomPool` runs `permanentLockPosition` in the same transaction, so 100% of the position can never be withdrawn. The position owner can still claim the 1% swap fee, paid in SOL.
- **Depth.** A buy moves the price by about 2 × (buy ÷ SKAL value in the pool). At launch the SKAL side is worth 7 SOL, so 0.01 SOL moves the price about 0.3%. Selling is limited to SOL that buyers have put in.

## Known limitations visible in wallets

| Wallet warning | Why | Fixable? |
|---|---|---|
| Low liquidity | No SOL was deposited; the SOL side grows only from buys | Only by real trading or a SOL deposit |
| Unverified token | Not yet reviewed by Jupiter's verification | Yes, by applying at Jupiter; a listing review, not code |
| Missing file metadata | The metadata URI was left empty at launch and the update authority was then removed | No. Name and symbol are on-chain; no off-chain logo can ever be attached |

## Launch history

The mint went live first and the vault program second, both on 2026-10-17. The vault PDA and its token account depend only on the program ID, so the 14% sat in an account no program could sign for until the binary with the pre-published SHA-256 was deployed and made immutable with `--final`.

## Research baseline

`src/` holds Ringan, a 1,352-byte custom token program used to measure how small a token can be. See [RINGAN.md](RINGAN.md).
