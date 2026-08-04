/* =========================================================
   grades.js – reine Rechen- und Formatierungslogik
   Bewusst ohne React und ohne DOM-Zugriff: alles hier ist
   nebenwirkungsfrei und dadurch einzeln testbar.
========================================================= */

/* ID: Zufall + Zeitanteil. Rein zufaellige 8 Zeichen kollidieren bei
   vielen Einzelnoten theoretisch; der Zeitanteil schliesst das aus. */
export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/* Einzelnoten sind entweder Strings (Altbestand) oder {v,d}-Objekte mit Datum. */
export const gv = (g) => (g && typeof g === "object" ? g.v : g);
export const gd = (g) => (g && typeof g === "object" ? Number(g.d) || 0 : 0);

/* --------- Eingabe-Filter ---------
   Erlaubt Ziffern, Komma/Punkt und beide Minuszeichen (ASCII "-" und U+2212 "−").
   Vorher wurde U+2212 weggefiltert, dadurch liess sich "3−" auf vielen
   Tastaturen gar nicht eintippen, obwohl der Hilfetext es verspricht. */
export const filterNumInput = (s) => String(s).replace(/[^0-9.,+\-\u2212]/g, "");

const PLAIN_NUM = /^[+-]?\d+(?:\.\d+)?$/;
const TENDENCY = /^(\d+(?:\.\d+)?)\s*([+\-\u2212])$/;

/* Tendenznoten: 2+ -> 1.7, 3- -> 3.3.
   Rueckgabe null bedeutet "keine gueltige Zahl" (nie NaN nach aussen). */
export function parseNum(s) {
  if (s === "" || s == null) return null;
  const str = String(s).trim().replace(",", ".").replace(/\u2212/g, "-");
  const m = str.match(TENDENCY);
  if (m) {
    const b = parseFloat(m[1]);
    if (!Number.isFinite(b)) return null;
    return Math.round((m[2] === "+" ? b - 0.3 : b + 0.3) * 10) / 10;
  }
  /* Strikt statt parseFloat: "1.2.3" oder "3abc" ergeben jetzt null
     statt stillschweigend 1.2 bzw. 3. */
  if (!PLAIN_NUM.test(str)) return null;
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : null;
}

/* Formatierung. Fix: die Nachkommastellen-Entscheidung wird jetzt am
   gerundeten Wert getroffen. Vorher wurde 1.999999 als "2,00" ausgegeben,
   obwohl das Ergebnis eine glatte 2 ist. */
export function fmt(n, lang, d = 2) {
  if (n == null || !Number.isFinite(n)) return "–";
  const r = Number(n.toFixed(d)) + 0; /* +0 entfernt -0 */
  const out = r.toFixed(Number.isInteger(r) ? 0 : d);
  return lang === "de" ? out.replace(".", ",") : out;
}

/* Skala eines Datensatzes, gegen kaputte Eigenwerte abgesichert. */
export function scaleOf(ds) {
  const s = (ds && ds.scale) || {};
  /* whole: die Skala kennt nur ganze Werte – wichtig fuer die
     Notenschluessel, damit 7,5 Punkte nicht als Ergebnis erscheinen. */
  if (s.type === "points") return { min: 0, max: 15, bestLow: false, whole: true };
  /* Alles ausser "custom" – auch ein fehlender oder unbekannter Typ –
     faellt auf das deutsche Standardsystem zurueck. */
  if (s.type !== "custom") return { min: 1, max: 6, bestLow: true, whole: false };
  let min = Number(s.min);
  let max = Number(s.max);
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 10;
  if (min > max) [min, max] = [max, min]; /* vertauschte Eingabe abfangen */
  if (min === max) max = min + 1; /* Division durch 0 verhindern */
  return { min, max, bestLow: !!s.bestLow, whole: false };
}

/* 0 = schlechteste, 1 = beste Leistung. */
export function quality(v, sc) {
  if (v == null || !Number.isFinite(v)) return 0;
  let p = (v - sc.min) / ((sc.max - sc.min) || 1);
  if (sc.bestLow) p = 1 - p;
  return Math.max(0, Math.min(1, p));
}

/* Notenfarbe. "dark" wird jetzt als Parameter uebergeben statt ueber eine
   modulweite Variable gesetzt zu werden – die war beim Rendern mehrerer
   Instanzen eine versteckte Abhaengigkeit. */
