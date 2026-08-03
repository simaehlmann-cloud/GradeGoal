import React, { useState, useRef } from "react";
import { Ic } from "./icons.jsx";
import {
  parseNum, gv, gd, fmt, mean, quality, cName, subjectPoints, trendOf, scaleOf, subjectsMean, colorFor,
} from "../lib/grades.js";
import { downloadBlob } from "../lib/exporters.js";
import { logError } from "../lib/logger.js";

const CAT_PALETTE = ["#4C7DFF", "#F2884B", "#9B6BF2", "#2BB8A3", "#E85D9E", "#C9A227", "#6BAA3D", "#FF7B6B"];
export const catColor = (i) => CAT_PALETTE[i % CAT_PALETTE.length];

/* Feste Farbwerte statt CSS-Variablen: im exportierten Bild gibt es
   keinen :root-Kontext, dort waeren die Variablen leer. */
const clrFor = (dark) => dark
  ? { line: "#2C3A56", faint: "#7A8BA6", card: "#1A2436", bg: "#1A2436", ink: "#E8EDF5" }
  : { line: "#E4EAF2", faint: "#8A97AB", card: "#ffffff", bg: "#ffffff", ink: "#172A46" };

/* ---------- Bild-Export eines SVG ---------- */
function exportSvg(svg, W, H, bg, fileName, onError) {
  if (!svg) return;
  try {
    const src = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onerror = () => onError && onError();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = W * 3; c.height = H * 3;
        const ctx = c.getContext("2d");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => {
          if (!b) { onError && onError(); return; }
          /* Fachnamen sind frei waehlbar – Pfadtrenner muessen raus */
          const safe = String(fileName || "chart").replace(/[\\/:*?"<>|]/g, "-").slice(0, 60);
          if (!downloadBlob(b, safe + ".png")) onError && onError();
        });
      } catch (e) {
        logError("Diagramm-Export fehlgeschlagen", e);
        onError && onError();
      }
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
  } catch (e) {
    logError("Diagramm konnte nicht serialisiert werden", e);
    onError && onError();
  }
}

/* =========================================================
   Notenverlauf eines Fachs – eine Linie je Kategorie (oben = besser)
========================================================= */
export function TrendChart({ subject, sc, lang, t, fileName, dark, onError }) {
  const [hidden, setHidden] = useState({});
  const svgRef = useRef(null);
  const CLR = clrFor(dark);

  const series = [];
  (subject.cats || []).forEach((c, ci) => {
    const pts = (c.grades || []).map((g) => ({ v: parseNum(gv(g)), d: gd(g) })).filter((p) => p.v != null);
    pts.sort((a, b) => a.d - b.d);
    if (pts.length) series.push({ id: c.id, name: cName(c, lang), color: catColor(ci), pts });
  });
  const allPts = series.flatMap((s) => s.pts);
  if (allPts.length < 2) return <div className="hint">{t("trendEmpty")}</div>;

  const visible = series.filter((s) => !hidden[s.id]);
  const vis = visible.flatMap((s) => s.pts).slice().sort((a, b) => a.d - b.d);

  const W = 320, H = 118, l = 12, r = 12, tp = 16, bp = 14;
  const y = (v) => tp + (1 - quality(v, sc)) * (H - tp - bp);
  const dsAll = allPts.map((p) => p.d);
  const minD = Math.min(...dsAll), maxD = Math.max(...dsAll);
  const timeAxis = allPts.every((p) => p.d > 0) && maxD > minD;
  const xTime = (d) => l + (W - l - r) * ((d - minD) / (maxD - minD));
  const xIdx = (i, n) => (n === 1 ? l + (W - l - r) / 2 : l + (W - l - r) * (i / (n - 1)));

  const dir = trendOf(vis, sc);
  const dirColor = dir === "up" ? "var(--green)" : dir === "down" ? "var(--red)" : "var(--sub)";
  const best = sc.bestLow ? sc.min : sc.max, worst = sc.bestLow ? sc.max : sc.min;

  return (
    <div>
      <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label={t("trend")}
        xmlns="http://www.w3.org/2000/svg">
        <line x1={l} y1={tp} x2={W - r} y2={tp} stroke={CLR.line} strokeDasharray="3 4" />
        <line x1={l} y1={H - bp} x2={W - r} y2={H - bp} stroke={CLR.line} />
        <text x={l} y={tp - 5} fontSize="9" fill={CLR.faint} fontFamily="Karla,sans-serif">{fmt(best, lang)} = {t("trendBest")}</text>
        <text x={W - r} y={H - 3} fontSize="9" fill={CLR.faint} textAnchor="end" fontFamily="Karla,sans-serif">{fmt(worst, lang)} = {t("trendWorst")}</text>
        {visible.map((s) => {
          const X = (p, i) => (timeAxis ? xTime(p.d) : xIdx(i, s.pts.length));
          const line = s.pts.map((p, i) => X(p, i).toFixed(1) + "," + y(p.v).toFixed(1)).join(" ");
          return (
            <g key={s.id}>
              {s.pts.length > 1 && <polyline points={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />}
              {s.pts.map((p, i) => (
                <circle key={i} cx={X(p, i)} cy={y(p.v)} r={i === s.pts.length - 1 ? 4.2 : 3} fill={s.color} stroke={CLR.card} strokeWidth="1.5" />
              ))}
            </g>);
        })}
      </svg>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 }}>
        {series.map((s) => (
          <button key={s.id} onClick={() => setHidden((h) => ({ ...h, [s.id]: !h[s.id] }))}
            aria-pressed={!hidden[s.id]} className="hint"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600,
              background: "none", border: "none", cursor: "pointer", padding: 0,
              opacity: hidden[s.id] ? 0.35 : 1, textDecoration: hidden[s.id] ? "line-through" : "none",
            }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0 }}></span>
            {s.name} · Ø {fmt(mean(s.pts.map((p) => p.v)), lang)}
          </button>))}
      </div>

      <div className="row" style={{ marginTop: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <span className="row" style={{ color: dirColor, fontWeight: 700, fontSize: 14 }}>
          <Ic n={dir === "up" ? "chart" : dir === "down" ? "chartDown" : "flat"} size={17} color={dirColor} />
          {t(dir === "up" ? "trendUp" : dir === "down" ? "trendDown" : "trendFlat")}
        </span>
        <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}
          onClick={() => exportSvg(svgRef.current, W, H, CLR.bg, fileName, onError)}>
          <Ic n="download" size={13} />{t("shareChart")}
        </button>
      </div>
    </div>);
}

