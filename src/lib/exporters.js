/* =========================================================
   exporters.js – Sicherung, CSV und Druckansicht.

   Zwei Sicherheitsthemen, die hier bewusst behandelt werden:

   1) HTML-Injektion. renderPrint() hat bisher Fachnamen, Namen und
      Schulbezeichnung ungeprueft per innerHTML eingesetzt. Bei eigenen
      Eingaben ist das harmlos, aber eine importierte Sicherung ist eine
      FREMDE Datei: ein Eintrag wie <img src=x onerror=...> haette beim
      Rendern der Druckansicht beliebiges JavaScript ausgefuehrt und
      damit Zugriff auf den kompletten localStorage gehabt.

   2) CSV-Formel-Injektion. Excel und LibreOffice interpretieren Zellen,
      die mit = + - @ beginnen, als Formel. Eine CSV, die man an Eltern
      oder Lehrkraefte weitergibt, darf das nicht ausloesen.
========================================================= */

import { parseNum, gv, gd, gp, fmt, sName, cName, subjWeight, subjectsMean } from "./grades.js";
import { logError } from "./logger.js";

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- Datei herunterladen ---------- */
export function downloadBlob(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (e) {
    logError("Datei konnte nicht bereitgestellt werden: " + filename, e);
    return false;
  }
}

/* ---------- Sicherung (JSON) ---------- */
export function exportBackup(state) {
  try {
    const json = JSON.stringify(state, null, 2);
    const stamp = new Date().toISOString().slice(0, 10);
    return downloadBlob(new Blob([json], { type: "application/json" }), `gradegoal-sicherung-${stamp}.json`);
  } catch (e) {
    logError("Sicherung konnte nicht erstellt werden", e);
    return false;
  }
}

/* ---------- CSV ---------- */
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(value, sep) {
  let s = value == null ? "" : String(value);
  /* Formel-Injektion neutralisieren, echte Zahlen aber unangetastet lassen */
  if (FORMULA_START.test(s) && !/^-?\d+(?:[.,]\d+)?$/.test(s)) s = "'" + s;
  if (s.includes(sep) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function buildCsv(state, opts = {}) {
  const lang = state.lang;
  /* Semikolon, weil Excel in deutscher Locale sonst alles in eine Spalte kippt */
  const sep = opts.sep || (lang === "de" ? ";" : ",");
  const head =
    lang === "de"
      ? ["Schuljahr", "Halbjahr", "Fach", "Fachgewicht", "Zeugnisnote", "Wunschnote", "Kategorie", "Gewichtung %", "Einzelnote", "Datum", "Punkte", "von"]
      : ["School year", "Term", "Subject", "Subject weight", "Report grade", "Wish grade", "Category", "Weighting %", "Single grade", "Date", "Points", "of"];

  const rows = [head];
  const dateStr = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  const yearLabel = (id) => {
    const y = (state.years || []).find((yy) => yy.id === id);
    return y ? y.label : "";
  };

  for (const ds of state.datasets) {
    for (const s of ds.subjects) {
      const base = [yearLabel(ds.yearId), ds.label, sName(s, lang), subjWeight(s), s.grade, s.wish];
      const singles = [];
      for (const c of s.cats || []) {
        for (const g of c.grades || []) {
          const v = parseNum(gv(g));
          if (v == null) continue;
          /* Punkteherkunft mitschreiben, falls die Note ueber einen
             Notenschluessel entstand – sonst bleiben die Spalten leer. */
          const pts = gp(g);
          singles.push([...base, cName(c, lang), c.weight, fmt(v, lang, 1), dateStr(gd(g)),
                        pts ? fmt(pts.r, lang, 1) : "", pts ? fmt(pts.m, lang, 1) : ""]);
        }
      }
      /* Faecher ohne Einzelnoten trotzdem auflisten – sonst fehlen sie in der Tabelle */
      if (singles.length) rows.push(...singles);
      else rows.push([...base, "", "", "", "", "", ""]);
    }
  }

  const body = rows.map((r) => r.map((c) => csvCell(c, sep)).join(sep)).join("\r\n");
  /* BOM, damit Excel Umlaute als UTF-8 erkennt */
  return "\uFEFF" + body + "\r\n";
}

export function exportCsv(state) {
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    return downloadBlob(
      new Blob([buildCsv(state)], { type: "text/csv;charset=utf-8" }),
      `gradegoal-noten-${stamp}.csv`
    );
  } catch (e) {
    logError("CSV konnte nicht erstellt werden", e);
    return false;
  }
}

/* ---------- Druckansicht ---------- */
export function buildPrintHtml(state, ds, t, app) {
  const lang = state.lang;
  const e = escapeHtml;
  /* Gewichteter Schnitt – muss mit der Anzeige in der App uebereinstimmen */
  const avg = subjectsMean(ds.subjects, "grade");
  const wishAvg = subjectsMean(ds.subjects, "wish");
  const showWish = !state.features.simple && state.features.wish;
  const showWeight = ds.subjects.some((s) => subjWeight(s) !== 1);

  const rows = ds.subjects
    .map(
      (s) =>
        `<tr><td>${e(sName(s, lang))}</td>` +
        (showWeight ? `<td>${e(fmt(subjWeight(s), lang, 1))}</td>` : "") +
        `<td>${e(fmt(parseNum(s.grade), lang))}</td>` +
        (showWish ? `<td>${e(fmt(parseNum(s.wish), lang))}</td>` : "") +
        `</tr>`
    )
    .join("");

  const head =
    `<tr><th>${e(t("subjects"))}</th>` +
    (showWeight ? `<th>${e(t("subjWeightShort"))}</th>` : "") +
    `<th>${e(t("grade"))}</th>` +
    (showWish ? `<th>&#9733; ${e(t("wish"))}</th>` : "") +
    `</tr>`;

  const meta = [state.name, state.school, ds.label].filter(Boolean).map(e).join(" · ");
  const printed = new Date().toLocaleDateString(lang === "de" ? "de-DE" : "en-GB");

  return `<div class="print-sheet">
    <h1>${e(app.name)} – ${e(t("report"))}</h1>
    <div class="print-meta">${meta}</div>
    <table>${head}${rows}</table>
    <p class="print-avg"><strong>${e(t("avg"))}: ${e(fmt(avg, lang))}</strong>${
    showWish ? ` &nbsp;·&nbsp; ${e(t("wishAvg"))}: ${e(fmt(wishAvg, lang))}` : ""
  }</p>
    <p class="print-foot">${e(app.name)}: ${e(app.sub)} · v${e(app.ver)} · ${e(t("developedBy"))} ${e(
    app.developer
  )} · ${e(printed)}</p>
  </div>`;
}
