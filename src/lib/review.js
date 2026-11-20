/* =========================================================
   review.js – Bitte um eine Bewertung

   Grundsaetze (Apple-Richtlinien und gesunder Menschenverstand):
   - Nur das native Bewertungsfenster des Systems. KEIN eigenes
     Vorfenster („Gefaellt dir die App?“) – Apple sieht das nicht gern,
     und es fuehlt sich nach Bettelei an.
   - Nur in einem guten Moment: nach einer erreichten Wunschnote oder
     direkt nach dem Eintragen einer Note.
   - Erst nach etwas Nutzung (Tage UND Noten), hoechstens einmal je
     Version. iOS begrenzt zusaetzlich selbst auf 3-mal im Jahr und
     entscheidet, ob das Fenster ueberhaupt erscheint.
   - Im Browser nie.
========================================================= */

import { isNative, platform } from "./platform.js";
import { getMeta, markReviewAsked } from "./meta.js";
import { logInfo, logWarn } from "./logger.js";
import { parseNum, gv } from "./grades.js";

export const REVIEW_MIN_DAYS = 7;
export const REVIEW_MIN_GRADES = 10;

/* Apple-ID der App aus App Store Connect (nur die Ziffern, z. B.
   "6740123456"). Steht in der Adresse des Store-Eintrags:
   https://apps.apple.com/app/id6740123456
   Leer lassen, solange die App nicht im App Store ist – dann bleibt der
   Knopf „App bewerten“ auf iOS ausgeblendet. */
export const APPSTORE_ID = "";

/* Wie viele Noten stecken im Zustand? Zeugnisnoten und Einzelnoten. */
export function countGrades(state) {
  let n = 0;
  for (const d of (state && state.datasets) || []) {
    for (const s of d.subjects || []) {
      if (parseNum(s.grade) != null) n++;
      for (const c of s.cats || []) n += (c.grades || []).filter((g) => parseNum(gv(g)) != null).length;
    }
  }
  return n;
}

/* Reine Entscheidung, damit sie sich testen laesst. */
export function reviewDue(meta, gradeCount, ver, now = Date.now()) {
  if (meta.reviewVer === ver) return false;
  if (gradeCount < REVIEW_MIN_GRADES) return false;
  return now - meta.firstUse >= REVIEW_MIN_DAYS * 86400000;
}

let asking = false;
export async function maybeAskReview(state, ver) {
  if (!isNative() || asking) return;
  if (state && state.datasets && state.datasets.some((d) => d.demo)) return; /* nicht im Beispiel */
  const meta = getMeta();
  if (!reviewDue(meta, countGrades(state), ver)) return;
  asking = true;
  /* Vorher merken: scheitert der Aufruf, wird trotzdem nicht bei jeder
     weiteren Note erneut gefragt. */
  markReviewAsked(ver);
  try {
    /* Kurz warten, damit Konfetti bzw. Eingabe abgeschlossen sind. */
    await new Promise((r) => setTimeout(r, 1200));
    const { AppReview } = await import("@capawesome/capacitor-app-review");
    await AppReview.requestReview();
    logInfo("Bewertung angefragt (" + ver + ")");
  } catch (e) {
    logWarn("Bewertungsfenster nicht verfügbar", e);
  } finally {
    asking = false;
  }
}

/* Dauerhafter Knopf „App bewerten“: auf Android immer, auf iOS nur mit
   bekannter App-ID, im Browser nie. */
export const canOpenStore = () =>
  isNative() && (platform() === "android" || (platform() === "ios" && !!APPSTORE_ID));

export async function openStorePage() {
  try {
    const { AppReview } = await import("@capawesome/capacitor-app-review");
    await AppReview.openAppStore(platform() === "ios" ? { appId: APPSTORE_ID } : {});
    return true;
  } catch (e) {
    logWarn("Store-Seite nicht geöffnet", e);
    return false;
  }
}
