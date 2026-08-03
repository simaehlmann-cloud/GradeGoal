import React, { useState, useMemo } from "react";
import { Ic } from "./icons.jsx";
import { Segmented, InfoTip } from "./ui.jsx";
import { parseNum, filterNumInput, fmt, gradeFromPercent, keyTable, colorFor } from "../lib/grades.js";

/* =========================================================
   Notenschluessel-Rechner: "34 von 50 Punkten – welche Note?"

   Die haeufigste Rechnung im Schulalltag. Bewusst eigenstaendig und
   unabhaengig von den eingetragenen Faechern, damit man ihn auch
   spontan aufrufen kann.
========================================================= */
export default function KeyCalc({ t, lang, dark }) {
  const [reached, setReached] = useState("");
  const [max, setMax] = useState("");
  const [mode, setMode] = useState("linear");

  const r = parseNum(reached);
  const m = parseNum(max);
  const valid = r != null && m != null && m > 0;
  /* Ueber 100 % sind bei Zusatzaufgaben durchaus moeglich – wir klemmen
     erst in gradeFromPercent, zeigen aber den echten Prozentwert an. */
  const pct = valid ? (r / m) * 100 : null;
  const grade = valid ? gradeFromPercent(pct, mode) : null;

  const sc = mode === "points" ? { min: 0, max: 15, bestLow: false } : { min: 1, max: 6, bestLow: true };
  const table = useMemo(() => (valid ? keyTable(m, mode) : []), [m, mode, valid]);

  return (
    <div>
      <div className="hint" style={{ marginBottom: 10 }}>{t("keyCalcHint")}</div>

      <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
        <label className="lbl" style={{ flex: "1 1 130px" }}>
          {t("keyReached")}
          <input className="inp" inputMode="decimal" style={{ marginTop: 4 }} value={reached}
            onChange={(e) => setReached(filterNumInput(e.target.value))} />
        </label>
        <label className="lbl" style={{ flex: "1 1 130px" }}>
          {t("keyMax")}
          <input className="inp" inputMode="decimal" style={{ marginTop: 4 }} value={max}
            onChange={(e) => setMax(filterNumInput(e.target.value))} />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="lbl">{t("keyMode")}</span>
          <InfoTip text={t("keyModeHint")} />
        </div>
        <Segmented value={mode} label={t("keyMode")} onChange={setMode}
          options={[["linear", t("keyLinear")], ["ihk", t("keyIhk")], ["points", t("keyPoints")]]} />
      </div>

      {valid && (
        <div className="card" style={{ marginTop: 14, marginBottom: 0, background: "var(--chip)", boxShadow: "none" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="lbl">{t("keyPercent")}</div>
              <div className="brand" style={{ fontSize: 22 }}>{fmt(pct, lang, 1)} %</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lbl">{t("keyResult")}</div>
              <div className="brand" style={{ fontSize: 32, color: colorFor(grade, sc, null, dark) }}>
                {fmt(grade, lang, 1)}
              </div>
            </div>
          </div>
        </div>)}

      {table.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="lbl" style={{ marginBottom: 6 }}><Ic n="table" size={13} />{t("keyTable")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {table.map((row) => (
              <span key={row.grade} style={{
                display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20,
                border: `1.5px solid ${colorFor(row.grade, sc, null, dark)}`,
                color: colorFor(row.grade, sc, null, dark),
                padding: "3px 12px", fontWeight: 700, fontSize: 13,
                fontFamily: "'Space Grotesk',sans-serif",
              }}>
                {fmt(row.grade, lang, 1)}
                <span style={{ color: "var(--sub)", fontWeight: 400, fontSize: 12 }}>
                  {t("keyFrom")} {fmt(row.from, lang, 1)}
                </span>
              </span>))}
          </div>
        </div>)}
    </div>);
}
