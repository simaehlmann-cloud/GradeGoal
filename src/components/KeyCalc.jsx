import React, { useState } from "react";
import { Ic } from "./icons.jsx";
import { Segmented, InfoTip } from "./ui.jsx";
import {
  uid, parseNum, filterNumInput, fmt, keyGrade, keyTable, colorFor,
  freshKey, IHK_STEPS, evenSteps, tendencySteps, sortedSteps,
} from "../lib/grades.js";

/* =========================================================
   Notenschluessel

   Schluessel unterscheiden sich von Schule zu Schule und von Fach zu
   Fach. Deshalb legt der Nutzer sie selbst an; fest hinterlegt ist nur
   der IHK-Schluessel, weil der tatsaechlich verbindlich ist.

   Die Schluessel gehoeren zum Halbjahr, nicht zum einzelnen Fach –
   meist gilt derselbe fuer mehrere Faecher. Jedes Fach zeigt nur
   darauf. Das spart mehrfaches Eintippen und haelt eine Aenderung an
   einer Stelle.
========================================================= */

const LINEAR = { id: "", name: "", type: "linear", steps: [] };

/* ---------- Rechner ---------- */
function Calculator({ keyObj, sc, lang, t, dark }) {
  const [reached, setReached] = useState("");
  const [max, setMax] = useState("");

  const r = parseNum(reached);
  const m = parseNum(max);
  const valid = r != null && m != null && m > 0;
  const pct = valid ? (r / m) * 100 : null;
  const grade = valid ? keyGrade(keyObj, pct, sc) : null;
  const table = valid ? keyTable(m, keyObj, sc) : [];

  return (
    <div>
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
            {table.map((row, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20,
                border: `1.5px solid ${colorFor(row.grade, sc, null, dark)}`,
                color: colorFor(row.grade, sc, null, dark),
                padding: "3px 12px", fontWeight: 700, fontSize: 13,
                fontFamily: "'Space Grotesk',sans-serif",
              }}>
                {row.label || fmt(row.grade, lang, 1)}
                <span style={{ color: "var(--sub)", fontWeight: 400, fontSize: 12 }}>
                  {t("keyFrom")} {fmt(row.from, lang, 1)}
                </span>
              </span>))}
          </div>
        </div>)}
    </div>);
}

/* ---------- Bearbeiten eines Schluessels ---------- */
function KeyEditor({ k, sc, lang, t, onChange, onDelete, dark }) {
  const [confirmReplace, setConfirmReplace] = useState(null);
  const rows = k.steps || [];
  const sorted = sortedSteps(rows);
  /* Warnung, wenn die Tabelle nicht bei 0 % endet: dann faellt alles
     darunter auf die schlechteste eingetragene Zeile – meist ungewollt. */
  const coversBottom = sorted.length > 0 && Number(sorted[sorted.length - 1].min) === 0;

  const setRow = (i, patch) =>
    onChange({ ...k, steps: rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  /* Nur nachfragen, wenn tatsaechlich etwas verloren gehen kann. */
  const replaceSteps = (next) => {
    if (rows.length) setConfirmReplace(next);
    else onChange({ ...k, type: "steps", steps: next });
  };

  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <input className="inp" style={{ flex: "1 1 140px", padding: "8px 10px", fontWeight: 700 }}
          value={k.name} maxLength={40} aria-label={t("keyName")}
          onChange={(e) => onChange({ ...k, name: e.target.value })} />
        <button className="xbtn" aria-label={t("keyDelete")} title={t("keyDelete")} onClick={onDelete}>✕</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <Segmented value={k.type} label={t("keyMode")}
          onChange={(v) => onChange({
            ...k, type: v,
            steps: v === "steps" && !rows.length ? (evenSteps(sc) || IHK_STEPS.map((s) => ({ ...s }))) : rows,
          })}
          options={[["steps", t("keySteps")], ["linear", t("keyLinear")]]} />
      </div>

      {k.type === "linear" ? (
        <div className="hint" style={{ marginTop: 8 }}>{t("keyLinearHint")}</div>
      ) : (
        <React.Fragment>
          <div className="hint" style={{ margin: "10px 0 6px" }}>{t("keyStepsHint")}</div>
          {rows.map((r, i) => (
            <div key={i} className="row" style={{ padding: "4px 0", gap: 8 }}>
              <span className="lbl" style={{ width: 34 }}>{t("keyFrom")}</span>
              <input className="num" inputMode="decimal" style={{ width: 66 }} value={r.min}
                aria-label={t("keyThreshold")}
                onChange={(e) => {
                  const v = filterNumInput(e.target.value).replace(/[+\-\u2212]/g, "");
                  setRow(i, { min: v === "" ? "" : Math.max(0, Math.min(100, Number(v) || 0)) });
                }} />
              <span className="lbl">%</span>
              <span className="lbl" style={{ marginLeft: "auto" }}>{t("grade")}</span>
              <input className="num" inputMode="decimal" style={{ width: 62, color: colorFor(parseNum(r.g), sc, null, dark) }}
                value={r.g} aria-label={t("grade")}
                onChange={(e) => setRow(i, { g: filterNumInput(e.target.value).slice(0, 5) })} />
              <button className="xbtn" aria-label={t("keyRowDelete")}
                onClick={() => onChange({ ...k, steps: rows.filter((_, j) => j !== i) })}>✕</button>
            </div>))}

          <button className="btn-ghost" style={{ marginTop: 8, padding: "6px 12px", fontSize: 13 }}
            onClick={() => onChange({ ...k, steps: [...rows, { g: "", min: 0 }] })}>
            + {t("keyRowAdd")}
          </button>

          {!coversBottom && rows.length > 0 && (
            <div className="hint" style={{ marginTop: 8, color: "var(--warn)", fontWeight: 700 }}>
              <Ic n="alert" size={13} />{t("keyNoZero")}
            </div>)}

          {/* Vorlagen ueberschreiben die Tabelle vollstaendig – deshalb
              die Rueckfrage, sobald schon etwas eingetragen ist. */}
          <div className="row" style={{ marginTop: 12, flexWrap: "wrap", gap: 6 }}>
            <span className="hint" style={{ width: "100%" }}>{t("keyPreset")}</span>
            {evenSteps(sc) && (
              <button className="chip-btn" onClick={() => replaceSteps(evenSteps(sc))}>
                {t("keyEven")}
              </button>)}
            {tendencySteps(sc) && (
              <button className="chip-btn" onClick={() => replaceSteps(tendencySteps(sc))}>
                {t("keyTend")}
              </button>)}
            <button className="chip-btn" onClick={() => replaceSteps(IHK_STEPS.map((x) => ({ ...x })))}>
              {t("keyIhk")}
            </button>
          </div>
          {confirmReplace && (
            <div className="banner banner-info" style={{ marginTop: 8 }}>
              <Ic n="alert" size={13} />{t("keyReplaceWarn")}
              <div className="row" style={{ marginTop: 8, gap: 8 }}>
                <button className="btn" style={{ padding: "6px 14px", fontSize: 13 }}
                  onClick={() => { onChange({ ...k, type: "steps", steps: confirmReplace }); setConfirmReplace(null); }}>
                  {t("keyReplaceOk")}
                </button>
                <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: 13, border: "none" }}
                  onClick={() => setConfirmReplace(null)}>{t("back")}</button>
              </div>
            </div>)}
          <div className="hint" style={{ marginTop: 8, fontSize: 12 }}>{t("keyTendHint")}</div>
        </React.Fragment>)}
    </div>);
}

