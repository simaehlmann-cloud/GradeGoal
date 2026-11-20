/* Farbsystem: Lesbarkeit (WCAG AA) und Zuordnung der Notenstufen. */
import "./setup.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { GRADE_TONES, SUBJECT_COLORS, contrast, toneIndex, withColors, nextSubjectColor, subjectColor } from "../src/lib/colors.js";
import { toneFor, colorFor } from "../src/lib/grades.js";
import { migrateState, freshState } from "../src/lib/state.js";

const CARD = { light: "#FFFFFF", dark: "#19233A" };

test("Notenfarben: Schrift auf Grund und auf Karte mindestens 4,5:1", () => {
  for (const mode of ["light", "dark"]) {
    for (const t of GRADE_TONES[mode]) {
      assert.ok(contrast(t.fg, t.bg) >= 4.5, `${mode} ${t.fg} auf ${t.bg}`);
      assert.ok(contrast(t.fg, CARD[mode]) >= 4.5, `${mode} ${t.fg} auf Karte`);
    }
  }
});

test("Fachfarben: als Schrift lesbar (hell und dunkel)", () => {
  for (const [l, d] of SUBJECT_COLORS) {
    assert.ok(contrast(l, CARD.light) >= 4.5, l);
    assert.ok(contrast(d, CARD.dark) >= 4.5, d);
  }
});

test("Notenstufen: 1 sehr gut, 6 sehr schwach; Punkte umgekehrt", () => {
  const g = { type: "grades", min: 1, max: 6, bestLow: true };
  const p = { type: "points", min: 0, max: 15, bestLow: false };
  assert.equal(toneFor(1, g, false), GRADE_TONES.light[4]);
  assert.equal(toneFor(6, g, false), GRADE_TONES.light[0]);
  assert.equal(toneFor(15, p, true), GRADE_TONES.dark[4]);
  assert.equal(toneFor(0, p, true), GRADE_TONES.dark[0]);
  assert.equal(toneFor(null, g, false), null);
  assert.equal(colorFor(null, g), "var(--faint)");
  assert.equal(toneIndex(NaN), -1);
});

test("Fachfarben: vergeben, erhalten, nach Migration vorhanden", () => {
  const list = withColors([{ id: "a" }, { id: "b", color: 0 }, { id: "c" }]);
  assert.equal(list[1].color, 0, "vorhandene Farbe bleibt");
  assert.notEqual(list[0].color, list[2].color);
  assert.equal(nextSubjectColor([{ color: 0 }, { color: 1 }]), 2);
  const st = freshState();
  const raw = JSON.parse(JSON.stringify(st));
  raw.datasets[0].subjects.forEach((s) => delete s.color);
  const m = migrateState(raw);
  assert.ok(m.datasets[0].subjects.every((s) => Number.isInteger(s.color)));
  assert.equal(migrateState({ datasets: [{ subjects: [{ name: "X", color: 99 }] }] }).datasets[0].subjects[0].color, 0);
  assert.equal(subjectColor({ color: 3 }, true), SUBJECT_COLORS[3][1]);
});
