# Security

## Status

No third-party audit has been performed. The code is small enough to read in one sitting (the vault is 143 lines), and that is the intended review path.

## Threat model of the vault

| Attack | Why it fails | Test |
|---|---|---|
| Pass a fake schedule (smaller `total`, earlier `end`) | The schedule is part of the PDA seeds. A different schedule derives a different PDA, which owns no tokens and cannot sign for the real vault. | `jadwal palsu (PDA tidak cocok)` |
| Pass a fake token program to abuse the PDA signature | The program accepts only the Token-2022 program ID, compared word by word. | `program token palsu` |
| Redirect released tokens to another wallet | The destination token account is a PDA seed. | `tarik ke penerima lain` |
| Release before the cliff | Nothing is vested before `start`; the call fails. | `release sebelum cliff` |
| Drain twice | Release only moves `balance - locked`; with nothing releasable the call fails. | `release saat tidak ada yang bisa dilepas` |

## Known limitations

- **Phased launch.** If the mint is launched before the vault program is deployed, the 14% sits in the vault's token account and nobody can move it. Until the program is deployed, its code cannot be inspected on-chain. The SHA-256 of the exact binary is published in [docs/DEPLOYMENTS.md](docs/DEPLOYMENTS.md); compare it with `solana program dump` after deployment.
- **Upgrade authority.** The vault is trustless only after `solana program set-upgrade-authority <id> --final`. DEPLOYMENTS.md records whether this has happened.
- The schedule (`total`, `start`, `end`, `bump`) lives off-chain in `launch-<mint>.json`. It can be reconstructed from the launch transaction if lost.
- Time comes from the validator `Clock` and can drift by seconds.

## Reporting

Open a GitHub issue for non-sensitive findings. For anything that could put funds at risk, use GitHub's private vulnerability reporting (Security tab → Report a vulnerability) instead of a public issue.
