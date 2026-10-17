// Peluncuran SKAL: mint Token-2022 + metadata + 14% ke vault vesting.
// node launch.mjs <rpc-url> <wallet.json> <vault-program-id> <metadata-uri> [cliff-hari] [selesai-hari]
// Default: cliff 90 hari, lepas linear sampai hari ke-365.
// Metadata dikunci saat peluncuran, jadi <metadata-uri> harus sudah final (mis. https://<domain>/token.json).
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { writeFileSync } from "node:fs";
import { launchTxs, loadKeypair } from "./skal.mjs";

const [rpc, walletPath, vaultArg, uri = "", cliffDays = "90", endDays = "365"] = process.argv.slice(2);
const connection = new Connection(rpc, "confirmed");
const wallet = loadKeypair(walletPath);
const mint = Keypair.generate();

const now = BigInt(Math.floor(Date.now() / 1000));
const day = 86_400n;
const start = now + BigInt(cliffDays) * day;
const end = now + BigInt(endDays) * day;

const before = await connection.getBalance(wallet.publicKey);
const l = await launchTxs(connection, {
  wallet: wallet.publicKey, mint, vaultProgram: new PublicKey(vaultArg),
  name: "Save Kalimantan", symbol: "SKAL", uri,
  supply: 1_000_000_000_000n, vestedShareBps: 1400, start, end,
});
const opts = { commitment: "confirmed" };
const s1 = await sendAndConfirmTransaction(connection, l.tx1, [wallet, mint], opts);
const s2 = await sendAndConfirmTransaction(connection, l.tx2, [wallet], opts);
const after = await connection.getBalance(wallet.publicKey);

const out = {
  mint: mint.publicKey.toBase58(),
  walletAta: l.walletAta.toBase58(),
  vaultPda: l.vault.pda.toBase58(),
  vaultToken: l.vault.vaultToken.toBase58(),
  bump: l.vault.bump,
  total: l.total.toString(), vested: l.vested.toString(),
  start: start.toString(), end: end.toString(),
  signatures: [s1, s2],
  costSol: (before - after) / 1e9,
};
// Jadwal ini wajib disimpan: tanpa total/start/end/bump, release tidak bisa disusun.
writeFileSync(`launch-${out.mint}.json`, JSON.stringify(out, null, 2));
console.log(out);
