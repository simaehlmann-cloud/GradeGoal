/* =========================================================
   state.js – Standarddaten, Schema-Version und Migration.

   Der wichtigste Teil ist migrateState(): jeder Zustand, der aus
   localStorage oder aus einer importierten Datei kommt, laeuft hier
   durch und wird auf ein garantiert vollstaendiges Schema gebracht.

   Grund: in v1.3.1 wurde nur "if (saved && saved.datasets)" geprueft.
   Eine Sicherung mit datasets:[] oder ein Fach ohne cats-Array fuehrte
   beim naechsten Render zu einer Ausnahme – und weil der kaputte Stand
   bereits gespeichert war, blieb die App dauerhaft weiss.
========================================================= */

import { uid } from "./grades.js";
import { logWarn } from "./logger.js";

export const SCHEMA_VERSION = 3;
export const LANGS = ["de", "en"];
export const THEMES = ["system", "light", "dark"];

/* Fuenf Pruefungsfaecher im Abitur (KMK-Standard) */
export const ABI_EXAM_COUNT = 5;
export const freshAbi = () => ({ results: [], exams: Array(ABI_EXAM_COUNT).fill("") });

export const defaultCats = () => [
  { id: uid(), name: { de: "Klassenarbeiten", en: "Class tests" }, weight: 50, grades: [] },
  { id: uid(), name: { de: "Mündliche Mitarbeit", en: "Oral participation" }, weight: 30, grades: [] },
  { id: uid(), name: { de: "Tests", en: "Quizzes" }, weight: 10, grades: [] },
  { id: uid(), name: { de: "Referate", en: "Presentations" }, weight: 10, grades: [] },
];

export const DEFAULT_SUBJECTS = [
  ["Deutsch", "German"],
  ["Mathematik", "Maths"],
  ["Englisch", "English"],
  ["Biologie", "Biology"],
  ["Chemie", "Chemistry"],
  ["Physik", "Physics"],
  ["Informatik", "Computer science"],
  ["Geschichte", "History"],
  ["Erdkunde", "Geography"],
  ["Politik", "Politics"],
  ["Religion / Werte und Normen", "Religion / Ethics"],
  ["Sport", "PE"],
  ["Kunst", "Art"],
  ["Musik", "Music"],
  ["Französisch", "French"],
];

export const freshSubjects = () =>
  DEFAULT_SUBJECTS.map(([de, en]) => ({
    id: uid(),
    name: { de, en },
    grade: "",
    wish: "",
    weight: 1, /* Fachgewichtung; 0 = zaehlt nicht im Gesamtschnitt */
    cats: defaultCats(),
    goals: "",
    notes: "",
  }));

export const freshDataset = (label, yearId) => ({
  id: uid(),
  label,
  yearId: yearId || "",
  scale: { type: "grades", min: 1, max: 6, bestLow: true },
  subjects: freshSubjects(),
  groups: [],
  abi: freshAbi(),
});

export const freshYear = (label) => ({ id: uid(), label });

export const freshState = () => {
  const y = freshYear("Schuljahr / School year");
  const d = freshDataset("1. Halbjahr / 1st term", y.id);
  return {
    v: SCHEMA_VERSION,
    lang: "de",
    theme: "system",
    screen: "start",
    selSubject: null,
    aboutFrom: null,
    name: "",
    school: "",
    features: { simple: true, wish: true, cats: true, groups: true, charts: true },
    years: [y],
    activeId: d.id,
    datasets: [d],
    lock: null, /* {on, salt, hash} – siehe security.js */
  };
};

/* ---------- Bausteine der Validierung ---------- */
const isObj = (v) => v != null && typeof v === "object" && !Array.isArray(v);
const str = (v, fallback = "") => (typeof v === "string" ? v : v == null ? fallback : String(v));
const idOf = (v) => (typeof v === "string" && v ? v : uid());

