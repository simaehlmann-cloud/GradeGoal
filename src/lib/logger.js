/* =========================================================
   logger.js – schlanke, rein lokale Fehlerueberwachung.

   Wichtig: es wird NICHTS an einen Server gesendet. Das Protokoll
   liegt nur im Arbeitsspeicher (Ringpuffer) und laesst sich in den
   Einstellungen anzeigen bzw. kopieren. Damit bleibt die Zusage im
   Impressum ("keine Daten verlassen das Geraet") unangetastet.
========================================================= */

const MAX_ENTRIES = 60;
const entries = [];
let listeners = [];

function shorten(detail) {
  if (detail == null) return "";
  try {
    if (detail instanceof Error) return (detail.stack || detail.message || "").slice(0, 800);
    if (typeof detail === "string") return detail.slice(0, 800);
    return JSON.stringify(detail).slice(0, 800);
  } catch (e) {
    return String(detail).slice(0, 800);
  }
}

export function logEvent(level, message, detail) {
  const entry = {
    t: new Date().toISOString(),
    level,
    message: String(message).slice(0, 300),
    detail: shorten(detail),
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  try {
    (console[level] || console.log).call(console, "[GradeGoal]", entry.message, detail ?? "");
  } catch (e) {
    /* Konsole kann in manchen WebViews fehlen – nie den Ablauf stoppen */
  }
  listeners.forEach((fn) => {
    try {
      fn(entry);
    } catch (e) {}
  });
  return entry;
}

export const logInfo = (m, d) => logEvent("info", m, d);
export const logWarn = (m, d) => logEvent("warn", m, d);
export const logError = (m, d) => logEvent("error", m, d);

export const getLog = () => entries.slice();
export const clearLog = () => {
  entries.length = 0;
};

export function formatLog() {
  if (!entries.length) return "–";
  return entries
    .map((e) => `${e.t} [${e.level}] ${e.message}${e.detail ? "\n    " + e.detail : ""}`)
    .join("\n");
}

export function onLog(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}

/* Faengt ab, was React nicht sieht: Fehler in Event-Handlern, in
   setTimeout-Callbacks und abgelehnte Promises (z. B. window.storage). */
export function installGlobalHandlers() {
  if (typeof window === "undefined" || window.__ggLogInstalled) return;
  window.__ggLogInstalled = true;
  window.addEventListener("error", (ev) => {
    logError("Unbehandelter Fehler: " + (ev.message || "unbekannt"), ev.error || ev.filename);
  });
  window.addEventListener("unhandledrejection", (ev) => {
    logError("Unbehandeltes Promise", ev.reason);
  });
}
