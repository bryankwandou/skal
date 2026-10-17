# Deployments

Official SKAL addresses are listed here and nowhere else. Any address not on this page is not SKAL.

## Mainnet-beta

Launched 2026-10-17. Vault immutable, mint and freeze authorities revoked, metadata locked.

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

`8xXDifrJWyBPEyUyAMUrtAnVXULP8GbKfUjr1s6N8FmH` is a discarded devnet launch: PowerShell 5.1 drops empty `""` arguments, which shifted every argument by one. Run `launch.mjs` from Bash, or pass a non-empty URI.

End-to-end suite on devnet: `node client/test-skal.mjs <vault-program-id> <payer.json> https://api.devnet.solana.com` gives `16 lulus, 0 gagal`.