function safeName(n, fallback) {
  if (typeof n === "string" && n.trim()) return n;
  if (isObj(n)) {
    const de = str(n.de || n.en || fallback);
    const en = str(n.en || n.de || fallback);
    return { de, en };
  }
  return fallback;
}

function safeGrade(g) {
  if (isObj(g)) {
    const v = str(g.v);
    if (!v.trim()) return null;
    return { v, d: Number(g.d) || 0 };
  }
  const v = str(g);
  return v.trim() ? { v, d: 0 } : null;
}

function safeCat(c) {
  if (!isObj(c)) return null;
  const w = Number(c.weight);
  return {
    id: idOf(c.id),
    name: safeName(c.name, "Kategorie"),
    weight: Number.isFinite(w) && w >= 0 ? Math.min(w, 999) : 0,
    grades: Array.isArray(c.grades) ? c.grades.map(safeGrade).filter(Boolean) : [],
  };
}

function safeSubject(s) {
  if (!isObj(s)) return null;
  const w = Number(s.weight);
  return {
    id: idOf(s.id),
    name: safeName(s.name, "Fach"),
    grade: str(s.grade),
    wish: str(s.wish),
    /* Fehlendes Gewicht bedeutet "normal" (1), nicht "zaehlt nicht" (0) –
       sonst haetten alle Altdaten nach dem Update einen leeren Schnitt. */
    weight: Number.isFinite(w) && w >= 0 ? Math.min(w, 99) : 1,
    cats: Array.isArray(s.cats) ? s.cats.map(safeCat).filter(Boolean) : defaultCats(),
    goals: str(s.goals),
    notes: str(s.notes),
  };
}

function safeAbi(a) {
  const src = isObj(a) ? a : {};
  const results = Array.isArray(src.results)
    ? src.results.filter(isObj).slice(0, 60).map((r) => ({
        id: idOf(r.id),
        label: str(r.label).slice(0, 40),
        p: str(r.p),
        double: !!r.double,
      }))
    : [];
  const rawExams = Array.isArray(src.exams) ? src.exams : [];
  const exams = Array.from({ length: ABI_EXAM_COUNT }, (_, i) => str(rawExams[i]));
  return { results, exams };
}

function safeGroup(g, subjectIds) {
  if (!isObj(g)) return null;
  const ids = Array.isArray(g.subjectIds) ? g.subjectIds.filter((i) => subjectIds.has(i)) : [];
  return {
    id: idOf(g.id),
    name: str(g.name),
    subjectIds: ids, /* verwaiste Verweise auf geloeschte Faecher werden entfernt */
    target: str(g.target),
  };
}

function safeScale(sc) {
  const s = isObj(sc) ? sc : {};
  const type = ["grades", "points", "custom"].includes(s.type) ? s.type : "grades";
  return {
    type,
    min: s.min === "" ? "" : Number.isFinite(Number(s.min)) ? Number(s.min) : 1,
    max: s.max === "" ? "" : Number.isFinite(Number(s.max)) ? Number(s.max) : 6,
    bestLow: s.bestLow === undefined ? true : !!s.bestLow,
  };
}

function safeDataset(d, i) {
  if (!isObj(d)) return null;
  const subjects = Array.isArray(d.subjects) ? d.subjects.map(safeSubject).filter(Boolean) : [];
  const ids = new Set(subjects.map((s) => s.id));
  return {
    id: idOf(d.id),
    label: str(d.label) || `Halbjahr ${i + 1}`,
    yearId: str(d.yearId),
    scale: safeScale(d.scale),
    subjects,
    groups: Array.isArray(d.groups) ? d.groups.map((g) => safeGroup(g, ids)).filter(Boolean) : [],
    abi: safeAbi(d.abi),
  };
}

