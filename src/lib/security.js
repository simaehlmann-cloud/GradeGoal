/* =========================================================
   security.js – PIN-Sichtschutz.

   WICHTIG, und in der App auch so formuliert: das ist ein Sichtschutz
   gegen neugierige Blicke, KEINE Verschluesselung. Die Noten liegen
   weiterhin im Klartext im localStorage. Wer Zugriff auf das entsperrte
   Geraet und die Entwicklerwerkzeuge hat, kommt an die Daten – daran
   aendert eine vierstellige PIN grundsaetzlich nichts.

   Gespeichert wird nur ein gesalzener Hash. Die Iterationen verteuern
   das Durchprobieren merklich, mehr aber auch nicht: 10.000 moegliche
   PINs bleiben 10.000 moegliche PINs.
========================================================= */

import { logWarn } from "./logger.js";

const ITERATIONS = 2000;
const PEPPER = "gradegoal-pin-v1";

const toHex = (bytes) => Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

export function randomSalt() {
  try {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return toHex(a);
  } catch (e) {
    logWarn("crypto.getRandomValues nicht verfügbar, nutze schwächeren Zufall", e);
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

/* Ersatzverfahren, wenn crypto.subtle fehlt.
   Das ist beim Oeffnen einer dist/index.html per Doppelklick der Fall:
   file:// ist kein "secure context", dort gibt es die Web-Crypto-API nicht.
   Deutlich schwaecher – deshalb bekommt der Hash ein eigenes Praefix,
   damit spaeter erkennbar ist, womit er erzeugt wurde. */
function fallbackHash(text) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let round = 0; round < 64; round++) {
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i) + round;
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = Math.imul(h2 + c + i, 0x85ebca6b) >>> 0;
      h2 = ((h2 << 13) | (h2 >>> 19)) >>> 0;
    }
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

export async function hashPin(pin, salt) {
  const data = salt + "|" + PEPPER + "|" + String(pin);
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      let buf = new TextEncoder().encode(data);
      for (let i = 0; i < ITERATIONS; i++) {
        buf = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
      }
      return "s1:" + toHex(buf);
    }
  } catch (e) {
    logWarn("Web Crypto nicht nutzbar, weiche auf Ersatzverfahren aus", e);
  }
  return "f1:" + fallbackHash(data);
}

export async function verifyPin(pin, lock) {
  if (!lock || !lock.hash || !lock.salt) return false;
  const h = await hashPin(pin, lock.salt);
  /* Laufzeitkonstanter Vergleich – hier kaum relevant, aber es kostet nichts */
  if (h.length !== lock.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ lock.hash.charCodeAt(i);
  return diff === 0;
}

export async function makeLock(pin) {
  const salt = randomSalt();
  return { on: true, salt, hash: await hashPin(pin, salt) };
}

export const PIN_MIN = 4;
export const PIN_MAX = 8;
export const isValidPin = (p) => /^\d+$/.test(String(p)) && String(p).length >= PIN_MIN && String(p).length <= PIN_MAX;
