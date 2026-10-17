// Tes end-to-end di validator lokal. Butuh validator yang baru di-reset (holder genesis hanya bisa dibuat sekali).
// node test.mjs <program-id> <payer.json> <genesis-holder.json>
import { Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import {
  SUPPLY, createHolderIx, loadKeypair, lockIx, openIx, readHolder, transferIx, tx,
} from "./ringan.mjs";

const [programArg, payerPath, genesisPath] = process.argv.slice(2);
const programId = new PublicKey(programArg);
const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const payer = loadKeypair(payerPath);
const genesis = loadKeypair(genesisPath);
const alice = Keypair.generate();
const bob = Keypair.generate();
const mallory = Keypair.generate();
const bobHolder = Keypair.generate();
const malHolder = Keypair.generate();
const orphan = Keypair.generate();

let passed = 0, failed = 0;
const send = (t, signers) => sendAndConfirmTransaction(connection, t, [payer, ...signers], { commitment: "confirmed" });

async function expectOk(name, t, signers) {
  try { await send(t, signers); console.log("  ok   ", name); passed++; }
  catch (e) { console.log("  GAGAL", name, "->", e.message.split("\n")[0]); failed++; }
}
async function expectFail(name, t, signers) {
  try { await send(t, signers); console.log("  GAGAL", name, "-> seharusnya ditolak"); failed++; }
  catch { console.log("  ok   ", name, "(ditolak)"); passed++; }
}
function check(name, cond) {
  cond ? passed++ : failed++;
  console.log(cond ? "  ok   " : "  GAGAL", name);
}

console.log("program", programId.toBase58());

await expectOk("genesis: buat + Open oleh alice",
  tx(await createHolderIx(connection, programId, payer.publicKey, genesis.publicKey, alice.publicKey)), [genesis, alice]);
let g = await readHolder(connection, genesis.publicKey);
check(`genesis menerima seluruh supply (${g.amount})`, g.amount === SUPPLY && g.owner.equals(alice.publicKey));

await expectFail("Open ulang genesis oleh mallory", tx(openIx(programId, genesis.publicKey, mallory.publicKey)), [mallory]);

await expectOk("holder bob: buat + Open",
  tx(await createHolderIx(connection, programId, payer.publicKey, bobHolder.publicKey, bob.publicKey)), [bobHolder, bob]);
check("holder biasa mulai dari nol", (await readHolder(connection, bobHolder.publicKey)).amount === 0n);

await expectOk("holder mallory: buat + Open",
  tx(await createHolderIx(connection, programId, payer.publicKey, malHolder.publicKey, mallory.publicKey)), [malHolder, mallory]);

await expectOk("transfer alice -> bob 1.000 token",
  tx(transferIx(programId, genesis.publicKey, alice.publicKey, bobHolder.publicKey, 1_000_000_000n)), [alice]);
check("saldo setelah transfer", (await readHolder(connection, bobHolder.publicKey)).amount === 1_000_000_000n
  && (await readHolder(connection, genesis.publicKey)).amount === SUPPLY - 1_000_000_000n);

await expectFail("mallory menandatangani transfer dari holder alice",
  tx(transferIx(programId, genesis.publicKey, mallory.publicKey, malHolder.publicKey, 1n)), [mallory]);
await expectFail("transfer melebihi saldo",
  tx(transferIx(programId, bobHolder.publicKey, bob.publicKey, malHolder.publicKey, 1_000_000_001n)), [bob]);
await expectFail("transfer ke diri sendiri",
  tx(transferIx(programId, bobHolder.publicKey, bob.publicKey, bobHolder.publicKey, 1n)), [bob]);

// Holder yang dibuat tapi belum di-Open: transfer ke sana harus ditolak supaya tidak bisa diserobot.
const lamports = await connection.getMinimumBalanceForRentExemption(48);
const { SystemProgram } = await import("@solana/web3.js");
await expectOk("buat holder tanpa Open", tx(SystemProgram.createAccount({
  fromPubkey: payer.publicKey, newAccountPubkey: orphan.publicKey, lamports, space: 48, programId,
})), [orphan]);
await expectFail("transfer ke holder yang belum di-Open",
  tx(transferIx(programId, bobHolder.publicKey, bob.publicKey, orphan.publicKey, 1n)), [bob]);

const now = BigInt(Math.floor(Date.now() / 1000));
await expectOk("alice mengunci saldo 1 jam", tx(lockIx(programId, genesis.publicKey, alice.publicKey, now + 3600n)), [alice]);
await expectFail("transfer saat terkunci",
  tx(transferIx(programId, genesis.publicKey, alice.publicKey, bobHolder.publicKey, 1n)), [alice]);
await expectFail("memperpendek kunci", tx(lockIx(programId, genesis.publicKey, alice.publicKey, now + 60n)), [alice]);
await expectFail("mallory mengunci holder bob", tx(lockIx(programId, bobHolder.publicKey, mallory.publicKey, now + 99999n)), [mallory]);
await expectOk("bob (tidak terkunci) tetap bisa transfer",
  tx(transferIx(programId, bobHolder.publicKey, bob.publicKey, malHolder.publicKey, 5n)), [bob]);

g = await readHolder(connection, genesis.publicKey);
const total = g.amount + (await readHolder(connection, bobHolder.publicKey)).amount
  + (await readHolder(connection, malHolder.publicKey)).amount;
check("total saldo tetap sama dengan supply", total === SUPPLY);

console.log(`\n${passed} lulus, ${failed} gagal`);
process.exit(failed ? 1 : 0);
