// Tes end-to-end SKAL di validator lokal.
// node test-skal.mjs <vault-program-id> <payer.json> [rpc-url]
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAccount, getMint } from "@solana/spl-token";
import { getTokenMetadata } from "@solana/spl-token";
import { launchTxs, loadKeypair, releaseIx, vaultAddresses } from "./skal.mjs";

const [vaultArg, payerPath, rpc = "http://127.0.0.1:8899"] = process.argv.slice(2);
const vaultProgram = new PublicKey(vaultArg);
const connection = new Connection(rpc, "confirmed");
const payer = loadKeypair(payerPath);
const send = (t, s = []) => sendAndConfirmTransaction(connection, t, [payer, ...s], { commitment: "confirmed" });
const bal = async (a) => (await getAccount(connection, a, "confirmed", TOKEN_2022_PROGRAM_ID)).amount;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chainNow = async () => BigInt(await connection.getBlockTime(await connection.getSlot("confirmed")));

let passed = 0, failed = 0;
const check = (name, cond) => { cond ? passed++ : failed++; console.log(cond ? "  ok   " : "  GAGAL", name); };
async function expectFail(name, t) {
  try { await send(t); console.log("  GAGAL", name, "-> seharusnya ditolak"); failed++; }
  catch { console.log("  ok   ", name, "(ditolak)"); passed++; }
}
const tx = (...ixs) => new Transaction().add(...ixs);

async function launch(start, end) {
  const mint = Keypair.generate();
  const l = await launchTxs(connection, {
    wallet: payer.publicKey, mint, vaultProgram, name: "Save Kalimantan", symbol: "SKAL", uri: "",
    supply: 1_000_000_000_000n, vestedShareBps: 1400, start, end,
  });
  await send(l.tx1, [mint]);
  await send(l.tx2);
  return { mint: mint.publicKey, ...l, start, end };
}

let now = await chainNow();
const a = await launch(now - 20n, now + 40n);
console.log("mint", a.mint.toBase58());

const m = await getMint(connection, a.mint, "confirmed", TOKEN_2022_PROGRAM_ID);
check("supply 1 triliun", m.supply === a.total && a.total === 1_000_000_000_000_000_000n);
check("mint authority null", m.mintAuthority === null);
check("freeze authority null", m.freezeAuthority === null);
const md = await getTokenMetadata(connection, a.mint, "confirmed", TOKEN_2022_PROGRAM_ID);
check(`metadata ${md.name} / ${md.symbol}`, md.name === "Save Kalimantan" && md.symbol === "SKAL");
check("metadata terkunci (update authority kosong)", !md.updateAuthority || md.updateAuthority.equals(PublicKey.default));
check("vault memegang 14%", (await bal(a.vault.vaultToken)) === a.vested && a.vested * 100n === a.total * 14n);
check("wallet memegang 86%", (await bal(a.walletAta)) === a.total - a.vested);

const rel = (x, opts) => releaseIx(vaultProgram, x.mint, x.walletAta, x.vault, x.vested, x.start, x.end, opts);

await send(tx(rel(a)));
const after1 = await bal(a.vault.vaultToken);
check(`release parsial di tengah vesting (sisa ${after1 / 1_000_000n} token)`, after1 > 0n && after1 < a.vested);

// Parameter palsu: klaim total lebih kecil supaya "sisa terkunci" lebih sedikit.
const fake = { ...a, vested: a.vested / 2n };
const ixFake = releaseIx(vaultProgram, a.mint, a.walletAta, a.vault, fake.vested, a.start, a.end);
await expectFail("jadwal palsu (PDA tidak cocok)", tx(ixFake));
await expectFail("program token palsu", tx(rel(a, { tokenProgram: SystemProgram.programId })));

// Penerima lain: holder lain mencoba menarik ke ATA-nya sendiri.
const other = Keypair.generate();
const { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction } = await import("@solana/spl-token");
const otherAta = getAssociatedTokenAddressSync(a.mint, other.publicKey, false, TOKEN_2022_PROGRAM_ID);
await send(tx(createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, otherAta, other.publicKey, a.mint, TOKEN_2022_PROGRAM_ID)));
await expectFail("tarik ke penerima lain",
  tx(releaseIx(vaultProgram, a.mint, otherAta, a.vault, a.vested, a.start, a.end)));

console.log("  ...  menunggu jadwal selesai");
while ((await chainNow()) <= a.end + 1n) await sleep(3000);
await send(tx(rel(a)));
check("setelah selesai: vault kosong", (await bal(a.vault.vaultToken)) === 0n);
check("setelah selesai: wallet memegang 100%", (await bal(a.walletAta)) === a.total);
await expectFail("release saat tidak ada yang bisa dilepas", tx(rel(a)));

now = await chainNow();
const b = await launch(now + 3600n, now + 7200n);
await expectFail("release sebelum cliff", tx(rel(b)));
check("cliff: vault tetap penuh", (await bal(b.vault.vaultToken)) === b.vested);

console.log(`\n${passed} lulus, ${failed} gagal`);
process.exit(failed ? 1 : 0);
