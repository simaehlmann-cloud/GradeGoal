/* =========================================================
   Store-Screenshots automatisch erzeugen (wie store-bilder.js in FairMix)

   Steuert die gebaute App (dist/) in einem Browser ueber ihre eigenen
   Bildschirme – mit dem Beispielzeugnis aus src/lib/demo.js. Es wird
   nichts nachgebaut oder nachbearbeitet.

   Einmalig:
     npm install --no-save playwright
     npx playwright install chromium

   Danach:
     npm run store-bilder

   Ergebnis in store-bilder/ (steht in .gitignore):
     iphone-6.3-de/ -en/     1206 × 2622  (App Store, iPhone 6,3" – Pflicht)
     iphone-6.9-de/ -en/     1320 × 2868  (App Store, iPhone 6,9" – optional)
     ipad-de/   ipad-en/     2064 × 2752  (App Store, iPad 13")
     android-de/ android-en/ 1080 × 2160  (Google Play, Telefon)
   Jedes Bild wird gegen sein Sollmass geprueft.
========================================================= */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* demo.js braucht localStorage nicht, aber uid() nutzt crypto – in Node vorhanden */
import { demoState } from "../src/lib/demo.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const OUT = path.join(ROOT, "store-bilder");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (e) {
  console.error("Playwright fehlt. Einmalig: npm install --no-save playwright && npx playwright install chromium");
  process.exit(1);
}
if (!fs.existsSync(path.join(DIST, "index.html"))) {
  console.error("dist/index.html fehlt – zuerst npm run build.");
  process.exit(1);
}

/* Breite × Hoehe in CSS-Pixeln und Skalierung -> exakte Store-Masse */
/* Apple verlangt seit 2026 mindestens das „mittlere Display mit Dynamic
   Island“ (6,3″, 1206 × 2622). Das große (6,9″) ist zusaetzlich erlaubt. */
const DEVICES = {
  "iphone-6.3": { viewport: { width: 402, height: 874 }, scale: 3, want: [1206, 2622] },
  "iphone-6.9": { viewport: { width: 440, height: 956 }, scale: 3, want: [1320, 2868] },
  ipad: { viewport: { width: 1032, height: 1376 }, scale: 2, want: [2064, 2752] },
  android: { viewport: { width: 360, height: 720 }, scale: 3, want: [1080, 2160] },
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

/* PNG-Masse aus dem Dateikopf lesen (ohne Zusatzbibliothek) */
function pngSize(file) {
  const b = fs.readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

const L = {
  de: { subject: "Englisch", whatIf: "Was wäre wenn?", abi: "Abitur", key: "Notenschlüssel", back: "Zurück" },
  en: { subject: "English", whatIf: "What if?", abi: "Abitur", key: "Grade key", back: "Back" },
};

const browser = await chromium.launch();
let failed = 0;

async function shoot(page, dir, n, name, want) {
  await page.waitForTimeout(350);
  const file = path.join(dir, `${n}-${name}.png`);
  await page.screenshot({ path: file });
  const [w, h] = pngSize(file);
  const ok = w === want[0] && h === want[1];
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${path.relative(ROOT, file)}  ${w}×${h}${ok ? "" : `  (Soll ${want[0]}×${want[1]})`}`);
}

async function open(dev, lang, theme, opts) {
  const ctx = await browser.newContext({ viewport: dev.viewport, deviceScaleFactor: dev.scale, locale: lang === "de" ? "de-DE" : "en-US" });
  const st = { ...demoState(lang, Date.now(), opts), theme };
  await ctx.addInitScript(([s]) => {
    try {
      if (!sessionStorage.getItem("gg-shot")) {
        localStorage.clear();
        localStorage.setItem("gradegoal:data", s);
        localStorage.setItem("gradegoal:unlocked", "1");
        // Hilfetexte als gelesen markieren: ruhigere Bilder
        localStorage.setItem("gradegoal:hints", JSON.stringify(["groups","home-subjects","key-calc","key-manage","presets","subj-weight","tendency","what-if"]));
        /* Angebote und Erinnerungen haben auf Store-Bildern nichts verloren */
        localStorage.setItem("gradegoal:meta", JSON.stringify({ firstUse: Date.now(), lastBackup: Date.now(), demoOff: true }));
        sessionStorage.setItem("gg-shot", "1");
      }
    } catch (e) {}
  }, [JSON.stringify(st)]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { failed++; console.error("Fehler in der App:", e.message); });
  await page.goto(BASE);
  await page.waitForSelector(".wrap");
  /* Schriften vollstaendig geladen, sonst springt das Layout */
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return { ctx, page };
}

for (const [devName, dev] of Object.entries(DEVICES)) {
  for (const lang of ["de", "en"]) {
    const dir = path.join(OUT, `${devName}-${lang}`);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const t = L[lang];

    /* Erstes Bild: Zeugnis mit Faecherliste (ein Halbjahr, damit die
       Liste ohne Scrollen sichtbar ist) */
    const first = await open(dev, lang, "light", { single: true });
    await shoot(first.page, dir, 1, "zeugnis", dev.want);
    await first.ctx.close();

    const { ctx, page } = await open(dev, lang, "light");

    await page.getByRole("button", { name: t.subject, exact: true }).first().click();
    await shoot(page, dir, 2, "fach", dev.want);

    await page.getByRole("heading", { name: t.whatIf }).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -16));
    await shoot(page, dir, 3, "was-waere-wenn", dev.want);

    await page.getByText("← " + t.back).first().click();
    await page.locator(".tile").filter({ hasText: t.abi }).click();
    await shoot(page, dir, 4, "abitur", dev.want);

    await page.getByText("← " + t.back).first().click();
    await page.locator(".tile").filter({ hasText: t.key }).click();
    const nums = page.locator("input[inputmode=decimal]");
    if (await nums.count() >= 2) { await nums.nth(0).fill("34"); await nums.nth(1).fill("50"); }
    await shoot(page, dir, 5, "notenschluessel", dev.want);
    await ctx.close();

    const dark = await open(dev, lang, "dark");
    await shoot(dark.page, dir, 6, "dunkel", dev.want);
    await dark.ctx.close();
  }
}

await browser.close();
server.close();
if (failed) { console.error(`\n${failed} Bild(er) fehlerhaft.`); process.exit(1); }
console.log("\nAlle Bilder in store-bilder/ – Masse geprüft.");
