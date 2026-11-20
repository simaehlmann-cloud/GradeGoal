/* =========================================================
   App-Vorschauvideos fuer den App Store (wie tools/store-bilder.mjs)

   Nimmt die lokal gebaute App (dist/) mit dem Beispielzeugnis auf –
   echte Bedienung der App, nichts nachgebaut. Eine oeffentliche
   Web-Version gibt es nicht; der Browser ist hier nur das Aufnahmegeraet.

   Einmalig:
     npm install --no-save playwright
     npx playwright install chromium
     ffmpeg installieren (Windows: winget install ffmpeg)

   Danach:
     npm run store-video

   Ergebnis in store-bilder/video/ (steht in .gitignore):
     iphone-de.mp4 iphone-en.mp4   886 × 1920   (iPhone 6,9")
     ipad-de.mp4   ipad-en.mp4    1200 × 1600   (iPad 13")
   Apple verlangt: 15–30 s, H.264, hoechstens 30 Bilder/s, Stereo-Ton.
   Jedes Video wird mit ffprobe gegen diese Vorgaben geprueft.
========================================================= */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { demoState } from "../src/lib/demo.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const OUT = path.join(ROOT, "store-bilder", "video");
const TMP = path.join(ROOT, "store-bilder", ".frames");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (e) {
  console.error("Playwright fehlt. Einmalig: npm install --no-save playwright && npx playwright install chromium");
  process.exit(1);
}
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch (e) {
  console.error("ffmpeg fehlt (Windows: winget install ffmpeg, macOS: brew install ffmpeg).");
  process.exit(1);
}
if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("dist/index.html fehlt – zuerst npm run build.");
  process.exit(1);
}

/* Bildschirmgroesse in CSS-Pixeln × Skalierung = exaktes Apple-Mass */
const DEVICES = {
  iphone: { viewport: { width: 443, height: 960 }, scale: 2, size: [886, 1920] },
  ipad: { viewport: { width: 900, height: 1200 }, scale: 4 / 3, size: [1200, 1600] },
};

const L = {
  de: {
    c1: "Dein Zeugnis auf einen Blick", c2: "Wunschnote erreicht? Konfetti!",
    c3: "Was wäre wenn …?", c4: "Abitur-Rechner", c5: "34 von 50 Punkten – welche Note?",
    c6: "Deine Noten bleiben auf deinem Gerät",
    physics: "Physik", grade: "Note", subject: "Englisch", whatIf: "Was wäre wenn?",
    abi: "Abitur", key: "Notenschlüssel", back: "Zurück",
  },
  en: {
    c1: "Your report card at a glance", c2: "Target reached? Confetti!",
    c3: "What if …?", c4: "Abitur calculator", c5: "34 out of 50 points – which grade?",
    c6: "Your grades stay on your device",
    physics: "Physics", grade: "Grade", subject: "English", whatIf: "What if?",
    abi: "Abitur", key: "Grade key", back: "Back",
  },
};

/* ---------- kleiner Webserver fuer dist/ ---------- */
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
  const file = path.join(DIST, rel);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

/* ---------- Einblendungen: Bildunterschrift und Fingertipp ---------- */
const OVERLAY_JS = () => {
  const st = document.createElement("style");
  st.textContent = `
    #gg-cap{position:fixed;left:50%;bottom:calc(26px + env(safe-area-inset-bottom,0px));transform:translate(-50%,12px);
      max-width:88vw;width:max-content;z-index:2000;opacity:0;transition:opacity .35s,transform .35s;pointer-events:none;
      background:rgba(23,42,70,.94);color:#fff;border-radius:18px;padding:13px 20px;text-align:center;
      font:700 19px/1.3 'Space Grotesk',sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35)}
    #gg-cap.on{opacity:1;transform:translate(-50%,0)}
    #gg-cap b{color:#FFDE59}
    .gg-tap{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;z-index:2001;pointer-events:none;
      background:rgba(47,93,224,.28);border:2px solid rgba(47,93,224,.75);animation:ggtap .55s ease-out forwards}
    @keyframes ggtap{from{transform:scale(.4);opacity:1}to{transform:scale(1.25);opacity:0}}`;
  document.head.appendChild(st);
  const cap = document.createElement("div");
  cap.id = "gg-cap";
  document.body.appendChild(cap);
  window.ggCaption = (text) => {
    cap.classList.remove("on");
    setTimeout(() => { cap.textContent = text; if (text) cap.classList.add("on"); }, text ? 180 : 0);
  };
  window.ggTap = (x, y) => {
    const d = document.createElement("div");
    d.className = "gg-tap"; d.style.left = x + "px"; d.style.top = y + "px";
    document.body.appendChild(d); setTimeout(() => d.remove(), 700);
  };
};

