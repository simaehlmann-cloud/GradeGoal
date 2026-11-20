/* =========================================================
   colors.js – Farbsystem (seit 1.10.0)

   Jede Farbe hat genau eine Rolle:
   - Blau (CSS --blue): Bedienung – Knoepfe, Links, Auswahl
   - Gelb (CSS --yellow): Ziele und Wunschnoten
   - Notenfarben (hier): nur fuer Noten. Fuenf Stufen von Rot bis
     Gruen, fuer jede Skala gleich (berechnet ueber quality()).
   - Fachfarben (hier): je Fach eine feste Farbe fuer Punkt, Streifen,
     Kopf der Fachseite. Bewusst ohne reines Rot/Gruen, damit sie nicht
     mit den Notenfarben verwechselt werden.

   Alle Schrift-/Hintergrundpaare erreichen mindestens WCAG AA (4,5:1),
   geprueft in tests/colors.test.mjs.
========================================================= */

/* Notenstufen, schlechteste zuerst. fg = Schrift, bg = zarter Grund. */
export const GRADE_TONES = {
  light: [
    { fg: "#B3261E", bg: "#FCE8E6" }, // sehr schwach
    { fg: "#A04E0B", bg: "#FDEEDF" }, // schwach
    { fg: "#875C00", bg: "#FFF3D1" }, // mittel
    { fg: "#3D6B12", bg: "#ECF5DC" }, // gut
    { fg: "#16703A", bg: "#E1F3E7" }, // sehr gut
  ],
  dark: [
    { fg: "#FF9C93", bg: "#3D2422" },
    { fg: "#FFB27A", bg: "#3B2B1C" },
    { fg: "#F5CB5C", bg: "#38311B" },
    { fg: "#B5DB7A", bg: "#27341B" },
    { fg: "#7FE0A3", bg: "#1B3727" },
  ],
};

/* quality: 0 = schlechteste, 1 = beste Note der Skala */
export function toneIndex(p) {
  if (p == null || !Number.isFinite(p)) return -1;
  if (p >= 0.84) return 4;
  if (p >= 0.62) return 3;
  if (p >= 0.42) return 2;
  if (p >= 0.22) return 1;
  return 0;
}

export function gradeTone(p, dark) {
  const i = toneIndex(p);
  if (i < 0) return null;
  return GRADE_TONES[dark ? "dark" : "light"][i];
}

/* Fachfarben: [hell, dunkel]. Reihenfolge so gewaehlt, dass benachbarte
   Faecher in der Liste deutlich unterschiedlich aussehen. */
export const SUBJECT_COLORS = [
  ["#3E63DD", "#8DA4FF"], // Indigo
  ["#C2410C", "#FF9D6B"], // Orange
  ["#087F84", "#5FD3D6"], // Petrol
  ["#8E44C9", "#C9A2F5"], // Violett
  ["#C2255C", "#F59AB9"], // Himbeere
  ["#1971C2", "#79BBF2"], // Himmelblau
  ["#8F5F00", "#F0C35A"], // Senf
  ["#5C6BC0", "#A9B4F2"], // Lavendel
  ["#00796B", "#5CD6C6"], // Tuerkis
  ["#6D5847", "#C9B2A0"], // Erdbraun
];

export const subjectColorCount = SUBJECT_COLORS.length;

/* Gespeichert wird nur der Index (0–9), nicht der Farbwert – so passt
   die Farbe automatisch zum hellen oder dunklen Design. */
export function subjectColor(s, dark) {
  const i = Number.isInteger(s && s.color) ? s.color : 0;
  const c = SUBJECT_COLORS[((i % subjectColorCount) + subjectColorCount) % subjectColorCount];
  return c[dark ? 1 : 0];
}

/* Naechste freie bzw. am seltensten benutzte Farbe fuer ein neues Fach */
export function nextSubjectColor(subjects) {
  const used = new Array(subjectColorCount).fill(0);
  for (const s of subjects || []) if (Number.isInteger(s.color)) used[s.color % subjectColorCount]++;
  let best = 0;
  for (let i = 1; i < subjectColorCount; i++) if (used[i] < used[best]) best = i;
  return best;
}

/* Faecher ohne Farbe (Altdaten, neue Listen) der Reihe nach einfaerben;
   vorhandene Farben bleiben. */
export function withColors(subjects) {
  const out = [];
  for (const s of subjects || []) {
    out.push(Number.isInteger(s.color) && s.color >= 0 && s.color < subjectColorCount
      ? s : { ...s, color: nextSubjectColor(out) });
  }
  return out;
}

/* Kontrast nach WCAG 2.x (fuer die Tests) */
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
