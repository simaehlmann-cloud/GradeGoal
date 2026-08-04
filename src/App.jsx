import React, { useState, useEffect, useRef, useCallback } from "react";

import {
  uid, parseNum, filterNumInput, fmt, scaleOf, quality, colorFor,
  sName, cName, catMean, weightedCalc, neededGrade, subjWeight, subjectsMean, gv,
  keyOf, standardKeyFor,
} from "./lib/grades.js";
import { store, STORAGE_KEY } from "./lib/storage.js";
import { freshState, freshDataset, freshYear, freshAbi, defaultCats, migrateState } from "./lib/state.js";
import { exportBackup, exportCsv, buildPrintHtml, downloadBlob } from "./lib/exporters.js";
import { logError, logInfo, formatLog, getLog, clearLog } from "./lib/logger.js";
import { makeT, APP, APP_NAME, APP_SUB, APP_VER, DEVELOPER, CONTACT, PUBLISHER, PRIVACY_URL, IMPRINT_URL, T } from "./lib/i18n.js";
import { isPro, TIER } from "./lib/tier.js";
import { makeLock, isValidPin, PIN_MIN, PIN_MAX } from "./lib/security.js";

import { Ic, FlagDE, FlagEN } from "./components/icons.jsx";
import { Toggle, Segmented, InfoTip, NumInput, AddRow, QuickAdd, Stamp, ProGate, ProBadge, ProLink } from "./components/ui.jsx";
import { TrendChart, Spark, LongTermChart, catColor } from "./components/charts.jsx";
import { WhatIf, GroupRow } from "./components/panels.jsx";
import KeyCalc from "./components/KeyCalc.jsx";
import AbiCalc from "./components/AbiCalc.jsx";
import LockScreen from "./components/LockScreen.jsx";

/* =========================================================
   GradeGoal: Schulnoten & Grades  ·  Version 1.5.0
   Entwickelt von / developed by Simon Mählmann
========================================================= */

/* Notnagel, falls wider Erwarten kein Datensatz existiert. Konstante,
   damit nicht bei jedem Render 15 Faecher neu erzeugt werden. */
const EMPTY_DS = { id: "", label: "", yearId: "", scale: { type: "grades" }, subjects: [], groups: [], abi: { results: [], exams: [] } };

/* Vorlagen fuer Faechergruppen. Bewusst REIN STRUKTURELL: welche
   Durchschnitte fuer welchen Abschluss noetig sind, unterscheidet sich
   je Bundesland und aendert sich – eine falsche Zahl waere hier
   schlimmer als gar keine. Den Ziel-Ø traegt der Nutzer selbst ein. */
const PRESETS = [
  ["presetCore", ["Deutsch", "Mathematik", "Englisch"]],
  ["presetRest", null],
  ["presetScience", ["Biologie", "Chemie", "Physik", "Informatik"]],
  ["presetLang", ["Englisch", "Französisch"]],
  ["presetSocial", ["Geschichte", "Erdkunde", "Politik"]],
];

function burstConfetti() {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) {}
  const icons = ["🎉", "⭐", "✨", "🎊", "💛"];
  for (let i = 0; i < 26; i++) {
    const el = document.createElement("span");
    el.className = "confetti";
    el.textContent = icons[i % icons.length];
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDelay = Math.random() * 0.4 + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
}

/* ---------- Systemdesign beobachten ---------- */
function useSystemDark() {
  const read = () => {
    try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return false; }
  };
  const [d, setD] = useState(read);
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia("(prefers-color-scheme: dark)"); } catch (e) { return undefined; }
    const h = (e) => setD(e.matches);
    /* addListener ist veraltet, aeltere Android-WebViews kennen
       addEventListener auf MediaQueryList aber noch nicht. */
    if (mq.addEventListener) mq.addEventListener("change", h);
    else if (mq.addListener) mq.addListener(h);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", h);
      else if (mq.removeListener) mq.removeListener(h);
    };
  }, []);
  return d;
}

