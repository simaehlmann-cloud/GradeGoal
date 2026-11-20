/* =========================================================
   demo.js – Beispielzeugnis

   Zwei Zwecke (wie die Beispielklasse in FairMix):
   1. Neue Nutzer sehen die App gefuellt, ohne zu tippen.
   2. Das Screenshot-Skript (tools/store-bilder.mjs) erzeugt damit die
      Store-Bilder – es wird nichts nachgebaut.

   Die Daten sind frei erfunden. Datumsangaben liegen relativ zu heute,
   damit Diagramme nie „veraltet“ aussehen.
========================================================= */

import { uid } from "./grades.js";
import { freshAbi, freshYear, schoolYearLabel, SCHEMA_VERSION } from "./state.js";

const DAY = 86400000;

/* [de, en, Zeugnisnote, Wunsch, Gewicht,
    Klassenarbeiten, Muendlich, Tests, Referate]
   Einzelnoten als Liste, aelteste zuerst. */
const SUBJECTS = [
  ["Deutsch", "German", "2", "2", 1, ["3", "2-", "2"], ["2", "2+"], ["3"], []],
  ["Mathematik", "Mathematics", "3", "2", 1, ["4", "3", "2-"], ["3", "2"], ["3+", "2"], []],
  ["Englisch", "English", "2", "2", 1, ["2", "2+"], ["1-", "2"], ["2"], ["1"]],
  ["Biologie", "Biology", "2", "2", 1, ["2"], ["2", "1-"], ["2-"], ["2"]],
  ["Chemie", "Chemistry", "3", "3", 1, ["3", "3-"], ["3"], ["4", "3"], []],
  ["Physik", "Physics", "3", "2", 1, ["3-", "3"], ["2-"], ["3"], []],
  ["Geschichte", "History", "2", "2", 1, ["2"], ["2", "2"], [], ["1-"]],
  ["Erdkunde", "Geography", "1", "1", 1, ["1-"], ["1"], [], ["1"]],
  ["Politik", "Politics", "2", "2", 1, [], ["2", "2+"], ["2"], []],
  ["Sport", "PE", "1", "1", 0.5, [], ["1", "1"], [], []],
  ["Kunst", "Art", "2", "1", 0.5, [], ["2", "1-"], [], ["2"]],
  ["Musik", "Music", "2", "2", 0.5, [], ["2"], ["2-"], []],
];

const CATS = [
  [{ de: "Klassenarbeiten", en: "Class tests" }, 50],
  [{ de: "Mündliche Mitarbeit", en: "Oral participation" }, 30],
  [{ de: "Tests", en: "Quizzes" }, 10],
  [{ de: "Referate", en: "Presentations" }, 10],
];

/* Noten ueber die letzten ~4 Monate verteilen: zuerst die jeweils
   erste Note jeder Kategorie, dann die zweite usw. So ergibt sich je
   Fach eine glaubwuerdige zeitliche Reihenfolge. */
function stamped(list, ci, now) {
  return list.map((v, i) => ({ v, d: now - (120 - i * 35 - ci * 7) * DAY }));
}

export function demoSubjects(now = Date.now()) {
  return SUBJECTS.map(([de, en, grade, wish, weight, ...cats]) => ({
    id: uid(),
    name: { de, en },
    grade,
    wish,
    weight,
    keyId: "",
    cats: CATS.map(([name, w], ci) => ({
      id: uid(),
      name: { ...name },
      weight: w,
      grades: stamped(cats[ci] || [], ci, now),
    })),
    goals: "",
    notes: "",
  }));
}

/* Ersetzt den Inhalt eines Halbjahres durch das Beispiel. Bezeichnung,
   Schuljahr und ID bleiben, damit nichts anderes verrutscht. */
export function demoDataset(base, now = Date.now(), lang = "de") {
  const subjects = demoSubjects(now);
  const ids = (names) => subjects.filter((s) => names.includes(s.name.de)).map((s) => s.id);
  return {
    ...base,
    scale: { type: "grades", min: 1, max: 6, bestLow: true },
    subjects,
    groups: [
      { id: uid(), name: lang === "en" ? "Core subjects (G/M/E)" : "Kernfächer (D/M/E)", subjectIds: ids(["Deutsch", "Mathematik", "Englisch"]), target: lang === "en" ? "2.5" : "2,5" },
    ],
    abi: freshAbi(),
    keys: [],
    defaultKeyId: "",
    demo: true,
    /* Vorheriger Stand zum Wiederherstellen (siehe state.js) */
    demoPrev: base && Array.isArray(base.subjects) && !base.demo ? { ...base } : undefined,
  };
}

/* Vollstaendiger Zustand fuer die Store-Bilder: zwei Halbjahre, damit
   Langzeitverlauf und Vergleich etwas zeigen. */
export function demoState(lang = "de", now = Date.now(), opts = {}) {
  const y = freshYear(schoolYearLabel(new Date(now)));
  const t1 = demoDataset({ id: uid(), label: lang === "de" ? "1. Halbjahr" : "1st term", yearId: y.id }, now - 160 * DAY, lang);
  /* Das erste Halbjahr etwas schwaecher, damit der Verlauf steigt */
  t1.subjects = t1.subjects.map((s, i) => ({ ...s, grade: String(Math.min(6, Number(s.grade) + (i % 3 === 0 ? 1 : 0))) }));
  const t2 = demoDataset({ id: uid(), label: lang === "de" ? "2. Halbjahr" : "2nd term", yearId: y.id }, now, lang);
  /* Abitur-Rechner gefuellt, damit das Store-Bild etwas zeigt */
  const subjAbi = lang === "de"
    ? ["Mathe", "Deutsch", "Englisch", "Bio", "Geschichte", "Physik", "Kunst", "Politik"]
    : ["Maths", "German", "English", "Biology", "History", "Physics", "Art", "Politics"];
  const pts = [13, 11, 12, 10, 9, 11, 12, 10];
  const results = [];
  for (let sem = 1; sem <= 4; sem++) {
    subjAbi.forEach((n, i) => results.push({
      id: uid(), label: n + " Q" + sem, p: String(Math.min(15, pts[i] + (sem > 2 ? 1 : 0))), double: i < 2,
    }));
  }
  t2.abi = { results, exams: ["13", "12", "11", "10", "12"] };

  return {
    v: SCHEMA_VERSION,
    lang,
    theme: "light",
    screen: "home",
    selSubject: null,
    aboutFrom: null,
    name: "Mia",
    school: "",
    features: { simple: false, wish: true, cats: true, groups: !opts.single, charts: true },
    years: [y],
    activeId: t2.id,
    /* single: nur ein Halbjahr – die Startseite zeigt dann ohne
       Langzeitverlauf gleich die Faecherliste (erstes Store-Bild) */
    datasets: (opts.single ? [t2] : [t1, t2]).map(({ demoPrev, ...d }) => ({ ...d, demo: false })),
    lock: null,
  };
}
