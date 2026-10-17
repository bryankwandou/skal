(() => {
  "use strict";
  const C = window.SKAL;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  /* ---------- language ---------- */
  let lang = "en";
  const en = {};
  $$("[data-i18n]").forEach((el) => { en[el.dataset.i18n] = el.innerHTML; });
  const t = (k, vars = {}) => (window.I18N.js[lang][k] || window.I18N.js.en[k] || k).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? "");
  const fmt = (n, d = 0) => Number(n).toLocaleString(lang === "id" ? "id-ID" : "en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
  const rerender = [];
  function setLang(l) {
    lang = l === "id" ? "id" : "en";
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((el) => {
      const k = el.dataset.i18n;
      el.innerHTML = lang === "en" ? en[k] : (window.I18N.id[k] ?? en[k]);
    });
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    store.set("skal-lang", lang);
    rerender.forEach((f) => f());
  }
  $$(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

  /* ---------- header + reveal ---------- */
  const header = $("header");
  addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 8), { passive: true });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  $$(".reveal").forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 5) * 0.07}s`);
    io.observe(el);
  });

  /* ---------- counters ---------- */
  $$("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || "";
    const draw = (v) => { el.textContent = fmt(v, dec) + suf; };
    rerender.push(() => draw(end));
    if (reduced) return draw(end);
    const t0 = performance.now(), dur = 1600;
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      draw(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  /* ---------- hero rivers ---------- */
  (function rivers() {
    const cv = $("#rivers"); if (!cv) return;
    const ctx = cv.getContext("2d");
    let w, h, dpr, lines, raf, visible = true;
    const rgb = () => getComputedStyle(document.documentElement).getPropertyValue("--river").trim() || "18,122,82";
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 640 ? 9 : 16;
      lines = Array.from({ length: n }, (_, i) => ({
        y: h * (0.12 + 0.8 * i / n), amp: 18 + Math.random() * 42, f: 0.0016 + Math.random() * 0.0024,
        ph: Math.random() * 6.28, sp: 0.0003 + Math.random() * 0.0005, a: 0.05 + Math.random() * 0.13,
        dots: Array.from({ length: 2 }, () => Math.random()),
      }));
    }
    const yAt = (l, x, tm) => l.y + Math.sin(x * l.f + l.ph + tm * l.sp) * l.amp + Math.sin(x * l.f * 2.3 + tm * l.sp * 1.7) * l.amp * 0.35;
    function frame(tm) {
      const c = rgb();
      ctx.clearRect(0, 0, w, h);
      for (const l of lines) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) { const y = yAt(l, x, tm); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.strokeStyle = `rgba(${c},${l.a})`; ctx.lineWidth = 1.2; ctx.stroke();
        for (let i = 0; i < l.dots.length; i++) {
          const x = ((l.dots[i] + tm * 0.00004 * (1 + i)) % 1) * w;
          ctx.beginPath(); ctx.arc(x, yAt(l, x, tm), 2, 0, 6.28);
          ctx.fillStyle = `rgba(${c},${Math.min(l.a * 4, 0.7)})`; ctx.fill();
        }
      }
      if (!reduced && visible) raf = requestAnimationFrame(frame);
    }
    size(); frame(0);
    addEventListener("resize", () => { size(); if (reduced) frame(0); });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible && !reduced) raf = requestAnimationFrame(frame); }).observe(cv);
  })();

  /* ---------- RPC ---------- */
  async function rpc(net, method, params) {
    const r = await fetch(C[net].rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    return j.result;
  }
  const short = (a) => `${a.slice(0, 4)}…${a.slice(-4)}`;
  const explorer = (net, a) => `https://explorer.solana.com/address/${a}${net === "devnet" ? "?cluster=devnet" : ""}`;

  /* ---------- live proof ---------- */
  let net = "devnet", proof = {};
  async function loadProof() {
    const n = net;
    proof = { net: n, state: "loading" };
    paintProof();
    const out = { net: n };
    try {
      const cfg = C[n];
      const [slot, prog] = await Promise.all([
        rpc(n, "getSlot", [{ commitment: "confirmed" }]),
        rpc(n, "getAccountInfo", [cfg.vault, { encoding: "jsonParsed" }]),
      ]);
      out.slot = slot;
      if (prog.value?.executable) {
        const pd = prog.value.data?.parsed?.info?.programData;
        const pdi = pd ? await rpc(n, "getAccountInfo", [pd, { encoding: "base64", dataSlice: { offset: 0, length: 0 } }]) : null;
        out.programSize = pdi?.value?.space ? pdi.value.space - 45 : null;
        out.program = true;
      } else out.program = false;
      if (cfg.mint) {
        const [mint, bal] = await Promise.all([
          rpc(n, "getAccountInfo", [cfg.mint, { encoding: "jsonParsed" }]),
          rpc(n, "getTokenAccountBalance", [cfg.vaultToken]),
        ]);
        const info = mint.value.data.parsed.info;
        out.mintAuth = info.mintAuthority; out.freezeAuth = info.freezeAuthority;
        out.supply = BigInt(info.supply) / 10n ** BigInt(info.decimals);
        const md = (info.extensions || []).find((e) => e.extension === "tokenMetadata");
        out.meta = md ? `${md.state.name} · ${md.state.symbol}` : "—";
        out.vault = BigInt(bal.value.amount) / 1_000_000n;
      }
      out.state = "ok";
    } catch (e) { out.state = "error"; out.err = e.message; }
    if (n === net) { proof = out; paintProof(); }
  }
  function paintProof() {
    const p = proof, set = (k, txt, ok) => {
      const card = $(`.pcard[data-k="${k}"]`), v = $(".val", card);
      v.classList.toggle("loading", p.state === "loading");
      v.textContent = p.state === "loading" ? "loading" : txt;
      card.classList.toggle("ok", ok === true); card.classList.toggle("warn", ok === false);
    };
    const pending = !C[p.net]?.mint;
    if (p.state === "loading") ["mintAuth", "freezeAuth", "supply", "meta", "vault", "program"].forEach((k) => set(k, ""));
    else if (p.state === "error") ["mintAuth", "freezeAuth", "supply", "meta", "vault", "program"].forEach((k) => set(k, "—", false));
    else {
      if (pending) ["mintAuth", "freezeAuth", "supply", "meta", "vault"].forEach((k) => set(k, t("notLaunched")));
      else {
        set("mintAuth", p.mintAuth ? t("set", { a: short(p.mintAuth) }) : t("empty"), !p.mintAuth);
        set("freezeAuth", p.freezeAuth ? t("set", { a: short(p.freezeAuth) }) : t("empty"), !p.freezeAuth);
        set("supply", fmt(p.supply.toString()), p.supply === 1_000_000_000_000n);
        set("meta", p.meta, p.meta.startsWith("Save Kalimantan"));
        set("vault", `${fmt(p.vault.toString())} SKAL`, true);
      }
      set("program", p.program ? t("deployed", { n: fmt(p.programSize ?? 0) }) : t("missing"), p.program ? true : undefined);
    }
    $("#proof-slot").textContent = p.slot ? t("reading", { slot: fmt(p.slot) }) : "";
    $("#proof-note").textContent = p.state === "error" ? t("offline", { net: p.net }) : pending ? t("pendingNote") : p.net === "devnet" ? t("devNote") : "";
    if (p.net === "devnet") {
      const dot = $("#hero-dot"), st = $("#hero-status");
      dot.classList.toggle("on", p.state === "ok");
      st.textContent = p.state === "ok" ? t("live", { net: "devnet", slot: fmt(p.slot) }) : p.state === "error" ? t("offline", { net: "devnet" }) : t("checking", { net: "devnet" });
    }
  }
  rerender.push(paintProof);
  $$(".seg button").forEach((b) => b.addEventListener("click", () => {
    net = b.dataset.net;
    $$(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    loadProof();
  }));

  /* ---------- attack lab ---------- */
  const W = window.solanaWeb3;
  const term = $("#term"), verdict = $("#verdict");
  let lastAtk = null, running = false;
  function releaseIx(kind) {
    const d = C.devnet, P = (s) => new W.PublicKey(s);
    const total = BigInt(d.total) / (kind === "fake" ? 2n : 1n);
    const data = new Uint8Array(26), dv = new DataView(data.buffer);
    dv.setBigUint64(0, total, true); dv.setBigInt64(8, BigInt(d.start), true); dv.setBigInt64(16, BigInt(d.end), true);
    data[24] = 6; data[25] = d.bump;
    const tokenProgram = kind === "tokenprog" ? W.SystemProgram.programId : P("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
    const dest = kind === "redirect" ? P(d.otherDest) : P(d.dest);
    return {
      total, dest, tokenProgram,
      ix: new W.TransactionInstruction({ programId: P(d.vault), data, keys: [
        { pubkey: P(d.vaultToken), isSigner: false, isWritable: true },
        { pubkey: P(d.mint), isSigner: false, isWritable: false },
        { pubkey: dest, isSigner: false, isWritable: true },
        { pubkey: P(d.pda), isSigner: false, isWritable: false },
        { pubkey: tokenProgram, isSigner: false, isWritable: false },
      ] }),
    };
  }
  const line = (cls, s) => `<span class="${cls}">${esc(s)}</span>\n`;
  async function typeOut(html) {
    if (reduced) { term.innerHTML += html; return; }
    const parts = html.split("\n").filter(Boolean);
    for (const p of parts) { term.innerHTML += p + "\n"; term.scrollTop = term.scrollHeight; await new Promise((r) => setTimeout(r, 70)); }
  }
  async function runAttack(kind) {
    if (running || !W) return;
    running = true; lastAtk = kind;
    $$(".atk").forEach((b) => b.classList.toggle("active", b.dataset.atk === kind));
    verdict.hidden = true; term.innerHTML = "";
    try {
      const conn = new W.Connection(C.devnet.rpc, "confirmed");
      const r = releaseIx(kind);
      await typeOut(line("c", `// ${t("building")}`));
      await typeOut(
        line("k", `program      ${C.devnet.vault}`) +
        line("", `total        ${r.total}${kind === "fake" ? "   <- halved" : ""}`) +
        line("", `start..end   ${C.devnet.start} .. ${C.devnet.end}`) +
        line("", `destination  ${r.dest.toBase58()}${kind === "redirect" ? "   <- changed" : ""}`) +
        line("", `token prog   ${r.tokenProgram.toBase58()}${kind === "tokenprog" ? "   <- swapped" : ""}`));
      await typeOut(line("c", `// ${t("simulating")}`));
      const tx = new W.Transaction().add(r.ix);
      tx.feePayer = new W.PublicKey(C.devnet.simPayer);
      tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
      const before = await conn.getTokenAccountBalance(new W.PublicKey(C.devnet.vaultToken));
      const sim = await conn.simulateTransaction(tx.compileMessage(), undefined, [new W.PublicKey(C.devnet.vaultToken)]);
      const v = sim.value;
      await typeOut((v.logs || []).map((l) => line(/failed|error|escalat/i.test(l) ? "er" : /success/.test(l) ? "ok" : "", l)).join(""));
      if (!v.err) {
        const raw = Uint8Array.from(atob(v.accounts[0].data[0]), (c) => c.charCodeAt(0));
        const after = new DataView(raw.buffer).getBigUint64(64, true);
        const moved = (BigInt(before.value.amount) - after) / 1_000_000n;
        verdict.className = "verdict ok"; verdict.textContent = t("passed", { amt: fmt(moved.toString()) });
      } else {
        await typeOut(line("er", `err: ${JSON.stringify(v.err)}`));
        verdict.className = "verdict er"; verdict.textContent = t("rejected");
      }
      verdict.hidden = false;
    } catch (e) {
      await typeOut(line("er", e.message));
      verdict.className = "verdict er"; verdict.textContent = t("rpcErr"); verdict.hidden = false;
    }
    running = false;
  }
  $$(".atk").forEach((b) => b.addEventListener("click", () => runAttack(b.dataset.atk)));
  rerender.push(() => {
    if (!lastAtk || verdict.hidden) return;
    const ok = verdict.classList.contains("ok");
    if (!ok) verdict.textContent = t("rejected");
  });

  /* ---------- vesting simulator ---------- */
  (function sim() {
    const X0 = 40, X1 = 580, Y0 = 200, Y1 = 20, MAX = 400, CLIFF = 90, END = 365, TOTAL = 140_000_000_000;
    const x = (d) => X0 + (d / MAX) * (X1 - X0), y = (f) => Y0 - f * (Y0 - Y1);
    const frac = (d) => (d <= CLIFF ? 0 : d >= END ? 1 : (d - CLIFF) / (END - CLIFF));
    const pts = [[0, 0], [CLIFF, 0], [END, 1], [MAX, 1]].map(([d, f]) => `${x(d)},${y(f)}`).join(" ");
    $("#curve").setAttribute("points", pts);
    $("#area").setAttribute("points", `${pts} ${x(MAX)},${Y0} ${x(0)},${Y0}`);
    $("#cliff").setAttribute("x1", x(CLIFF)); $("#cliff").setAttribute("x2", x(CLIFF)); $("#cliff-t").setAttribute("x", x(CLIFF));
    const input = $("#day");
    function paint() {
      const d = +input.value, f = frac(d), freed = Math.floor(TOTAL * f);
      $("#dayout").textContent = d;
      $("#cursor").setAttribute("x1", x(d)); $("#cursor").setAttribute("x2", x(d));
      $("#dotc").setAttribute("cx", x(d)); $("#dotc").setAttribute("cy", y(f));
      $("#v-locked").textContent = fmt(TOTAL - freed); $("#v-free").textContent = fmt(freed);
      $("#v-bar").style.width = `${f * 100}%`;
      $("#v-note").textContent = t(d <= CLIFF ? "dayNote0" : d >= END ? "dayNote2" : "dayNote1");
    }
    input.addEventListener("input", () => { auto = false; paint(); });
    rerender.push(paint);
    paint();
    let auto = !reduced;
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting || !auto) return;
      o.disconnect();
      const t0 = performance.now();
      const step = (now) => {
        if (!auto) return;
        const p = Math.min((now - t0) / 2600, 1);
        input.value = Math.round(400 * (1 - Math.pow(1 - p, 3))); paint();
        if (p < 1) requestAnimationFrame(step); else { input.value = 180; paint(); }
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 }).observe($(".sim"));
  })();

  /* ---------- addresses ---------- */
  function paintAddresses() {
    const row = (netn, label, a) => `<div class="addr"><div class="k">${esc(label)}<code>${esc(a)}</code></div><div style="display:flex;gap:8px;align-items:center">${netn ? `<a class="x" href="${explorer(netn, a)}" target="_blank" rel="noopener">${t("explorer")} ↗</a>` : ""}<button class="copy" data-v="${esc(a)}">${t("copy")}</button></div></div>`;
    const m = C.mainnet, d = C.devnet;
    $("#addr-main").innerHTML = $("#addr-main .head").outerHTML +
      (m.mint ? row("mainnet", t("lMint"), m.mint) : `<div class="addr"><div class="k">${t("lMint")}<code>${t("notLaunched")}</code></div></div>`) +
      row("mainnet", t("lVault"), m.vault) + row(null, t("lHash"), C.sha256);
    $("#addr-dev").innerHTML = $("#addr-dev .head").outerHTML +
      row("devnet", t("lVault"), d.vault) + row("devnet", t("lMint"), d.mint) + row("devnet", t("lVaultTok"), d.vaultToken);
    if (m.mint) { const s = $("#main-status"); s.classList.add("live"); s.removeAttribute("data-i18n"); s.textContent = "Live"; $("#ph-main").classList.add("done"); }
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".copy"); if (!b) return;
    try { navigator.clipboard.writeText(b.dataset.v); } catch {}
    b.textContent = t("copied"); b.classList.add("done");
    setTimeout(() => { b.textContent = t("copy"); b.classList.remove("done"); }, 1400);
  });
  rerender.push(paintAddresses);

  /* ---------- boot ---------- */
  paintAddresses();
  const saved = store.get("skal-lang") || (navigator.language || "").toLowerCase().startsWith("id") && "id";
  if (saved === "id") setLang("id");
  loadProof();
})();
