# GradeGoal 1.8.0 – iOS und In-App-Kauf

## Neues Modell: eine App statt Lite und Pro

- Alle Funktionen stehen jedem offen (Rechner, Diagramme, Fachgewichtung,
  PIN-Sperre, CSV, eigene Skala …).
- Gratis: **ein Schuljahr mit bis zu zwei Halbjahren** bzw. Profilen.
- Einmaliger In-App-Kauf `gradegoal_unlimited` hebt die Grenze auf.
  Kaufkarte mit Preis aus dem Store, „Kauf wiederherstellen“ immer
  daneben (Apple-Pflicht), Statusanzeige unter Info & Impressum.
- Daten werden nie gesperrt. Ohne Kauf importierte Sicherungen mit
  mehreren Schuljahren bleiben vollständig nutzbar.
- Entfernt: `src/lib/tier.js`, `.env.lite`, `.env.pro`,
  `capacitor.config.pro.json`, `assets-lite/`, `public/icon-lite.svg`,
  `build:pro`-Skripte, Lite/Pro-Matrix in den Workflows.

## iOS

- Capacitor 8 (Xcode 26, iOS 15+, Swift Package Manager). Apple nimmt
  seit dem 28.04.2026 nur noch Builds mit dem iOS-26-SDK an.
- Neuer Workflow **iOS – TestFlight**: Build auf einem Mac von GitHub,
  Signierung per Cloud Signing, direkter Upload zu App Store Connect.
- `tools/prepare-ios.sh`: Version, Build-Nummer, Exportkontrolle
  (`ITSAppUsesNonExemptEncryption = false`), Begründung für „Bild
  sichern“ im Teilen-Menü.
- `contentInset` entfernt: Die Ränder regelt das Stylesheet über
  `env(safe-area-inset-*)`; zusammen mit `contentInset: always` wäre der
  Abstand oben doppelt.
- `limitsNavigationsToAppBoundDomains` entfernt – blockierte externe
  Verweise.

## Native Fixes (iOS und Android)

- **Export über das Teilen-Menü** (`src/lib/filesave.js`): Sicherung,
  CSV, Diagramm-Bild, Rettungsdatei und Protokoll. Die WebView ignoriert
  Downloads sonst stumm.
- **Zeugnis in der App:** Statt `window.print()` (gibt es dort nicht)
  wird ein eigenständiges HTML-Dokument geteilt, das sich aus „Dateien“
  drucken lässt.
- **Externe Verweise** (Impressum, Datenschutz) öffnen über
  `@capacitor/browser`; `target="_blank"` tat in der App nichts.
- **Android-Zurück-Taste** geht eine Ebene zurück statt die App zu
  schließen (`@capacitor/app`).
- **Zweitablage:** In der App wird jeder Stand zusätzlich über
  `@capacitor/preferences` gespeichert und genutzt, falls iOS den
  WebView-Speicher geleert hat.

## Android

- Capacitor 8: targetSdk/compileSdk 36 (Play-Pflicht seit Aug. 2026),
  JDK 21.
- Test-APK wird mit dem Release-Schlüssel signiert, sobald die
  Keystore-Secrets hinterlegt sind (versionCode = Laufnummer).

## Texte und Rechtliches

- Datenschutzerklärung: Abschnitt In-App-Kauf (de/en), Stand Oktober 2026.
- In der App: Hinweis zum Kauf im Datenschutz-Abschnitt.
- Neu: `store/APP-STORE-CHECKLISTE.md`, `store/APP-STORE-TEXTE.md`.
