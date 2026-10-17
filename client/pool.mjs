// Pool SKAL/SOL satu sisi di Meteora DAMM v2, LP dikunci permanen dalam transaksi yang sama.
// node pool.mjs <rpc-url> <wallet.json> <mint> [skal-ke-pool] [harga-awal-sol-per-skal] [--send]
// Default: 700 miliar SKAL (70% supply), harga awal 1e-11 SOL per SKAL, fee swap 1%.
// Tanpa --send hanya simulasi. Pool hanya berisi SKAL; SOL masuk saat orang membeli.
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from "@solana/spl-token";
import {
  CpAmm, BaseFeeMode, CollectFeeMode, ActivationType, MAX_SQRT_PRICE,
  getBaseFeeParams, getSqrtPriceFromPrice,
} from "@meteora-ag/cp-amm-sdk";
import BN from "bn.js";
import { writeFileSync } from "node:fs";
import { DECIMALS, UNIT, loadKeypair } from "./skal.mjs";

const args = process.argv.slice(2);
const send = args.includes("--send");
const [rpc, walletPath, mintArg, amountArg = "700000000000", priceArg = "0.00000000001"] = args.filter((a) => a !== "--send");
const connection = new Connection(rpc, "confirmed");
const wallet = loadKeypair(walletPath);
const mint = new PublicKey(mintArg);
const positionNft = Keypair.generate();
const cpAmm = new CpAmm(connection);

const tokenAAmount = new BN((BigInt(amountArg) * UNIT).toString());
// Harga awal = harga minimum: syarat pool satu sisi, jadi hanya token A yang disetor.
const sqrtMinPrice = getSqrtPriceFromPrice(priceArg, DECIMALS, 9);
const sqrtMaxPrice = MAX_SQRT_PRICE;
const mintInfo = await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
const liquidityDelta = cpAmm.preparePoolCreationSingleSide({
  tokenAAmount, minSqrtPrice: sqrtMinPrice, maxSqrtPrice: sqrtMaxPrice, initSqrtPrice: sqrtMinPrice,
  tokenAInfo: { mint: mintInfo, currentEpoch: (await connection.getEpochInfo()).epoch },
  collectFeeMode: CollectFeeMode.OnlyB,
});

const { tx, pool, position } = await cpAmm.createCustomPool({
  payer: wallet.publicKey, creator: wallet.publicKey, positionNft: positionNft.publicKey,
  tokenAMint: mint, tokenBMint: NATIVE_MINT, tokenAAmount, tokenBAmount: new BN(0),
  sqrtMinPrice, sqrtMaxPrice, initSqrtPrice: sqrtMinPrice, liquidityDelta,
  poolFees: {
    baseFee: getBaseFeeParams({
      baseFeeMode: BaseFeeMode.FeeTimeSchedulerLinear,
      feeTimeSchedulerParam: { startingFeeBps: 100, endingFeeBps: 100, numberOfPeriod: 0, totalDuration: 0 },
    }),
    compoundingFeeBps: 0, padding: 0, dynamicFee: null,
  },
  hasAlphaVault: false, activationType: ActivationType.Timestamp, activationPoint: null,
  collectFeeMode: CollectFeeMode.OnlyB,
  tokenAProgram: TOKEN_2022_PROGRAM_ID, tokenBProgram: TOKEN_PROGRAM_ID,
  isLockLiquidity: true,
});

const before = await connection.getBalance(wallet.publicKey);
console.log({ pool: pool.toBase58(), position: position.toBase58(), positionNft: positionNft.publicKey.toBase58(), balanceSol: before / 1e9 });

if (!send) {
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(wallet, positionNft);
  const sim = await connection.simulateTransaction(tx);
  console.log(sim.value.err ? { err: sim.value.err, logs: sim.value.logs } : { ok: true, unitsConsumed: sim.value.unitsConsumed });
  process.exit(sim.value.err ? 1 : 0);
}

const sig = await sendAndConfirmTransaction(connection, tx, [wallet, positionNft], { commitment: "confirmed" });
const after = await connection.getBalance(wallet.publicKey);
const out = {
  dex: "Meteora DAMM v2", pool: pool.toBase58(), position: position.toBase58(), positionNft: positionNft.publicKey.toBase58(),
  mint: mint.toBase58(), skalDeposited: amountArg, startPriceSolPerSkal: priceArg, feeBps: 100,
  lpPermanentlyLocked: true, signature: sig, costSol: (before - after) / 1e9,
};
writeFileSync(`pool-${pool.toBase58()}.json`, JSON.stringify(out, null, 2));
console.log(out);