export function colorFor(v, sc, mode, dark) {
  if (v == null || !Number.isFinite(v)) return "var(--faint)";
  const p = quality(v, sc);
  const h = Math.round(p * 122);
  if (mode === "bright") return `hsl(${h},72%,68%)`;
  return dark
    ? `hsl(${h},62%,${Math.round(63 - p * 6)}%)`
    : `hsl(${h},62%,${Math.round(44 - p * 4)}%)`;
}

export function mean(arr) {
  const v = (arr || []).filter((x) => x != null && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export const sName = (s, lang) =>
  typeof s?.name === "string" ? s.name : s?.name?.[lang] ?? s?.name?.de ?? "?";
export const cName = (c, lang) =>
  typeof c?.name === "string" ? c.name : c?.name?.[lang] ?? c?.name?.de ?? "?";

export const catMean = (cat) =>
  mean((cat?.grades || []).map((g) => parseNum(gv(g))));

/* Gewichteter Schnitt ueber alle Kategorien eines Fachs. */
export function weightedCalc(subject) {
  let sum = 0;
  let w = 0;
  for (const c of subject?.cats || []) {
    const m = catMean(c);
    const cw = Number(c.weight);
    if (m != null && Number.isFinite(cw) && cw > 0) {
      sum += m * cw;
      w += cw;
    }
  }
  return w ? sum / w : null;
}

/* Zielrechner: welche Note braucht es als naechste in dieser Kategorie?
   Herleitung: (So + wc*(sum+g)/(n+1)) / (Wo+wc) = wunsch  ->  nach g aufloesen. */
export function neededGrade(subject, cat, wish, sc) {
  if (wish == null || !Number.isFinite(wish)) return { type: "missing" };
  const wc = Number(cat.weight);
  if (!Number.isFinite(wc) || wc <= 0) return { type: "noWeight" };

  let So = 0;
  let Wo = 0;
  for (const c of subject.cats || []) {
    if (c.id === cat.id) continue;
    const m = catMean(c);
    const cw = Number(c.weight);
    if (m != null && Number.isFinite(cw) && cw > 0) {
      So += m * cw;
      Wo += cw;
    }
  }
  const s = (cat.grades || []).map((x) => parseNum(gv(x))).filter((x) => x != null);
  const n = s.length;
  const sum = s.reduce((a, b) => a + b, 0);

  const need = ((wish * (Wo + wc) - So) * (n + 1)) / wc - sum;
  if (!Number.isFinite(need)) return { type: "missing" };

  const alreadySafe = sc.bestLow ? need >= sc.max : need <= sc.min;
  const beyondBest = sc.bestLow ? need < sc.min : need > sc.max;
  if (alreadySafe) return { type: "safe" };
  if (beyondBest) return { type: "impossible" };
  return { type: "ok", g: sc.bestLow ? Math.floor(need * 10) / 10 : Math.ceil(need * 10) / 10 };
}

/* =========================================================
   Fachgewichtung
   Bis v1.4 zaehlte jedes Fach gleich viel. Fuer Zeugnis- und
   Abschlussregeln stimmt das nicht – Kernfaecher wiegen oft doppelt.
   Ein Gewicht von 0 bedeutet ausdruecklich "zaehlt nicht mit"
   (z. B. ein nicht zeugnisrelevantes Fach), fehlendes Gewicht = 1.
========================================================= */
export const subjWeight = (s) => {
  const w = Number(s && s.weight);
  return Number.isFinite(w) && w >= 0 ? w : 1;
};

export function weightedMean(items, valueOf, weightOf) {
  let sum = 0, w = 0;
  for (const it of items || []) {
    const v = valueOf(it);
    const k = weightOf(it);
    if (v == null || !Number.isFinite(v) || !Number.isFinite(k) || k <= 0) continue;
    sum += v * k;
    w += k;
  }
  return w ? sum / w : null;
}

/* Gesamtschnitt eines Datensatzes unter Beruecksichtigung der Fachgewichte. */
export const subjectsMean = (subjects, field) =>
  weightedMean(subjects, (s) => parseNum(s[field]), subjWeight);

/* =========================================================
   Notenschluessel

   Schwellen werden in PROZENT gespeichert, nicht in Punkten: eine Arbeit
   hat 50 Punkte, die naechste 120. "Ab 92 %" gilt fuer beide.

   Zwei Arten:
     type "linear" – Formel, verteilt die Skala gleichmaessig
     type "steps"  – Tabelle mit Schwellen, wie sie Schulen vorgeben
========================================================= */

/* Prozentwert einlesen: akzeptiert Komma UND Punkt als Trennzeichen und
   begrenzt auf 0..100.

   Wichtig, weil Number("87,5") NaN liefert – genau daran ist die
   Eingabe frueher stillschweigend auf 0 gesprungen. */
export function pctOf(x) {
  const n = parseNum(x);
  if (n == null) return null;
  return Math.max(0, Math.min(100, n));
}

/* Der in deutschen Schulen weit verbreitete Sechstel-Schluessel.
   Er ist die Vorgabe der App – anders als der IHK-Schluessel aber kein
   verbindlicher Standard, sondern nur der haeufigste Ausgangspunkt.
   Jede Zeile laesst sich aendern. */
export const STANDARD_STEPS = [
  { g: "1", min: 87.5 }, { g: "2", min: 75 }, { g: "3", min: 62.5 },
  { g: "4", min: 50 }, { g: "5", min: 25 }, { g: "6", min: 0 },
];

/* Gilt der Standardschluessel fuer diese Skala?
   Nur bei Noten 1–6 – bei Oberstufen-Punkten oder eigenen Skalen waeren
   die Notenbezeichnungen schlicht falsch. */
export function standardKeyFor(sc) {
  if (!sc || !sc.bestLow || sc.min !== 1 || sc.max !== 6) return null;
  return { id: "", name: "", type: "steps", steps: STANDARD_STEPS.map((x) => ({ ...x })) };
}

/* Der IHK-Schluessel ist ein tatsaechlich verbindlicher Standard und
   deshalb fest hinterlegt. Schulinterne Schluessel unterscheiden sich
   dagegen von Ort zu Ort – die legt der Nutzer selbst an. */
export const IHK_STEPS = [
  { g: "1", min: 92 }, { g: "2", min: 81 }, { g: "3", min: 67 },
  { g: "4", min: 50 }, { g: "5", min: 30 }, { g: "6", min: 0 },
];

/* Lineare Umrechnung, an der Skala des Halbjahres ausgerichtet:
   bei Noten 1–6 ergibt 100 % eine 1, bei Punkten 0–15 eine 15. */
export function linearGrade(pct, sc) {
  if (!Number.isFinite(pct) || !sc) return null;
  const p = Math.max(0, Math.min(100, pct)) / 100;
  const span = sc.max - sc.min;
  const raw = sc.bestLow ? sc.max - span * p : sc.min + span * p;
  return sc.whole ? Math.round(raw) : Math.round(raw * 10) / 10;
}

/* Verteilt eine Liste von Notenbezeichnungen (beste zuerst) auf gleich
   breite Prozentbaender. Die letzte Zeile beginnt immer bei 0 %, damit
   die Tabelle nach unten lueckenlos ist. */
function bandsFor(labels) {
  const band = 100 / labels.length;
  return labels.map((g, i) => ({
    g,
    min: i === labels.length - 1 ? 0 : Math.round((100 - band * (i + 1)) * 10) / 10,
  }));
}

/* Ausgangstabelle mit den GANZEN Noten der Skala.
   Bei Noten 1–6 sind das genau sechs Zeilen, bei Oberstufen-Punkten
   0–15 sechzehn – letzteres ist an Schulen durchaus ueblich.
   Ausdruecklich nur ein Startpunkt zum Anpassen: einen bundesweit
   gueltigen Schulschluessel gibt es nicht. */
export function evenSteps(sc) {
  if (!sc) return null;
  const lo = Math.min(sc.min, sc.max), hi = Math.max(sc.min, sc.max);
  const values = [];
  for (let v = Math.ceil(lo); v <= hi + 1e-9; v++) values.push(v);
  if (values.length < 2 || values.length > 20) return null;
  const best = sc.bestLow ? values.slice().sort((a, b) => a - b) : values.slice().sort((a, b) => b - a);
  return bandsFor(best.map(String));
}

/* Ausgangstabelle MIT Tendenzen, nur fuer die deutsche Skala 1–6.

   Die Liste endet bewusst bei 1 und 6 ohne Tendenz: 1+ waere
   rechnerisch 0,7 und damit ausserhalb der Skala, 6- entsprechend 6,3.
   Ergibt 15 Stufen – dieselbe Feinheit wie die Oberstufen-Punkte.

   Ob eine Lehrkraft ueberhaupt mit Tendenzen bewertet, ist von Fach zu
   Fach verschieden. Deshalb ist das eine Vorlage zur Auswahl und keine
   Voreinstellung. */
export function tendencySteps(sc) {
  if (!sc || !sc.bestLow || sc.min !== 1 || sc.max !== 6) return null;
  const labels = ["1"];
  for (let n = 1; n <= 5; n++) {
    if (n > 1) labels.push(n + "+");
    if (n > 1) labels.push(String(n));
    labels.push(n + "\u2212");           /* typografisches Minus */
  }
  labels.push("6");
  return bandsFor(labels);
}

export const freshKey = (id, name, sc) => {
  const std = standardKeyFor(sc);
  return {
    id, name,
    type: "steps",
    steps: std ? std.steps : (evenSteps(sc) || IHK_STEPS.map((x) => ({ ...x }))),
  };
};

/* Tabelle absteigend nach Schwelle – die Reihenfolge der Eingabe soll
   das Ergebnis nicht beeinflussen. */
export const sortedSteps = (steps) =>
  (steps || [])
    .map((s) => (s && parseNum(s.g) != null ? { ...s, min: pctOf(s.min) } : null))
    .filter((s) => s && s.min != null)
    .sort((a, b) => b.min - a.min);

/* Prozent -> Note nach einem Schluessel. */
export function keyGrade(key, pct, sc) {
  if (!Number.isFinite(pct)) return null;
  if (key && key.type === "linear") return linearGrade(pct, sc);
  /* Kein Schluessel gewaehlt: bei Noten 1–6 gilt der Standardschluessel,
     sonst linear. Frueher war hier immer linear – das traf die
     Schulwirklichkeit nicht. */
  const eff = key || standardKeyFor(sc);
  if (!eff) return linearGrade(pct, sc);
  const rows = sortedSteps(eff.steps);
  if (!rows.length) return linearGrade(pct, sc);
  const p = Math.max(0, Math.min(100, pct));
  for (const r of rows) if (p >= r.min) return parseNum(r.g);
  /* Unterhalb der niedrigsten Schwelle gilt die schlechteste Note der Tabelle */
  return parseNum(rows[rows.length - 1].g);
}

/* Notenspiegel: ab wie vielen Punkten beginnt welche Note?
   Bei Tabellen direkt aus den Schwellen gerechnet, bei linear abgetastet. */
export function keyTable(maxPoints, key, sc) {
  const max = Number(maxPoints);
  if (!Number.isFinite(max) || max <= 0) return [];

  const eff = key && key.type === "linear" ? null : (key || standardKeyFor(sc));
  if (eff) {
    return sortedSteps(eff.steps).map((r) => ({
      grade: parseNum(r.g),
      label: String(r.g),  /* so anzeigen, wie es eingetippt wurde */
      from: Math.round((r.min / 100) * max * 100) / 100,
      pct: r.min,
    }));
  }

  const seen = new Map();
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const p = (max * i) / steps;
    const g = linearGrade((p / max) * 100, sc);
    if (g == null) continue;
    if (!seen.has(g) || p < seen.get(g)) seen.set(g, p);
  }
  return Array.from(seen.entries())
    .map(([grade, from]) => ({ grade, label: null, from: Math.round(from * 100) / 100, pct: Math.round((from / max) * 1000) / 10 }))
    .sort((a, b) => b.from - a.from);
}

/* =========================================================
   Abitur nach der KMK-Vereinbarung

   Block I:  E = (P / S) x 40, hoechstens 600 Punkte
   Block II: fuenf Pruefungen, jeweils vierfach, hoechstens 300 Punkte
   Note:     N = 17/3 - E/180, amtlich ABGESCHNITTEN (nicht gerundet)

   Die Formel ist bundesweit einheitlich. Welche Halbjahresergebnisse
   eingebracht werden MUESSEN und welche doppelt zaehlen, regelt dagegen
   jedes Land selbst – deshalb rechnet die App nur mit dem, was der
   Nutzer eintraegt, und behauptet keine Landesvorgaben.
========================================================= */
export function abiBlockI(results) {
  let P = 0, S = 0, under5 = 0, zeros = 0;
  for (const r of results || []) {
    const p = Number(r && r.p);
    if (!Number.isFinite(p)) continue;
    const val = Math.max(0, Math.min(15, p));
    const k = r.double ? 2 : 1;
    P += val * k;
    S += k;
    if (val < 5) under5 += k;
    if (val === 0) zeros += k;
  }
  if (!S) return null;
  const points = Math.min(600, Math.round((P * 40) / S));
  const maxUnder5 = Math.floor(S * 0.2);
  return {
    points, count: S, under5, zeros, maxUnder5,
    ok: points >= 200 && zeros === 0 && under5 <= maxUnder5,
  };
}

export function abiBlockII(exams) {
  const vals = (exams || []).map(Number).filter((v) => Number.isFinite(v)).map((v) => Math.max(0, Math.min(15, v)));
  const points = Math.min(300, vals.reduce((a, b) => a + b * 4, 0));
  const atLeast5 = vals.filter((v) => v >= 5).length;
  return { points, count: vals.length, atLeast5, ok: points >= 100 && atLeast5 >= 3 };
}

export function abiGradeFromPoints(total) {
  if (!Number.isFinite(total) || total < 300) return null;
  const n = 17 / 3 - total / 180;
  const cut = Math.floor(n * 10) / 10; /* amtlich wird abgeschnitten */
  return Math.min(6, Math.max(1, Math.round(cut * 10) / 10));
}

export function abiTotal(bI, bII) {
  const p1 = bI ? bI.points : 0;
  const p2 = bII ? bII.points : 0;
  const total = p1 + p2;
  return {
    total,
    grade: abiGradeFromPoints(total),
    passed: !!(bI && bII && bI.ok && bII.ok && total >= 300),
  };
}

/* Alle Einzelnoten eines Fachs, chronologisch – fuer Sparkline und Diagramm. */
export function subjectPoints(subject) {
  const pts = [];
  for (const c of subject?.cats || []) {
    for (const g of c.grades || []) {
      const v = parseNum(gv(g));
      if (v != null) pts.push({ v, d: gd(g) });
    }
  }
  return pts.sort((a, b) => a.d - b.d);
}

/* Tendenz ueber eine chronologische Punktliste: "up" | "down" | "flat". */
export function trendOf(pts, sc) {
  if (!pts || pts.length < 2) return "flat";
  const half = Math.floor(pts.length / 2);
  const q1 = mean(pts.slice(0, half || 1).map((p) => quality(p.v, sc)));
  const q2 = mean(pts.slice(-Math.max(half, 1)).map((p) => quality(p.v, sc)));
  if (q1 == null || q2 == null) return "flat";
  const d = q2 - q1;
  return d > 0.03 ? "up" : d < -0.03 ? "down" : "flat";
}

/* =========================================================
   Datumshelfer fuer Einzelnoten
========================================================= */
/* Lokales Datum, NICHT toISOString(): das liefert UTC und waere abends
   in Mitteleuropa bereits der Folgetag. */
export function todayISO(now) {
  const d = now instanceof Date ? now : new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* ISO-Datum -> Zeitstempel auf 12:00 Uhr lokal.
   Mittag statt Mitternacht, damit die Sommerzeitumstellung den Tag nicht kippt. */
export function isoToStamp(iso, fallback) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  const fb = Number.isFinite(fallback) ? fallback : Date.now();
  if (!m) return fb;
  const y = Number(m[1]), mo = Number(m[2]), da = Number(m[3]);
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return fb;
  const t = new Date(y, mo - 1, da, 12, 0, 0).getTime();
  return Number.isFinite(t) ? t : fb;
}

/* Welcher Schluessel gilt fuer ein Fach?
   Reihenfolge: eigener Schluessel des Fachs, sonst Vorgabe des
   Halbjahres, sonst linear. Ein Verweis auf einen geloeschten
   Schluessel faellt dabei sauber auf die naechste Ebene zurueck. */
export function keyOf(ds, subject) {
  const keys = (ds && ds.keys) || [];
  const byId = (id) => (id ? keys.find((k) => k.id === id) : null);
  return byId(subject && subject.keyId) || byId(ds && ds.defaultKeyId) || null;
}

/* Punkte einer Einzelnote, falls sie ueber einen Schluessel entstand. */
export const gp = (g) => (g && typeof g === "object" && g.p && Number.isFinite(Number(g.p.r)) && Number.isFinite(Number(g.p.m)))
  ? { r: Number(g.p.r), m: Number(g.p.m) } : null;
