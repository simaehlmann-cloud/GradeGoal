import React, { useState, useEffect, useRef } from "react";
import { Ic } from "./icons.jsx";
import { verifyPin, PIN_MIN, PIN_MAX } from "../lib/security.js";
import { logWarn } from "../lib/logger.js";

/* =========================================================
   Sperrbildschirm.

   Zwei Dinge, die hier bewusst so und nicht anders geloest sind:

   1) Nach fuenf Fehlversuchen greift eine wachsende Wartezeit. Sie ist
      keine echte Sicherheit (ein Angreifer mit Geraetezugriff liest den
      localStorage einfach direkt), verhindert aber das gedankenlose
      Durchprobieren durch Geschwister und Mitschueler.

   2) Es gibt KEINE Wiederherstellung. Ein "Notfall-Code" waere eine
      Hintertuer, die den Sichtschutz wertlos macht. Wer die PIN
      vergisst, kann nur alles loeschen – das steht so auch im Text,
      bevor die Sperre ueberhaupt eingeschaltet wird.
========================================================= */

const MAX_FREE_TRIES = 5;
const LOCK_STEP_MS = 15000;

export default function LockScreen({ lock, t, onUnlock, onResetAll }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [tries, setTries] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [showForgot, setShowForgot] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  /* Nur ticken, solange tatsaechlich gewartet wird – kein Dauer-Intervall */
  useEffect(() => {
    if (waitUntil <= Date.now()) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [waitUntil]);

  const waiting = waitUntil > now;
  const waitLeft = Math.max(0, Math.ceil((waitUntil - now) / 1000));

  const submit = async () => {
    if (busy || waiting) return;
    if (pin.length < PIN_MIN) { setErr(t("lockFormat")); return; }
    setBusy(true);
    let ok = false;
    try {
      ok = await verifyPin(pin, lock);
    } catch (e) {
      logWarn("PIN-Prüfung fehlgeschlagen", e);
    }
    if (!alive.current) return;
    setBusy(false);
    if (ok) { onUnlock(); return; }
    const n = tries + 1;
    setTries(n);
    setPin("");
    setErr(t("lockWrong"));
    if (n >= MAX_FREE_TRIES) {
      const ms = LOCK_STEP_MS * (n - MAX_FREE_TRIES + 1);
      setWaitUntil(Date.now() + ms);
      setNow(Date.now());
    }
  };

  return (
    <div className="screen-center">
      <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
        <div style={{ marginBottom: 14 }}><Ic n="lock" size={40} color="var(--blue)" style={{ marginRight: 0 }} /></div>
        <h1 className="brand" style={{ fontSize: 22, margin: "0 0 16px" }}>{t("lockEnter")}</h1>

        <input className="inp pin-input" inputMode="numeric" type="password" autoComplete="off"
          enterKeyHint="go" value={pin} maxLength={PIN_MAX} aria-label={t("lockEnter")} disabled={waiting || busy}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_MAX)); setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()} />

        {err && !waiting && <div style={{ color: "var(--red)", fontWeight: 700, marginTop: 10, fontSize: 14 }} role="alert">{err}</div>}
        {waiting && <div style={{ color: "var(--red)", fontWeight: 700, marginTop: 10, fontSize: 14 }} role="alert">{t("lockWait")(waitLeft)}</div>}

        <button className="btn" style={{ width: "100%", marginTop: 14 }} onClick={submit}
          disabled={waiting || busy || pin.length < PIN_MIN}>
          {t("lockUnlock")}
        </button>

        <button className="btn-ghost" style={{ border: "none", color: "var(--faint)", marginTop: 18, fontSize: 13 }}
          onClick={() => setShowForgot(!showForgot)} aria-expanded={showForgot}>
          {t("lockForgot")}
        </button>

        {showForgot && (
          <div className="card" style={{ marginTop: 8, textAlign: "left" }}>
            <div className="hint">{t("lockForgotHint")}</div>
            {!confirmReset ? (
              <button className="btn-danger" style={{ width: "100%", marginTop: 12 }} onClick={() => setConfirmReset(true)}>
                <Ic n="trash" size={14} />{t("lockResetAll")}
              </button>
            ) : (
              <React.Fragment>
                <button className="btn-danger" style={{ width: "100%", marginTop: 12, background: "var(--red)", color: "#fff" }}
                  onClick={onResetAll}>
                  <Ic n="alert" size={14} />{t("resetConfirm")}
                </button>
                <button className="btn-ghost" style={{ width: "100%", marginTop: 8, border: "none" }}
                  onClick={() => setConfirmReset(false)}>{t("back")}</button>
              </React.Fragment>)}
          </div>)}
      </div>
    </div>);
}
