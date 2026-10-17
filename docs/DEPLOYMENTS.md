# Deployments

Official SKAL addresses are listed here and nowhere else. Any address not on this page is not SKAL.

## Mainnet-beta

Not deployed yet. Reserved addresses and the binary to be deployed:

| | |
|---|---|
| Vault program ID (reserved) | `5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ` |
| Deployer | `3bZ1Jj16o4qdcpNx2EGTZ5eXTZreGYBZx4pCLPGPaVqb` |
| `skal_vault.min.so` SHA-256 | `729572666d23a87adc0faeb747bc6599dc9efe556043b4708576764ae5588d6f` |
| Mint | pending phase 1 |
| Vault deployed / immutable | pending phase 2 |

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
