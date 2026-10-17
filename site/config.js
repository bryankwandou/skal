// Official SKAL addresses. Keep in sync with docs/DEPLOYMENTS.md.
// A field set to null means "not launched yet"; the page shows it as pending.
window.SKAL = {
  devnet: {
    rpc: "https://api.devnet.solana.com",
    cluster: "devnet",
    vault: "CW69TjeM9Xk8hFnqsvDZRYhGYcKXtnJj2N7VbJSQxz1o",
    // Demo launch whose vesting is already running, so the attack lab has something to release.
    mint: "9kcZo6DqzeZfZDqp9WRn3c95N1bJAgdLANWcgMGRU7YT",
    dest: "Fe2Sp9e7N8hyAdpWBifd9YVvPtdSWtKTaYsQg4vB6mpd",
    pda: "EDXgLoukPV2B829Y73xxeVUHNsX699agqvRBhEGgy42P",
    vaultToken: "FNVoCLY25i9sV19HaafHGJD2EaTbjCujHfsadcFibwid",
    total: "140000000000000000", start: "1789646245", end: "1821182245", bump: 255,
    // Any funded devnet account works as the fee payer of a dry run; nothing is signed.
    simPayer: "8dr9rMNaLsCvCpL4kbzj3mkPTfAAhyHhiXZhZxBGCWfr",
    // A token account of a different SKAL launch, used as the "other wallet" in attack 2.
    otherDest: "6GRRw51PVPN6VYhwMDrAucYx8Pwp1eY83BqMhgVb6Yam",
    // Rehearsal pool on the demo mint.
    pool: "7B26oGu2fjoHbxcSfU8fSGjAWRgupfj3EAaNdXZA5vEZ",
    poolSkal: "AyNwReTAhc1LfPa665TZSSVMfHu2SDdhN5oeWSnYu2NE", poolSol: "EtP1dcyjzZ59jDUPe1GDS9Eeo2WR9t2pcr9o2BmhamUz",
  },
  mainnet: {
    // api.mainnet-beta.solana.com refuses browser requests (403), so a CORS-friendly public node goes first.
    rpc: ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"],
    cluster: "mainnet-beta",
    vault: "5eaxtobwFbmwEVzdmfVbJ5Zz1PVyyZ3queCJkkVAccLZ",
    mint: "5nySYzo5RxuefMYnKztHaAGbwrEBBtrFiv1g5XVqnpmS",
    vaultToken: "4yaWsT9hL1QagsS7BxFJGqVoxgqTumLq9bgTmF28UVS2",
    // Meteora DAMM v2 SKAL/SOL pool. Its SKAL and SOL vaults are read live.
    pool: "9oejCQAKdkkVWCeqDvLYYsTqT8KQLf9sMebcfF5YPWRe",
    poolSkal: "F7PtJHJvi2nNogrA9ZNAa4F73qSPPbthmWVqKYxG6HJh", poolSol: "8indBh7D7mjmt8g5gLLjEnDqRFVM8yGm8VRCkshByNyW",
  },
  sha256: "729572666d23a87adc0faeb747bc6599dc9efe556043b4708576764ae5588d6f",
};
