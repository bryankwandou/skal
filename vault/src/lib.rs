//! SKAL Vault: kunci + vesting linear untuk token Token-2022, ditulis di Pinocchio.
//!
//! Tidak ada akun state. Jadwal vesting dan alamat penerima menjadi seed PDA:
//!   vault_pda = PDA([dest_token_account, total u64 | start i64 | end i64], bump)
//! Token disimpan di token account Token-2022 milik vault_pda (biasanya ATA-nya).
//! Kalau ada yang mengirim parameter palsu, PDA-nya berbeda dan CPI ditolak runtime,
//! jadi jadwal tidak bisa diakali tanpa perlu dicek manual.
//!
//! Satu instruksi, Release (siapa saja boleh memanggil; token hanya bisa ke `dest`):
//!   akun: [vault_token (w), mint, dest_token (w), vault_pda, token_program]
//!   data: total u64 | start i64 | end i64 | decimals u8 | bump u8   (26 byte)
//! Yang dilepas = saldo vault - bagian yang belum vested. Gagal kalau tidak ada yang bisa dilepas.
//! Sebelum `start` tidak ada yang vested (cliff), setelah `end` semuanya vested.
#![no_std]

use pinocchio::{
    cpi::{invoke_signed_unchecked, CpiAccount, Seed, Signer},
    entrypoint::lazy::{InstructionContext, MaybeAccount},
    instruction::{InstructionAccount, InstructionView},
    no_allocator, AccountView,
};

no_allocator!();

#[cfg(target_os = "solana")]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    unsafe { pinocchio::syscalls::abort() }
}

/// TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb sebagai 4 word little-endian.
const TOKEN_2022: [u64; 4] = [
    16037166466943343878,
    15766377600162546200,
    2814109315776649910,
    18197816669093084670,
];
const TRANSFER_CHECKED: u8 = 12;
const FAIL: u64 = 1;

#[inline(always)]
unsafe fn word(p: *const u8, i: usize) -> u64 {
    core::ptr::read_unaligned((p as *const u64).add(i))
}

#[inline(always)]
unsafe fn next(ctx: &mut InstructionContext) -> Option<AccountView> {
    match ctx.next_account_unchecked() {
        MaybeAccount::Account(a) => Some(a),
        _ => None,
    }
}

#[allow(deprecated)]
#[inline(always)]
fn now() -> i64 {
    let mut clock = core::mem::MaybeUninit::<[i64; 5]>::uninit();
    unsafe {
        pinocchio::syscalls::sol_get_clock_sysvar(clock.as_mut_ptr() as *mut u8);
        (*clock.as_ptr())[4]
    }
}

/// Jumlah yang sudah vested pada waktu `t`, tanpa perkalian 128-bit.
#[inline(always)]
fn vested(total: u64, start: i64, end: i64, t: i64) -> u64 {
    if t >= end {
        total
    } else if t <= start {
        0
    } else {
        let d = (end - start) as u64;
        let e = (t - start) as u64;
        (total / d) * e + (total % d) * e / d
    }
}

#[no_mangle]
pub unsafe extern "C" fn entrypoint(input: *mut u8) -> u64 {
    let mut ctx = InstructionContext::new_unchecked(input);
    if ctx.remaining() != 5 {
        return FAIL;
    }
    let (Some(vault), Some(mint), Some(dest), Some(pda), Some(token_program)) = (
        next(&mut ctx),
        next(&mut ctx),
        next(&mut ctx),
        next(&mut ctx),
        next(&mut ctx),
    ) else {
        return FAIL;
    };
    let data = ctx.instruction_data_unchecked();
    let tp = token_program.address() as *const _ as *const u8;
    // Wajib Token-2022 asli: program lain bisa menyalahgunakan tanda tangan PDA.
    if data.len() != 26
        || word(tp, 0) != TOKEN_2022[0]
        || word(tp, 1) != TOKEN_2022[1]
        || word(tp, 2) != TOKEN_2022[2]
        || word(tp, 3) != TOKEN_2022[3]
        || vault.data_len() < 72
    {
        return FAIL;
    }
    let d = data.as_ptr();
    let total = word(d, 0);
    let locked = total - vested(total, word(d, 1) as i64, word(d, 2) as i64, now());
    // Saldo token account ada di offset 64 (sama untuk Token dan Token-2022).
    let balance = word(vault.data_ptr(), 8);
    if balance <= locked {
        return FAIL;
    }

    let mut ix = [0u8; 10];
    ix[0] = TRANSFER_CHECKED;
    ix[1..9].copy_from_slice(&(balance - locked).to_le_bytes());
    ix[9] = data[24];

    let metas = [
        InstructionAccount::writable(vault.address()),
        InstructionAccount::readonly(mint.address()),
        InstructionAccount::writable(dest.address()),
        InstructionAccount::readonly_signer(pda.address()),
    ];
    let accounts = [
        CpiAccount::from(&vault),
        CpiAccount::from(&mint),
        CpiAccount::from(&dest),
        CpiAccount::from(&pda),
    ];
    let seeds = [
        Seed::from(dest.address().as_ref()),
        Seed::from(&data[..24]),
        Seed::from(&data[25..26]),
    ];
    let instruction = InstructionView {
        program_id: token_program.address(),
        data: &ix,
        accounts: &metas,
    };
    invoke_signed_unchecked(&instruction, &accounts, &[Signer::from(&seeds)]);
    0
}