/* ========================================================= */
function App() {
  const [state, setState] = useState(freshState);
  const [loaded, setLoaded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState(null);
  const [saveErr, setSaveErr] = useState(null);
  const [undo, setUndo] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logTick, setLogTick] = useState(0);
  const [pinA, setPinA] = useState("");
  const [pinB, setPinB] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  const saveT = useRef(null);
  const msgT = useRef(null);
  const undoT = useRef(null);
  const fileRef = useRef(null);
  const prevMet = useRef({});
  const alive = useRef(true);

  const sysDark = useSystemDark();

  /* ----- Ableitungen ----- */
  const t = useCallback(makeT(state.lang), [state.lang]);
  const dark = state.theme === "dark" || (state.theme === "system" && sysDark);
  const ds = state.datasets.find((d) => d.id === state.activeId) || state.datasets[0] || EMPTY_DS;
  const sc = scaleOf(ds);
  const years = state.years && state.years.length ? state.years : [{ id: "", label: "" }];

  /* Pro-Funktionen sind in der Lite-Ausgabe hart aus. Das laeuft ueber
     dieselbe eff-Logik wie die Nutzereinstellungen, damit im UI-Code nur
     EINE Stelle ueber Sichtbarkeit entscheidet. */
  const userEff = state.features.simple
    ? { wish: false, cats: false, groups: false, charts: false }
    : { charts: true, ...state.features };
  const eff = { ...userEff, charts: userEff.charts && isPro, groups: userEff.groups && isPro };
  const C = (v, mode) => colorFor(v, sc, mode, dark);

  const flash = useCallback((text, kind = "ok") => {
    clearTimeout(msgT.current);
    setMsg({ text, kind });
    msgT.current = setTimeout(() => alive.current && setMsg(null), 4000);
  }, []);

  /* ----- Laden ----- */
  useEffect(() => {
    alive.current = true;
    (async () => {
      const saved = await store.get(STORAGE_KEY);
      if (saved) {
        const migrated = migrateState(saved);
        if (migrated) setState(migrated);
        else logError("Gespeicherte Daten unbrauchbar – starte mit leerem Zustand");
      }
      if (alive.current) setLoaded(true);
    })();
    return () => { alive.current = false; };
  }, []);

  /* ----- Speichern (entprellt) mit Rueckmeldung bei Fehlschlag ----- */
  useEffect(() => {
    if (!loaded) return undefined;
    clearTimeout(saveT.current);
    saveT.current = setTimeout(async () => {
      const r = await store.set(STORAGE_KEY, state);
      if (alive.current) setSaveErr(r.ok ? null : r.reason);
    }, 600);
    return () => clearTimeout(saveT.current);
  }, [state, loaded]);

  useEffect(() => () => {
    clearTimeout(saveT.current);
    clearTimeout(msgT.current);
    clearTimeout(undoT.current);
  }, []);

  /* ----- Design auf das Dokument anwenden ----- */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", dark ? "#101826" : "#EEF2F7");
  }, [dark]);

  /* ----- Druckansicht nur bei Bedarf bauen ----- */
  const printData = useRef(null);
  printData.current = { state, ds, t };
  const buildPrint = useCallback(() => {
    const el = document.getElementById("print");
    if (!el) return;
    const p = printData.current;
    try {
      el.innerHTML = buildPrintHtml(p.state, p.ds, p.t, APP);
    } catch (e) {
      logError("Druckansicht konnte nicht erstellt werden", e);
      el.textContent = "";
    }
  }, []);

  useEffect(() => {
    window.addEventListener("beforeprint", buildPrint);
    let mq = null;
    const onMq = (e) => { if (e.matches) buildPrint(); };
    try {
      mq = window.matchMedia("print"); /* Safari kennt beforeprint nicht zuverlaessig */
      if (mq.addEventListener) mq.addEventListener("change", onMq);
      else if (mq.addListener) mq.addListener(onMq);
    } catch (e) { mq = null; }
    return () => {
      window.removeEventListener("beforeprint", buildPrint);
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener("change", onMq);
        else if (mq.removeListener) mq.removeListener(onMq);
      }
    };
  }, [buildPrint]);

  /* ----- Zustandsaenderungen ----- */
  const up = (p) => setState((s) => ({ ...s, ...p }));
  const upDs = (p) => setState((s) => ({
    ...s,
    datasets: s.datasets.map((d) => (d.id === s.activeId ? { ...d, ...p } : d)),
  }));

  const upSubject = (id, p) => {
    setState((s) => ({
      ...s,
      datasets: s.datasets.map((d) =>
        d.id !== s.activeId ? d : { ...d, subjects: d.subjects.map((x) => (x.id === id ? { ...x, ...p } : x)) }),
    }));
    const before = ds.subjects.find((x) => x.id === id);
    if (!before) return;
    const next = { ...before, ...p };
    const g = parseNum(next.grade), w = parseNum(next.wish);
    const met = g != null && w != null && (sc.bestLow ? g <= w : g >= w);
    if (met && !prevMet.current[id]) burstConfetti();
    prevMet.current[id] = met;
  };

  const subject = ds.subjects.find((x) => x.id === state.selSubject) || null;

  /* Gesamtschnitt jetzt MIT Fachgewichtung (Gewicht 0 zaehlt nicht mit) */
  const overallAvg = subjectsMean(ds.subjects, "grade");
  const wishAvg = subjectsMean(ds.subjects, "wish");
  const anyWeighted = ds.subjects.some((s) => subjWeight(s) !== 1);

  const groupAvg = (g) => subjectsMean(ds.subjects.filter((s) => g.subjectIds.includes(s.id)), "grade");
  const groupOk = (g) => {
    const a = groupAvg(g), tg = parseNum(g.target);
    if (a == null || tg == null) return null;
    return sc.bestLow ? a <= tg : a >= tg;
  };

  /* ----- Rueckgaengig ----- */
  const pushUndo = () => {
    clearTimeout(undoT.current);
    setUndo({ datasets: state.datasets, years: state.years, activeId: state.activeId });
    undoT.current = setTimeout(() => alive.current && setUndo(null), 6000);
  };
  const doUndo = () => {
    clearTimeout(undoT.current);
    if (undo) setState((s) => ({ ...s, datasets: undo.datasets, years: undo.years, activeId: undo.activeId }));
    setUndo(null);
  };

  const addPreset = (key) => {
    const name = t(key);
    if (ds.groups.some((g) => g.name === name)) { flash(t("presetExists"), "err"); return; }
    const def = (PRESETS.find(([k]) => k === key) || [])[1];
    const deName = (s) => (typeof s.name === "string" ? s.name : s.name.de);
    let ids;
    if (def) {
      ids = ds.subjects.filter((s) => def.includes(deName(s))).map((s) => s.id);
    } else {
      const core = new Set(ds.subjects.filter((s) => ["Deutsch", "Mathematik", "Englisch"].includes(deName(s))).map((s) => s.id));
      ids = ds.subjects.filter((s) => !core.has(s.id)).map((s) => s.id);
    }
    upDs({ groups: [...ds.groups, { id: uid(), name, subjectIds: ids, target: "" }] });
  };

  /* ----- Import / Export ----- */
  const doExport = () => { if (!exportBackup(state)) flash(t("exportErr"), "err"); };
  const doCsv = () => { if (!exportCsv(state)) flash(t("exportErr"), "err"); };
  const doPrint = () => { buildPrint(); try { window.print(); } catch (e) { logError("Drucken nicht möglich", e); } };

  const doImport = (file) => {
    const r = new FileReader();
    r.onerror = () => { logError("Datei konnte nicht gelesen werden"); flash(t("importRead"), "err"); };
    r.onload = () => {
      let parsed = null;
      try {
        parsed = JSON.parse(r.result);
      } catch (e) {
        logError("Sicherung ist kein gültiges JSON", e);
        flash(t("importErr"), "err");
        return;
      }
      const migrated = migrateState(parsed);
      if (!migrated) { flash(t("importErr"), "err"); return; }
      prevMet.current = {};
      setUndo(null);
      /* Eine importierte Sperre wuerde den Nutzer sofort aussperren, obwohl
         er die App gerade offen hat. Die aktuelle Sitzung bleibt deshalb
         entsperrt; die Sperre greift erst beim naechsten Start. */
      setUnlocked(true);
      setState({ ...migrated, screen: "home" });
      logInfo("Sicherung importiert");
      flash(t("importOk"), "ok");
    };
    try { r.readAsText(file); } catch (e) { flash(t("importRead"), "err"); }
  };

  const copyLog = async () => {
    const text = formatLog();
    try {
      await navigator.clipboard.writeText(text);
      flash(t("copied"), "ok");
    } catch (e) {
      downloadBlob(new Blob([text], { type: "text/plain" }), "gradegoal-protokoll.txt");
    }
  };

  const hardReset = () => {
    const f = freshState();
    prevMet.current = {};
    setUndo(null);
    setConfirmReset(false);
    setUnlocked(true);
    setState(f);
    store.set(STORAGE_KEY, f);
  };

  /* ----- PIN ----- */
  const savePin = async () => {
    if (!isValidPin(pinA)) { flash(t("lockFormat"), "err"); return; }
    if (pinA !== pinB) { flash(t("lockMismatch"), "err"); return; }
    setPinBusy(true);
    try {
      const lock = await makeLock(pinA);
      if (!alive.current) return;
      up({ lock });
      setPinA(""); setPinB("");
      flash(t("lockSaved"), "ok");
    } catch (e) {
      logError("PIN konnte nicht gespeichert werden", e);
      flash(t("exportErr"), "err");
    } finally {
      if (alive.current) setPinBusy(false);
    }
  };

  if (!loaded) return null;

  /* Sperrbildschirm vor allem anderen – aber erst nach dem Laden, sonst
     blitzt er bei jedem Start kurz auf. */
  if (state.lock && state.lock.on && !unlocked) {
    return <LockScreen lock={state.lock} t={t} onUnlock={() => setUnlocked(true)} onResetAll={hardReset} />;
  }

  const snack = undo ? (
    <div className="snack" role="status">
      <span>{t("undoDeleted")}</span>
      <button onClick={doUndo}>↩ {t("undoBtn")}</button>
    </div>) : null;

  const banner = saveErr ? (
    <div className="banner" role="alert">
      <Ic n="alert" size={14} />{saveErr === "quota" ? t("saveFailQuota") : t("saveFailGeneric")}
    </div>) : null;

  const flashBox = msg ? (
    <div style={{ marginTop: 10, fontWeight: 700, color: msg.kind === "ok" ? "var(--green)" : "var(--red)" }} role="status">{msg.text}</div>
  ) : null;

  /* ============ START ============ */
  if (state.screen === "start") return (
    <div className="screen-center">
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div className="brand" style={{ fontSize: 44, letterSpacing: "-0.02em" }}>
          {APP_NAME}<span style={{ color: "var(--blue)" }}>.</span>
        </div>
        <div style={{ color: "var(--sub)", marginTop: 2, fontSize: 15 }}>
          {APP_SUB}{isPro && <span className="pro-badge" style={{ marginLeft: 6 }}>Pro</span>}
        </div>
        <div style={{ color: "var(--sub)", marginTop: 8, fontSize: 16 }}>{t("tagline")}</div>
        <div className="lbl" style={{ margin: "34px 0 10px", textTransform: "uppercase", letterSpacing: ".05em" }}>{t("chooseLang")}</div>
        <div style={{ display: "flex", gap: 22, justifyContent: "center", marginBottom: 34 }}>
          {[["de", FlagDE], ["en", FlagEN]].map(([lg, Flag]) => (
            <button key={lg} onClick={() => up({ lang: lg })} aria-pressed={state.lang === lg}
              style={{
                background: "var(--card)", border: state.lang === lg ? "3px solid var(--blue)" : "3px solid transparent",
                borderRadius: 16, padding: 12, cursor: "pointer", boxShadow: "var(--shadow)",
              }}>
              <Flag size={84} />
              <div className="brand" style={{ marginTop: 8, fontSize: 15 }}>{T[lg].langName}</div>
            </button>))}
        </div>
        <button className="btn" style={{ fontSize: 17, padding: "13px 34px" }} onClick={() => up({ screen: "setup" })}>{t("start")} →</button>
        <div style={{ marginTop: 22 }}>
          <button className="btn-ghost" style={{ border: "none", color: "var(--faint)" }} onClick={() => up({ screen: "about", aboutFrom: "start" })}>
            <Ic n="info" size={14} />{t("aboutBtn")}
          </button>
        </div>
      </div>
    </div>);

  /* ============ ÜBER / INFO ============ */
  if (state.screen === "about") return (
    <div className="wrap">
      <button className="btn-ghost" style={{ border: "none", paddingLeft: 0 }}
        onClick={() => up({ screen: state.aboutFrom || "home" })}>← {t("back")}</button>
      <h1 className="brand" style={{ fontSize: 30, margin: "8px 0 16px" }}><Ic n="info" size={24} />{t("about")}</h1>
      <div className="card">
        <div className="brand" style={{ fontSize: 22 }}>
          {APP_NAME}<span style={{ color: "var(--blue)" }}>.</span>{" "}
          <span style={{ fontSize: 14, color: "var(--sub)", fontWeight: 400 }}>{APP_SUB}</span>
        </div>
        {t("aboutText").map((p, i) => <p key={i} style={{ lineHeight: 1.6, fontSize: 15 }}>{p}</p>)}
      </div>
      <div className="card">
        <h2 className="sec">{t("aboutFeatTitle")}</h2>
        {t("aboutFeatures").map(([icon, title, text], i) => (
          <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", padding: "10px 0" }}>
            <strong style={{ fontSize: 15 }}><Ic n={icon} size={16} color="var(--blue)" />{title}</strong>
            <p style={{ margin: "4px 0 0", lineHeight: 1.55, fontSize: 14, color: "var(--sub)" }}>{text}</p>
          </div>))}
      </div>
      {!isPro && (
        <div className="card">
          <h2 className="sec"><Ic n="lock" size={14} />{t("proTeaser")}</h2>
          <p style={{ margin: 0, lineHeight: 1.6, fontSize: 14, color: "var(--sub)" }}>{t("proList")}</p>
          <p style={{ margin: "8px 0 0", lineHeight: 1.6, fontSize: 13, color: "var(--faint)" }}>{t("proMigrate")}</p>
          <ProLink t={t} style={{ marginTop: 12 }} />
        </div>)}
      <div className="card">
        <h2 className="sec"><Ic n="lock" size={14} />{t("aboutPrivacyTitle")}</h2>
        <p style={{ margin: 0, lineHeight: 1.6, fontSize: 15 }}>{t("aboutPrivacy")}</p>
      </div>
      <div className="card">
        <h2 className="sec">{t("legalTitle")}</h2>
        <div className="row" style={{ justifyContent: "space-between" }}><span className="lbl">{t("publisher")}</span><strong>{PUBLISHER}</strong></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span className="lbl">{t("developedBy")}</span><strong>{DEVELOPER}</strong></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span className="lbl">{t("version")}</span><span>{APP_VER}</span></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span className="lbl">{t("edition")}</span><span>{isPro ? "Pro" : "Lite"}</span></div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}><span className="lbl">{t("contact")}</span><span style={{ color: "var(--sub)" }}>{CONTACT}</span></div>
        {(PRIVACY_URL || IMPRINT_URL) && (
          <div className="row" style={{ marginTop: 14, flexWrap: "wrap", gap: 8 }}>
            {IMPRINT_URL && (
              <a className="btn-ghost" style={{ textDecoration: "none" }}
                href={IMPRINT_URL} target="_blank" rel="noopener noreferrer">{t("imprintLink")}</a>)}
            {PRIVACY_URL && (
              <a className="btn-ghost" style={{ textDecoration: "none" }}
                href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">{t("privacyLink")}</a>)}
          </div>)}
        <div style={{ marginTop: 14, fontSize: 12, color: "var(--faint)" }}>© 2026 {PUBLISHER} · {DEVELOPER}</div>
      </div>
    </div>);

  /* ============ RECHNER: NOTENSCHLÜSSEL ============ */
  if (state.screen === "key") return (
    <div className="wrap">
      <button className="btn-ghost" style={{ border: "none", paddingLeft: 0 }} onClick={() => up({ screen: "home" })}>← {t("back")}</button>
      <h1 className="brand" style={{ fontSize: 28, margin: "8px 0 16px" }}><Ic n="percent" size={22} />{t("keyCalc")}</h1>
      <div className="card">
        <ProGate feature="key" t={t}>
          <KeyCalc ds={ds} sc={sc} t={t} lang={state.lang} dark={dark}
            onChangeDs={(patch) => upDs(patch)} />
        </ProGate>
      </div>
    </div>);

  /* ============ RECHNER: ABITUR ============ */
  if (state.screen === "abi") return (
    <div className="wrap">
      <button className="btn-ghost" style={{ border: "none", paddingLeft: 0 }} onClick={() => up({ screen: "home" })}>← {t("back")}</button>
      <h1 className="brand" style={{ fontSize: 28, margin: "8px 0 16px" }}><Ic n="cap" size={22} />{t("abi")}</h1>
      <div className="card">
        <ProGate feature="abi" t={t}>
          <AbiCalc abi={ds.abi || freshAbi()} t={t} lang={state.lang} onChange={(next) => upDs({ abi: next })} />
        </ProGate>
      </div>
    </div>);

  /* ============ SETUP / EINSTELLUNGEN ============ */
  if (state.screen === "setup" || state.screen === "settings") {
    const isSettings = state.screen === "settings";
    return (
      <div className="wrap">
        {isSettings && <button className="btn-ghost" style={{ border: "none", paddingLeft: 0 }} onClick={() => up({ screen: "home" })}>← {t("back")}</button>}
        <h1 className="brand" style={{ fontSize: 30, margin: "8px 0 16px" }}>
          {isSettings ? <React.Fragment><Ic n="settings" size={24} />{t("settings")}</React.Fragment> : t("profile")}
        </h1>
        {banner}

        <div className="card">
          <h2 className="sec">{t("profile")}</h2>
          <label className="lbl" htmlFor="f-name">{t("yourName")} ({t("optional")})</label>
          <input id="f-name" className="inp" style={{ margin: "6px 0 14px" }} maxLength={60} value={state.name} onChange={(e) => up({ name: e.target.value })} />
          <label className="lbl" htmlFor="f-school">{t("school")} ({t("optional")})</label>
          <input id="f-school" className="inp" style={{ marginTop: 6 }} maxLength={80} value={state.school} onChange={(e) => up({ school: e.target.value })} />
        </div>

        <div className="card">
          <h2 className="sec">{t("scale")}</h2>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {[["grades", t("scaleGrades"), t("scaleGradesHint"), true],
              ["points", t("scalePoints"), t("scalePointsHint"), true],
              ["custom", t("scaleCustom"), "", isPro]].map(([v, l, h, allowed]) => (
              <button key={v} disabled={!allowed} aria-pressed={ds.scale.type === v}
                onClick={() => allowed && upDs({ scale: { ...ds.scale, type: v } })}
                style={{
                  flex: "1 1 30%", padding: "10px 8px", borderRadius: 12, cursor: allowed ? "pointer" : "default",
                  border: ds.scale.type === v ? "2.5px solid var(--blue)" : "1.5px solid var(--border)",
                  background: ds.scale.type === v ? "var(--blue-soft)" : "var(--card)",
                  textAlign: "center", opacity: allowed ? 1 : 0.5,
                }}>
                <div className="brand" style={{ fontSize: 15 }}>{l}{!allowed && <ProBadge t={t} />}</div>
                {h && <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>{h}</div>}
              </button>))}
          </div>
          {ds.scale.type === "custom" && isPro && (
            <div className="row" style={{ marginTop: 12, flexWrap: "wrap", gap: 12 }}>
              <label className="lbl">{t("min")} <input className="inp" inputMode="decimal" style={{ width: 70, marginLeft: 6, display: "inline-block", padding: 8 }}
                value={ds.scale.min} onChange={(e) => upDs({ scale: { ...ds.scale, min: filterNumInput(e.target.value) } })} /></label>
              <label className="lbl">{t("max")} <input className="inp" inputMode="decimal" style={{ width: 70, marginLeft: 6, display: "inline-block", padding: 8 }}
                value={ds.scale.max} onChange={(e) => upDs({ scale: { ...ds.scale, max: filterNumInput(e.target.value) } })} /></label>
              <label className="lbl row"><input type="checkbox" checked={!!ds.scale.bestLow}
                onChange={(e) => upDs({ scale: { ...ds.scale, bestLow: e.target.checked } })} /> {t("bestLow")}</label>
            </div>)}
          <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 10 }}>{t("scaleWarn")}</div>
        </div>

        <div className="card">
          <h2 className="sec">{isSettings ? t("display") : t("onboardTitle")}</h2>
          {!isSettings && <div className="hint" style={{ marginBottom: 8 }}>{t("onboardHint")}{" "}
            <button onClick={() => up({ screen: "about", aboutFrom: "setup" })}
              style={{ background: "none", border: "none", color: "var(--blue)", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13, textDecoration: "underline" }}>
              {t("onboardInfo")}</button></div>}

          <div className="row" style={{ justifyContent: "space-between", padding: "8px 0" }}>
            <div><strong><Ic n="eye" size={16} />{t("simpleMode")}</strong><div className="hint">{t("simpleModeHint")}</div></div>
            <Toggle on={state.features.simple} label={t("simpleMode")} onChange={(v) => up({ features: { ...state.features, simple: v } })} />
          </div>
          {[["wish", "star", t("featWish"), true],
            ["cats", "book", t("featCats"), true],
            ["charts", "chart", t("featCharts"), isPro],
            ["groups", "sigma", t("featGroups"), isPro]].map(([k, ic, label, allowed]) => (
            <div key={k} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line)", opacity: state.features.simple || !allowed ? 0.45 : 1 }}>
              <strong style={{ fontWeight: 600 }}><Ic n={ic} size={16} />{label}{!allowed && <ProBadge t={t} />}</strong>
              <Toggle on={eff[k]} label={label} disabled={!allowed}
                onChange={(v) => allowed && up({ features: { ...state.features, [k]: v, simple: false } })} />
            </div>))}

          <div style={{ padding: "12px 0 4px", borderTop: "1px solid var(--line)" }}>
            <strong style={{ fontWeight: 600, display: "block", marginBottom: 8 }}><Ic n="moon" size={16} />{t("themeMode")}</strong>
            <Segmented value={state.theme} label={t("themeMode")} onChange={(v) => up({ theme: v })}
              options={[["system", t("themeSystem")], ["light", t("themeLight")], ["dark", t("themeDark")]]} />
            <div className="hint" style={{ marginTop: 6 }}>{t("themeHint")}</div>
          </div>
        </div>

        {isSettings && (<React.Fragment>
          {/* ---------- Schuljahre & Halbjahre ---------- */}
          <div className="card">
            <h2 className="sec"><Ic n="calendar" size={14} />{t("terms")}</h2>
            <div className="hint" style={{ marginBottom: 8 }}>{t("termsHint")}</div>

            <ProGate feature="terms" t={t} compact>
              {years.map((yr) => {
                const inYear = state.datasets.filter((d) => d.yearId === yr.id);
                return (
                  <div key={yr.id} className="year-block">
                    <div className="row" style={{ marginBottom: 4 }}>
                      <Ic n="archive" size={14} color="var(--sub)" />
                      <input className="inp" style={{ flex: 1, padding: "6px 10px", fontWeight: 700 }} value={yr.label}
                        maxLength={40} aria-label={t("yearName")}
                        onChange={(e) => up({ years: state.years.map((x) => (x.id === yr.id ? { ...x, label: e.target.value } : x)) })} />
                      {state.years.length > 1 && (
                        <button className="xbtn" aria-label={t("deleteYear")} title={t("deleteYear")}
                          onClick={() => {
                            /* Ein Schuljahr mit Inhalt zu loeschen wuerde die
                               Halbjahre unsichtbar machen – deshalb blockiert. */
                            if (inYear.length) { flash(t("deleteYearBlocked"), "err"); return; }
                            pushUndo();
                            up({ years: state.years.filter((x) => x.id !== yr.id) });
                          }}>✕</button>)}
                    </div>

                    {inYear.map((d) => {
                      const a = subjectsMean(d.subjects, "grade");
                      const dsc = scaleOf(d);
                      const p = a == null ? 0 : quality(a, dsc);
                      return (
                        <div key={d.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0 10px 18px" }}>
                          <div className="row">
                            <input className="inp" style={{ flex: 1, padding: "8px 10px" }} value={d.label} maxLength={60} aria-label={t("termName")}
                              onChange={(e) => up({ datasets: state.datasets.map((x) => (x.id === d.id ? { ...x, label: e.target.value } : x)) })} />
                            <span className="brand" style={{ color: colorFor(a, dsc, null, dark), minWidth: 52, textAlign: "right" }}>Ø {fmt(a, state.lang)}</span>
                            {d.id === state.activeId
                              ? <span style={{ fontSize: 12, fontWeight: 700, background: "var(--green-soft)", color: "var(--green)", borderRadius: 20, padding: "4px 10px" }}>✓ {t("active")}</span>
                              : <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 13 }}
                                  onClick={() => { prevMet.current = {}; up({ activeId: d.id, selSubject: null }); }}>{t("activate")}</button>}
                            {state.datasets.length > 1 && d.id !== state.activeId &&
                              <button className="xbtn" title={t("deleteTerm")} aria-label={t("deleteTerm")}
                                onClick={() => { pushUndo(); up({ datasets: state.datasets.filter((x) => x.id !== d.id) }); }}>✕</button>}
                          </div>
                          {state.years.length > 1 && (
                            <div className="row" style={{ marginTop: 6, gap: 6 }}>
                              <span className="hint" style={{ fontSize: 11 }}>{t("moveToYear")}</span>
                              <select className="sel" value={d.yearId} aria-label={t("moveToYear")}
                                onChange={(e) => up({ datasets: state.datasets.map((x) => (x.id === d.id ? { ...x, yearId: e.target.value } : x)) })}>
                                {years.map((y2) => <option key={y2.id} value={y2.id}>{y2.label}</option>)}
                              </select>
                            </div>)}
                          <div style={{ height: 6, background: "var(--chip)", borderRadius: 4, marginTop: 8 }}>
                            <div style={{ height: 6, width: p * 100 + "%", background: colorFor(a, dsc, null, dark), borderRadius: 4 }}></div>
                          </div>
                        </div>);
                    })}

                    <button className="btn-ghost" style={{ marginTop: 10, marginLeft: 18, padding: "6px 12px", fontSize: 13 }}
                      onClick={() => up({ datasets: [...state.datasets, freshDataset(state.lang === "de" ? "Neues Halbjahr" : "New term", yr.id)] })}>
                      + {t("newTerm")}
                    </button>
                  </div>);
              })}

              <button className="btn-ghost" style={{ marginTop: 14 }}
                onClick={() => up({ years: [...state.years, freshYear(state.lang === "de" ? "Neues Schuljahr" : "New school year")] })}>
                + {t("newYear")}
              </button>
            </ProGate>
          </div>

          {/* ---------- PIN-Sperre ---------- */}
          <div className="card">
            <h2 className="sec"><Ic n="lock" size={14} />{t("lock")}</h2>
            {/* Das Aufheben liegt BEWUSST ausserhalb des Pro-Hinweises.
                Sonst waere folgender Ablauf eine Sackgasse: Sicherung in Pro
                mit PIN erstellt, in Lite importiert – die Sperre greift, der
                Knopf zum Aufheben ist aber unsichtbar. Der einzige Ausweg
                waere das Loeschen aller Daten. */}
            {state.lock && state.lock.on ? (
              <React.Fragment>
                <div className="banner banner-info" style={{ marginBottom: 10 }}>
                  <Ic n="alert" size={14} />{t("lockHint")}
                </div>
                <button className="btn-danger" style={{ width: "100%" }}
                  onClick={() => { up({ lock: null }); flash(t("lockRemove"), "ok"); }}>
                  <Ic n="trash" size={14} />{t("lockRemove")}
                </button>
                {flashBox}
              </React.Fragment>
            ) : (
            <ProGate feature="lock" t={t} compact>
              <div className="banner banner-info" style={{ marginBottom: 10 }}>
                <Ic n="alert" size={14} />{t("lockHint")}
              </div>
              <div className="hint" style={{ marginBottom: 8 }}>{t("lockForgotHint")}</div>
              <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
                <label className="lbl" style={{ flex: "1 1 130px" }}>
                  {t("lockSet")}
                      <input className="inp" style={{ marginTop: 4 }} type="password" inputMode="numeric"
                        autoComplete="new-password" maxLength={PIN_MAX} value={pinA}
                        onChange={(e) => setPinA(e.target.value.replace(/\D/g, "").slice(0, PIN_MAX))} />
                    </label>
                    <label className="lbl" style={{ flex: "1 1 130px" }}>
                      {t("lockRepeat")}
                      <input className="inp" style={{ marginTop: 4 }} type="password" inputMode="numeric"
                        autoComplete="new-password" maxLength={PIN_MAX} value={pinB}
                        onChange={(e) => setPinB(e.target.value.replace(/\D/g, "").slice(0, PIN_MAX))} />
                    </label>
                  </div>
              <button className="btn" style={{ width: "100%", marginTop: 12 }} onClick={savePin}
                disabled={pinBusy || pinA.length < PIN_MIN || pinB.length < PIN_MIN}>
                <Ic n="lock" size={14} />{t("lockSave")}
              </button>
              {flashBox}
            </ProGate>)}
          </div>

          {/* ---------- Daten ---------- */}
          <div className="card">
            <h2 className="sec"><Ic n="save" size={14} />{t("data")}</h2>
            <div className="hint" style={{ marginBottom: 10 }}>{t("dataHint")}</div>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <button className="btn-ghost" onClick={doExport}><Ic n="download" size={15} />{t("exportBtn")}</button>
              <button className="btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}><Ic n="upload" size={15} />{t("importBtn")}</button>
              <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) doImport(f); e.target.value = ""; }} />
              {isPro && <button className="btn-ghost" onClick={doCsv}><Ic n="table" size={15} />{t("exportCsvBtn")}</button>}
              <button className="btn-ghost" onClick={doPrint}><Ic n="printer" size={15} />{t("printBtn")}</button>
            </div>
            {isPro && <div className="hint" style={{ marginTop: 8 }}>{t("csvHint")}</div>}
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14 }}>
              <button className="btn-danger" style={{ width: "100%", background: confirmReset ? "var(--red)" : "var(--card)", color: confirmReset ? "#fff" : "var(--red)" }}
                onClick={() => { if (!confirmReset) return setConfirmReset(true); hardReset(); }}>
                <Ic n={confirmReset ? "alert" : "trash"} size={15} />{confirmReset ? t("resetConfirm") : t("resetBtn")}
              </button>
              {confirmReset && <button className="btn-ghost" style={{ width: "100%", marginTop: 8, border: "none" }} onClick={() => setConfirmReset(false)}>{t("back")}</button>}
            </div>
          </div>

          {/* ---------- Diagnose ---------- */}
          <div className="card">
            <h2 className="sec"><Ic n="bug" size={14} />{t("diagnostics")}</h2>
            <div className="hint" style={{ marginBottom: 10 }}>{t("diagnosticsHint")}</div>
            <button className="btn-ghost" onClick={() => { setLogTick((n) => n + 1); setLogOpen(!logOpen); }} aria-expanded={logOpen}>
              {logOpen ? "▾ " : "▸ "}{getLog().length}×
            </button>
            {logOpen && (
              <React.Fragment>
                <div className="log-box" style={{ marginTop: 10 }} key={logTick}>{getLog().length ? formatLog() : t("logEmpty")}</div>
                <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}>
                  <button className="btn-ghost" onClick={copyLog}>{t("copyLog")}</button>
                  <button className="btn-ghost" onClick={() => { clearLog(); setLogTick((n) => n + 1); }}>{t("clearLogBtn")}</button>
                </div>
              </React.Fragment>)}
          </div>

          <button className="btn-ghost" style={{ width: "100%", marginBottom: 14 }} onClick={() => up({ screen: "about", aboutFrom: "settings" })}>
            <Ic n="info" size={15} />{t("aboutBtn")}
          </button>
        </React.Fragment>)}

        {!isSettings && (
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => up({ screen: "home" })}>{t("skip")}</button>
            <button className="btn" onClick={() => up({ screen: "home" })}>{t("continue")} →</button>
          </div>)}
        {snack}
      </div>);
  }

  /* ============ FACH-DETAIL ============ */
  if (subject) {
    const calc = weightedCalc(subject);
    const subjKey = keyOf(ds, subject);
    const defaultKey = (ds.keys || []).find((k) => k.id === ds.defaultKeyId);
    const defaultKeyName = defaultKey
      ? defaultKey.name
      : (standardKeyFor(sc) ? t("keyStandard") : t("keyLinear"));
    const g = parseNum(subject.grade), w = parseNum(subject.wish);
    const diff = g != null && w != null ? (sc.bestLow ? g - w : w - g) : null;
    const upCat = (cid, p) => upSubject(subject.id, { cats: subject.cats.map((c) => (c.id === cid ? { ...c, ...p } : c)) });

    return (
      <div className="wrap">
        <button className="btn-ghost" style={{ border: "none", paddingLeft: 0 }} onClick={() => { up({ selSubject: null }); setConfirmDel(false); }}>← {t("back")}</button>
        <h1 className="brand" style={{ fontSize: 30, margin: "8px 0 16px", overflowWrap: "anywhere" }}>{sName(subject, state.lang)}</h1>
        {banner}

        <div className="card row" style={{ justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <NumInput value={subject.grade} label={t("reportGrade")} onChange={(v) => upSubject(subject.id, { grade: v })} ph="–" color={C(g)} />
            <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 6, fontWeight: 600 }}>{t("reportGrade")}</div>
          </div>
          {eff.wish && (<React.Fragment>
            <div style={{ fontSize: 22, color: "var(--border)" }} aria-hidden="true">→</div>
            <div style={{ textAlign: "center" }}>
              <NumInput value={subject.wish} label={t("wishGrade")} onChange={(v) => upSubject(subject.id, { wish: v })} ph="–" color="var(--blue)" />
              <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 6, fontWeight: 600 }}><Ic n="star" size={11} />{t("wishGrade")}</div>
            </div>
          </React.Fragment>)}
          {eff.cats && <Stamp value={calc} dark={dark} label={<span>{t("calc")}<br /><span style={{ fontWeight: 400 }}>{t("calcHint")}</span></span>} sc={sc} lang={state.lang} />}
        </div>

        {eff.wish && diff != null && (
          <div style={{ margin: "-6px 0 14px", textAlign: "center", fontSize: 14, fontWeight: 700, color: diff <= 0 ? "var(--green)" : "var(--red)" }}>
            {diff <= 0 ? `✓ ${t("onTrack")}` : `${fmt(diff, state.lang)} ${t("gap")}`}
          </div>)}
        {ds.scale.type === "grades" && (
          <div className="hint" style={{ margin: "-4px 0 14px", textAlign: "center", fontSize: 12 }}>{t("tendHint")}</div>)}

        {/* ---------- Fachgewichtung ---------- */}
        {!state.features.simple && (
          <div className="card">
            <h2 className="sec"><Ic n="scale" size={14} />{t("subjWeight")}</h2>
            <ProGate feature="subjWeight" t={t} compact>
              <div className="hint" style={{ marginBottom: 10 }}>{t("subjWeightHint")}</div>
              <div className="row" style={{ gap: 10 }}>
                <input className="num-weight" inputMode="decimal" value={String(subjWeight(subject))} aria-label={t("subjWeight")}
                  onChange={(e) => {
                    const raw = filterNumInput(e.target.value).replace(/[+\-\u2212]/g, "").slice(0, 4);
                    const n = parseNum(raw);
                    upSubject(subject.id, { weight: n == null ? 1 : Math.max(0, Math.min(99, n)) });
                  }} />
                <span className="hint">
                  {subjWeight(subject) === 0 ? t("weightOff") : "× " + fmt(subjWeight(subject), state.lang, 1)}
                </span>
              </div>

              {/* Notenschluessel des Fachs. Schluessel unterscheiden sich
                  von Schule zu Schule UND von Fach zu Fach – deshalb ist
                  die Zuordnung hier und nicht nur global. */}
              <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="lbl"><Ic n="percent" size={13} />{t("keyCalc")}</span>
                  <InfoTip text={t("keySubjectHint")} />
                </div>
                <select className="sel" style={{ width: "100%", maxWidth: "100%", marginTop: 4 }}
                  value={subject.keyId || ""} aria-label={t("keyCalc")}
                  onChange={(e) => upSubject(subject.id, { keyId: e.target.value })}>
                  <option value="">{t("keyFromTerm")} ({defaultKeyName})</option>
                  {(ds.keys || []).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
                <button className="btn-ghost" style={{ marginTop: 8, padding: "6px 12px", fontSize: 13 }}
                  onClick={() => up({ screen: "key" })}>
                  <Ic n="sliders" size={13} />{t("keyManage")}
                </button>
              </div>
            </ProGate>
          </div>)}

        {eff.cats && eff.charts && (
          <div className="card">
            <h2 className="sec"><Ic n="chart" size={14} />{t("trend")}</h2>
            <TrendChart subject={subject} sc={sc} lang={state.lang} t={t} dark={dark}
              onError={() => flash(t("exportErr"), "err")}
              fileName={sName(subject, state.lang) + " – " + t("trend")} />
            {flashBox}
          </div>)}

        {eff.cats && (
          <div className="card">
            <h2 className="sec">{t("categories")}</h2><InfoTip text={t("weightHint")} />
            {subject.cats.map((c, ci) => {
              const m = catMean(c);
              return (
                <div key={c.id} style={{ borderTop: "1px solid var(--line)", padding: "12px 0" }}>
                  <div className="row" style={{ flexWrap: "wrap" }}>
                    <strong style={{ flex: 1, fontSize: 15, display: "flex", alignItems: "center", gap: 7, minWidth: 120, overflowWrap: "anywhere" }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: catColor(ci), flexShrink: 0 }}></span>
                      {cName(c, state.lang)}
                    </strong>
                    <span style={{ fontSize: 12, color: "var(--sub)" }}>{t("weight")}</span>
                    <input className="num-weight" inputMode="numeric" value={c.weight} aria-label={t("weight")}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
                        upCat(c.id, { weight: raw === "" ? 0 : Number(raw) });
                      }} />
                    <span style={{ fontSize: 12, color: "var(--sub)" }}>%</span>
                    <span className="brand" style={{ minWidth: 46, textAlign: "right", color: C(m) }}>Ø {fmt(m, state.lang)}</span>
                    <button className="xbtn" aria-label={t("deleteSubject")}
                      onClick={() => { pushUndo(); upSubject(subject.id, { cats: subject.cats.filter((x) => x.id !== c.id) }); }}>✕</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, alignItems: "center" }}>
                    {c.grades.map((gr, i) => {
                      const val = parseNum(gv(gr));
                      return (
                        <span key={i} style={{
                          display: "inline-flex", alignItems: "center", gap: 4, background: "var(--chip)",
                          border: `1.5px solid ${C(val)}`, color: C(val),
                          borderRadius: 20, padding: "3px 6px 3px 12px", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif",
                        }}>
                          {fmt(val, state.lang)}
                          {gr && gr.p && (
                            <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.8 }}>
                              {fmt(gr.p.r, state.lang, 1)}/{fmt(gr.p.m, state.lang, 1)}
                            </span>)}
                          <button className="xbtn" style={{ fontSize: 14, color: "var(--faint)" }} aria-label="✕"
                            onClick={() => { pushUndo(); upCat(c.id, { grades: c.grades.filter((_, j) => j !== i) }); }}>✕</button>
                        </span>);
                    })}
                    <QuickAdd ph={t("addGrade")} label={t("addGradeFull")}
                      dateLabel={t("gradeDate")} dateHint={t("gradeDateHint")}
                      keyObj={isPro ? subjKey : null} sc={isPro ? sc : null}
                      lang={state.lang} t={isPro ? t : null} dark={dark}
                      onAdd={(v) => upCat(c.id, { grades: [...c.grades, v] })} />
                  </div>
                </div>);
            })}
            {(() => {
              const wSum = subject.cats.reduce((a, c) => a + (Number(c.weight) || 0), 0);
              return (
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: wSum === 100 ? "var(--faint)" : "var(--warn)" }}>
                  {t("weightSum")(wSum)}{wSum !== 100 && <span style={{ fontWeight: 400 }}> · {t("weightHint")}</span>}
                </div>);
            })()}
            <AddRow ph={t("newCat")} btn={t("add")}
              onAdd={(name) => upSubject(subject.id, { cats: [...subject.cats, { id: uid(), name, weight: 10, grades: [] }] })} />
          </div>)}

        {/* ---------- Was wäre wenn ---------- */}
        {eff.cats && (
          <div className="card">
            <h2 className="sec"><Ic n="sliders" size={14} />{t("whatIf")}</h2>
            <ProGate feature="whatIf" t={t} compact>
              <WhatIf subject={subject} sc={sc} lang={state.lang} t={t} dark={dark} current={calc} />
            </ProGate>
          </div>)}

        {eff.cats && eff.wish && (
          <div className="card">
            <h2 className="sec"><Ic n="target" size={14} />{t("needCalc")}</h2>
            {subject.cats.filter((c) => Number(c.weight) > 0).map((c) => {
              const r = neededGrade(subject, c, w, sc);
              return (
                <div key={c.id} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
                  <div className="lbl">{t("needIn")} „{cName(c, state.lang)}“:</div>
                  <div style={{
                    marginTop: 4, fontSize: 14, lineHeight: 1.5,
                    color: r.type === "ok" ? "var(--ink)" : r.type === "safe" ? "var(--green)" : r.type === "impossible" ? "var(--red)" : "var(--sub)",
                  }}>
                    {r.type === "ok" && (() => {
                      const parts = t("needResult")(<strong style={{ color: C(r.g) }}>{fmt(r.g, state.lang, 1)}</strong>);
                      return <span>{parts[0]}{parts[1]}{parts[2]}</span>;
                    })()}
                    {r.type === "safe" && "✓ " + t("needSafe")}
                    {r.type === "impossible" && t("needImpossible")}
                    {r.type === "missing" && t("needMissing")}
                    {r.type === "noWeight" && t("needNoWeight")}
                  </div>
                </div>);
            })}
          </div>)}

        <div className="card">
          <h2 className="sec"><Ic n="target" size={14} />{t("goals")}</h2>
          <textarea className="ta" placeholder={t("goalsPh")} value={subject.goals} maxLength={2000}
            onChange={(e) => upSubject(subject.id, { goals: e.target.value })} />
        </div>
        <div className="card">
          <h2 className="sec"><Ic n="pencil" size={14} />{t("notes")}</h2>
          <textarea className="ta" placeholder={t("notesPh")} value={subject.notes} maxLength={4000}
            onChange={(e) => upSubject(subject.id, { notes: e.target.value })} />
        </div>

        <button className="btn-danger" style={{ width: "100%", background: confirmDel ? "var(--red)" : "var(--card)", color: confirmDel ? "#fff" : "var(--red)" }}
          onClick={() => {
            if (!confirmDel) return setConfirmDel(true);
            pushUndo();
            upDs({
              subjects: ds.subjects.filter((x) => x.id !== subject.id),
              groups: ds.groups.map((gp) => ({ ...gp, subjectIds: gp.subjectIds.filter((i) => i !== subject.id) })),
            });
            delete prevMet.current[subject.id];
            up({ selSubject: null });
            setConfirmDel(false);
          }}>
          <Ic n="trash" size={15} />{confirmDel ? t("confirmDelete") : t("deleteSubject")}
        </button>
        {snack}
      </div>);
  }

  /* ============ HOME ============ */
  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div className="brand" style={{ fontSize: 24 }}>
            {APP_NAME}<span style={{ color: "var(--blue)" }}>.</span>
            {isPro && <span className="pro-badge" style={{ marginLeft: 6 }}>Pro</span>}
          </div>
          {state.datasets.length > 1 && <div style={{ fontSize: 12, color: "var(--sub)", fontWeight: 700 }}>{ds.label}</div>}
        </div>
        <div className="row">
          <button onClick={() => up({ lang: state.lang === "de" ? "en" : "de" })} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
            aria-label={state.lang === "de" ? "Switch to English" : "Auf Deutsch umschalten"}>
            {state.lang === "de" ? <FlagEN size={34} /> : <FlagDE size={34} />}
          </button>
          <button onClick={() => up({ screen: "settings" })} title={t("settings")} aria-label={t("settings")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink)", padding: 4 }}>
            <Ic n="settings" size={23} style={{ marginRight: 0 }} />
          </button>
        </div>
      </div>

      {banner}

      <div className="card" style={{ background: "linear-gradient(135deg,var(--hero1),var(--hero2))", color: "#fff" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="brand" style={{ fontSize: 19, color: "#fff" }}>{t("report")}</div>
            {(state.name || state.school) && (
              <div style={{ fontSize: 13, color: "var(--hero-ink)", marginTop: 3, overflowWrap: "anywhere" }}>
                {state.name}{state.name && state.school ? " · " : ""}{state.school}
              </div>)}
          </div>
          <div className="row" style={{ gap: 18 }}>
            <div style={{ textAlign: "center" }}>
              <div className="brand" style={{ fontSize: 34, color: overallAvg != null ? C(overallAvg, "bright") : "var(--hero-ink)" }}>{fmt(overallAvg, state.lang)}</div>
              <div style={{ fontSize: 11, color: "var(--hero-ink)", fontWeight: 700 }}>
                {t("avg")}{anyWeighted && isPro ? " · " + t("weighted") : ""}
              </div>
            </div>
            {eff.wish && (
              <div style={{ textAlign: "center" }}>
                <div className="brand" style={{ fontSize: 34, color: "var(--yellow)" }}>{fmt(wishAvg, state.lang)}</div>
                <div style={{ fontSize: 11, color: "var(--hero-ink)", fontWeight: 700 }}><Ic n="star" size={10} color="var(--yellow)" />{t("wishAvg")}</div>
              </div>)}
          </div>
        </div>
        {overallAvg == null && <div style={{ fontSize: 13, color: "var(--hero-ink)", marginTop: 8 }}>{t("noGrades")}</div>}
      </div>

      {/* ---------- Rechner ---------- */}
      <div className="card">
        <h2 className="sec"><Ic n="sliders" size={14} />{t("tools")}</h2>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={() => up({ screen: "key" })}>
            <Ic n="percent" size={15} />{t("keyCalc")}<ProBadge t={t} stop />
          </button>
          <button className="btn-ghost" onClick={() => up({ screen: "abi" })}>
            <Ic n="cap" size={15} />{t("abiShort")}<ProBadge t={t} stop />
          </button>
        </div>
      </div>

      {/* ---------- Langzeitverlauf & Halbjahresvergleich ---------- */}
      {eff.charts && state.datasets.length > 1 && (
        <div className="card">
          <h2 className="sec"><Ic n="chart" size={14} />{t("longTerm")}</h2>
          <LongTermChart datasets={state.datasets} years={years} lang={state.lang} t={t} dark={dark}
            onError={() => flash(t("exportErr"), "err")} fileName={t("longTerm")} />
          <h2 className="sec" style={{ marginTop: 16 }}>{t("compare")}</h2>
          {state.datasets.map((d) => {
            const a = subjectsMean(d.subjects, "grade");
            const dsc = scaleOf(d);
            const p = a == null ? 0 : quality(a, dsc);
            return (
              <div key={d.id} className="row" style={{ padding: "5px 0" }}>
                <span style={{ width: 112, fontSize: 13, fontWeight: 700, color: d.id === state.activeId ? "var(--ink)" : "var(--sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
                <div style={{ flex: 1, height: 10, background: "var(--chip)", borderRadius: 5 }}>
                  <div style={{ height: 10, width: p * 100 + "%", background: colorFor(a, dsc, null, dark), borderRadius: 5, minWidth: a != null ? 6 : 0 }}></div>
                </div>
                <span className="brand" style={{ color: colorFor(a, dsc, null, dark), minWidth: 48, textAlign: "right" }}>Ø {fmt(a, state.lang)}</span>
              </div>);
          })}
          {flashBox}
        </div>)}

      {/* ---------- Ausgewählte Durchschnitte ---------- */}
      {!state.features.simple && state.features.groups && (
        <div className="card">
          <h2 className="sec"><Ic n="sigma" size={14} />{t("groups")}</h2>
          <ProGate feature="groups" t={t} compact>
            <div className="hint" style={{ marginBottom: 10 }}>{t("groupsHint")}</div>
            {ds.groups.map((g) => (
              <GroupRow key={g.id} g={g} a={groupAvg(g)} ok={groupOk(g)} sc={sc} ds={ds} upDs={upDs}
                lang={state.lang} t={t} dark={dark} pushUndo={pushUndo} />))}
            <div className="row" style={{ flexWrap: "wrap", marginTop: 10 }}>
              <button className="btn-ghost" onClick={() => upDs({ groups: [...ds.groups, { id: uid(), name: "", subjectIds: [], target: "" }] })}>+ {t("newGroup")}</button>
            </div>
            <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <div className="lbl" style={{ marginBottom: 4 }}>{t("presets")}</div>
              <div className="hint" style={{ marginBottom: 8, fontSize: 12 }}>{t("presetHint")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PRESETS.map(([key]) => (
                  <button key={key} className="chip-btn" onClick={() => addPreset(key)}>+ {t(key)}</button>))}
              </div>
            </div>
            {flashBox}
          </ProGate>
        </div>)}

      {/* ---------- Fächer ---------- */}
      <div className="card">
        <h2 className="sec"><Ic n="book" size={14} />{t("subjects")}</h2>

        {ds.subjects.length === 0 ? (
          <div className="empty">
            <Ic n="book" size={30} style={{ marginRight: 0 }} />
            <div className="brand" style={{ fontSize: 16, marginTop: 4 }}>{t("emptySubjects")}</div>
            <div className="hint" style={{ marginTop: 4 }}>{t("emptySubjectsCta")}</div>
          </div>
        ) : (<React.Fragment>
          <div className="hint" style={{ marginBottom: 6 }}>{t("empty")}</div>
          <div style={{
            display: "grid", gridTemplateColumns: eff.wish ? "1fr 70px 70px" : "1fr 70px", gap: "0 8px",
            fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".05em", padding: "6px 4px 4px",
          }}>
            <span></span><span style={{ textAlign: "center" }}>{t("grade")}</span>
            {eff.wish && <span style={{ textAlign: "center" }}><Ic n="star" size={10} />{t("wish")}</span>}
          </div>
          {ds.subjects.map((s) => {
            const sg = parseNum(s.grade);
            const wt = subjWeight(s);
            return (
              <div key={s.id} style={{
                display: "grid", gridTemplateColumns: eff.wish ? "1fr 70px 70px" : "1fr 70px", gap: "0 8px",
                alignItems: "center", borderTop: "1px solid var(--line)", padding: "8px 4px",
                opacity: wt === 0 ? 0.55 : 1,
              }}>
                <button onClick={() => up({ selSubject: s.id })}
                  style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8, padding: 0, minWidth: 0 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: C(sg), flexShrink: 0 }}></span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sName(s, state.lang)}</span>
                  {isPro && wt !== 1 && (
                    <span className="wt-badge" title={t("subjWeight")}>{wt === 0 ? "0" : "×" + fmt(wt, state.lang, 1)}</span>)}
                  {eff.charts && eff.cats && <span style={{ marginLeft: "auto", display: "flex" }}><Spark subject={s} sc={sc} /></span>}
                  <span style={{ color: "var(--border)", fontSize: 13 }} aria-hidden="true">›</span>
                </button>
                <NumInput width="100%" label={sName(s, state.lang) + " – " + t("grade")} value={s.grade} onChange={(v) => upSubject(s.id, { grade: v })} ph="–" color={C(sg)} />
                {eff.wish && <NumInput width="100%" label={sName(s, state.lang) + " – " + t("wish")} value={s.wish} onChange={(v) => upSubject(s.id, { wish: v })} ph="–" color="var(--blue)" />}
              </div>);
          })}
        </React.Fragment>)}

        <AddRow ph={t("addSubject")} btn={t("add")}
          onAdd={(name) => upDs({ subjects: [...ds.subjects, { id: uid(), name, grade: "", wish: "", weight: 1, cats: defaultCats(), goals: "", notes: "" }] })} />
      </div>

      {!isPro && (
        <div className="card pro-teaser">
          <div className="row" style={{ gap: 6 }}>
            <Ic n="star" size={15} color="var(--blue)" />
            <strong style={{ fontSize: 15 }}>{t("proTeaser")}</strong>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>{t("proList")}</div>
          <ProLink t={t} style={{ marginTop: 12 }} />
        </div>)}

      <div style={{ textAlign: "center", marginTop: 6 }}>
        <button className="btn-ghost" style={{ border: "none", color: "var(--faint)", fontSize: 13 }} onClick={() => up({ screen: "about", aboutFrom: "home" })}>
          <Ic n="info" size={13} />{t("aboutBtn")} · v{APP_VER} {TIER === "pro" ? "Pro" : "Lite"}
        </button>
      </div>
      {snack}
    </div>);
}

export default App;