function safeLock(l) {
  if (!isObj(l) || !l.on) return null;
  const salt = str(l.salt), hash = str(l.hash);
  /* Eine halb gespeicherte Sperre wuerde die App unbenutzbar machen –
     lieber gar keine Sperre als eine, die niemand mehr aufbekommt. */
  if (!salt || !hash) return null;
  return { on: true, salt, hash };
}

/* ---------- Hauptfunktion ----------
   Gibt bei nicht rettbaren Daten null zurueck (der Aufrufer entscheidet dann,
   ob er einen frischen Zustand nimmt oder eine Fehlermeldung zeigt). */
export function migrateState(raw) {
  if (!isObj(raw)) return null;
  if (!Array.isArray(raw.datasets)) return null;

  let datasets = raw.datasets.map(safeDataset).filter(Boolean);
  /* Doppelte IDs (z. B. durch zweimaligen Import derselben Sicherung) trennen */
  const seen = new Set();
  datasets = datasets.map((d) => {
    if (seen.has(d.id)) d = { ...d, id: uid() };
    seen.add(d.id);
    return d;
  });
  if (!datasets.length) return null; /* eine leere Sicherung ist keine gueltige Sicherung */

  /* --- Schuljahre (neu in v3) ---
     Altdaten kennen keine Schuljahre. Statt sie zu erfinden, bekommen alle
     vorhandenen Halbjahre EIN gemeinsames Schuljahr – der Nutzer kann sie
     danach frei umsortieren. */
  let years = Array.isArray(raw.years)
    ? raw.years.filter(isObj).map((y) => ({ id: idOf(y.id), label: str(y.label) || "Schuljahr" }))
    : [];
  const ySeen = new Set();
  years = years.filter((y) => (ySeen.has(y.id) ? false : (ySeen.add(y.id), true)));
  if (!years.length) years = [{ id: uid(), label: "Schuljahr / School year" }];

  const yIds = new Set(years.map((y) => y.id));
  datasets = datasets.map((d) => (yIds.has(d.yearId) ? d : { ...d, yearId: years[0].id }));

  const activeId = datasets.some((d) => d.id === raw.activeId) ? raw.activeId : datasets[0].id;
  const active = datasets.find((d) => d.id === activeId);
  const selSubject =
    typeof raw.selSubject === "string" && active.subjects.some((s) => s.id === raw.selSubject)
      ? raw.selSubject
      : null;

  /* v1 kannte nur dark:boolean, ab v2 gibt es system/light/dark */
  let theme = THEMES.includes(raw.theme) ? raw.theme : raw.dark === true ? "dark" : raw.dark === false ? "light" : "system";

  const f = isObj(raw.features) ? raw.features : {};
  const features = {
    simple: f.simple === undefined ? true : !!f.simple,
    wish: f.wish === undefined ? true : !!f.wish,
    cats: f.cats === undefined ? true : !!f.cats,
    groups: f.groups === undefined ? true : !!f.groups,
    charts: f.charts === undefined ? true : !!f.charts,
  };

  /* Nach dem Neustart nie auf einer Unterseite landen, die ohne Kontext
     verwirrt ("Über die App" oder halb ausgefuellte Einrichtung). */
  const resumable = ["start", "home", "settings"];
  const screen = resumable.includes(raw.screen) ? raw.screen : raw.screen ? "home" : "start";

  return {
    v: SCHEMA_VERSION,
    lang: LANGS.includes(raw.lang) ? raw.lang : "de",
    theme,
    screen,
    selSubject,
    aboutFrom: null,
    name: str(raw.name),
    school: str(raw.school),
    features,
    years,
    activeId,
    datasets,
    lock: safeLock(raw.lock),
  };
}

/* Bequemer Wrapper fuer den App-Start: liefert immer einen brauchbaren Zustand. */
export function stateOrFresh(raw) {
  try {
    const m = migrateState(raw);
    if (m) return m;
  } catch (e) {
    logWarn("Gespeicherter Zustand nicht lesbar, starte neu", e);
  }
  return null;
}
