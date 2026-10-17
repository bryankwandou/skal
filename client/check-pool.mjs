// Cek pool: LP terkunci permanen, isi vault, dan (opsional) beli SKAL pakai SOL.
// node check-pool.mjs <rpc-url> <pool> [wallet.json lamports-beli]
import { Connection, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { CpAmm, getPriceFromSqrtPrice } from "@meteora-ag/cp-amm-sdk";
import BN from "bn.js";
import { DECIMALS, loadKeypair } from "./skal.mjs";

const [rpc, poolArg, walletPath, buyLamports] = process.argv.slice(2);
const connection = new Connection(rpc, "confirmed");
const cpAmm = new CpAmm(connection);
const pool = new PublicKey(poolArg);

async function report() {
  const s = await cpAmm.fetchPoolState(pool);
  const [a, b] = await Promise.all([s.tokenAVault, s.tokenBVault].map((v) => connection.getTokenAccountBalance(v)));
  const r = {
    tokenA: s.tokenAMint.toBase58(), tokenB: s.tokenBMint.toBase58(),
    liquidity: s.liquidity.toString(), permanentLockedLiquidity: s.permanentLockLiquidity.toString(),
    lockedShare: s.liquidity.isZero() ? "0%" : `${s.permanentLockLiquidity.muln(10000).div(s.liquidity).toNumber() / 100}%`,
    priceSolPerSkal: getPriceFromSqrtPrice(s.sqrtPrice, DECIMALS, 9).toString(),
    vaultSkal: a.value.uiAmountString, vaultSol: b.value.uiAmountString,
  };
  console.log(r);
  return s;
}

const s = await report();
if (walletPath) {
  const wallet = loadKeypair(walletPath);
  const tx = await cpAmm.swap({
    payer: wallet.publicKey, pool, inputTokenMint: NATIVE_MINT, outputTokenMint: s.tokenAMint,
    amountIn: new BN(buyLamports), minimumAmountOut: new BN(1),
    tokenAMint: s.tokenAMint, tokenBMint: s.tokenBMint, tokenAVault: s.tokenAVault, tokenBVault: s.tokenBVault,
    tokenAProgram: TOKEN_2022_PROGRAM_ID, tokenBProgram: TOKEN_PROGRAM_ID, referralTokenAccount: null, poolState: s,
  });
  const sig = await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: "confirmed" });
  console.log({ swap: sig });
  await report();
}
