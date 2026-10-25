/* =========================================================
   platform.js – Wo laeuft die App, und wie oeffnet man Verweise?

   In der App (iOS-WKWebView, Android-WebView) funktionieren einige
   Browser-Selbstverstaendlichkeiten nicht oder nur stumm:
     - target="_blank" wird ignoriert, ein Verweis tut dann gar nichts
     - window.print() existiert nicht bzw. bewirkt nichts
     - Downloads ueber das download-Attribut kommen nicht an
   Dieses Modul kapselt die Unterscheidung an EINER Stelle.
========================================================= */

import { Capacitor } from "@capacitor/core";
import { logWarn } from "./logger.js";

export function isNative() {
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
}

/* "ios" | "android" | "web" */
export function platform() {
  try {
    return Capacitor.getPlatform();
  } catch (e) {
    return "web";
  }
}

/* Externe Adresse oeffnen. In der App ueber den System-Browser
   (iOS: Safari-Ansicht innerhalb der App), im Browser als neuer Tab. */
export async function openExternal(url) {
  if (!url) return;
  if (isNative()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
      return;
    } catch (e) {
      logWarn("Browser-Modul nicht verfuegbar, weiche aus", e);
    }
    try { window.location.href = url; } catch (e) {}
    return;
  }
  try {
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (e) {
    window.location.href = url;
  }
}

/* Eigenschaften fuer einen <a>-Verweis nach aussen.
   Im Browser ein normaler Verweis, in der App faengt onClick ihn ab. */
export function extLinkProps(url) {
  return {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: (e) => {
      if (!isNative()) return;
      e.preventDefault();
      openExternal(url);
    },
  };
}
