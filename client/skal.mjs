// Klien untuk Save Kalimantan (SKAL): mint Token-2022 + vault vesting Pinocchio.
import {
  Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction,
} from "@solana/web3.js";
import {
  AuthorityType, ExtensionType, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID, TYPE_SIZE,
  createAssociatedTokenAccountIdempotentInstruction, createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction, createMintToCheckedInstruction, createSetAuthorityInstruction,
  getAssociatedTokenAddressSync, getMintLen,
} from "@solana/spl-token";
import { createInitializeInstruction, createUpdateAuthorityInstruction, pack } from "@solana/spl-token-metadata";
import { readFileSync } from "node:fs";

export const DECIMALS = 6;
export const UNIT = 10n ** BigInt(DECIMALS);

export function loadKeypair(path) {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))));
}

/** total | start | end, 24 byte, dipakai sebagai seed PDA dan sebagai data instruksi. */
function schedule(total, start, end) {
  const b = Buffer.alloc(24);
  b.writeBigUInt64LE(BigInt(total), 0);
  b.writeBigInt64LE(BigInt(start), 8);
  b.writeBigInt64LE(BigInt(end), 16);
  return b;
}

/** Semua alamat vault untuk satu jadwal. `dest` = token account penerima (ATA beneficiary). */
export function vaultAddresses(vaultProgram, mint, dest, total, start, end) {
  const [pda, bump] = PublicKey.findProgramAddressSync([dest.toBuffer(), schedule(total, start, end)], vaultProgram);
  const vaultToken = getAssociatedTokenAddressSync(mint, pda, true, TOKEN_2022_PROGRAM_ID);
  return { pda, bump, vaultToken };
}

export function releaseIx(vaultProgram, mint, dest, v, total, start, end, opts = {}) {
  const data = Buffer.concat([schedule(total, start, end), Buffer.from([DECIMALS, v.bump])]);
  return new TransactionInstruction({
    programId: vaultProgram,
    keys: [
      { pubkey: v.vaultToken, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: dest, isSigner: false, isWritable: true },
      { pubkey: v.pda, isSigner: false, isWritable: false },
      { pubkey: opts.tokenProgram ?? TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * Dua transaksi peluncuran.
 * tx1: buat mint + metadata, lalu kunci metadata (update authority = none).
 * tx2: ATA wallet + ATA vault, mint jatah vault dan sisanya ke wallet, lalu cabut mint authority.
 */
export async function launchTxs(connection, { wallet, mint, vaultProgram, name, symbol, uri, supply, vestedShareBps, start, end }) {
  const metadata = { mint: mint.publicKey, name, symbol, uri, additionalMetadata: [] };
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);
  const fullLen = mintLen + TYPE_SIZE + LENGTH_SIZE + pack({ ...metadata, updateAuthority: wallet }).length;
  const lamports = await connection.getMinimumBalanceForRentExemption(fullLen);

  const tx1 = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: wallet, newAccountPubkey: mint.publicKey, space: mintLen, lamports, programId: TOKEN_2022_PROGRAM_ID,
    }),
    // Pointer authority = null: alamat metadata tidak bisa dialihkan lagi.
    createInitializeMetadataPointerInstruction(mint.publicKey, null, mint.publicKey, TOKEN_2022_PROGRAM_ID),
    // Freeze authority = null sejak awal.
    createInitializeMintInstruction(mint.publicKey, DECIMALS, wallet, null, TOKEN_2022_PROGRAM_ID),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID, metadata: mint.publicKey, updateAuthority: wallet,
      mint: mint.publicKey, mintAuthority: wallet, name, symbol, uri,
    }),
    createUpdateAuthorityInstruction({
      programId: TOKEN_2022_PROGRAM_ID, metadata: mint.publicKey, oldAuthority: wallet, newAuthority: null,
    }),
  );

  const total = supply * UNIT;
  const vested = (total * BigInt(vestedShareBps)) / 10_000n;
  const walletAta = getAssociatedTokenAddressSync(mint.publicKey, wallet, false, TOKEN_2022_PROGRAM_ID);
  // vestedShareBps 0 = tanpa vault: seluruh supply ke wallet, jatah pembuat tidak dikunci.
  const v = vested > 0n ? vaultAddresses(vaultProgram, mint.publicKey, walletAta, vested, start, end) : null;
  const tx2 = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(wallet, walletAta, wallet, mint.publicKey, TOKEN_2022_PROGRAM_ID),
    ...(v ? [
      createAssociatedTokenAccountIdempotentInstruction(wallet, v.vaultToken, v.pda, mint.publicKey, TOKEN_2022_PROGRAM_ID),
      createMintToCheckedInstruction(mint.publicKey, v.vaultToken, wallet, vested, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
    ] : []),
    createMintToCheckedInstruction(mint.publicKey, walletAta, wallet, total - vested, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
    createSetAuthorityInstruction(mint.publicKey, wallet, AuthorityType.MintTokens, null, [], TOKEN_2022_PROGRAM_ID),
  );
  return { tx1, tx2, walletAta, vault: v, vested, total };
}
