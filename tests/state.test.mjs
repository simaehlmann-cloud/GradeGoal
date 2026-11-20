/* Datenschema, Migration, Halbjahr uebernehmen, Beispielzeugnis. */
import "./setup.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { freshState, migrateState, datasetFrom, schoolYearLabel } from "../src/lib/state.js";
import { demoDataset, demoState } from "../src/lib/demo.js";

test("Frischer Zustand uebersteht die Migration unveraendert in der Struktur", () => {
  const s = freshState();
  const m = migrateState(JSON.parse(JSON.stringify(s)));
  assert.ok(m);
  assert.equal(m.datasets.length, 1);
  assert.equal(m.datasets[0].subjects.length, s.datasets[0].subjects.length);
});

test("Kaputte Daten: null statt Absturz", () => {
  assert.equal(migrateState(null), null);
  assert.equal(migrateState({ datasets: [] }), null);
  assert.equal(migrateState("x"), null);
  const m = migrateState({ datasets: [{ subjects: [{ name: "Mathe", cats: "kaputt" }] }] });
  assert.ok(m && Array.isArray(m.datasets[0].subjects[0].cats));
});

test("Schuljahr-Bezeichnung wechselt im August", () => {
  assert.equal(schoolYearLabel(new Date(2026, 6, 31)), "2025/26");
  assert.equal(schoolYearLabel(new Date(2026, 7, 1)), "2026/27");
  assert.equal(schoolYearLabel(new Date(2099, 11, 1)), "2099/00");
});

test("Neues Halbjahr uebernimmt Struktur, aber keine Noten", () => {
  const src = {
    id: "d1", label: "1. HJ", yearId: "y",
    scale: { type: "points", min: 0, max: 15, bestLow: false },
    subjects: [{ id: "s1", name: "Mathe", grade: "12", wish: "14", weight: 2, keyId: "k1",
      cats: [{ id: "c1", name: "Klausur", weight: 60, grades: [{ v: "12", d: 1 }] }], goals: "x", notes: "y" }],
    groups: [{ id: "g1", name: "Kern", subjectIds: ["s1"], target: "10" }],
    abi: { results: [{ id: "r", p: "12" }], exams: ["", "", "", "", ""] },
    keys: [{ id: "k1", name: "Oberstufe", type: "steps", steps: [{ g: "15", min: 95 }] }],
    defaultKeyId: "k1",
  };
  const d = datasetFrom(src, "2. HJ", "y");
  assert.notEqual(d.id, src.id);
  assert.equal(d.scale.type, "points");
  assert.equal(d.subjects.length, 1);
  const s = d.subjects[0];
  assert.equal(s.name, "Mathe");
  assert.equal(s.grade, ""); assert.equal(s.wish, ""); assert.equal(s.goals, "");
  assert.equal(s.weight, 2);
  assert.equal(s.cats[0].weight, 60);
  assert.deepEqual(s.cats[0].grades, []);
  assert.equal(d.keys.length, 1);
  assert.equal(s.keyId, d.keys[0].id, "Schluesselverweis umgeschrieben");
  assert.equal(d.defaultKeyId, d.keys[0].id);
  assert.deepEqual(d.groups[0].subjectIds, [s.id], "Gruppenverweis umgeschrieben");
  assert.deepEqual(d.abi.results, []);
  /* Quelle unveraendert */
  assert.equal(src.subjects[0].cats[0].grades.length, 1);
  /* Ergebnis besteht die Validierung */
  const m = migrateState({ datasets: [d] });
  assert.equal(m.datasets[0].subjects[0].keyId, d.keys[0].id);
});

test("Beispielzeugnis: gekennzeichnet, vorheriger Stand bleibt erhalten", () => {
  const st = freshState();
  const before = st.datasets[0];
  const demo = demoDataset(before, Date.now(), "de");
  assert.equal(demo.demo, true);
  assert.equal(demo.id, before.id);
  assert.ok(demo.subjects.some((s) => s.grade));
  const m = migrateState({ ...st, datasets: [demo] });
  assert.equal(m.datasets[0].demo, true);
  assert.equal(m.datasets[0].demoPrev.subjects.length, before.subjects.length);
  assert.equal(m.datasets[0].demoPrev.demo, undefined);
});

test("Beispielzustand fuer die Store-Bilder ist gueltig", () => {
  for (const lang of ["de", "en"]) {
    const m = migrateState(demoState(lang));
    assert.ok(m);
    assert.equal(m.datasets.length, 2);
    assert.equal(m.screen, "home");
    assert.ok(m.datasets.every((d) => !d.demo));
  }
});
