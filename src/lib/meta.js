/* =========================================================
   meta.js – Merker rund um die Nutzung, getrennt von den Noten.

   Bewusst NICHT im Notenzustand und damit nicht in der
   Sicherungsdatei: Wer eine Sicherung auf ein neues Geraet spielt,
   soll dort nicht sofort als „lange nicht gesichert“ gelten und auch
   keine Bewertungsbitte erben.

   Geht der Speicher verloren (iOS darf ihn leeren), passiert nichts
   Schlimmes: Die Zaehlung beginnt einfach neu.
========================================================= */

const KEY = "gradegoal:meta";
const DAY = 86400000;

/* Sicherungserinnerung: nach so vielen Tagen ohne Sicherung UND so
   vielen gespeicherten Aenderungen. Beides zusammen, damit jemand,
   der die App nur ansieht, nicht ermahnt wird. Wie FairMix/PitchPro. */
export const BACKUP_DAYS = 30;
export const BACKUP_EDITS = 15;
export const SNOOZE_DAYS = 14;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const o = raw ? JSON.parse(raw) : null;
    return o && typeof o === "object" ? o : {};
  } catch (e) {
    return {};
  }
}
function write(o) {
  try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* nur Komfort */ }
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);

export function getMeta(now = Date.now()) {
  const m = read();
  let firstUse = num(m.firstUse);
  if (!firstUse || firstUse > now) { firstUse = now; write({ ...m, firstUse }); }
  return {
    firstUse,
    lastBackup: num(m.lastBackup),
    edits: num(m.edits),
    snoozeUntil: num(m.snoozeUntil),
    reviewVer: typeof m.reviewVer === "string" ? m.reviewVer : "",
    demoOff: m.demoOff === true,
  };
}

function patch(p) { write({ ...read(), ...p }); }

/* Jede tatsaechlich gespeicherte Aenderung */
export function countEdit() {
  const m = read();
  patch({ edits: Math.min(num(m.edits) + 1, 100000) });
}

export function markBackup(now = Date.now()) {
  patch({ lastBackup: now, edits: 0, snoozeUntil: 0 });
}

export function snoozeBackup(now = Date.now()) {
  patch({ snoozeUntil: now + SNOOZE_DAYS * DAY });
}

export function hideDemoOffer() {
  patch({ demoOff: true });
}

export function markReviewAsked(ver) {
  patch({ reviewVer: String(ver) });
}

export const daysSince = (t, now = Date.now()) => (t ? Math.floor((now - t) / DAY) : null);

/* Reine Entscheidung, damit sie sich testen laesst.
   hasData: gibt es ueberhaupt etwas, das sich zu sichern lohnt? */
export function backupDue(meta, hasData, now = Date.now()) {
  if (!hasData) return false;
  if (meta.snoozeUntil && now < meta.snoozeUntil) return false;
  if (meta.edits < BACKUP_EDITS) return false;
  const since = meta.lastBackup || meta.firstUse;
  return now - since >= BACKUP_DAYS * DAY;
}
