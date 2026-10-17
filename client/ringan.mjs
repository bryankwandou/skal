// Klien kecil untuk program Ringan: bikin instruksi dan baca akun holder.
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { readFileSync } from "node:fs";

export const HOLDER_LEN = 48;
export const DECIMALS = 6;
export const SUPPLY = 21_000_000n * 10n ** BigInt(DECIMALS);

export function loadKeypair(path) {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

function data(tag, arg) {
  if (arg === undefined) return Buffer.from([tag]);
  const b = Buffer.alloc(9);
  b[0] = tag;
  b.writeBigUInt64LE(BigInt.asUintN(64, BigInt(arg)), 1);
  return b;
}

const ix = (programId, keys, d) => new TransactionInstruction({ programId, keys, data: d });

/** Bikin akun holder milik program (48 byte), lalu Open untuk `owner`, dalam satu transaksi. */
export async function createHolderIx(connection, programId, payer, holder, owner) {
  const lamports = await connection.getMinimumBalanceForRentExemption(HOLDER_LEN);
  return [
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: holder,
      lamports,
      space: HOLDER_LEN,
      programId,
    }),
    openIx(programId, holder, owner),
  ];
}

export const openIx = (programId, holder, owner) =>
  ix(programId, [
    { pubkey: holder, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
  ], data(0));

export const transferIx = (programId, from, owner, to, amount) =>
  ix(programId, [
    { pubkey: from, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: to, isSigner: false, isWritable: true },
  ], data(1, amount));

export const lockIx = (programId, holder, owner, untilUnix) =>
  ix(programId, [
    { pubkey: holder, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
  ], data(2, untilUnix));

export async function readHolder(connection, holder) {
  const info = await connection.getAccountInfo(holder, "confirmed");
  if (!info) return null;
  const d = info.data;
  return {
    owner: new PublicKey(d.subarray(0, 32)),
    amount: d.readBigUInt64LE(32),
    unlockTs: d.readBigInt64LE(40),
  };
}

export const tx = (...ixs) => new Transaction().add(...ixs.flat());
