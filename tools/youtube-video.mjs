/* =========================================================
   YouTube-Video im Querformat (fuer Google Play und YouTube)

   1920 × 1080, 30 Bilder/s, H.264 + AAC, mit selbst erzeugter Musik
   (tools/make_music.py – keine fremden Aufnahmen, keine Lizenzfragen).

   Aufbau: links ein Telefon mit der echten App (lokal gebaut, mit
   Beispielzeugnis), rechts grosse Bildunterschriften. Vorspann und
   Abspann mit Logo. Ausserdem ein Vorschaubild (1280 × 720).
   Keine Store- oder Plattformnamen im Bild – das Video laeuft auch im
   Google-Play-Eintrag.

   Einmalig: npm install --no-save playwright && npx playwright install chromium
             ffmpeg und python3 mit numpy + scipy
   Aufruf:   npm run youtube-video
   Ergebnis: store-bilder/youtube/gradegoal-de.mp4, -en.mp4,
             vorschau-de.png, vorschau-en.png
========================================================= */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { demoState } from "../src/lib/demo.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const FONTS = path.join(ROOT, "node_modules", "@fontsource");
const OUT = path.join(ROOT, "store-bilder", "youtube");
const TMP = path.join(ROOT, "store-bilder", ".yt");

let chromium;
try { ({ chromium } = await import("playwright")); } catch (e) {
  console.error("Playwright fehlt. Einmalig: npm install --no-save playwright && npx playwright install chromium");
  process.exit(1);
}
for (const [cmd, args] of [["ffmpeg", ["-version"]], ["python3", ["-c", "import numpy, scipy"]]]) {
  try { execFileSync(cmd, args, { stdio: "ignore" }); } catch (e) {
    console.error(`${cmd} fehlt oder ist unvollständig (ffmpeg; python3 mit numpy und scipy).`);
    process.exit(1);
  }
}
if (!fs.existsSync(path.join(DIST, "index.html"))) { console.error("dist/index.html fehlt – zuerst npm run build."); process.exit(1); }

const T = {
  de: {
    tagline: "Noten bis zum Abi",
    scenes: [
      ["Dein Zeugnis", "auf einen Blick", "Alle Fächer, Gesamtschnitt und Wunschnoten."],
      ["Wunschnote", "erreicht?", "Dann gibt's Konfetti."],
      ["Was wäre", "wenn …?", "Sieh sofort, wie die nächste Note deinen Schnitt verändert."],
      ["Abitur-", "Rechner", "Block I und II nach der bundesweiten Formel."],
      ["Noten-", "schlüssel", "34 von 50 Punkten – welche Note ist das?"],
    ],
    outro: ["Keine Werbung", "Kein Konto", "Alle Daten bleiben auf deinem Gerät"],
    ui: { physics: "Physik", grade: "Note", subject: "Englisch", whatIf: "Was wäre wenn?", abi: "Abitur", key: "Notenschlüssel", back: "Zurück" },
    thumb: ["Deine Noten.", "Dein Ziel."],
  },
  en: {
    tagline: "School grades & target grades",
    scenes: [
      ["Your report card", "at a glance", "All subjects, overall average and target grades."],
      ["Target grade", "reached?", "Then there's confetti."],
      ["What", "if …?", "See instantly how your next grade changes your average."],
      ["Abitur", "calculator", "Block I and II for students in Germany."],
      ["Grade", "key", "34 out of 50 points – which grade is that?"],
    ],
    outro: ["No ads", "No account", "All data stays on your device"],
    ui: { physics: "Physics", grade: "Grade", subject: "English", whatIf: "What if?", abi: "Abitur", key: "Grade key", back: "Back" },
    thumb: ["Your grades.", "Your goal."],
  },
};

