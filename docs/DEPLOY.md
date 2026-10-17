# Mainnet runbook

Never use keypairs from `keys/`; they are local test keys. Mainnet keypairs live outside the repo in `~/.config/solana/`.

| Role | Keypair file | Address |
|---|---|---|
| Deployer / payer | `ringan-mainnet.json` | `3bZ1Jj16o4qdcpNx2EGTZ5eXTZreGYBZx4pCLPGPaVqb` |
| Vault program ID | `skal-vault-mainnet.json` | `5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ` |

## 0. Build and verify the binary

```bash
cd vault && cargo build-sbf --arch v3 && cd ..
```

```bash
python scripts/strip_elf.py vault/target/deploy/skal_vault.so vault/target/deploy/skal_vault.min.so
```

```bash
sha256sum vault/target/deploy/skal_vault.min.so
```

The hash must match the one in [DEPLOYMENTS.md](DEPLOYMENTS.md).

## 1. Phase 1: launch the mint (0.0054 SOL)

The deployer needs at least 0.0095 SOL to leave a margin for fees.

```bash
cd client && node launch.mjs https://api.mainnet-beta.solana.com ~/.config/solana/ringan-mainnet.json 5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ ""
```

Run this from Bash, not Windows PowerShell 5.1: PowerShell drops the empty `""` argument, which shifts the cliff and end days into the wrong slots. The metadata URI is locked at launch. An empty URI is final; pass a real URI only if it is already permanent.

Keep the generated `launch-<mint>.json`. Its `total`, `start`, `end` and `bump` are required to build `Release`. Record mint, vault PDA, vault token account and both signatures in DEPLOYMENTS.md.

## 2. Phase 2: deploy the vault (~0.0143 SOL)

```bash
solana -um program deploy vault/target/deploy/skal_vault.min.so --program-id ~/.config/solana/skal-vault-mainnet.json -k ~/.config/solana/ringan-mainnet.json
```

```bash
solana -um program dump 5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ dumped.so
```

Compare `sha256sum dumped.so` with the published hash, then make the program immutable. This cannot be undone:

```bash
solana -um program set-upgrade-authority 5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ --final -k ~/.config/solana/ringan-mainnet.json
```

## 3. Liquidity pool (separate budget)

See [id/SKAL.md](id/SKAL.md#liquidity-pool). Not part of the 0.03 SOL budget.
