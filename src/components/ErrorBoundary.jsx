import React from "react";
import { logError, formatLog } from "../lib/logger.js";
import { store, STORAGE_KEY } from "../lib/storage.js";
import { downloadBlob } from "../lib/exporters.js";

/* =========================================================
   ErrorBoundary – der Auffangschirm fuer Render-Fehler.

   Ohne diese Komponente fuehrt jeder Fehler beim Rendern zu einem
   komplett weissen Bildschirm. Besonders bitter: der ausloesende
   Datenstand liegt bereits in localStorage, also ist die App auch nach
   einem Neustart weiss und der Nutzer kommt ohne Entwicklerwerkzeuge
   nicht mehr an seine Noten.

   Die drei Schaltflaechen sind bewusst in dieser Reihenfolge:
   erst nochmal versuchen, dann Daten RETTEN, erst zuletzt loeschen.

   Bewusst eine Klassenkomponente – getDerivedStateFromError und
   componentDidCatch gibt es in React nur hier.
========================================================= */

const TXT = {
  de: {
    title: "Die App konnte nicht angezeigt werden",
    body: "Ein unerwarteter Fehler ist aufgetreten. Deine Noten liegen weiterhin auf dem Gerät. Versuche zuerst einen Neuaufbau – wenn das nicht hilft, lade die Sicherung herunter, bevor du zurücksetzt.",
    retry: "Erneut versuchen",
    rescue: "Daten als Sicherung herunterladen",
    reset: "Alle Daten löschen",
    resetConfirm: "Wirklich löschen? Das lässt sich nicht rückgängig machen.",
    cancel: "Abbrechen",
    details: "Technische Details",
  },
  en: {
    title: "The app could not be displayed",
    body: "An unexpected error occurred. Your grades are still on this device. Try rebuilding the view first – if that does not help, download the backup before you reset.",
    retry: "Try again",
    rescue: "Download data as backup",
    reset: "Delete all data",
    resetConfirm: "Really delete? This cannot be undone.",
    cancel: "Cancel",
    details: "Technical details",
  },
};

const pickLang = () => {
  try {
    return String(navigator.language || "de").toLowerCase().startsWith("de") ? "de" : "en";
  } catch (e) {
    return "de";
  }
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, confirmReset: false, rescued: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logError("Render-Fehler abgefangen: " + (error && error.message), (info && info.componentStack) || error);
  }

  rescue = () => {
    /* Rohtext statt geparster Zustand: so laesst sich auch eine kaputte
       Datei retten, die JSON.parse nicht mehr uebersteht. */
    const raw = store.raw(STORAGE_KEY) || "{}";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const payload = `${raw}\n\n/* --- Protokoll ---\n${formatLog()}\n*/`;
    const ok = downloadBlob(new Blob([payload], { type: "application/json" }), `gradegoal-rettung-${stamp}.json`);
    this.setState({ rescued: ok });
  };

  hardReset = () => {
    store.remove(STORAGE_KEY);
    try {
      window.location.reload();
    } catch (e) {
      this.setState({ error: null, confirmReset: false });
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    const t = TXT[pickLang()];
    const btn = {
      display: "block",
      width: "100%",
      marginTop: 10,
      padding: "12px 16px",
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "'Space Grotesk',sans-serif",
    };

    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div
          style={{
            maxWidth: 460,
            width: "100%",
            background: "var(--card,#fff)",
            color: "var(--ink,#172A46)",
            borderRadius: 18,
            padding: 20,
            boxShadow: "0 2px 14px rgba(23,42,70,.16)",
          }}
        >
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 21, margin: "0 0 8px" }}>{t.title}</h1>
          <p style={{ lineHeight: 1.6, fontSize: 15, color: "var(--sub,#5B6B84)" }}>{t.body}</p>

          <button
            style={{ ...btn, background: "var(--blue,#2F5DE0)", color: "#fff", border: "none" }}
            onClick={() => this.setState({ error: null, confirmReset: false })}
          >
            {t.retry}
          </button>

          <button
            style={{
              ...btn,
              background: "transparent",
              color: "var(--blue,#2F5DE0)",
              border: "1.5px solid var(--blue,#2F5DE0)",
            }}
            onClick={this.rescue}
          >
            {this.state.rescued ? "✓ " : ""}
            {t.rescue}
          </button>

          {!this.state.confirmReset ? (
            <button
              style={{ ...btn, background: "transparent", color: "var(--red,#B0392E)", border: "1.5px solid var(--red,#B0392E)" }}
              onClick={() => this.setState({ confirmReset: true })}
            >
              {t.reset}
            </button>
          ) : (
            <React.Fragment>
              <button style={{ ...btn, background: "var(--red,#B0392E)", color: "#fff", border: "none" }} onClick={this.hardReset}>
                {t.resetConfirm}
              </button>
              <button
                style={{ ...btn, background: "transparent", color: "var(--sub,#5B6B84)", border: "none" }}
                onClick={() => this.setState({ confirmReset: false })}
              >
                {t.cancel}
              </button>
            </React.Fragment>
          )}

          <details style={{ marginTop: 16, fontSize: 12, color: "var(--faint,#8A97AB)" }}>
            <summary style={{ cursor: "pointer" }}>{t.details}</summary>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 8 }}>
              {String((this.state.error && this.state.error.stack) || this.state.error)}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
