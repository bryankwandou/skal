# SOP deploy manual SKAL v2 (jatah pembuat unlocked)

Langkah 1 sudah dijalankan (issue #2). Langkah 3 dan 4 dijalankan otomatis setiap hari pukul 19.45 WITA oleh tugas terjadwal `skal-v2-relaunch-proposal` dengan `node relaunch.mjs 2 --unlocked`; perintah di bawah tetap bisa dipakai manual. Proposal #1 tidak lagi dieksekusi otomatis.

## 1. Umumkan proposal amandemen

```bash
gh issue create -R bryankwandou/skal --title "Proposal #2: jatah pembuat 14% SKAL v2 tanpa vesting (amandemen #1)" --body-file docs/proposals/002-unlock.md
```

Catat nomor issue yang keluar (seharusnya 2). Lalu beri tahu di issue #1:

```bash
gh issue comment 1 -R bryankwandou/skal --body "Bagian alokasi proposal ini diamandemen oleh #2 (jatah pembuat tanpa vesting). Eksekusi otomatis dimatikan; peluncuran dijalankan manual setelah masa komentar #2 selesai."
```

## 2. Tunggu 24 jam

Skrip menolak berjalan sebelum 24 jam sejak issue dibuat, jadi aman dicoba lebih awal.

## 3. Periksa tanpa mengirim transaksi

```bash
cd client && node relaunch.mjs 2 --dry --unlocked
```

Harus berakhir dengan `[dry] semua syarat terpenuhi`. Jika muncul penolakan atau saldo kurang, berhenti di sini.

## 4. Luncurkan

```bash
cd client && node relaunch.mjs 2 --unlocked
```

Skrip mengklaim fee pool v1, membuat mint v2 (tanpa vault), membuat pool dengan LP terkunci, menulis `client/relaunch.done.json`, dan mengomentari hasilnya di issue #2.

## 5. Perbarui situs lalu deploy ke Vercel

1. Ganti alamat mint dan pool v1 di `site/index.html` dan `docs/LISTING.md` dengan alamat v2 dari `relaunch.done.json`, dan hapus klaim vesting untuk v2.
2. Deploy:

```bash
vercel login
```

```bash
vercel deploy --prod --yes
```

3. Cek `https://savekalimantan.vercel.app/token/skal.json` dan `https://savekalimantan.vercel.app/token/logo.png` keduanya terbuka.

## 6. Surat pernyataan

Isi alamat mint v2, pool v2, dan tanda tangan transaksi di `docs/legal/Surat-Pernyataan-SKAL-v2.docx`, cetak, lalu tanda tangani di atas meterai 10.000.

## 7. Listing logo

Kirim formulir https://solscan.io/token-update dengan isian di `docs/LISTING.md` (alamat v2).
