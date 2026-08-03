# GradeGoal 1.4.0 – Einbau & Änderungen

## Wohin kommt welche Datei

```
index.html                       ersetzen  (Wurzelverzeichnis)
package.json                     ersetzen  (nur Versionsnummer)
src/App.jsx                      ersetzen
src/main.jsx                     ersetzen
src/styles.css                   ersetzen
src/lib/grades.js                NEU
src/lib/logger.js                NEU
src/lib/storage.js               NEU
src/lib/state.js                 NEU
src/lib/exporters.js             NEU
src/components/ErrorBoundary.jsx NEU
```

Keine neuen Abhängigkeiten – `npm install` ist nicht nötig, `npm run dev` reicht.

## Neu

- **Sichere Bereiche (Safe Areas).** Kopfbereich, Ränder und die Rückgängig-Leiste
  respektieren Notch, Dynamic Island, Statusleiste und Home-Indikator.
- **Design: System / Hell / Dunkel.** Standard ist „System“. Ein kleines Skript im
  `<head>` setzt das Design vor dem ersten Rendern, sodass nichts mehr hell aufblitzt.
  Die Meta-Angabe `theme-color` wandert mit.
- **Fehlergrenze.** Ein Fehler beim Rendern zeigt jetzt eine Seite mit drei Optionen
  (erneut versuchen / Daten retten / zurücksetzen) statt eines weißen Bildschirms.
- **CSV-Export.** Eine Zeile je Einzelnote, Semikolon-getrennt, mit UTF-8-BOM für Excel.
- **Diagnose-Protokoll** in den Einstellungen. Bleibt lokal, wird nie übertragen.
- **Warnstreifen**, wenn das Speichern fehlschlägt (privater Modus, voller Speicher).

## Geändert

- Logik in `src/lib/` ausgelagert: `grades.js` (Rechnen), `state.js` (Migration),
  `storage.js` (Ein-/Ausgabe), `exporters.js` (CSV/JSON/Druck), `logger.js`.
- Jede gespeicherte oder importierte Datei läuft durch `migrateState()` und wird
  auf ein vollständiges Schema gebracht.
- Druckansicht wird nur noch vor dem Drucken gebaut, nicht mehr bei jedem Tastendruck –
  und alle Texte werden maskiert.
- Alle Eingabefelder mindestens 16 px (kein automatischer Zoom auf iOS mehr).
- Tendenznoten mit dem typografischen Minus („3−“) werden jetzt akzeptiert.

## Noch offen

- **PWA** (`manifest.json` + Service Worker) – braucht eine Anpassung an
  `vite-plugin-singlefile`, weil der Service Worker eine eigene Datei bleiben muss.
- **Wischgesten** zum Löschen.
- **`capacitor.config.json`**: `backgroundColor` ist fest hell (`#EEF2F7`). Für einen
  dunklen Startbildschirm in der APK wäre `@capacitor/status-bar` bzw. ein
  Theme-abhängiger Splashscreen nötig.
- **Kontakt-E-Mail** in `src/App.jsx` (Konstante `CONTACT`) vor der Play-Store-Einreichung ersetzen.
