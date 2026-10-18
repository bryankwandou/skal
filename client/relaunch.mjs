// Eksekusi proposal SKAL v2 (relaunch dengan logo) setelah masa komentar 24 jam.
// node relaunch.mjs <issue-number> [--dry] [--unlocked]
// --unlocked: 14% pembuat tidak masuk vault vesting, langsung bebas di wallet deployer (proposal #2).
// Berjalan hanya jika: issue masih open, tidak berlabel "rejected", 👎 tidak lebih banyak dari 👍,
// dan saldo deployer >= 0,0240 SOL. Dana berasal dari fee trading pool v1: fee diklaim dulu ke deployer.
// Hasilnya dikomentari ke issue. Aman dijalankan berulang (misalnya harian); hanya bisa sukses sekali.
import { Connection, PublicKey } from "@solana/web3.js";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadKeypair } from "./skal.mjs";
import { claimFees } from "./claim-fees.mjs";

const [issue, ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");
const unlocked = flags.includes("--unlocked");
const REPO = "bryankwandou/skal";
const RPC = "https://api.mainnet-beta.solana.com";
const WALLET = join(homedir(), ".config", "solana", "ringan-mainnet.json");
const VAULT = "5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ";
const URI = "https://savekalimantan.vercel.app/token/skal.json";
// Biaya terukur: mint v2 dengan URI 0,0056538 SOL (devnet) + pool 0,017998281 SOL (mainnet) = 0,0236521 SOL,
// sudah termasuk biaya transaksi. Ditambah cadangan 0,00005 SOL.
const NEED_LAMPORTS = 23_700_000;
const DONE = "relaunch.done.json";
const STATE = "relaunch.state.json";
const LAUNCHED = "relaunch.launch.json"; // mint v2 sudah dibuat, pool belum: lanjutkan tanpa mint ulang
const POOL_LAMPORTS = 18_050_000;
const V1_POOL = new PublicKey("9oejCQAKdkkVWCeqDvLYYsTqT8KQLf9sMebcfF5YPWRe");
// Bagian fee yang diterima posisi per SOL volume: 1% fee dikurangi bagian Meteora, diukur dari pembelian pertama.
const LP_FEE_PER_SOL = 0.0082;

// Koneksi ke api.github.com dari mesin ini kadang timeout saat TLS handshake; coba sampai 4 kali.
const gh = (...a) => {
  for (let i = 1; ; i++) {
    try { return execFileSync("gh", a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
    catch (e) { if (i === 4 || !/timeout|EOF|connection/i.test(String(e.stderr))) throw e; }
  }
};
const comment = (body) => (dry ? console.log(`[dry] comment:\n${body}`) : gh("issue", "comment", issue, "-R", REPO, "--body", body));
const node = (...a) => execFileSync(process.execPath, a, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const newest = (prefix, before) => readdirSync(".").filter((f) => f.startsWith(prefix) && f.endsWith(".json") && !before.includes(f));

if (!issue) throw new Error("usage: node relaunch.mjs <issue-number> [--dry] [--unlocked]");
if (existsSync(DONE)) { console.log(`Sudah dieksekusi: ${readFileSync(DONE, "utf8")}`); process.exit(0); }

const it = JSON.parse(gh("api", `repos/${REPO}/issues/${issue}`));
const opensAt = Date.parse(it.created_at) + 24 * 3600 * 1000;
if (Date.now() < opensAt) {
  console.log(`Masa komentar belum selesai. Eksekusi paling cepat ${new Date(opensAt).toISOString()}.`);
  process.exit(0);
}
const up = it.reactions["+1"], down = it.reactions["-1"];
const rejected = it.labels.some((l) => l.name === "rejected");
if (it.state !== "open" || rejected || down > up) {
  comment(`Proposal tidak dieksekusi: ${it.state !== "open" ? "issue sudah ditutup" : rejected ? "berlabel rejected" : `👎 ${down} lebih banyak dari 👍 ${up}`}. Tidak ada transaksi yang dikirim.`);
  if (!dry) writeFileSync(DONE, JSON.stringify({ rejectedAt: new Date().toISOString(), up, down, state: it.state }, null, 2));
  process.exit(0);
}
const NEED = existsSync(LAUNCHED) ? POOL_LAMPORTS : NEED_LAMPORTS;
const signer = loadKeypair(WALLET), wallet = signer.publicKey;
const connection = new Connection(RPC, "confirmed");
const fees = await claimFees(connection, signer, V1_POOL, !dry);
const balance = await connection.getBalance(wallet);
const funds = balance + (fees.signatures.length ? 0 : Math.round(fees.claimableSol * 1e9));
const status = { issueState: it.state, rejected, up, down, balanceSol: balance / 1e9, unclaimedFeeSol: fees.signatures.length ? 0 : fees.claimableSol, feeClaims: fees.signatures, needSol: NEED / 1e9 };
console.log(status);

if (balance < NEED) {
  // Komentar hanya saat pertama kali atau saat dana bertambah, supaya eksekusi harian tidak membanjiri issue.
  const last = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")).fundsLamports : -1;
  if (funds > last) {
    const missing = (NEED - funds) / 1e9;
    comment([
      `Masa komentar selesai tanpa keberatan (👍 ${up}, 👎 ${down}). Proposal disetujui dan menunggu dana dari fee trading.`,
      "",
      `- Saldo deployer \`${wallet.toBase58()}\`: ${balance / 1e9} SOL`,
      `- Fee pool v1 yang belum diklaim: ${status.unclaimedFeeSol} SOL (diklaim otomatis mulai ${fees.minClaimSol} SOL)`,
      ...fees.signatures.map((s) => `- Fee diklaim: \`${s}\``),
      `- Kurang: ${missing.toFixed(6)} SOL, setara volume trading sekitar ${(missing / LP_FEE_PER_SOL).toFixed(2)} SOL di pool v1`,
      "",
      "Tidak ada transaksi peluncuran yang dikirim. Pemeriksaan berjalan setiap hari dan v2 diluncurkan begitu dana cukup.",
    ].join("\n"));
    if (!dry) writeFileSync(STATE, JSON.stringify({ checkedAt: new Date().toISOString(), fundsLamports: funds }, null, 2));
  }
  process.exit(0);
}
if (dry) { console.log("[dry] semua syarat terpenuhi; berhenti sebelum transaksi."); process.exit(0); }

let launch;
if (existsSync(LAUNCHED)) {
  launch = JSON.parse(readFileSync(LAUNCHED, "utf8"));
  console.log(`Melanjutkan: mint v2 ${launch.mint} sudah ada, tinggal pool.`);
} else {
  const launchesBefore = readdirSync(".");
  node("launch.mjs", RPC, WALLET, unlocked ? "none" : VAULT, URI);
  const [launchFile] = newest("launch-", launchesBefore);
  launch = JSON.parse(readFileSync(launchFile, "utf8"));
  writeFileSync(LAUNCHED, JSON.stringify(launch, null, 2));
}

const poolsBefore = readdirSync(".");
node("pool.mjs", RPC, WALLET, launch.mint, "--send");
const [poolFile] = newest("pool-", poolsBefore);
const pool = JSON.parse(readFileSync(poolFile, "utf8"));

const result = { executedAt: new Date().toISOString(), mint: launch.mint, creatorShare: launch.creatorShareUnlocked ? "unlocked" : `vault ${launch.vaultToken}`, pool: pool.pool, launchSignatures: launch.signatures, poolSignature: pool.signature, costSol: launch.costSol + pool.costSol };
writeFileSync(DONE, JSON.stringify(result, null, 2));
comment([
  "Proposal dieksekusi di mainnet.",
  "",
  `- Mint SKAL v2: \`${result.mint}\` ([Solscan](https://solscan.io/token/${result.mint}))`,
  `- Jatah pembuat 14%: ${result.creatorShare}`,
  `- Pool Meteora: \`${result.pool}\`, LP 100% terkunci`,
  `- Tanda tangan: ${[...result.launchSignatures, result.poolSignature].map((s) => `\`${s}\``).join(", ")}`,
  `- Biaya: ${result.costSol.toFixed(6)} SOL`,
].join("\n"));
console.log(result);
