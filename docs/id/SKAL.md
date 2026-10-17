# Save Kalimantan (SKAL)

Token Token-2022 dengan 14% jatah pembuat dikunci di vault vesting Pinocchio. Nama dipakai untuk keperluan edukasi. Proyek ini tidak menggalang dana dan tidak terafiliasi dengan lembaga apa pun.

## Angka

| | |
|---|---|
| Supply | 1.000.000.000.000 SKAL (1 triliun), 6 desimal |
| Vault vesting | 14% = 140 miliar SKAL |
| Wallet pembuat | 86% = 860 miliar SKAL, sumber likuiditas dan distribusi komunitas |
| Jadwal vault | cliff 90 hari, lalu lepas linear sampai hari ke-365 |
| Mint authority | dicabut (null) di transaksi peluncuran |
| Freeze authority | null sejak mint dibuat |
| Metadata | on-chain di akun mint, update authority dicabut |

## Biaya terukur (validator lokal, tarif sewa mainnet)

| Langkah | SOL |
|---|---|
| Deploy vault (`skal_vault.min.so`, 2.472 byte) | 0,01430 |
| Peluncuran: mint, metadata, 2 ATA, 2 mint, cabut authority | 0,00540 |
| **Total on-chain** | **0,01970** |

Di bawah batas diskualifikasi 0,03 SOL. Target 0,01 hanya tercapai oleh program Ringan saja (0,00861 SOL). Paket SKAL lengkap belum bisa turun ke 0,01 karena sewa program vault sendiri sudah 0,0143.

## Vault

Program: `vault/src/lib.rs`. Satu instruksi, tanpa akun state.

Akun: `vault_token (w), mint, dest_token (w), vault_pda, token_program`
Data (26 byte): `total u64 | start i64 | end i64 | decimals u8 | bump u8`

Cara kerjanya:
1. PDA vault diturunkan dari `dest_token + total + start + end + bump`. Jadwal tidak disimpan di akun, jadwal *adalah* alamatnya. Mengubah satu angka saja menghasilkan PDA lain yang tidak memegang token.
2. Program menghitung jumlah yang masih terkunci pada waktu `Clock`, lalu memanggil `TransferChecked` Token-2022 sebesar `saldo − terkunci` ke `dest_token`.
3. Siapa pun boleh memanggil `release`. Token hanya bisa pergi ke `dest_token` yang tertanam di seed, jadi tidak ada yang bisa membelokkannya.
4. Hanya program Token-2022 asli yang diterima.

Tanpa signer, tanpa admin, tanpa akun state. Setelah upgrade authority dicabut, tidak ada yang bisa mengubah aturan ini, termasuk pembuatnya.

## Tes (16/16 lulus)

```
node client/test-skal.mjs <vault-program-id> <payer.json>
```

Mencakup supply, authority null, metadata terkunci, pembagian 14/86, release parsial, PDA palsu, program token palsu, penerima lain, release setelah selesai, release kosong, dan cliff.

## Liquidity pool

Pool tidak masuk anggaran 0,03 SOL. Biaya pembuatan pool di DEX dan modal SOL untuk likuiditas jauh di atas angka itu, jadi pool diperlakukan sebagai langkah kedua yang didanai terpisah.

Rancangan yang disarankan:
- **DEX:** Meteora DAMM v2 atau Raydium CPMM. Keduanya mendukung Token-2022. Cek biaya pembuatan pool di UI masing-masing saat membuat.
- **Pasangan:** SKAL/SOL.
- **Isi:** 70% supply (700 miliar SKAL) ke pool. 16% sisanya untuk distribusi komunitas (airdrop, hadiah kegiatan edukasi).
- **LP:** dikunci permanen atau dibakar segera setelah pool dibuat, supaya likuiditas tidak bisa ditarik. Tunjukkan transaksi penguncian di Solscan saat presentasi.
- **Harga awal:** ditentukan oleh rasio SKAL dan SOL yang disetor. Modal SOL kecil berarti harga mudah bergerak. Sampaikan ini terus terang kepada juri.

Pool yang "sehat" di sini berarti: LP tidak bisa ditarik pembuat, pembuat tidak bisa mencetak token baru, pembuat tidak bisa membekukan akun, dan jatah pembuat terkunci 12 bulan oleh kode yang tidak bisa diubah. Kedalaman pool tetap bergantung pada modal SOL yang disetor.

## Langkah mainnet (dijalankan sendiri oleh pemilik wallet)

Pakai wallet mainnet sendiri. Jangan pakai keypair di folder `keys/`, semuanya keypair uji lokal.

```bash
cd vault && cargo build-sbf --arch v3 && cd .. && python scripts/strip_elf.py vault/target/deploy/skal_vault.so vault/target/deploy/skal_vault.min.so
```

```bash
solana -um program deploy vault/target/deploy/skal_vault.min.so -k <wallet-mainnet.json>
```

```bash
node client/launch.mjs https://api.mainnet-beta.solana.com <wallet-mainnet.json> <vault-program-id>
```

`launch.mjs` menulis `launch-<mint>.json`. Simpan file itu. Isinya (`total`, `start`, `end`, `bump`) dibutuhkan untuk menyusun instruksi `release`.

Setelah semua dicek di Solscan, cabut upgrade authority vault. Langkah ini tidak bisa dibatalkan:

```bash
solana -um program set-upgrade-authority <vault-program-id> --final -k <wallet-mainnet.json>
```

## Batasan

- Jadwal harus disimpan di luar chain (file `launch-*.json`). Kalau hilang, jadwal bisa direkonstruksi dari tanda tangan transaksi peluncuran, tapi lebih repot.
- Vault memakai waktu `Clock` validator, yang bisa melenceng beberapa detik.
- Tidak ada audit pihak ketiga.
