# Naskah pitch SKAL (± 3 menit)

## 0:00 – Pembuka (20 detik)

"Token baru biasanya punya tiga pertanyaan yang sama: apakah pembuatnya bisa mencetak lagi, apakah bisa membekukan dompet orang, dan apakah jatah pembuat bisa dijual besok pagi. Save Kalimantan menjawab ketiganya dengan 'tidak', dan jawabannya bisa dicek langsung di chain, bukan cuma dijanjikan."

## 0:20 – Apa yang dibuat (40 detik)

- Token-2022, 1 triliun SKAL, metadata disimpan di akun mint sendiri.
- Mint authority dicabut di transaksi yang sama dengan pencetakan. Supply final.
- Freeze authority tidak pernah ada.
- 14% jatah pembuat masuk vault yang ditulis dengan Pinocchio: cliff 3 bulan, lalu lepas bertahap sampai 12 bulan.

"Seluruh paket on-chain, program vault plus peluncuran token, menghabiskan 0,0197 SOL."

## 1:00 – Kenapa vault ini menarik (50 detik)

"Vault ini tidak punya akun state dan tidak punya admin. Jadwalnya disimpan di alamatnya sendiri: PDA diturunkan dari penerima, jumlah, waktu mulai, dan waktu selesai. Kalau ada yang mengubah satu angka saja, alamatnya berubah dan alamat itu kosong."

"Siapa pun boleh memanggil release, tapi token cuma bisa mengalir ke satu penerima yang tertanam di alamat itu. Programnya 2.472 byte. Setelah upgrade authority dicabut, saya sendiri pun tidak bisa mengubah aturannya."

## 1:50 – Demo Solscan (50 detik)

Buka tab yang sudah disiapkan:
1. **Mint SKAL** → Mint Authority: kosong. Freeze Authority: kosong. Supply: 1.000.000.000.000.
2. **Metadata** → nama dan simbol ada di akun mint, update authority kosong.
3. **Vault token account** → saldo 140.000.000.000 SKAL, pemiliknya PDA program vault.
4. **Program vault** → Upgradeable: tidak (setelah `--final`).
5. **Pool + LP** (jika sudah dibuat) → transaksi penguncian atau pembakaran LP.

## 2:40 – Penutup (20 detik)

"Teruji 16 skenario di validator lokal, termasuk jadwal palsu, program token palsu, dan penerima palsu. Semuanya ditolak. Nama Save Kalimantan dipakai untuk edukasi, proyek ini tidak menggalang dana. Yang ingin saya tunjukkan adalah token yang aturannya dikunci oleh kode."

## Pertanyaan yang mungkin muncul

**Kenapa 0,0197 dan bukan 0,01?**
Sewa program vault sendiri 0,0143 SOL. Program token minimal saya (Ringan) cuma 0,0086 SOL, tapi untuk SKAL saya memilih Token-2022 standar supaya bisa masuk DEX dan dompet biasa, ditambah vault yang benar-benar mengunci.

**Bagaimana kalau jadwal vault hilang?**
Jadwal tersimpan di file peluncuran dan bisa direkonstruksi dari data transaksi peluncuran.

**Apa likuiditasnya dalam?**
Kedalaman pool bergantung pada modal SOL yang disetor. Yang dijamin kode adalah LP terkunci, tidak ada cetak ulang, tidak ada pembekuan, dan jatah pembuat terkunci 12 bulan.