async function caption(page, text) { await page.evaluate((t) => window.ggCaption(t), text); }
async function tap(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) await page.evaluate(([x, y]) => window.ggTap(x, y), [box.x + box.width / 2, box.y + box.height / 2]);
  await page.waitForTimeout(160);
  await locator.click();
}
async function smoothScroll(page, y, ms = 900) {
  await page.evaluate(([to, dur]) => new Promise((done) => {
    const from = window.scrollY, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      window.scrollTo(0, from + (to - from) * e);
      k < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  }), [y, ms]);
}
async function scrollToEl(page, locator, offset = 90, ms = 900) {
  const y = await locator.evaluate((el, off) => el.getBoundingClientRect().top + window.scrollY - off, offset);
  await smoothScroll(page, Math.max(0, y), ms);
}
/* Regler „Was waere wenn“ sichtbar bewegen (React lauscht auf input) */
async function slide(page, from, to, ms = 1600) {
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const v = Math.round((from + (to - from) * (i / steps)) * 10) / 10;
    await page.evaluate((val) => {
      const r = document.querySelector("input[type=range]");
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      set.call(r, String(val));
      r.dispatchEvent(new Event("input", { bubbles: true }));
    }, v);
    await page.waitForTimeout(ms / steps);
  }
}

/* ---------- Aufnahme ueber den Screencast von Chromium ----------
   Liefert verlustfreie Einzelbilder mit Zeitstempel – deutlich schaerfer
   als die eingebaute Videoaufnahme von Playwright. */
async function record(page, dir, run) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const file = path.join(dir, String(frames.length).padStart(5, "0") + ".png");
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    /* Eingangszeit statt metadata.timestamp: dieselbe Uhr wie das Ende
       der Aufnahme – sonst wird die stehende Schlussszene verschluckt. */
    frames.push({ file, t: Date.now() / 1000 });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) {}
  });
  await cdp.send("Page.startScreencast", { format: "png", everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  await run();
  const t1 = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  return { frames, t0, t1 };
}

function encode({ frames, t1 }, size, out) {
  if (frames.length < 10) throw new Error("zu wenige Einzelbilder aufgenommen");
  /* Jedes Einzelbild so lange zeigen, bis das naechste kam */
  const list = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : t1;
    const d = Math.max(1 / 60, next - f.t);
    list.push(`file '${f.file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`, `duration ${d.toFixed(4)}`);
  });
  list.push(`file '${frames[frames.length - 1].file.replace(/\\/g, "/")}'`);
  const listFile = path.join(path.dirname(frames[0].file), "list.txt");
  fs.writeFileSync(listFile, list.join("\n"));
  const [w, h] = size;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", listFile,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-vf", `scale=${w}:${h}:flags=lanczos,fps=30,format=yuv420p`,
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow",
    "-b:v", "10M", "-maxrate", "12M", "-bufsize", "20M",
    "-c:a", "aac", "-b:a", "256k", "-ac", "2", "-ar", "48000",
    "-t", "29.5", "-shortest", "-movflags", "+faststart",
    out,
  ]);
}

/* Gegen Apples Vorgaben pruefen */
function check(file, size) {
  const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]).toString());
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  const dur = Number(j.format.duration);
  const [n, d] = String(v.r_frame_rate).split("/").map(Number);
  const fps = n / (d || 1);
  const errs = [];
  if (v.codec_name !== "h264") errs.push("Codec " + v.codec_name);
  if (v.width !== size[0] || v.height !== size[1]) errs.push(`Maße ${v.width}×${v.height}`);
  if (!(dur >= 15 && dur <= 30)) errs.push("Länge " + dur.toFixed(1) + " s");
  if (fps > 30.01) errs.push("Bildrate " + fps);
  if (!a || a.channels !== 2) errs.push("kein Stereo-Ton");
  const mb = fs.statSync(file).size / 1e6;
  if (mb > 500) errs.push("Datei zu groß");
  console.log(`${errs.length ? "✗" : "✓"} ${path.relative(ROOT, file)}  ${v.width}×${v.height}  ${dur.toFixed(1)} s  ${fps} fps  ${mb.toFixed(1)} MB${errs.length ? "  → " + errs.join(", ") : ""}`);
  return errs.length === 0;
}

