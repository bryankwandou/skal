// Eksekusi proposal SKAL v2 (relaunch dengan logo) setelah masa komentar 24 jam.
// node relaunch.mjs <issue-number> [--dry]
// Berjalan hanya jika: issue masih open, tidak berlabel "rejected", 👎 tidak lebih banyak dari 👍,
// dan saldo deployer >= 0,0240 SOL. Hasilnya dikomentari ke issue. Hanya bisa sukses sekali.
import { Connection } from "@solana/web3.js";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadKeypair } from "./skal.mjs";

const [issue, flag] = process.argv.slice(2);
const dry = flag === "--dry";
const REPO = "bryankwandou/skal";
const RPC = "https://api.mainnet-beta.solana.com";
const WALLET = join(homedir(), ".config", "solana", "ringan-mainnet.json");
const VAULT = "5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ";
const URI = "https://savekalimantan.vercel.app/token/skal.json";
const NEED_LAMPORTS = 24_000_000;
const DONE = "relaunch.done.json";

const gh = (...a) => execFileSync("gh", a, { encoding: "utf8" }).trim();
const comment = (body) => (dry ? console.log(`[dry] comment:\n${body}`) : gh("issue", "comment", issue, "-R", REPO, "--body", body));
const node = (...a) => execFileSync(process.execPath, a, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const newest = (prefix, before) => readdirSync(".").filter((f) => f.startsWith(prefix) && f.endsWith(".json") && !before.includes(f));

if (!issue) throw new Error("usage: node relaunch.mjs <issue-number> [--dry]");
if (existsSync(DONE)) { console.log(`Sudah dieksekusi: ${readFileSync(DONE, "utf8")}`); process.exit(0); }

const it = JSON.parse(gh("api", `repos/${REPO}/issues/${issue}`));
const opensAt = Date.parse(it.created_at) + 24 * 3600 * 1000;
if (Date.now() < opensAt) {
  console.log(`Masa komentar belum selesai. Eksekusi paling cepat ${new Date(opensAt).toISOString()}.`);
  process.exit(0);
}
const up = it.reactions["+1"], down = it.reactions["-1"];
const rejected = it.labels.some((l) => l.name === "rejected");
const wallet = loadKeypair(WALLET).publicKey;
const balance = await new Connection(RPC, "confirmed").getBalance(wallet);
const status = { issueState: it.state, rejected, up, down, balanceSol: balance / 1e9, needSol: NEED_LAMPORTS / 1e9 };
console.log(status);

if (it.state !== "open" || rejected || down > up) {
  comment(`Proposal tidak dieksekusi: ${it.state !== "open" ? "issue sudah ditutup" : rejected ? "berlabel rejected" : `👎 ${down} lebih banyak dari 👍 ${up}`}. Tidak ada transaksi yang dikirim.`);
  process.exit(0);
}
if (balance < NEED_LAMPORTS) {
  comment(`Masa komentar selesai tanpa keberatan (👍 ${up}, 👎 ${down}), tapi saldo deployer \`${wallet.toBase58()}\` baru ${balance / 1e9} SOL dari ${NEED_LAMPORTS / 1e9} SOL yang dibutuhkan. Tidak ada transaksi yang dikirim. Eksekusi dijalankan ulang setelah dana masuk.`);
  process.exit(0);
}
if (dry) { console.log("[dry] semua syarat terpenuhi; berhenti sebelum transaksi."); process.exit(0); }

const launchesBefore = readdirSync(".");
node("launch.mjs", RPC, WALLET, VAULT, URI);
const [launchFile] = newest("launch-", launchesBefore);
const launch = JSON.parse(readFileSync(launchFile, "utf8"));

const poolsBefore = readdirSync(".");
node("pool.mjs", RPC, WALLET, launch.mint, "--send");
const [poolFile] = newest("pool-", poolsBefore);
const pool = JSON.parse(readFileSync(poolFile, "utf8"));

const result = { executedAt: new Date().toISOString(), mint: launch.mint, vaultToken: launch.vaultToken, pool: pool.pool, launchSignatures: launch.signatures, poolSignature: pool.signature, costSol: launch.costSol + pool.costSol };
writeFileSync(DONE, JSON.stringify(result, null, 2));
comment([
  "Proposal dieksekusi di mainnet.",
  "",
  `- Mint SKAL v2: \`${result.mint}\` ([Solscan](https://solscan.io/token/${result.mint}))`,
  `- Pool Meteora: \`${result.pool}\`, LP 100% terkunci`,
  `- Tanda tangan: ${[...result.launchSignatures, result.poolSignature].map((s) => `\`${s}\``).join(", ")}`,
  `- Biaya: ${result.costSol.toFixed(6)} SOL`,
].join("\n"));
console.log(result);
