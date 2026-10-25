/* =========================================================
   storage.js – ausschliesslich Ein-/Ausgabe.

   Reihenfolge: window.storage (Claude-Artefakt) -> localStorage -> nur Sitzung.
   Neu gegenueber v1.3.1:
   - set() meldet zurueck, OB gespeichert wurde. Vorher wurden Fehler
     stillschweigend verschluckt: im privaten Safari-Modus oder bei vollem
     Speicher hat die App munter weitergearbeitet und beim naechsten Start
     war alles weg.
   - raw() liest den Rohtext, damit sich Daten auch dann retten lassen,
     wenn sie nicht mehr geparst werden koennen.
========================================================= */

import { logWarn, logError } from "./logger.js";
import { isNative } from "./platform.js";

/* ---------- Zweitablage in der App ----------
   iOS darf den Speicher einer WebView bei Platzmangel leeren. Fuer eine
   Noten-App waere das ein Totalverlust. In der App wird deshalb jeder
   Stand zusaetzlich ueber @capacitor/preferences (iOS: UserDefaults,
   Android: SharedPreferences) abgelegt und beim Start herangezogen,
   falls localStorage leer ist. */
/* ACHTUNG: Ein Capacitor-Plugin darf NIE direkt aus einer async-Funktion
   zurueckgegeben werden. Das Plugin-Objekt beantwortet jede Eigenschaft –
   auch "then" – als nativen Aufruf; await haelt es deshalb fuer ein
   Promise und wartet ewig ("Preferences.then() is not implemented").
   Darum steckt es hier in einem Huellobjekt. */
async function prefs() {
  if (!isNative()) return null;
  try {
    const mod = await import("@capacitor/preferences");
    return { P: mod.Preferences };
  } catch (e) {
    logWarn("Preferences nicht verfuegbar", e);
    return null;
  }
}

export const STORAGE_KEY = "gradegoal:data";

const hasLocal = () => {
  try {
    return typeof localStorage !== "undefined";
  } catch (e) {
    return false; /* Zugriff kann in gesperrten WebViews selbst werfen */
  }
};

export const store = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(key);
        return r && r.value ? JSON.parse(r.value) : null;
      }
    } catch (e) {
      logWarn("window.storage.get fehlgeschlagen", e);
    }
    try {
      if (!hasLocal()) return null;
      let v = localStorage.getItem(key);
      if (!v) {
        const w = await prefs();
        const P = w && w.P;
        if (P) {
          /* Zeitlimit: haengt das Zusatzmodul, startet die App trotzdem. */
          const r = await Promise.race([
            P.get({ key }),
            new Promise((res) => setTimeout(() => res(null), 2000)),
          ]);
          if (r && r.value) {
            v = r.value;
            logWarn("Daten aus der Zweitablage wiederhergestellt");
          }
        }
      }
      return v ? JSON.parse(v) : null;
    } catch (e) {
      logError("Gespeicherte Daten konnten nicht gelesen werden", e);
      return null;
    }
  },

  /* -> { ok:true } | { ok:false, reason:"serialize"|"quota"|"unavailable" } */
  async set(key, value) {
    let json;
    try {
      json = JSON.stringify(value);
    } catch (e) {
      logError("Daten konnten nicht serialisiert werden", e);
      return { ok: false, reason: "serialize" };
    }
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, json);
        return { ok: true };
      }
    } catch (e) {
      logWarn("window.storage.set fehlgeschlagen, weiche auf localStorage aus", e);
    }
    try {
      if (!hasLocal()) return { ok: false, reason: "unavailable" };
      localStorage.setItem(key, json);
      const w = await prefs();
      if (w && w.P) {
        const P = w.P;
        try { await P.set({ key, value: json }); } catch (e) { logWarn("Zweitablage nicht geschrieben", e); }
      }
      return { ok: true };
    } catch (e) {
      const quota =
        e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22);
      logError("Speichern fehlgeschlagen" + (quota ? " (Speicher voll)" : ""), e);
      return { ok: false, reason: quota ? "quota" : "unavailable" };
    }
  },

  raw(key) {
    try {
      if (!hasLocal()) return null;
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },

  remove(key) {
    try {
      if (typeof window !== "undefined" && window.storage && window.storage.delete) {
        window.storage.delete(key);
      }
    } catch (e) {}
    try {
      if (hasLocal()) localStorage.removeItem(key);
      prefs().then((w) => w && w.P.remove({ key })).catch(() => {});
      return true;
    } catch (e) {
      logError("Zuruecksetzen fehlgeschlagen", e);
      return false;
    }
  },
};
