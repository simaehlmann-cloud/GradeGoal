/* Sicherungserinnerung und Bewertungsbitte: wann, wann nicht. */
import "./setup.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { backupDue, BACKUP_DAYS, BACKUP_EDITS, getMeta, markBackup, countEdit, snoozeBackup } from "../src/lib/meta.js";
import { reviewDue, countGrades, REVIEW_MIN_DAYS, REVIEW_MIN_GRADES } from "../src/lib/review.js";

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 20);

test("Sicherung: erst nach Tagen UND Aenderungen", () => {
  const m = { firstUse: NOW - (BACKUP_DAYS + 1) * DAY, lastBackup: 0, edits: BACKUP_EDITS, snoozeUntil: 0 };
  assert.equal(backupDue(m, true, NOW), true);
  assert.equal(backupDue(m, false, NOW), false, "ohne Daten nie");
  assert.equal(backupDue({ ...m, edits: BACKUP_EDITS - 1 }, true, NOW), false);
  assert.equal(backupDue({ ...m, firstUse: NOW - DAY }, true, NOW), false);
  assert.equal(backupDue({ ...m, lastBackup: NOW - 2 * DAY }, true, NOW), false);
  assert.equal(backupDue({ ...m, snoozeUntil: NOW + DAY }, true, NOW), false);
});

test("Sicherung setzt Zaehler zurueck, Spaeter verschiebt", () => {
  localStorage.clear();
  for (let i = 0; i < 20; i++) countEdit();
  assert.equal(getMeta().edits, 20);
  markBackup(NOW);
  const m = getMeta(NOW);
  assert.equal(m.edits, 0);
  assert.equal(m.lastBackup, NOW);
  snoozeBackup(NOW);
  assert.ok(getMeta(NOW).snoozeUntil > NOW);
});

test("Bewertung: nur nach Nutzung, einmal je Version", () => {
  const meta = { firstUse: NOW - REVIEW_MIN_DAYS * DAY, reviewVer: "" };
  assert.equal(reviewDue(meta, REVIEW_MIN_GRADES, "1.9.0", NOW), true);
  assert.equal(reviewDue(meta, REVIEW_MIN_GRADES - 1, "1.9.0", NOW), false);
  assert.equal(reviewDue({ ...meta, firstUse: NOW - DAY }, 50, "1.9.0", NOW), false);
  assert.equal(reviewDue({ ...meta, reviewVer: "1.9.0" }, 50, "1.9.0", NOW), false);
  assert.equal(reviewDue({ ...meta, reviewVer: "1.8.0" }, 50, "1.9.0", NOW), true);
});

test("Notenzaehlung: Zeugnis- und Einzelnoten, leere nicht", () => {
  const st = { datasets: [{ subjects: [
    { grade: "2", cats: [{ grades: [{ v: "1" }, { v: "" }, "3"] }] },
    { grade: "", cats: [] },
  ] }] };
  assert.equal(countGrades(st), 3);
});
