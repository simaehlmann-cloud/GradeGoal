import React, { useState } from "react";
import { Ic } from "./icons.jsx";
import { parseNum, filterNumInput, fmt, colorFor, todayISO, isoToStamp, keyGrade } from "../lib/grades.js";
import { usePurchase, buyUnlock, restoreUnlock, FREE_TERMS } from "../lib/purchase.js";

/* ---------- Schalter ---------- */
export const Toggle = ({ on, onChange, label, disabled }) => (
  <label className="switch">
    <input type="checkbox" checked={!!on} aria-label={label} disabled={!!disabled}
      onChange={(e) => onChange(e.target.checked)} />
    <span className="slider"></span>
  </label>
);

/* ---------- Segmentierte Auswahl ---------- */
export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

/* ---------- Kontexthilfe ---------- */
export function InfoTip({ text }) {
  const [o, setO] = useState(false);
  return (
    <React.Fragment>
      <button onClick={() => setO(!o)} aria-label="Info" aria-expanded={o}
        style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", padding: "0 4px", verticalAlign: "middle" }}>
        <Ic n="info" size={15} style={{ marginRight: 0 }} />
      </button>
      {o && <div className="hint" style={{ background: "var(--blue-soft)", borderRadius: 10, padding: "8px 10px", margin: "4px 0 8px" }}>{text}</div>}
    </React.Fragment>);
}

/* ---------- Zahleneingabe ---------- */
export const NumInput = ({ value, onChange, ph, width = 74, color, label }) => (
  <input className="num" inputMode="decimal" enterKeyHint="done" value={value} placeholder={ph}
    aria-label={label} style={{ width, color: color || "var(--ink)" }}
    onChange={(e) => onChange(filterNumInput(e.target.value))} />
);

/* ---------- Zeile zum Hinzufuegen ---------- */
export function AddRow({ ph, btn, onAdd }) {
  const [v, setV] = useState("");
  const go = () => { const s = v.trim(); if (s) { onAdd(s.slice(0, 80)); setV(""); } };
  return (
    <div className="row" style={{ marginTop: 12 }}>
      <input className="inp" style={{ flex: 1 }} placeholder={ph} value={v} maxLength={80}
        enterKeyHint="done" onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
      <button className="btn" onClick={go}>+ {btn}</button>
    </div>);
}

/* =========================================================
   Schnelleingabe einer Einzelnote MIT Datum.

   Bisher wurde hart Date.now() gestempelt. Wer beim Einstieg fuenf
   zurueckliegende Noten nachtraegt, bekam fuenf identische Zeitstempel –
   die echte Zeitachse im Diagramm fiel dann stillschweigend auf die
   Indexachse zurueck. Das Datumsfeld ist eingeklappt, damit der
   Normalfall "Note von heute" weiterhin zwei Tipper braucht.
========================================================= */
export function QuickAdd({ ph, onAdd, label, dateLabel, dateHint, keyObj, sc, lang, t, dark }) {
  const [mode, setMode] = useState("grade");
  const [v, setV] = useState("");
  const [reached, setReached] = useState("");
  const [max, setMax] = useState("");
  const [date, setDate] = useState(todayISO);
  const [openDate, setOpenDate] = useState(false);

  const r = parseNum(reached), m = parseNum(max);
  const pointsOk = r != null && m != null && m > 0;
  /* Aus Punkten wird ueber den Schluessel des Fachs eine Note. Beides
     wird gespeichert, damit spaeter noch nachvollziehbar ist, woher
     die Note kam – und damit ein geaenderter Schluessel alte Eintraege
     nicht stillschweigend umdeutet. */
  const fromPoints = pointsOk ? keyGrade(keyObj, (r / m) * 100, sc) : null;
  const valid = mode === "grade" ? parseNum(v) != null : fromPoints != null;

  const reset = () => {
    setV(""); setReached(""); setMax("");
    setDate(todayISO()); setOpenDate(false);
  };

  const go = () => {
    if (!valid) return;
    if (mode === "grade") {
      onAdd({ v: v.trim(), d: isoToStamp(date) });
    } else {
      onAdd({ v: String(fromPoints), d: isoToStamp(date), p: { r, m } });
    }
    reset();
  };

  const canPoints = !!(sc && t);

  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
      {mode === "grade" ? (
        <input className="num-mini" inputMode="decimal" enterKeyHint="done" value={v} placeholder={ph} aria-label={label}
          onChange={(e) => setV(filterNumInput(e.target.value))} onKeyDown={(e) => e.key === "Enter" && go()} />
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
          <input className="num-mini" inputMode="decimal" enterKeyHint="next" value={reached}
            placeholder={t("keyReachedShort")} aria-label={t("keyReached")}
            onChange={(e) => setReached(filterNumInput(e.target.value))} onKeyDown={(e) => e.key === "Enter" && go()} />
          <span className="lbl">/</span>
          <input className="num-mini" inputMode="decimal" enterKeyHint="done" value={max}
            placeholder={t("keyMaxShort")} aria-label={t("keyMax")}
            onChange={(e) => setMax(filterNumInput(e.target.value))} onKeyDown={(e) => e.key === "Enter" && go()} />
          {fromPoints != null && (
            <span className="brand" style={{ fontSize: 15, minWidth: 30, textAlign: "center", color: colorFor(fromPoints, sc, null, dark) }}>
              {fmt(fromPoints, lang, 1)}
            </span>)}
        </span>)}

      {canPoints && (
        <button onClick={() => { setMode(mode === "grade" ? "points" : "grade"); reset(); }}
          className="date-btn" aria-pressed={mode === "points"}
          aria-label={t("keyTogglePoints")} title={t("keyTogglePoints")}>
          <Ic n="percent" size={13} style={{ marginRight: 0 }} />
        </button>)}

      <button onClick={() => setOpenDate(!openDate)} className="date-btn" aria-expanded={openDate}
        aria-label={dateLabel} title={dateLabel}>
        <Ic n="calendar" size={14} style={{ marginRight: 0 }} />
      </button>

      <button onClick={go} aria-label={label} disabled={!valid}
        style={{ border: "none", background: valid ? "var(--blue)" : "var(--border)", color: "#fff", borderRadius: "50%", width: 28, height: 28, cursor: valid ? "pointer" : "default", fontWeight: 700 }}>+</button>

      {openDate && (
        <span style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", marginTop: 4 }}>
          <input type="date" className="inp" style={{ maxWidth: 190 }} value={date} aria-label={dateLabel}
            max={todayISO()} onChange={(e) => setDate(e.target.value || todayISO())} />
          <span className="hint" style={{ fontSize: 12 }}>{dateHint}</span>
        </span>)}

      {mode === "points" && canPoints && (
        <span className="hint" style={{ fontSize: 12, width: "100%", marginTop: 2 }}>
          {keyObj && keyObj.name ? t("keyUsing") + " " + keyObj.name : t("keyUsingLinear")}
        </span>)}
    </span>);
}

