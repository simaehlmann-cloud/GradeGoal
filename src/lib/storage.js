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
      const v = localStorage.getItem(key);
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
      return true;
    } catch (e) {
      logError("Zuruecksetzen fehlgeschlagen", e);
      return false;
    }
  },
};
