/* =========================================================
   filesave.js – Dateien herausgeben

   Im Browser genuegt ein Verweis mit download-Attribut. In der App
   nicht: iOS und Android ignorieren das Attribut bzw. blob:-Adressen.
   Ein Export waere dort wirkungslos – ohne Fehlermeldung.

   Deshalb in der App: Datei in den Zwischenspeicher schreiben und an
   das Teilen-Menue des Systems uebergeben. Von dort landet sie in
   „Dateien“, Drive, Mail oder wo der Nutzer sie haben moechte.

   Die Zusatzmodule werden erst bei Bedarf geladen. Scheitert das,
   faellt die Funktion auf den Browser-Weg zurueck.
========================================================= */

import { isNative } from "./platform.js";
import { downloadBlob } from "./exporters.js";
import { logError, logWarn } from "./logger.js";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("FileReader"));
    r.onload = () => {
      const s = String(r.result);
      const i = s.indexOf(",");
      i >= 0 ? resolve(s.slice(i + 1)) : reject(new Error("Datenformat"));
    };
    r.readAsDataURL(blob);
  });
}

/* Fachnamen sind frei waehlbar und koennen Pfadtrenner enthalten. */
const safeName = (n) => String(n || "datei").replace(/[\\/:*?"<>|]/g, "-").slice(0, 80);

/* Gibt true zurueck, wenn die Datei herausgegeben wurde (oder der
   Nutzer das Teilen-Menue bewusst geschlossen hat). */
export async function saveFile(blob, filename, opts) {
  const name = safeName(filename);
  if (!isNative()) return downloadBlob(blob, name);

  try {
    const [fs, sh] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const data = await blobToBase64(blob);
    const written = await fs.Filesystem.writeFile({
      path: name,
      data,
      directory: fs.Directory.Cache, /* Zwischenspeicher: das System raeumt selbst auf */
    });
    const title = (opts && opts.title) || name;
    await sh.Share.share({ title, files: [written.uri], dialogTitle: title });
    return true;
  } catch (e) {
    /* Schliessen des Teilen-Menues ist kein Fehler. */
    const msg = String((e && e.message) || e || "");
    if (/cancel|abort|dismiss/i.test(msg)) {
      logWarn("Teilen abgebrochen", e);
      return true;
    }
    logError("Teilen fehlgeschlagen", e);
    return false;
  }
}

export const saveText = (text, filename, mime, opts) =>
  saveFile(new Blob([text], { type: mime || "text/plain;charset=utf-8" }), filename, opts);

/* In die Zwischenablage legen – der Weg, der ohne Dateisystem immer geht. */
export async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    logWarn("Zwischenablage nicht verfuegbar", e);
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    logError("Kopieren fehlgeschlagen", e);
    return false;
  }
}
