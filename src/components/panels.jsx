import React, { useState } from "react";
import { Ic } from "./icons.jsx";
import { InfoTip } from "./ui.jsx";
import { parseNum, filterNumInput, fmt, colorFor, cName, catMean, mean, sName } from "../lib/grades.js";
import { catColor } from "./charts.jsx";

/* =========================================================
   Was-waere-wenn-Regler.

   Der Zielrechner arbeitet rueckwaerts ("welche Note brauche ich?").
   Hier geht es vorwaerts: eine zusaetzliche Note in einer Kategorie
   wird probeweise eingerechnet und der neue Schnitt sofort angezeigt.
   Rein rechnerisch, es wird nichts gespeichert.
========================================================= */
export function WhatIf({ subject, sc, lang, t, dark, current }) {
  const cats = (subject.cats || []).filter((c) => Number(c.weight) > 0);
  const [catId, setCatId] = useState(cats.length ? cats[0].id : "");
  /* Startwert: Mitte der Skala, auf 0,1 gerundet */
  const [val, setVal] = useState(() => Math.round(((sc.min + sc.max) / 2) * 10) / 10);

  if (!cats.length) return <div className="hint">{t("whatIfNoCats")}</div>;

  const active = cats.find((c) => c.id === catId) || cats[0];

  /* Neuen gewichteten Schnitt berechnen, als waere `val` bereits eingetragen. */
  let sum = 0, w = 0;
  for (const c of subject.cats || []) {
    const cw = Number(c.weight);
    if (!Number.isFinite(cw) || cw <= 0) continue;
    let m;
    if (c.id === active.id) {
      const vals = (c.grades || []).map((g) => parseNum(g && typeof g === "object" ? g.v : g)).filter((x) => x != null);
      m = mean([...vals, val]);
    } else {
      m = catMean(c);
    }
    if (m != null) { sum += m * cw; w += cw; }
  }
  const next = w ? sum / w : null;
  const better = current != null && next != null && (sc.bestLow ? next < current : next > current);
  const worse = current != null && next != null && (sc.bestLow ? next > current : next < current);

  /* Der Regler laeuft in Skalenrichtung; bei bestLow ist links "gut". */
  const step = 0.1;

  return (
    <div>
      <div className="hint" style={{ marginBottom: 10 }}>{t("whatIfHint")}</div>

      {cats.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <div className="lbl" style={{ marginBottom: 6 }}>{t("whatIfIn")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {cats.map((c, i) => {
              const on = c.id === active.id;
              return (
                <button key={c.id} aria-pressed={on} onClick={() => setCatId(c.id)}
                  style={{
                    borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    border: on ? "1.5px solid var(--blue)" : "1.5px solid var(--border)",
                    background: on ? "var(--blue)" : "var(--card)", color: on ? "#fff" : "var(--sub)",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: catColor(subject.cats.indexOf(c)), flexShrink: 0 }}></span>
                  {cName(c, lang)}
                </button>);
            })}
          </div>
        </div>)}

      <div className="row" style={{ gap: 12 }}>
        <span className="brand" style={{ fontSize: 26, minWidth: 54, textAlign: "center", color: colorFor(val, sc, null, dark) }}>
          {fmt(val, lang, 1)}
        </span>
        <input type="range" className="range" min={sc.min} max={sc.max} step={step} value={val}
          aria-label={t("whatIf")} onChange={(e) => setVal(Number(e.target.value))} />
      </div>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 12, flexWrap: "wrap" }}>
        <span className="lbl">{t("whatIfNew")}</span>
        <span className="row" style={{ gap: 8 }}>
          <span className="brand" style={{ fontSize: 15, color: "var(--sub)" }}>{fmt(current, lang)}</span>
          <Ic n={better ? "chart" : worse ? "chartDown" : "flat"} size={16}
            color={better ? "var(--green)" : worse ? "var(--red)" : "var(--sub)"} />
          <span className="brand" style={{ fontSize: 24, color: colorFor(next, sc, null, dark) }}>{fmt(next, lang)}</span>
        </span>
      </div>
    </div>);
}

/* =========================================================
   Ausgewaehlte Durchschnitte – eine Gruppe
========================================================= */
export function GroupRow({ g, a, ok, sc, ds, upDs, lang, t, dark, pushUndo }) {
  const [open, setOpen] = useState(!g.name);
  const upG = (p) => upDs({ groups: ds.groups.map((x) => (x.id === g.id ? { ...x, ...p } : x)) });
  return (
    <div style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
      <div className="row">
        <button onClick={() => setOpen(!open)} aria-expanded={open}
          style={{ background: "none", border: "none", cursor: "pointer", flex: 1, textAlign: "left", padding: 0, fontSize: 15, fontWeight: 700, color: "var(--ink)", minWidth: 0, overflowWrap: "anywhere" }}>
          {open ? "▾ " : "▸ "}{g.name || t("newGroup")}
        </button>
        <span className="brand" style={{ fontSize: 18, color: colorFor(a, sc, null, dark) }}>Ø {fmt(a, lang)}</span>
        {ok != null && (
          <span style={{
            fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "3px 10px",
            background: ok ? "var(--green-soft)" : "var(--red-soft)", color: ok ? "var(--green)" : "var(--red)",
          }}>
            {ok ? "✓" : "✗"} {t("target")} {fmt(parseNum(g.target), lang)} {ok ? t("reached") : t("notReached")}
          </span>)}
      </div>
      {open && (
        <div style={{ marginTop: 10 }}>
          <div className="row" style={{ marginBottom: 4 }}>
            <input className="inp" style={{ flex: 1 }} placeholder={t("groupName")} maxLength={60}
              value={g.name} onChange={(e) => upG({ name: e.target.value })} />
            <input className="inp" style={{ width: 88 }} inputMode="decimal" placeholder={t("target")}
              value={g.target} aria-label={t("target")} onChange={(e) => upG({ target: filterNumInput(e.target.value) })} />
          </div>
          <InfoTip text={t("infoTarget")} />
          <div className="lbl" style={{ marginBottom: 6 }}>{t("pickSubjects")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ds.subjects.map((s) => {
              const on = g.subjectIds.includes(s.id);
              return (
                <button key={s.id} aria-pressed={on}
                  onClick={() => upG({ subjectIds: on ? g.subjectIds.filter((i) => i !== s.id) : [...g.subjectIds, s.id] })}
                  style={{
                    borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    border: on ? "1.5px solid var(--blue)" : "1.5px solid var(--border)",
                    background: on ? "var(--blue)" : "var(--card)", color: on ? "#fff" : "var(--sub)",
                  }}>
                  {sName(s, lang)}
                </button>);
            })}
          </div>
          <button className="xbtn" style={{ marginTop: 10, fontSize: 13, fontWeight: 700, padding: 0 }}
            onClick={() => { pushUndo(); upDs({ groups: ds.groups.filter((x) => x.id !== g.id) }); }}>
            <Ic n="trash" size={13} />{t("deleteGroup")}
          </button>
        </div>)}
    </div>);
}
