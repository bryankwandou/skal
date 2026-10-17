"""Buang tabel section header dari ELF SBPF v3.

Loader SBPF v3 (SIMD-0189) hanya membaca ELF header dan program header, jadi
section header dan .shstrtab adalah byte mati yang tetap kena rent saat deploy.
Pemakaian: python scripts/strip_elf.py target/deploy/ringan.so out.so
"""
import struct
import sys

src, dst = sys.argv[1], sys.argv[2]
elf = bytearray(open(src, "rb").read())
assert elf[:4] == b"\x7fELF" and elf[4] == 2, "bukan ELF64"
phoff, = struct.unpack_from("<Q", elf, 0x20)
phentsize, phnum = struct.unpack_from("<HH", elf, 0x36)
end = phoff + phentsize * phnum
for i in range(phnum):
    p = phoff + i * phentsize
    offset, = struct.unpack_from("<Q", elf, p + 8)
    filesz, = struct.unpack_from("<Q", elf, p + 32)
    end = max(end, offset + filesz)
struct.pack_into("<Q", elf, 0x28, 0)            # e_shoff
struct.pack_into("<HHH", elf, 0x3A, 0, 0, 0)    # e_shentsize, e_shnum, e_shstrndx
open(dst, "wb").write(elf[:end])
print(f"{len(elf)} -> {end} byte")
