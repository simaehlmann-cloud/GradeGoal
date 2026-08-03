import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/karla/400.css";
import "@fontsource/karla/600.css";
import "@fontsource/karla/700.css";
import "./styles.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { installGlobalHandlers, logError } from "./lib/logger.js";

installGlobalHandlers();

const mount = document.getElementById("app");

if (!mount) {
  /* Sollte nie passieren – aber eine stumme Konsolenmeldung waere hier
     das Schlimmste, was man dem Nutzer antun kann. */
  logError("Container #app nicht gefunden");
  document.body.innerHTML =
    '<p style="font-family:sans-serif;padding:24px">GradeGoal konnte nicht starten. Bitte die Seite neu laden.</p>';
} else {
  createRoot(mount).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
