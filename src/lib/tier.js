/* =========================================================
   tier.js – Lite oder Pro.

   Die Ausbaustufe wird beim Bauen festgelegt, nicht zur Laufzeit:
     npm run build       -> Lite
     npm run build:pro   -> Pro (laedt .env.pro)

   Ausfallsicherheit: ohne gesetztes Flag ist ein Produktions-Build
   IMMER Lite. Ein vergessenes Flag verschenkt damit nie die
   Pro-Funktionen, sondern faellt nur auf den kleineren Umfang zurueck.
   Im Entwicklungsmodus (npm run dev) ist Pro aktiv, damit man beim
   Bauen nicht staendig umschalten muss.
========================================================= */

function safeEnv() {
  try {
    return import.meta.env || {};
  } catch (e) {
    return {};
  }
}

const env = safeEnv();

function resolveTier() {
  /* Nur fuer manuelles Testen in der Browser-Konsole: window.__GG_TIER = "lite" */
  try {
    if (typeof window !== "undefined" && (window.__GG_TIER === "lite" || window.__GG_TIER === "pro")) {
      return window.__GG_TIER;
    }
  } catch (e) {}
  if (env.VITE_TIER === "pro") return "pro";
  if (env.VITE_TIER === "lite") return "lite";
  return env.DEV ? "pro" : "lite";
}

export const TIER = resolveTier();
export const isPro = TIER === "pro";

/* Adresse der Pro-Version im Store.

   Vor der Veroeffentlichung eintragen. Solange sie leer ist, zeigt die
   App nur Hinweistexte und keinerlei Verweis – ein toter Link ist im
   Store ein Ablehnungsgrund.

   Sobald hier etwas steht, werden automatisch anklickbar:
     - die grossen Pro-Karten (ProGate)
     - die kleinen "Pro"-Abzeichen an gesperrten Eintraegen (ProBadge)
     - die Werbekarte auf der Startseite und im Info-Bildschirm (ProLink)

   Fuer Google Play:
     https://play.google.com/store/apps/details?id=de.maehlmann.gradegoal.pro
   Fuer den App Store spaeter die dortige Adresse eintragen – oder je
   Plattform unterscheiden, wenn beide Fassungen erscheinen. */
export const PRO_URL = "";

/* Welche Funktionen zur Pro-Version gehoeren. Zentral an EINER Stelle,
   damit sich der Zuschnitt spaeter ohne Suche im UI-Code aendern laesst. */
export const PRO_FEATURES = [
  "terms",      /* mehrere Halbjahre, Profile und Schuljahre */
  "charts",     /* Notenverlauf, Sparklines, Langzeitverlauf */
  "groups",     /* ausgewaehlte Durchschnitte inkl. Vorlagen */
  "subjWeight", /* Fachgewichtung */
  "whatIf",     /* Was-waere-wenn-Regler */
  "abi",        /* Abitur-Rechner (Block I / II) */
  "key",        /* Notenschluessel-Rechner */
  "lock",       /* PIN-Sperre */
  "csv",        /* CSV-Export */
  "customScale" /* eigene Notenskala */
];

export const hasPro = (feature) => isPro || !PRO_FEATURES.includes(feature);