/* ---------- Mini-Verlauf für die Fächerliste ---------- */
export function Spark({ subject, sc }) {
  const pts = subjectPoints(subject);
  if (pts.length < 2) return null;
  const W = 46, Hh = 18, pd = 2.5;
  const y = (v) => pd + (1 - quality(v, sc)) * (Hh - 2 * pd);
  const x = (i) => pd + (W - 2 * pd) * (i / (pts.length - 1));
  const dir = trendOf(pts, sc);
  const col = dir === "up" ? "var(--green)" : dir === "down" ? "var(--red)" : "var(--faint)";
  const line = pts.map((p, i) => x(i).toFixed(1) + "," + y(p.v).toFixed(1)).join(" ");
  return (
    <svg width={W} height={Hh} viewBox={`0 0 ${W} ${Hh}`} style={{ flexShrink: 0 }} aria-hidden="true">
      <polyline points={line} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>);
}

/* =========================================================
   Langzeitverlauf: ein Punkt je Halbjahr, ueber alle Schuljahre.

   Achtung bei der Skalierung: jeder Datensatz kann ein EIGENES
   Notensystem haben (1–6 hier, 0–15 dort). Deshalb wird nicht der
   Rohwert aufgetragen, sondern die Guete (0..1) nach der jeweils
   eigenen Skala – sonst waere die Kurve schlicht falsch.
========================================================= */
export function LongTermChart({ datasets, years, lang, t, dark, onError, fileName }) {
  const svgRef = useRef(null);
  const CLR = clrFor(dark);

  const pts = datasets
    .map((d) => {
      const dsc = scaleOf(d);
      const a = subjectsMean(d.subjects, "grade");
      return a == null ? null : { label: d.label, yearId: d.yearId, q: quality(a, dsc), avg: a, sc: dsc };
    })
    .filter(Boolean);

  if (pts.length < 2) return <div className="hint">{t("longTermEmpty")}</div>;

  const W = 320, H = 130, l = 14, r = 14, tp = 14, bp = 30;
  const x = (i) => (pts.length === 1 ? W / 2 : l + (W - l - r) * (i / (pts.length - 1)));
  const y = (q) => tp + (1 - q) * (H - tp - bp);
  const line = pts.map((p, i) => x(i).toFixed(1) + "," + y(p.q).toFixed(1)).join(" ");
  const yearLabel = (id) => (years.find((yy) => yy.id === id) || {}).label || "";

  /* Nur jede n-te Beschriftung zeichnen, sonst ueberlappen sie auf dem Handy */
  const every = Math.ceil(pts.length / 6);

  return (
    <div>
      <svg ref={svgRef} width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label={t("longTerm")}
        xmlns="http://www.w3.org/2000/svg">
        <line x1={l} y1={tp} x2={W - r} y2={tp} stroke={CLR.line} strokeDasharray="3 4" />
        <line x1={l} y1={H - bp} x2={W - r} y2={H - bp} stroke={CLR.line} />
        <polyline points={line} fill="none" stroke="#4C7DFF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.q)} r={i === pts.length - 1 ? 4.5 : 3.4}
              fill={colorFor(p.avg, p.sc, "bright", dark)} stroke={CLR.card} strokeWidth="1.5" />
            {i % every === 0 && (
              <text x={x(i)} y={H - bp + 12} fontSize="8" fill={CLR.faint} textAnchor="middle" fontFamily="Karla,sans-serif">
                {String(p.label).slice(0, 10)}
              </text>)}
            {i % every === 0 && (
              <text x={x(i)} y={H - bp + 22} fontSize="7" fill={CLR.faint} textAnchor="middle" fontFamily="Karla,sans-serif">
                {String(yearLabel(p.yearId)).slice(0, 10)}
              </text>)}
          </g>))}
      </svg>
      <div className="row" style={{ marginTop: 6, justifyContent: "space-between", flexWrap: "wrap" }}>
        <span className="hint">{t("longTermHint")}</span>
        <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}
          onClick={() => exportSvg(svgRef.current, W, H, CLR.bg, fileName, onError)}>
          <Ic n="download" size={13} />{t("shareChart")}
        </button>
      </div>
    </div>);
}