/* ---------- Bildschirm ---------- */
export default function KeyCalc({ ds, sc, lang, t, dark, onChangeDs }) {
  const keys = ds.keys || [];
  const all = [LINEAR, ...keys];
  const [selId, setSelId] = useState(() => ds.defaultKeyId || "");
  const selected = all.find((k) => k.id === selId) || LINEAR;

  const upKey = (id, next) => onChangeDs({ keys: keys.map((k) => (k.id === id ? next : k)) });

  const addKey = () => {
    const k = freshKey(uid(), t("keyNewName"), sc);
    onChangeDs({ keys: [...keys, k], defaultKeyId: ds.defaultKeyId || k.id });
    setSelId(k.id);
  };

  const delKey = (id) => {
    onChangeDs({
      keys: keys.filter((k) => k.id !== id),
      defaultKeyId: ds.defaultKeyId === id ? "" : ds.defaultKeyId,
      /* Faecher, die auf diesen Schluessel zeigten, auf die Vorgabe
         zuruecksetzen – sonst zeigten sie einen Namen ohne Inhalt. */
      subjects: ds.subjects.map((s) => (s.keyId === id ? { ...s, keyId: "" } : s)),
    });
    if (selId === id) setSelId("");
  };

  return (
    <div>
      <div className="hint" style={{ marginBottom: 12 }}>{t("keyCalcHint")}</div>

      {/* Auswahl, mit welchem Schlüssel gerechnet wird */}
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <span className="lbl">{t("keyUse")}</span>
        <InfoTip text={t("keyScopeHint")} />
      </div>
      <select className="sel" style={{ maxWidth: "100%", width: "100%" }} value={selId}
        aria-label={t("keyUse")} onChange={(e) => setSelId(e.target.value)}>
        <option value="">{t("keyLinear")}</option>
        {keys.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
      </select>

      <div style={{ marginTop: 14 }}>
        <Calculator keyObj={selected} sc={sc} lang={lang} t={t} dark={dark} />
      </div>

      {/* Verwaltung */}
      <div style={{ marginTop: 24, borderTop: "2px solid var(--line)", paddingTop: 14 }}>
        <h2 className="sec"><Ic n="sliders" size={14} />{t("keyManage")}</h2>
        <div className="hint">{t("keyManageHint")}</div>

        {keys.map((k) => (
          <KeyEditor key={k.id} k={k} sc={sc} lang={lang} t={t} dark={dark}
            onChange={(next) => upKey(k.id, next)} onDelete={() => delKey(k.id)} />))}

        <button className="btn-ghost" style={{ marginTop: 14 }} onClick={addKey}>+ {t("keyNew")}</button>

        {keys.length > 0 && (
          <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div className="lbl" style={{ marginBottom: 6 }}>{t("keyDefault")}</div>
            <select className="sel" style={{ maxWidth: "100%", width: "100%" }} value={ds.defaultKeyId || ""}
              aria-label={t("keyDefault")} onChange={(e) => onChangeDs({ defaultKeyId: e.target.value })}>
              <option value="">{t("keyLinear")}</option>
              {keys.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <div className="hint" style={{ marginTop: 6 }}>{t("keyDefaultHint")}</div>
          </div>)}
      </div>
    </div>);
}
