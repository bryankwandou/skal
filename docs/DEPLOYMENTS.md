# Deployments

Official SKAL addresses are listed here and nowhere else. Any address not on this page is not SKAL.

## Mainnet-beta

Launched 2026-10-17. Vault immutable, mint and freeze authorities revoked, metadata locked, pool LP locked.

| | |
|---|---|
| Vault program | `5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ` |
| ProgramData | `E5ynGj1X4YbhL4aLjYmzY4W7DMSZDxPdUCrVRNFYJvxw` |
| Upgrade authority | none (set with `--final`) |
| Deployer | `3bZ1Jj16o4qdcpNx2EGTZ5eXTZreGYBZx4pCLPGPaVqb` |
| `skal_vault.min.so` SHA-256 | `729572666d23a87adc0faeb747bc6599dc9efe556043b4708576764ae5588d6f` (matches `solana program dump`) |
| Deploy signature | `FoHRLvRK6R4wKuZV3CoBT3wPngdnNksbBdvK7AHZPtUsoNoy6au4McGQpxidiHMed4zJXqTL1DKBQkk8Eboj9it` |
| Finalize signature | `42Hf5bavXsQRgZ66KuKfg8oqSfA55zoSUtyGn56YmexLhtzhCKGzgKHAJzVRiFDZanibLM1GQsUVAvNP7QayY16o` |
| Measured deploy cost | 0.01430 SOL |
| **SKAL mint** | `5nySYzo5RxuefMYnKztHaAGbwrEBBtrFiv1g5XVqnpmS` |
| Creator token account (86%) | `6LQQQvJFmUiW2e4aE2Dzp7mz5vyc2Nq1N9HxNxPqEUew` |
| Vault PDA | `DDPqop8GyjYHaq5LzP4xECkKkZcqzz2J7SbC2AwsHKQP` |
| Vault token account (14%) | `4yaWsT9hL1QagsS7BxFJGqVoxgqTumLq9bgTmF28UVS2` |
| Schedule | total `140000000000000000`, start `1800017970` (2027-01-15), end `1823777970` (2027-10-17), bump `255` |
| Launch signatures | `61UE9gxfnSWzqN26wgaGQk76tyLvQPDP5Y2WoCEA8PfTR4GqpA6euKvpuh7exsw3b8QQ35JM2ZFquVnbatog9o4n`, `pVYjnpDBcvM8hLo9jEiqTAp9m5W7ia7YioZHqrGpkgKkfPvwQDQhodz92YYfWozaDYXd5tYKuqypxk8A5mUT4g5` |
| Measured launch cost | 0.00540 SOL (total with vault: 0.01970 SOL) |
| **Liquidity pool** | `9oejCQAKdkkVWCeqDvLYYsTqT8KQLf9sMebcfF5YPWRe` (Meteora DAMM v2, SKAL/SOL) |
| Pool position / NFT | `77e5yTa4wohGUVEPDbdmQbJpVdrb56zaf9yus65wqboV` / `2D34fWUDjejWe7TFbzfJjpYFtDmrABVmGE6WX54HSNw5` |
| Pool signature | `5vrwyPRFesUoYsBm8D2Z9GCwmP3xrbQCFjUWqG8v2tWR7UynBqGDy7k1r61XeDGXZcBvV2oZf1eAQQS2NHrwruRe` |
| Pool deposit | 700,000,000,000 SKAL (70%), 0 SOL; start price 1e-11 SOL per SKAL; 1% swap fee paid in SOL |
| LP | 100% permanently locked in the creation transaction |
| First buy (creator test, 0.002 SOL) | `5EzfSVjDrSwyqJn3UcV2zSE4qeeD9LhMEFm6uPsmHbb9EyLhXPoipE4456yHv13DdFDxX19JFaphWVnhAZjNEyci`, received 197,944,010 SKAL; opens the sell side and the DexScreener listing |
| Measured pool cost | 0.017998281 SOL, all rent (Meteora charges no creation fee). Total on-chain spend: 0.03770 SOL |

## Devnet

Deployed 2026-10-17 from `vault/target/deploy/skal_vault.min.so` (2,472 bytes).

| | |
|---|---|
| Vault program | `CW69TjeM9Xk8hFnqsvDZRYhGYcKXtnJj2N7VbJSQxz1o` |
| ProgramData | `7eupUEHm2WNpHPaXVC9M6pZMzKNYjWXpcHZJ34G2Pz6m` |
| Upgrade authority | `8dr9rMNaLsCvCpL4kbzj3mkPTfAAhyHhiXZhZxBGCWfr` |
| Deploy signature | `4aBrZPUWeZ8WCARkptcjc7Rw57RNcvCEUqscFLzQecampwwax5p81sZfrMsecZ5UuUvGnKqonvdYcqcRA6fn4FUr` |
| Test mint | `CCY5GpTR41RkG2KXH5rMxyeMTsmVZyTZRdrjfjbjZrV` |

Demo launch used by the website's live proof and attack lab. Its vesting started 30 days before launch so part of the vault is releasable:

| | |
|---|---|
| Mint | `9kcZo6DqzeZfZDqp9WRn3c95N1bJAgdLANWcgMGRU7YT` |
| Vault PDA | `EDXgLoukPV2B829Y73xxeVUHNsX699agqvRBhEGgy42P` |
| Vault token account | `FNVoCLY25i9sV19HaafHGJD2EaTbjCujHfsadcFibwid` |
| Schedule | total `140000000000000000`, start `1789646245`, end `1821182245`, bump `255` |

Devnet pool rehearsal on the demo mint (Meteora DAMM v2, `node client/pool.mjs`):

| | |
|---|---|
| Pool | `7B26oGu2fjoHbxcSfU8fSGjAWRgupfj3EAaNdXZA5vEZ` |
| Position / NFT | `CRZBSB1QfRkVzYmNSs8JrwALWm4G5DiRdT3wxWe2y8f8` / `BRxqhuMXLjUGrKLWd5ZRAKrD2XS1k92u8MYEBXydUe9` |
| Create signature | `23cRS7Fh4GzWF17j7A3vjqy2i3qR9U8QzMmziBKUi2Xd8ofCURzdeVoUUapnPTrzooHtJHK4q3GgWpG3Uj3a6cJq` |
| Deposit | 700,000,000,000 SKAL, 0 SOL, start price 1e-11 SOL per SKAL, 1% swap fee |
| LP locked | 100% permanent |
| Measured cost | 0.017998281 SOL |
| Test buy (0.01 SOL) | `23B4BX2Vq3sou1hjnZrXRHGoK2Sza3W9MiWgX1xoYVkHqgXNyktdC7NSsCMiAkPL7EkmSbUdb9J4DBH62eQZ6fDJ`, received 988,601,834 SKAL |

`8xXDifrJWyBPEyUyAMUrtAnVXULP8GbKfUjr1s6N8FmH` is a discarded devnet launch: PowerShell 5.1 drops empty `""` arguments, which shifted every argument by one. Run `launch.mjs` from Bash, or pass a non-empty URI.

End-to-end suite on devnet: `node client/test-skal.mjs <vault-program-id> <payer.json> https://api.devnet.solana.com` gives `16 lulus, 0 gagal`.
