// Fee trading pool SKAL/SOL v1 (1%, dibayar dalam SOL) adalah sumber dana proposal v2.
// node claim-fees.mjs <rpc> <wallet.json> <pool> [--send]
// Tanpa --send hanya menampilkan fee yang bisa diklaim. Dengan --send, fee diklaim ke wallet pemilik posisi,
// tapi hanya jika jumlahnya cukup besar untuk menutup biaya transaksi berkali-kali lipat.
import { Connection, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { CpAmm, getUnClaimLpFee } from "@meteora-ag/cp-amm-sdk";
import { pathToFileURL } from "node:url";
import { loadKeypair } from "./skal.mjs";

export const MIN_CLAIM_LAMPORTS = 500_000; // 0,0005 SOL, 100x biaya transaksi dasar

export async function claimableFees(connection, owner, pool) {
  const cpAmm = new CpAmm(connection);
  const poolState = await cpAmm.fetchPoolState(pool);
  const positions = await cpAmm.getUserPositionByPool(pool, owner);
  return positions.map(({ position, positionNftAccount, positionState }) => ({
    position, positionNftAccount, poolState,
    lamports: BigInt(getUnClaimLpFee(poolState, positionState).feeTokenB.toString()),
  }));
}

export async function claimFees(connection, wallet, pool, send) {
  const found = await claimableFees(connection, wallet.publicKey, pool);
  const total = found.reduce((s, p) => s + p.lamports, 0n);
  const result = { pool: pool.toBase58(), claimableSol: Number(total) / 1e9, minClaimSol: MIN_CLAIM_LAMPORTS / 1e9, signatures: [] };
  if (!send || total < BigInt(MIN_CLAIM_LAMPORTS)) return result;
  const cpAmm = new CpAmm(connection);
  for (const p of found.filter((p) => p.lamports > 0n)) {
    const s = p.poolState;
    const tx = await cpAmm.claimPositionFee({
      owner: wallet.publicKey, position: p.position, pool, positionNftAccount: p.positionNftAccount,
      tokenAMint: s.tokenAMint, tokenBMint: s.tokenBMint, tokenAVault: s.tokenAVault, tokenBVault: s.tokenBVault,
      tokenAProgram: TOKEN_2022_PROGRAM_ID, tokenBProgram: TOKEN_PROGRAM_ID,
    });
    result.signatures.push(await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: "confirmed" }));
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [rpc, walletPath, poolArg, flag] = process.argv.slice(2);
  if (!poolArg) throw new Error("usage: node claim-fees.mjs <rpc> <wallet.json> <pool> [--send]");
  const r = await claimFees(new Connection(rpc, "confirmed"), loadKeypair(walletPath), new PublicKey(poolArg), flag === "--send");
  console.log(r);
}
