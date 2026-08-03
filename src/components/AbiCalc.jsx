import React from "react";
import { Ic } from "./icons.jsx";
import { InfoTip } from "./ui.jsx";
import { uid, parseNum, filterNumInput, fmt, abiBlockI, abiBlockII, abiTotal } from "../lib/grades.js";
import { ABI_EXAM_COUNT } from "../lib/state.js";

/* =========================================================
   Abitur-Rechner nach der KMK-Vereinbarung.

   Bewusst KEINE fest verdrahteten Landesregeln: welche
   Halbjahresergebnisse eingebracht werden muessen und welche doppelt
   zaehlen, unterscheidet sich je Bundesland und aendert sich. Eine
   falsche Zahl an dieser Stelle waere schlimmer als gar keine – die App
   rechnet deshalb nur mit dem, was der Nutzer eintraegt, und sagt das
   auch deutlich.
========================================================= */
const PT_COLORS = (p) => {
  if (p == null) return "var(--faint)";
  const q = Math.max(0, Math.min(1, p / 15));
  return `hsl(${Math.round(q * 122)},62%,46%)`;
};

function Check({ ok, label }) {
  return (
    <div className="row" style={{ gap: 6, padding: "3px 0", fontSize: 13, color: ok ? "var(--green)" : "var(--sub)" }}>
      <span style={{ fontWeight: 700, width: 14 }}>{ok ? "✓" : "○"}</span>
      <span>{label}</span>
    </div>);
}

export default function AbiCalc({ abi, onChange, t, lang }) {
  const results = abi.results || [];
  const exams = abi.exams || [];

  const bI = abiBlockI(results.map((r) => ({ p: parseNum(r.p), double: r.double })));
  const bII = abiBlockII(exams.map((e) => parseNum(e)));
  const total = abiTotal(bI, bII);

  const setResult = (id, patch) =>
    onChange({ ...abi, results: results.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const addResult = () =>
    onChange({ ...abi, results: [...results, { id: uid(), label: "", p: "", double: false }] });
  const removeResult = (id) =>
    onChange({ ...abi, results: results.filter((r) => r.id !== id) });
  const setExam = (i, v) =>
    onChange({ ...abi, exams: Array.from({ length: ABI_EXAM_COUNT }, (_, j) => (j === i ? v : exams[j] || "")) });

  return (
    <div>
      <div className="hint">{t("abiHint")}</div>
      <div className="banner banner-info" style={{ marginTop: 10 }}>
        <Ic n="alert" size={14} />{t("abiDisclaimer")}
      </div>

      {/* ---------- Block I ---------- */}
      <h2 className="sec" style={{ marginTop: 14 }}>{t("blockI")}</h2>
      <InfoTip text={t("abiDoubleHint")} />

      {results.length === 0 && <div className="hint" style={{ padding: "6px 0" }}>{t("abiEmpty")}</div>}

      {results.map((r) => (
        <div key={r.id} className="row" style={{ borderTop: "1px solid var(--line)", padding: "8px 0", flexWrap: "wrap" }}>
          <input className="inp" style={{ flex: "1 1 130px", padding: "8px 10px" }} placeholder={t("abiResultLabel")}
            maxLength={40} value={r.label} onChange={(e) => setResult(r.id, { label: e.target.value })} />
          <input className="num" inputMode="numeric" style={{ width: 58, color: PT_COLORS(parseNum(r.p)) }}
            aria-label={t("abiPoints")} placeholder="–" value={r.p}
            onChange={(e) => setResult(r.id, { p: filterNumInput(e.target.value).replace(/[.,+\-\u2212]/g, "").slice(0, 2) })} />
          <label className="lbl row" style={{ gap: 4 }}>
            <input type="checkbox" checked={!!r.double} onChange={(e) => setResult(r.id, { double: e.target.checked })} />
            {t("abiDouble")}
          </label>
          <button className="xbtn" aria-label={t("deleteTerm")} onClick={() => removeResult(r.id)}>✕</button>
        </div>))}

      <button className="btn-ghost" style={{ marginTop: 10 }} onClick={addResult}>+ {t("abiAddResult")}</button>

      {bI && (
        <div className="row" style={{ justifyContent: "space-between", marginTop: 12, flexWrap: "wrap" }}>
          <span className="hint">{t("abiCounted")(bI.count)}</span>
          <span className="brand" style={{ fontSize: 18 }}>{bI.points} / 600</span>
        </div>)}

      {/* ---------- Block II ---------- */}
      <h2 className="sec" style={{ marginTop: 18 }}>{t("blockII")}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Array.from({ length: ABI_EXAM_COUNT }, (_, i) => (
          <label key={i} className="lbl" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, marginBottom: 3 }}>{t("abiExam")} {i + 1}</div>
            <input className="num" inputMode="numeric" style={{ width: 54, color: PT_COLORS(parseNum(exams[i])) }}
              placeholder="–" value={exams[i] || ""} aria-label={t("abiExam") + " " + (i + 1)}
              onChange={(e) => setExam(i, filterNumInput(e.target.value).replace(/[.,+\-\u2212]/g, "").slice(0, 2))} />
          </label>))}
      </div>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
        <span className="hint">×4</span>
        <span className="brand" style={{ fontSize: 18 }}>{bII.points} / 300</span>
      </div>

      {/* ---------- Ergebnis ---------- */}
      <div className="card" style={{ marginTop: 16, marginBottom: 0, background: "var(--chip)", boxShadow: "none" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="lbl">{t("abiTotal")}</div>
            <div className="brand" style={{ fontSize: 26 }}>{total.total} <span style={{ fontSize: 14, color: "var(--sub)", fontWeight: 400 }}>/ 900</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="lbl">{t("abiGrade")}</div>
            <div className="brand" style={{ fontSize: 34, color: total.grade != null ? "var(--blue)" : "var(--faint)" }}>
              {total.grade != null ? fmt(total.grade, lang, 1) : "–"}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 10 }}>
          <Check ok={!!(bI && bI.points >= 200)} label={t("abiNeed200")} />
          <Check ok={!!(bI && bI.zeros === 0 && bI.count > 0)} label={t("abiNeedZero")} />
          <Check ok={!!(bI && bI.under5 <= bI.maxUnder5)} label={bI ? t("abiNeedUnder5")(bI.under5, bI.maxUnder5) : t("abiNeedUnder5")(0, 0)} />
          <Check ok={bII.points >= 100} label={t("abiNeed100")} />
          <Check ok={bII.atLeast5 >= 3} label={t("abiNeed3x5")} />
        </div>

        <div style={{
          marginTop: 10, fontWeight: 700, fontSize: 14,
          color: total.passed ? "var(--green)" : "var(--sub)",
        }}>
          {total.passed ? "✓ " + t("abiPassed") : t("abiFailed")}
        </div>
      </div>
    </div>);
}
