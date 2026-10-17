# Blueprint

## Goal

Ship a token where the three usual rug vectors are closed by code, not by promises, inside a hard on-chain budget of 0.03 SOL (target 0.01 SOL).

| Rug vector | Closed by |
|---|---|
| Infinite mint | Mint authority set to `null` in the launch transaction |
| Wallet freeze | Freeze authority `null` from mint creation |
| Creator dump | 14% creator allocation held by a stateless vesting vault |
| Metadata swap | Token-2022 on-mint metadata, update authority removed |

## Token distribution

| Share | Amount (SKAL) | Where |
|---|---|---|
| 14% | 140,000,000,000 | Vesting vault: 90-day cliff, linear to day 365 |
| 70% | 700,000,000,000 | Liquidity pool (separately funded, LP locked or burned) |
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
| **Total** | **0.01970** |

## Launch plan under a 0.01 SOL budget

The vault PDA and its token account depend only on the program ID, not on deployed code. That allows two phases:

1. **Phase 1 (0.0054 SOL).** Launch the mint. 14% goes to the vault's token account, where nobody can move it because no program exists to sign for the PDA.
2. **Phase 2 (~0.0143 SOL, when funded).** Deploy the exact binary whose SHA-256 is published in [DEPLOYMENTS.md](DEPLOYMENTS.md) at the pre-generated program ID, then make it immutable with `--final`.

Between phases the allocation is strictly safer for holders than vesting (it cannot move at all). The trade-off is that the vault code is not yet inspectable on-chain; the published hash closes that gap once phase 2 lands.

## Research baseline

`src/` holds Ringan, a 1,352-byte custom token program used to measure how small a token can be. See [RINGAN.md](RINGAN.md).
