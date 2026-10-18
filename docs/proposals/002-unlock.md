## Ringkasan

Amandemen proposal #1. SKAL v2 tetap diluncurkan dengan logo, tetapi jatah pembuat 14% **tidak lagi dikunci di vault vesting**. Jatah itu berada di dompet pembuat sejak peluncuran dan bisa dipindahkan kapan saja.

Proposal ini menggantikan bagian alokasi di proposal #1. Bagian lain tidak berubah.

## Yang berubah

| | Proposal #1 | Proposal ini |
|---|---|---|
| Jatah pembuat 14% (140 miliar SKAL) | Vault vesting `5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ`, cliff 90 hari, linear sampai hari 365 | Tidak dikunci, di dompet `3bZ1Jj16o4qdcpNx2EGTZ5eXTZreGYBZx4pCLPGPaVqb` |
| Cara eksekusi | Otomatis setiap hari oleh tugas terjadwal | Manual oleh pendiri dengan `node client/relaunch.mjs 2 --unlocked` |

## Yang tetap

- Supply tetap 1 triliun SKAL, Token-2022, 6 desimal.
- Mint authority dan freeze authority dicabut di transaksi peluncuran.
- Metadata on-chain menunjuk ke `https://savekalimantan.vercel.app/token/skal.json` (logo), lalu update authority dicabut.
- 70% supply masuk pool SKAL/SOL Meteora DAMM v2 satu sisi, posisi LP terkunci permanen 100%, fee swap 1%.
- 16% untuk distribusi komunitas, di dompet yang sama dengan jatah pembuat.
- Dana dari fee trading pool v1 dan saldo deployer. Tidak ada penjualan token.

## Risiko yang perlu diketahui

Tanpa vesting, pembuat bisa menjual 14% (dan 16% komunitas yang dipegangnya) kapan saja. Di explorer dan agregator, alokasi pembuat yang tidak terkunci biasa ditandai sebagai risiko. Jika Anda keberatan, beri 👎 atau komentar.

## Aturan keputusan

- Masa komentar 24 jam sejak issue ini dibuat.
- Proposal batal jika issue ditutup, diberi label `rejected`, atau 👎 lebih banyak dari 👍. Jika batal, proposal #1 (vesting) yang berlaku.
- Jika lolos, pendiri menjalankan peluncuran secara manual dan hasilnya (alamat mint, pool, tanda tangan transaksi) dikomentari otomatis di issue ini.

Kode: https://github.com/bryankwandou/skal (`client/launch.mjs`, `client/relaunch.mjs`). Mode tanpa vault diuji di devnet: mint `E4paMmJQcnHXgRVPAKnuvk81EUQsWTapUUJewXbfR7ph`, biaya 0,00414 SOL.