/* ---------- Buehne: Telefon mit App links, Text rechts ---------- */
const STAGE = (lang) => `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><style>
@font-face{font-family:SG;src:url(/fonts/space-grotesk/files/space-grotesk-latin-700-normal.woff2)format("woff2");font-weight:700}
@font-face{font-family:SG;src:url(/fonts/space-grotesk/files/space-grotesk-latin-400-normal.woff2)format("woff2");font-weight:400}
@font-face{font-family:KA;src:url(/fonts/karla/files/karla-latin-400-normal.woff2)format("woff2");font-weight:400}
@font-face{font-family:KA;src:url(/fonts/karla/files/karla-latin-700-normal.woff2)format("woff2");font-weight:700}
*{box-sizing:border-box;margin:0}
html,body{width:1920px;height:1080px;overflow:hidden}
body{background:radial-gradient(1200px 800px at 75% 20%,#26467A 0%,#172A46 45%,#0E1A2E 100%);color:#fff;font-family:KA,sans-serif}
.blob{position:absolute;border-radius:50%;filter:blur(60px);opacity:.35}
.b1{width:520px;height:520px;background:#2F5DE0;left:-120px;bottom:-160px}
.b2{width:380px;height:380px;background:#FFDE59;right:120px;top:-180px;opacity:.18}
.logo{position:absolute;left:80px;top:60px;font:700 40px SG;letter-spacing:-.5px;transition:opacity .6s}
.logo i{font-style:normal;color:#FFDE59}
.phone{position:absolute;left:300px;top:70px;width:440px;height:940px;border-radius:58px;background:#05080F;padding:14px;
  box-shadow:0 40px 90px rgba(0,0,0,.55),0 0 0 2px #2A3A55 inset;transition:transform 1.1s cubic-bezier(.2,.8,.2,1),opacity .8s}
/* Bildschirm mit Statusleiste oben und Home-Balken unten, damit die
   Kamera-Insel nichts von der App verdeckt */
.screen{width:412px;height:912px;border-radius:44px;background:#EEF2F7;overflow:hidden;position:relative;padding:46px 0 22px}
.screen::after{content:"";position:absolute;left:50%;bottom:8px;width:130px;height:5px;margin-left:-65px;border-radius:3px;background:#172A46;opacity:.35}
.sb{position:absolute;left:34px;right:30px;top:15px;display:flex;justify-content:space-between;font:700 15px SG;color:#172A46}
.phone iframe{width:412px;height:844px;border:0;background:#EEF2F7;display:block}
.notch{position:absolute;left:50%;top:26px;width:110px;height:30px;margin-left:-55px;border-radius:20px;background:#05080F;z-index:2}
.cap{position:absolute;left:920px;top:330px;width:880px;transition:opacity .45s,transform .45s}
.cap.hide{opacity:0;transform:translateY(24px)}
.num{font:700 26px SG;color:#FFDE59;letter-spacing:3px;margin-bottom:22px}
.h1{font:700 92px/1.02 SG;letter-spacing:-2px}
.h1 span{color:#FFDE59}
.sub{font:400 36px/1.35 KA;color:#C9D6EA;margin-top:28px;max-width:760px}
.bar{height:6px;width:120px;background:#FFDE59;border-radius:4px;margin-top:34px}
.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transition:opacity .7s,transform .7s}
.center .big{font:700 150px SG;letter-spacing:-4px}
.center .big i{font-style:normal;color:#FFDE59}
.center .tag{font:400 48px KA;color:#C9D6EA;margin-top:6px}
.center .pills{display:flex;gap:18px;margin-top:56px}
.center .pill{font:700 30px KA;padding:16px 30px;border-radius:999px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18)}
.off{opacity:0;pointer-events:none}
.down{transform:translateY(1100px)}
.left{transform:translateX(-1200px)}
.up{transform:translateY(-40px)}
</style></head><body>
<div class="blob b1"></div><div class="blob b2"></div>
<div class="logo off" id="logo">GradeGoal<i>.</i></div>
<div class="phone down" id="phone"><div class="notch"></div><div class="screen"><div class="sb"><span>9:41</span><span>●●● ▮</span></div><iframe id="app" src="/index.html"></iframe></div></div>
<div class="cap hide" id="cap"><div class="num" id="num"></div><div class="h1" id="h1"></div><div class="sub" id="sub"></div><div class="bar"></div></div>
<div class="center" id="intro"><div class="big">GradeGoal<i>.</i></div><div class="tag" id="itag"></div></div>
<div class="center off up" id="outro"><div class="big">GradeGoal<i>.</i></div><div class="tag" id="otag"></div><div class="pills" id="pills"></div></div>
<script>
window.stage = {
  set(id, cls, on) { document.getElementById(id).classList.toggle(cls, on); },
  caption(n, a, b, sub) {
    const c = document.getElementById("cap");
    c.classList.add("hide");
    setTimeout(() => {
      document.getElementById("num").textContent = String(n).padStart(2, "0");
      document.getElementById("h1").innerHTML = a + "<br><span>" + b + "</span>";
      document.getElementById("sub").textContent = sub;
      c.classList.remove("hide");
    }, 420);
  },
  text(id, t) { document.getElementById(id).textContent = t; },
  pills(list) { document.getElementById("pills").innerHTML = list.map((p) => '<div class="pill">' + p + "</div>").join(""); },
};
</script></body></html>`;

