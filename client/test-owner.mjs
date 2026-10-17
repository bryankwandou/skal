// Bukti bahwa runtime menolak program A menulis ke holder milik program B.
// node test-owner.mjs <program-a> <program-b> <payer.json>
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { createHolderIx, loadKeypair, transferIx, tx } from "./ringan.mjs";

const [a, b, payerPath] = process.argv.slice(2);
const A = new PublicKey(a), B = new PublicKey(b);
const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const payer = loadKeypair(payerPath);
const owner = Keypair.generate(), inA = Keypair.generate(), inB = Keypair.generate();
const send = (t, s) => sendAndConfirmTransaction(connection, t, [payer, ...s], { commitment: "confirmed" });

await send(tx(await createHolderIx(connection, A, payer.publicKey, inA.publicKey, owner.publicKey)), [inA, owner]);
await send(tx(await createHolderIx(connection, B, payer.publicKey, inB.publicKey, owner.publicKey)), [inB, owner]);
for (const [name, from, to] of [["A -> holder milik B", inA, inB], ["holder milik B -> A", inB, inA]]) {
  try {
    await send(tx(transferIx(A, from.publicKey, owner.publicKey, to.publicKey, 0n)), [owner]);
    // amount 0 tidak mengubah data apa pun, jadi lolos tanpa efek; uji juga dengan data berubah lewat Lock di bawah.
    console.log("  info ", name, "amount 0 lolos tanpa mengubah data");
  } catch (e) { console.log("  ok   ", name, "ditolak:", e.message.split("\n")[0].slice(0, 90)); }
}
const { lockIx } = await import("./ringan.mjs");
try {
  await send(tx(lockIx(A, inB.publicKey, owner.publicKey, 4102444800n)), [owner]);
  console.log("  GAGAL program A berhasil menulis ke holder milik B"); process.exit(1);
} catch (e) { console.log("  ok    program A menulis ke holder milik B ditolak runtime:", e.message.split("\n")[0].slice(0, 90)); }
