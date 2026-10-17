//! Ringan: token SPL-style paling ringan, ditulis di Pinocchio.
//!
//! Satu program = satu token. Supply tetap 21.000.000 (6 desimal) dan di-mint
//! sekali ke holder genesis. Tidak ada mint authority, jadi tidak ada yang bisa
//! mencetak token lagi. Fitur tambahan: pemilik bisa mengunci saldonya sendiri
//! sampai waktu tertentu (misalnya jatah developer), dan kunci hanya bisa diperpanjang.
//!
//! Holder (48 byte, dimiliki program): owner [0..32] | amount u64 [32..40] | unlock_ts i64 [40..48]
//!
//! Akun selalu [holder, owner (signer), to?]. Data: tag u8, lalu u64/i64 little-endian.
//!   0 Open      [holder, owner]        -> set owner; holder genesis sekaligus menerima seluruh supply
//!   1 Transfer  [from, owner, to]  u64 -> gagal kalau `from` masih terkunci atau `to` belum di-Open
//!   2 Lock      [holder, owner]    i64 -> kunci saldo sampai unix time, hanya bisa diperpanjang
//!
//! Program tidak memeriksa sendiri bahwa holder dimiliki program ini. Runtime Solana
//! sudah menolak transaksi yang mengubah data akun milik program lain, dan setiap
//! jalur sukses yang berdampak menulis ke holder. Ini sengaja, demi ukuran.
#![no_std]

use pinocchio::{entrypoint::lazy::InstructionContext, no_allocator, AccountView};

no_allocator!();

#[cfg(target_os = "solana")]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    unsafe { pinocchio::syscalls::abort() }
}

/// 21.000.000 token × 10^6.
pub const SUPPLY: u64 = 21_000_000_000_000;
pub const HOLDER_LEN: usize = 48;

/// Alamat holder genesis (BgM5q77e4k9ocrjHHn1CYFHNgxtGUDL6146vKfvsozUk) sebagai 4 word little-endian.
const GENESIS: [u64; 4] = [
    1760633953506208158,
    17904664943084790966,
    10274228803305670927,
    4452792528545039921,
];

const OK: u64 = 0;
const FAIL: u64 = 1;

#[inline(always)]
unsafe fn word(p: *const u8, i: usize) -> u64 {
    core::ptr::read_unaligned((p as *const u64).add(i))
}

#[inline(always)]
unsafe fn key_eq(a: *const u8, b: *const u8) -> bool {
    word(a, 0) == word(b, 0) && word(a, 1) == word(b, 1) && word(a, 2) == word(b, 2) && word(a, 3) == word(b, 3)
}

#[inline(always)]
fn key_ptr(a: &AccountView) -> *const u8 {
    a.address() as *const _ as *const u8
}

#[inline(always)]
unsafe fn next(ctx: &mut InstructionContext) -> Option<AccountView> {
    match ctx.next_account_unchecked() {
        pinocchio::entrypoint::lazy::MaybeAccount::Account(a) => Some(a),
        _ => None,
    }
}

#[allow(deprecated)]
#[inline(always)]
fn now() -> i64 {
    let mut clock = [0i64; 5];
    unsafe { pinocchio::syscalls::sol_get_clock_sysvar(clock.as_mut_ptr() as *mut u8) };
    clock[4]
}

#[no_mangle]
pub unsafe extern "C" fn entrypoint(input: *mut u8) -> u64 {
    let mut ctx = InstructionContext::new_unchecked(input);
    let n = ctx.remaining();
    if n < 2 || n > 3 {
        return FAIL;
    }
    let (Some(mut holder), Some(owner)) = (next(&mut ctx), next(&mut ctx)) else {
        return FAIL;
    };
    let to = if n == 3 {
        match next(&mut ctx) {
            Some(t) => Some(t),
            None => return FAIL,
        }
    } else {
        None
    };
    let data = ctx.instruction_data_unchecked();

    if !owner.is_signer() || holder.data_len() != HOLDER_LEN || data.is_empty() {
        return FAIL;
    }
    let h = holder.data_mut_ptr();
    let o = key_ptr(&owner);
    let tag = data[0];

    if tag == 0 {
        if to.is_some() || word(h, 0) | word(h, 1) | word(h, 2) | word(h, 3) != 0 {
            return FAIL;
        }
        core::ptr::copy_nonoverlapping(o, h, 32);
        if key_eq(key_ptr(&holder), GENESIS.as_ptr() as *const u8) {
            (h as *mut u64).add(4).write(SUPPLY);
        }
        return OK;
    }

    if data.len() != 9 || !key_eq(h, o) {
        return FAIL;
    }
    let arg = core::ptr::read_unaligned(data.as_ptr().add(1) as *const u64);
    let amount = (h as *mut u64).add(4);
    let unlock = (h as *mut i64).add(5);

    match (tag, to) {
        (1, Some(mut to)) => {
            let t = to.data_mut_ptr();
            if to.data_len() != HOLDER_LEN
                || word(t, 0) | word(t, 1) | word(t, 2) | word(t, 3) == 0
                || now() < *unlock
                || *amount < arg
            {
                return FAIL;
            }
            *amount -= arg;
            // Tidak bisa overflow: total semua saldo tidak pernah melebihi SUPPLY.
            *(t as *mut u64).add(4) += arg;
            OK
        }
        (2, None) if arg as i64 > *unlock => {
            *unlock = arg as i64;
            OK
        }
        _ => FAIL,
    }
}
