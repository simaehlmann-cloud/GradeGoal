/* Rechenlogik: Notenwerte, Schnitt, Zielrechner, Schluessel, Abitur.
   Aufruf: npm test (laeuft auch in den Workflows vor jedem Build). */
import "./setup.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import * as G from "../src/lib/grades.js";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);
const SC = { type: "grades", min: 1, max: 6, bestLow: true };

test("parseNum: Komma, Punkt, Tendenzen, Unsinn", () => {
  assert.equal(G.parseNum("2,5"), 2.5);
  assert.equal(G.parseNum("2.5"), 2.5);
  assert.equal(G.parseNum("2+"), 1.7);
  assert.equal(G.parseNum("3-"), 3.3);
  assert.equal(G.parseNum("3−"), 3.3);
  assert.equal(G.parseNum(""), null);
  assert.equal(G.parseNum("1.2.3"), null);
  assert.equal(G.parseNum("3abc"), null);
});

test("Kategorien gewichtet, leere Kategorien zaehlen nicht", () => {
  const s = { cats: [
    { id: "a", weight: 50, grades: [{ v: "2", d: 1 }, { v: "4", d: 2 }] },
    { id: "b", weight: 50, grades: [{ v: "1", d: 3 }] },
    { id: "c", weight: 30, grades: [] },
  ] };
  close(G.weightedCalc(s), 2);
});

test("Fachgewichtung: 0 zaehlt nicht, fehlend = 1", () => {
  const subs = [{ grade: "1", weight: 2 }, { grade: "4" }, { grade: "6", weight: 0 }];
  close(G.subjectsMean(subs, "grade"), (1 * 2 + 4) / 3);
});

test("Zielrechner: Ergebnis erreicht genau den Wunsch", () => {
  const cat = { id: "k", weight: 50, grades: [{ v: "3", d: 1 }] };
  const subj = { cats: [cat, { id: "m", weight: 50, grades: [{ v: "2", d: 1 }] }] };
  const r = G.neededGrade(subj, cat, 2, SC);
  assert.equal(r.type, "ok");
  const after = { cats: [{ ...cat, grades: [...cat.grades, { v: String(r.g), d: 2 }] }, subj.cats[1]] };
  assert.ok(G.weightedCalc(after) <= 2 + 1e-9, "Wunsch erreicht");
});

test("Zielrechner: unmoeglich und schon sicher", () => {
  const cat = { id: "k", weight: 50, grades: [{ v: "6" }, { v: "6" }, { v: "6" }] };
  const subj = { cats: [cat] };
  assert.equal(G.neededGrade(subj, cat, 1, SC).type, "impossible");
  const good = { id: "g", weight: 50, grades: [{ v: "1" }, { v: "1" }] };
  assert.equal(G.neededGrade({ cats: [good] }, good, 3, SC).type, "safe");
});

test("Linearer Schluessel: Raender und Mitte", () => {
  close(G.linearGrade(100, SC), 1);
  close(G.linearGrade(0, SC), 6);
  close(G.linearGrade(50, SC), 3.5);
});

test("Standardschluessel: 87,5 % ist eine 1", () => {
  const key = G.standardKeyFor(SC);
  assert.ok(key, "Standardschluessel vorhanden");
  assert.equal(Number(G.keyGrade(key, 87.5, SC)), 1);
  assert.equal(Number(G.keyGrade(key, 87.4, SC)), 2);
});

test("Abitur: amtliche Tabelle 300–900 Punkte", () => {
  for (let E = 300; E <= 900; E++) {
    /* N = 17/3 − E/180, auf eine Nachkommastelle abgeschnitten,
       in ganzen Zahlen gerechnet (frei von Rundungsfehlern) */
    const exp = Math.min(4, Math.max(1, Math.floor((1020 - E) / 18) / 10));
    close(G.abiGradeFromPoints(E), exp);
  }
  assert.equal(G.abiGradeFromPoints(822), 1.1);
  assert.equal(G.abiGradeFromPoints(823), 1.0);
  assert.equal(G.abiGradeFromPoints(299), null);
});

test("Abitur: Block I und II mit Bedingungen", () => {
  const res = Array.from({ length: 40 }, () => ({ p: "10" }));
  const b1 = G.abiBlockI(res);
  assert.equal(b1.points, 400);
  assert.equal(b1.ok, true);
  const b1bad = G.abiBlockI([...res.slice(0, 31), ...Array.from({ length: 9 }, () => ({ p: "3" }))]);
  assert.equal(b1bad.ok, false, "mehr als 20 % unter 5 Punkten");
  const b2 = G.abiBlockII(["10", "10", "10", "4", "4"]);
  assert.equal(b2.points, 152);
  assert.equal(b2.ok, true);
  assert.equal(G.abiBlockII(["10", "10", "4", "4", "4"]).ok, false, "nur 2 Pruefungen ab 5 Punkten");
});

test("Trend: steigend bei besser werdenden Noten (1–6)", () => {
  const pts = [{ v: 4 }, { v: 3 }, { v: 2 }, { v: 2 }];
  assert.equal(G.trendOf(pts, SC), "up");
});