/* ---------- Vorschaubild 1280 × 720 ---------- */
const THUMB = (lang, t, shot) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face{font-family:SG;src:url(/fonts/space-grotesk/files/space-grotesk-latin-700-normal.woff2)format("woff2");font-weight:700}
@font-face{font-family:KA;src:url(/fonts/karla/files/karla-latin-700-normal.woff2)format("woff2");font-weight:700}
*{margin:0;box-sizing:border-box}
body{width:1280px;height:720px;overflow:hidden;background:radial-gradient(900px 600px at 80% 10%,#2F5DE0 0%,#172A46 55%,#0E1A2E 100%);color:#fff;font-family:KA}
.t{position:absolute;left:70px;top:150px;font:700 104px/1 SG;letter-spacing:-3px}
.t span{color:#FFDE59;display:block}
.l{position:absolute;left:74px;top:470px;font:700 40px SG}.l i{font-style:normal;color:#FFDE59}
.s{position:absolute;left:74px;top:530px;font:700 30px KA;color:#C9D6EA}
.p{position:absolute;right:120px;top:40px;width:340px;height:740px;border-radius:44px;background:#05080F;padding:10px;transform:rotate(6deg);box-shadow:0 30px 70px rgba(0,0,0,.6)}
.p img{width:100%;height:100%;border-radius:36px;object-fit:cover;object-position:top}
.c{position:absolute;right:430px;top:120px;font-size:80px;transform:rotate(-12deg)}
</style></head><body>
<div class="t">${t.thumb[0]}<span>${t.thumb[1]}</span></div>
<div class="l">GradeGoal<i>.</i></div><div class="s">${t.tagline}</div>
<div class="p"><img src="${shot}"></div>
<div class="c">🎉</div>
</body></html>`;

/* ---------- Webserver: App (dist/), Schriften, Buehne ---------- */
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
const pages = {};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (pages[p]) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(pages[p]); return; }
  let file;
  if (p.startsWith("/fonts/")) file = path.join(FONTS, p.slice(7));
  else if (p.startsWith("/shots/")) file = path.join(ROOT, "store-bilder", p.slice(7));
  else file = path.join(DIST, p.replace(/^\/+/, "") || "index.html");
  const okRoot = [DIST, FONTS, path.join(ROOT, "store-bilder")].some((r) => file.startsWith(r));
  if (!okRoot || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

/* ---------- Hilfen fuer die Bedienung im Telefon ---------- */
const TAP_CSS = `.gg-tap{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;z-index:2001;pointer-events:none;
  background:rgba(47,93,224,.28);border:2px solid rgba(47,93,224,.75);animation:ggtap .55s ease-out forwards}
  @keyframes ggtap{from{transform:scale(.4);opacity:1}to{transform:scale(1.25);opacity:0}}`;

async function tap(app, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) {
    /* boundingBox liefert Seitenkoordinaten; im Rahmen in Rahmenkoordinaten umrechnen */
    await app.evaluate(([x, y]) => {
      const r = window.frameElement.getBoundingClientRect();
      const d = document.createElement("div");
      d.className = "gg-tap"; d.style.left = (x - r.left) + "px"; d.style.top = (y - r.top) + "px";
      document.body.appendChild(d); setTimeout(() => d.remove(), 700);
    }, [box.x + box.width / 2, box.y + box.height / 2]);
  }
  await app.waitForTimeout(160);
  await locator.click();
}
async function smoothScroll(app, y, ms = 900) {
  await app.evaluate(([to, dur]) => new Promise((done) => {
    const from = window.scrollY, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      window.scrollTo(0, from + (to - from) * e);
      k < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  }), [y, ms]);
}
async function scrollToEl(app, locator, offset = 90, ms = 900) {
  const y = await locator.evaluate((el, off) => el.getBoundingClientRect().top + window.scrollY - off, offset);
  await smoothScroll(app, Math.max(0, y), ms);
}
async function slide(app, from, to, ms = 1600) {
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const v = Math.round((from + (to - from) * (i / steps)) * 10) / 10;
    await app.evaluate((val) => {
      const r = document.querySelector("input[type=range]");
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      set.call(r, String(val));
      r.dispatchEvent(new Event("input", { bubbles: true }));
    }, v);
    await app.waitForTimeout(ms / steps);
  }
}

/* Zeitmarken der Einblendungen – daraus entsteht die englische
   Untertiteldatei zum deutschen Video, immer passend zum Schnitt. */
let MARKS = [];
const srtTime = (x) => {
  const ms = Math.max(0, Math.round(x * 1000));
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
function writeSrt(rec, file) {
  const t0 = rec.frames[0].t, end = rec.t1 - t0, en = T.en, out = [];
  const add = (a, b, text) => out.push(`${out.length + 1}\n${srtTime(a)} --> ${srtTime(b)}\n${text}\n`);
  const intro = MARKS.find((m) => m.fn === "introEnd");
  add(0.3, (intro ? intro.t - t0 : 2.4), "GradeGoal – " + en.tagline);
  const caps = MARKS.filter((m) => m.fn === "caption");
  const stop = MARKS.find((m) => m.fn === "set");
  caps.forEach((m, i) => {
    const a = m.t - t0 + 0.42;
    const b = (i + 1 < caps.length ? caps[i + 1].t : (stop ? stop.t : rec.t1)) - t0 - 0.05;
    const sc = en.scenes[m.a[0] - 1];
    add(a, b, sc[0] + " " + sc[1] + "\n" + sc[2]);
  });
  const pills = MARKS.find((m) => m.fn === "pills");
  if (pills) add(pills.t - t0 + 0.5, end - 0.2, "GradeGoal – " + en.tagline + "\n" + en.outro.join(" · "));
  fs.writeFileSync(file, out.join("\n"));
  console.log(`✓ ${path.relative(ROOT, file)}  ${out.length} Untertitel`);
}

/* ---------- Ablauf (rund 40 Sekunden) ---------- */
async function scenes(page, app, t) {
  const S = async (fn, ...a) => {
    if (fn === "caption" || (fn === "set" && a[0] === "cap") || (fn === "pills")) MARKS.push({ fn, a, t: Date.now() / 1000 });
    if (fn === "set" && a[0] === "intro" && a[1] === "off") MARKS.push({ fn: "introEnd", t: Date.now() / 1000 });
    return page.evaluate(([f, args]) => window.stage[f](...args), [fn, a]);
  };
  const wait = (ms) => page.waitForTimeout(ms);
  const u = t.ui;

  /* Vorspann */
  await S("text", "itag", t.tagline);
  await wait(2200);
  await S("set", "intro", "off", true);
  await S("set", "intro", "up", true);
  await wait(300);
  await S("set", "phone", "down", false);
  await S("set", "logo", "off", false);
  await wait(700);

  /* 1 Zeugnis */
  await S("caption", 1, ...t.scenes[0]);
  await wait(1800);
  await smoothScroll(app, 300, 1400);
  await wait(900);

  /* 2 Konfetti */
  await S("caption", 2, ...t.scenes[1]);
  const g = app.getByRole("textbox", { name: `${u.physics} – ${u.grade}`, exact: true });
  await scrollToEl(app, g, 360, 700);
  await wait(500);
  await tap(app, g);
  await g.fill("");
  await wait(250);
  await page.keyboard.type("2", { delay: 120 });
  await app.evaluate(() => document.activeElement && document.activeElement.blur());
  await wait(2600);

  /* 3 Was waere wenn */
  await S("caption", 3, ...t.scenes[2]);
  await smoothScroll(app, 0, 500);
  const subj = app.getByRole("button", { name: u.subject, exact: true }).first();
  await scrollToEl(app, subj, 300, 500);
  await tap(app, subj);
  await wait(600);
  await scrollToEl(app, app.getByRole("heading", { name: u.whatIf }), 70, 1000);
  await wait(400);
  await slide(app, 3.5, 1.3, 2200);
  await wait(1400);

  /* 4 Abitur */
  await S("caption", 4, ...t.scenes[3]);
  await tap(app, app.getByText("← " + u.back).first());
  await wait(300);
  await smoothScroll(app, 0, 400);
  await tap(app, app.locator(".tile").filter({ hasText: u.abi }));
  await wait(900);
  await smoothScroll(app, await app.evaluate(() => document.body.scrollHeight - window.innerHeight), 2600);
  await wait(1400);

  /* 5 Notenschluessel */
  await S("caption", 5, ...t.scenes[4]);
  await tap(app, app.getByText("← " + u.back).first());
  await wait(300);
  await tap(app, app.locator(".tile").filter({ hasText: u.key }));
  await wait(500);
  const nums = app.locator("input[inputmode=decimal]");
  await tap(app, nums.nth(0));
  await page.keyboard.type("34", { delay: 150 });
  await tap(app, nums.nth(1));
  await page.keyboard.type("50", { delay: 150 });
  await app.evaluate(() => document.activeElement && document.activeElement.blur());
  await wait(2400);

  /* Abspann */
  await S("set", "cap", "hide", true);
  await S("set", "phone", "left", true);
  await S("set", "logo", "off", true);
  await S("text", "otag", t.tagline);
  await S("pills", t.outro);
  await wait(500);
  await S("set", "outro", "off", false);
  await S("set", "outro", "up", false);
  await wait(6000);
}

/* ---------- Aufnahme (Screencast von Chromium) ---------- */
async function record(page, dir, run) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const file = path.join(dir, String(frames.length).padStart(5, "0") + ".jpg");
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    /* Eingangszeit statt metadata.timestamp: Dieselbe Uhr wie das Ende der
       Aufnahme, sonst wird der stehende Abspann verschluckt. */
    frames.push({ file, t: Date.now() / 1000 });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) {}
  });
  /* JPEG in hoher Qualitaet: bei 1920 × 1080 deutlich fluessiger als PNG */
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 95, everyNthFrame: 1 });
  await run();
  const t1 = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  return { frames, t1 };
}

function encode({ frames, t1 }, dir, out) {
  if (frames.length < 20) throw new Error("zu wenige Einzelbilder aufgenommen");
  /* Bis zum tatsaechlichen Ende – der Abspann steht still und liefert
     keine neuen Einzelbilder, soll aber voll zu sehen sein. */
  const t1x = t1;
  const list = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : t1x;
    list.push(`file '${f.file.replace(/\\/g, "/")}'`, `duration ${Math.max(1 / 60, next - f.t).toFixed(4)}`);
  });
  list.push(`file '${frames[frames.length - 1].file.replace(/\\/g, "/")}'`);
  fs.writeFileSync(path.join(dir, "list.txt"), list.join("\n"));
  const duration = t1x - frames[0].t;
  const wav = path.join(dir, "music.wav");
  execFileSync("python3", [path.join(ROOT, "tools", "make_music.py"), duration.toFixed(2), wav], { stdio: "ignore" });
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-i", wav,
    "-vf", "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p",
    "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "18",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-shortest", "-movflags", "+faststart", out,
  ]);
  return duration;
}

function check(file) {
  const j = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]).toString());
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  const dur = Number(j.format.duration);
  const ok = v.width === 1920 && v.height === 1080 && a && a.channels === 2 && dur > 20 && dur < 90;
  console.log(`${ok ? "✓" : "✗"} ${path.relative(ROOT, file)}  ${v.width}×${v.height}  ${dur.toFixed(1)} s  ${(fs.statSync(file).size / 1e6).toFixed(1)} MB`);
  return ok;
}

/* ---------- Los ---------- */
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let ok = true;
for (const lang of ["de", "en"]) {
  const t = T[lang];
  pages["/stage.html"] = STAGE(lang);
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: lang === "de" ? "de-DE" : "en-US" });
  const st = { ...demoState(lang, Date.now(), { single: true }), theme: "light" };
  st.features = { ...st.features, groups: false };
  await ctx.addInitScript(([s]) => {
    try {
      if (!sessionStorage.getItem("gg-yt")) {
        localStorage.clear();
        localStorage.setItem("gradegoal:data", s);
        localStorage.setItem("gradegoal:unlocked", "1");
        // Hilfetexte als gelesen markieren: ruhigere Bilder
        localStorage.setItem("gradegoal:hints", JSON.stringify(["groups","home-subjects","key-calc","key-manage","presets","subj-weight","tendency","what-if"]));
        localStorage.setItem("gradegoal:meta", JSON.stringify({ firstUse: Date.now(), lastBackup: Date.now(), demoOff: true }));
        sessionStorage.setItem("gg-yt", "1");
      }
    } catch (e) {}
  }, [JSON.stringify(st)]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { ok = false; console.error("Fehler:", e.message); });
  await page.goto(BASE + "/stage.html");
  await page.evaluate(() => document.fonts.ready);
  const app = await (await page.$("#app")).contentFrame();
  await app.waitForSelector(".wrap");
  await app.evaluate(() => document.fonts && document.fonts.ready);
  await app.evaluate((css) => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }, TAP_CSS);
  await page.waitForTimeout(500);

  const dir = path.join(TMP, lang);
  MARKS = [];
  const rec = await record(page, dir, () => scenes(page, app, t));
  if (lang === "de") writeSrt(rec, path.join(OUT, "gradegoal-de.en.srt"));
  const out = path.join(OUT, `gradegoal-${lang}.mp4`);
  encode(rec, dir, out);
  ok = check(out) && ok;
  await ctx.close();

  /* Vorschaubild */
  const shot = `/shots/iphone-6.3-${lang}/1-zeugnis.png`;
  pages["/thumb.html"] = THUMB(lang, t, shot);
  const tctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const tp = await tctx.newPage();
  await tp.goto(BASE + "/thumb.html");
  await tp.evaluate(() => document.fonts.ready);
  await tp.waitForTimeout(300);
  await tp.screenshot({ path: path.join(OUT, `vorschau-${lang}.png`) });
  await tctx.close();
  console.log(`✓ ${path.relative(ROOT, path.join(OUT, `vorschau-${lang}.png`))}  1280×720`);
}
await browser.close();
server.close();
fs.rmSync(TMP, { recursive: true, force: true });
if (!ok) process.exit(1);
console.log("\nFertig: store-bilder/youtube/");