/* ---------- Notenstempel ---------- */
export const Stamp = ({ value, label, sc, lang, dark }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{
      width: 76, height: 76, borderRadius: "50%",
      border: `4px solid ${colorFor(value, sc, null, dark)}`, color: colorFor(value, sc, null, dark),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 22,
      background: "var(--card)", margin: "0 auto", transform: "rotate(-4deg)", boxShadow: "var(--shadow)",
    }}>{fmt(value, lang)}</div>
    <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 6, fontWeight: 600, maxWidth: 110 }}>{label}</div>
  </div>
);

/* =========================================================
   Vollversion freischalten.

   Erscheint dort, wo der Gratis-Rahmen endet, und im Info-Bildschirm.
   Apple verlangt einen sichtbaren „Wiederherstellen“-Knopf – er steht
   deshalb immer neben dem Kauf-Knopf, auch wenn der Store gerade nicht
   erreichbar ist.
========================================================= */
export function UnlockCard({ t, compact, style }) {
  const p = usePurchase();
  const [note, setNote] = useState(null);
  if (p.unlocked) return null;

  const buy = async () => {
    setNote(null);
    const r = await buyUnlock();
    if (r === "ok") setNote({ ok: true, text: t("unlockDone") });
    else if (r === "pending") setNote({ ok: true, text: t("unlockPending") });
    else if (r === "error") setNote({ ok: false, text: t("unlockError") });
  };
  const restore = async () => {
    setNote(null);
    const r = await restoreUnlock();
    if (r === "ok") setNote({ ok: true, text: t("unlockDone") });
    else if (r === "none") setNote({ ok: false, text: t("restoreNone") });
    else setNote({ ok: false, text: t("unlockError") });
  };

  return (
    <div className={compact ? "pro-gate pro-gate-compact" : "pro-gate"} style={style}>
      <div className="row" style={{ gap: 6 }}>
        <Ic n="star" size={14} color="var(--blue)" />
        <strong style={{ fontSize: 14 }}>{t("unlockTitle")}</strong>
      </div>
      <div className="hint" style={{ marginTop: 4 }}>{t("unlockText")(FREE_TERMS)}</div>
      {p.native ? (
        <React.Fragment>
          {p.canBuy ? (
            <button className="btn" style={{ width: "100%", marginTop: 10 }} disabled={p.busy} onClick={buy}>
              {p.busy ? "…" : t("unlockBuy")(p.price)}
            </button>
          ) : (
            <div className="hint" style={{ marginTop: 8, fontSize: 12 }}>{t("unlockUnavailable")}</div>
          )}
          <button className="btn-ghost" style={{ width: "100%", marginTop: 8 }} disabled={p.busy} onClick={restore}>
            {t("restoreBtn")}
          </button>
          <div className="hint" style={{ marginTop: 6, fontSize: 11 }}>{t("unlockFine")}</div>
        </React.Fragment>
      ) : (
        <div className="hint" style={{ marginTop: 8, fontSize: 12 }}>{t("unlockWebHint")}</div>
      )}
      {note && (
        <div role="status" style={{ marginTop: 8, fontWeight: 700, fontSize: 13, color: note.ok ? "var(--green)" : "var(--red)" }}>{note.text}</div>
      )}
    </div>);
}