/* ---------- Ablauf (rund 25 Sekunden) ---------- */
async function scenes(page, t) {
  const wait = (ms) => page.waitForTimeout(ms);
  await caption(page, t.c1);
  await wait(1000);
  await smoothScroll(page, 260, 1000);
  await wait(400);

  /* Wunschnote erreicht -> Konfetti (Standbild bei 5 s zeigt es) */
  await caption(page, t.c2);
  const g = page.getByRole("textbox", { name: `${t.physics} – ${t.grade}`, exact: true });
  await scrollToEl(page, g, 320, 700);
  await tap(page, g);
  await g.fill("");
  await wait(250);
  await page.keyboard.type("2", { delay: 120 });
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await wait(2300);

  /* Was waere wenn */
  await caption(page, t.c3);
  await smoothScroll(page, 0, 500);
  const subj = page.getByRole("button", { name: t.subject, exact: true }).first();
  await scrollToEl(page, subj, 300, 500);
  await tap(page, subj);
  await wait(500);
  await scrollToEl(page, page.getByRole("heading", { name: t.whatIf }), 70, 1000);
  await wait(300);
  await slide(page, 3.5, 1.3, 1800);
  await wait(900);

  /* Abitur */
  await caption(page, t.c4);
  await tap(page, page.getByText("← " + t.back).first());
  await wait(300);
  await smoothScroll(page, 0, 400);
  await tap(page, page.locator(".tile").filter({ hasText: t.abi }));
  await wait(700);
  await smoothScroll(page, await page.evaluate(() => document.body.scrollHeight - window.innerHeight), 2200);
  await wait(900);

  /* Notenschluessel */
  await caption(page, t.c5);
  await tap(page, page.getByText("← " + t.back).first());
  await wait(300);
  await tap(page, page.locator(".tile").filter({ hasText: t.key }));
  await wait(400);
  const nums = page.locator("input[inputmode=decimal]");
  await tap(page, nums.nth(0));
  await page.keyboard.type("34", { delay: 140 });
  await tap(page, nums.nth(1));
  await page.keyboard.type("50", { delay: 140 });
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await wait(1800);

  /* Schluss */
  await caption(page, t.c6);
  await tap(page, page.getByText("← " + t.back).first());
  await wait(2200);
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let ok = true;
for (const [devName, dev] of Object.entries(DEVICES)) {
  for (const lang of ["de", "en"]) {
    const ctx = await browser.newContext({ viewport: dev.viewport, deviceScaleFactor: dev.scale, locale: lang === "de" ? "de-DE" : "en-US", hasTouch: false });
    /* Ein Halbjahr, Physik knapp unter der Wunschnote, keine Angebote */
    const st = { ...demoState(lang, Date.now(), { single: true }), theme: "light" };
    st.features = { ...st.features, groups: false };
    await ctx.addInitScript(([s]) => {
      try {
        if (!sessionStorage.getItem("gg-vid")) {
          localStorage.clear();
          localStorage.setItem("gradegoal:data", s);
          localStorage.setItem("gradegoal:unlocked", "1");
          // Hilfetexte als gelesen markieren: ruhigere Bilder
          localStorage.setItem("gradegoal:hints", JSON.stringify(["groups","home-subjects","key-calc","key-manage","presets","subj-weight","tendency","what-if"]));
          localStorage.setItem("gradegoal:meta", JSON.stringify({ firstUse: Date.now(), lastBackup: Date.now(), demoOff: true }));
          sessionStorage.setItem("gg-vid", "1");
        }
      } catch (e) {}
    }, [JSON.stringify(st)]);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => { ok = false; console.error("Fehler in der App:", e.message); });
    await page.goto(BASE);
    await page.waitForSelector(".wrap");
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.evaluate(OVERLAY_JS);
    await page.waitForTimeout(400);

    const dir = path.join(TMP, `${devName}-${lang}`);
    const rec = await record(page, dir, () => scenes(page, L[lang]));
    const out = path.join(OUT, `${devName}-${lang}.mp4`);
    encode(rec, dev.size, out);
    ok = check(out, dev.size) && ok;
    await ctx.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
await browser.close();
server.close();
fs.rmSync(TMP, { recursive: true, force: true });
if (!ok) { console.error("\nMindestens ein Video entspricht nicht den Vorgaben."); process.exit(1); }
console.log("\nAlle Videos in store-bilder/video/ – Vorgaben geprüft.");
