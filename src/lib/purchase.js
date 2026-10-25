/* =========================================================
   purchase.js – Gratis-Rahmen und In-App-Kauf

   Ersetzt die fruehere Aufteilung in Lite- und Pro-Ausgabe. Es gibt
   nur noch EINE App mit allen Funktionen. Gratis ist ein Schuljahr
   (bis zu zwei Halbjahre bzw. Profile). Ein einmaliger Kauf hebt die
   Grenze auf.

   Grundsaetze:
   - Daten werden NIE gesperrt. Wer ohne Kauf eine Sicherung mit
     mehreren Schuljahren importiert, sieht und bearbeitet alles; nur
     NEUE Schuljahre bzw. Halbjahre ueber den Rahmen hinaus brauchen
     den Kauf. (Lehre aus 1.7.0: nichts darf in eine Sackgasse fuehren.)
   - Der Kaufstatus liegt NICHT in der Sicherungsdatei, sondern
     getrennt. Sonst liesse sich der Kauf per Sicherung weitergeben.
   - Der Store ist die Quelle der Wahrheit. Der lokale Merker sorgt nur
     dafuer, dass die App auch offline sofort richtig startet.
   - Im Browser (GitHub Pages) gibt es keinen Kauf: dort gilt der
     Gratis-Rahmen, beim Entwickeln (npm run dev) ist alles frei.
========================================================= */

import { useSyncExternalStore } from "react";
import { isNative, platform } from "./platform.js";
import { logError, logInfo, logWarn } from "./logger.js";

/* Produkt-ID – muss in App Store Connect UND (spaeter) in der Play
   Console genau so angelegt werden. Erlaubt sind dort Kleinbuchstaben,
   Ziffern, Punkt und Unterstrich; diese ID passt fuer beide Stores. */
export const PRODUCT_ID = "gradegoal_unlimited";

/* Gratis-Rahmen. Hier an EINER Stelle aenderbar. */
export const FREE_YEARS = 1;
export const FREE_TERMS = 2;

const CACHE_KEY = "gradegoal:unlocked";

function env() {
  try { return import.meta.env || {}; } catch (e) { return {}; }
}

function readCache() {
  try { return localStorage.getItem(CACHE_KEY) === "1"; } catch (e) { return false; }
}
function writeCache(on) {
  try {
    if (on) localStorage.setItem(CACHE_KEY, "1");
    else localStorage.removeItem(CACHE_KEY);
  } catch (e) {}
}

/* Nur fuers Testen in der Browser-Konsole:
   window.__GG_UNLOCK = true / false, danach neu laden. */
function override() {
  try {
    if (typeof window !== "undefined" && typeof window.__GG_UNLOCK === "boolean") return window.__GG_UNLOCK;
  } catch (e) {}
  return null;
}

/* ---------- kleiner Zustandsspeicher fuer React ---------- */
let snap = {
  unlocked: override() ?? (env().DEV ? true : readCache()),
  canBuy: false,     /* Store erreichbar und Produkt gefunden */
  price: "",         /* lokalisierter Preis aus dem Store, z. B. "0,99 €" */
  busy: false,
  native: isNative(),
};
const subs = new Set();
function set(p) {
  snap = { ...snap, ...p };
  subs.forEach((f) => { try { f(); } catch (e) {} });
}

export function usePurchase() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => snap,
    () => snap
  );
}

export const isUnlocked = () => snap.unlocked;

function grant(source) {
  if (!snap.unlocked) logInfo("Vollversion freigeschaltet (" + source + ")");
  writeCache(true);
  set({ unlocked: true });
}

/* ---------- Gratis-Rahmen ---------- */
export const yearsAllowed = (state, unlocked) =>
  unlocked || (state.years || []).length < FREE_YEARS;
export const termsAllowed = (state, unlocked) =>
  unlocked || (state.datasets || []).length < FREE_TERMS;

