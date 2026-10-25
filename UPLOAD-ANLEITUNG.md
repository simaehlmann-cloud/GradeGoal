# GradeGoal 1.8.0 – Dateien ins Repo bringen

Das Repo stand auf **1.6.2**. Die Fixes aus der früheren 1.7.0 (Export
über das Teilen-Menü, externe Verweise, Zurück-Taste) waren dort nie
angekommen – sie sind in diesem Paket neu und für iOS erweitert enthalten.

## 1. Hochladen (26 Dateien)

GitHub → Repository → **Add file → Upload files**.
Den **Inhalt** dieses Ordners hineinziehen (nicht den Ordner selbst),
also `.github`, `src`, `store`, `tools`, `public` und die Einzeldateien.
Diese Datei (`UPLOAD-ANLEITUNG.md`) bitte weglassen.

Commit-Nachricht z. B. `1.8.0: iOS, In-App-Kauf`.

Bei früheren Uploads kamen Unterordner manchmal unvollständig an. Wenn
du unsicher bist, lade in Etappen hoch – erst `src`, dann `.github`,
dann den Rest. Ich prüfe danach ohnehin alles.

| Ordner | Dateien |
|---|---|
| `.github/workflows/` | ios-testflight.yml (neu), build-apk.yml, release-aab.yml, deploy-pages.yml |
| `src/` | App.jsx, styles.css |
| `src/lib/` | filesave.js, platform.js, purchase.js (neu), exporters.js, i18n.js, storage.js |
| `src/components/` | ui.jsx, charts.jsx, ErrorBoundary.jsx |
| `public/` | datenschutz.html |
| `store/` | APP-STORE-CHECKLISTE.md, APP-STORE-TEXTE.md (neu), PLAY-CONSOLE-CHECKLISTE.md, STORE-TEXTE.md |
| `tools/` | prepare-ios.sh (neu) |
| Hauptordner | package.json, package-lock.json (neu), capacitor.config.json, README.md, CHANGELOG-1.8.0.md (neu) |

## 2. Alte Dateien löschen

Diese Dateien werden nicht mehr verwendet. Sie stören den Build nicht,
sollten aber weg, damit das Repo aufgeräumt ist. Im Browser: Datei
öffnen → **…** (oben rechts) → **Delete file** → Commit.

- `src/lib/tier.js`
- `capacitor.config.pro.json`
- `.env.lite`
- `.env.pro`
- `public/icon-lite.svg`
- Ordner `assets-lite/` (alle 7 Dateien; der Ordner verschwindet, wenn er leer ist)

## 3. Danach

Sag mir Bescheid – ich prüfe das Repo. Dann weiter mit
`store/APP-STORE-CHECKLISTE.md`, Teil A.
