#!/usr/bin/env bash
# Build SBPF v3, buang section header, lalu cetak perkiraan biaya deploy di mainnet.
set -euo pipefail
cd "$(dirname "$0")/.."
cargo build-sbf --arch v3 >/dev/null
python scripts/strip_elf.py target/deploy/ringan.so target/deploy/ringan.min.so
size=$(stat -c %s target/deploy/ringan.min.so)
# Rent-exempt = (data + 128) x 5080 lamport (tarif mainnet per Oktober 2026; cek: solana -um rent <byte>).
programdata=$(( (size + 45 + 128) * 5080 ))
program=$(( (36 + 128) * 5080 ))
fees=$(( (size / 1000 + 3) * 5000 ))
total=$(( programdata + program + fees ))
printf "ringan.min.so: %d byte\nperkiraan deploy: %d lamport = %s SOL\n" "$size" "$total" "$(python -c "print($total/1e9)")"