/* ---------- Store-Anbindung ---------- */
let plugin = null;
async function getPlugin() {
  if (plugin) return plugin;
  const mod = await import("@capgo/native-purchases");
  plugin = { NP: mod.NativePurchases, TYPE: mod.PURCHASE_TYPE };
  return plugin;
}

const isOwned = (tx) => {
  if (!tx || tx.productIdentifier !== PRODUCT_ID) return false;
  /* Android liefert einen Zustand ("1" = bezahlt, "0" = ausstehend),
     iOS nur bestaetigte Transaktionen. */
  if (platform() === "android") return String(tx.purchaseState) === "1";
  return true;
};

async function refreshOwnership() {
  const { NP, TYPE } = await getPlugin();
  const opts = platform() === "ios"
    ? { onlyCurrentEntitlements: true } /* nur aktuelle Apple-ID, ohne Erstattungen */
    : { productType: TYPE.INAPP };
  const { purchases } = await NP.getPurchases(opts);
  const owned = (purchases || []).some(isOwned);
  if (owned) grant("Store");
  return owned;
}

let started = false;
export async function initPurchases() {
  if (started || !isNative() || override() !== null) return;
  started = true;
  try {
    const { NP, TYPE } = await getPlugin();
    const { isBillingSupported } = await NP.isBillingSupported();
    if (!isBillingSupported) { logWarn("Käufe auf diesem Gerät nicht möglich"); return; }

    /* Spaetere Bestaetigungen, z. B. „Kaufen fragen“ bei Familienfreigabe */
    NP.addListener("transactionUpdated", (tx) => { if (isOwned(tx)) grant("Aktualisierung"); });

    const { products } = await NP.getProducts({ productIdentifiers: [PRODUCT_ID], productType: TYPE.INAPP });
    const p = (products || []).find((x) => x.identifier === PRODUCT_ID) || (products || [])[0];
    if (p) set({ canBuy: true, price: p.priceString || "" });
    else logWarn("Produkt " + PRODUCT_ID + " im Store nicht gefunden");

    await refreshOwnership();
  } catch (e) {
    logError("Store konnte nicht abgefragt werden", e);
  }
}

const cancelled = (e) => /cancel|abgebrochen|user ?cancel|USER_CANCELED/i.test(String((e && (e.code || e.message)) || e || ""));

/* Ergebnis: "ok" | "pending" | "cancel" | "error" */
export async function buyUnlock() {
  if (!isNative()) return "error";
  set({ busy: true });
  try {
    const { NP, TYPE } = await getPlugin();
    const tx = await NP.purchaseProduct({ productIdentifier: PRODUCT_ID, productType: TYPE.INAPP, quantity: 1 });
    if (platform() === "android" && String(tx && tx.purchaseState) === "0") return "pending";
    grant("Kauf");
    return "ok";
  } catch (e) {
    if (cancelled(e)) return "cancel";
    const msg = String((e && (e.code || e.message)) || e || "");
    /* iOS „Kaufen fragen“ (Familienfreigabe): die Bestaetigung kommt
       spaeter ueber transactionUpdated. */
    if (/pending/i.test(msg)) return "pending";
    /* Android meldet einen bereits vorhandenen Kauf als Fehler
       (ITEM_ALREADY_OWNED) – dann einfach den Bestand abfragen. */
    try { if (await refreshOwnership()) return "ok"; } catch (e2) {}
    logError("Kauf fehlgeschlagen", e);
    return "error";
  } finally {
    set({ busy: false });
  }
}

/* Ergebnis: "ok" | "none" | "error" */
export async function restoreUnlock() {
  if (!isNative()) return "error";
  set({ busy: true });
  try {
    const { NP } = await getPlugin();
    await NP.restorePurchases();
    return (await refreshOwnership()) ? "ok" : "none";
  } catch (e) {
    logError("Wiederherstellen fehlgeschlagen", e);
    return "error";
  } finally {
    set({ busy: false });
  }
}
