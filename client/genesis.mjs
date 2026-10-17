// Bikin holder genesis dan Open untuk wallet kamu: seluruh 21.000.000 token masuk ke sini, sekali saja.
// Akun dibuat dan di-Open dalam SATU transaksi supaya tidak ada celah untuk diserobot.
// node genesis.mjs <rpc-url> <program-id> <wallet.json> <genesis-holder.json>
import { Connection, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { createHolderIx, loadKeypair, readHolder, tx } from "./ringan.mjs";

const [url, programArg, walletPath, genesisPath] = process.argv.slice(2);
const connection = new Connection(url, "confirmed");
const programId = new PublicKey(programArg);
const wallet = loadKeypair(walletPath);
const genesis = loadKeypair(genesisPath);

const sig = await sendAndConfirmTransaction(
  connection,
  tx(await createHolderIx(connection, programId, wallet.publicKey, genesis.publicKey, wallet.publicKey)),
  [wallet, genesis],
  { commitment: "confirmed" },
);
const h = await readHolder(connection, genesis.publicKey);
console.log("signature:", sig);
console.log("holder genesis:", genesis.publicKey.toBase58());
console.log("owner:", h.owner.toBase58(), "saldo:", h.amount / 1_000_000n, "token");
