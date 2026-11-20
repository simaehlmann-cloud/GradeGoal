# GradeGoal 1.9.0 – Upload-Anleitung (Stand 20.11.2026, 2. Fassung)

**Dieses ZIP ersetzt das erste ZIP von heute vollständig.** Es enthält
alle Änderungen gegenüber deinem Repo-Stand: die 25 Punkte, außerdem
„keine Web-Version“, Rechtstexte passend zur Plattform und das
Video-Skript. Hast du das erste ZIP schon hochgeladen, lade einfach alle
Dateien hier noch einmal hoch – sie überschreiben die alten.

Das ZIP enthält **50 Dateien**, jeweils am richtigen Platz. Diese
Anleitung selbst gehört **nicht** ins Repo.

Unterordner kommen beim Hochladen über die Weboberfläche manchmal
unvollständig an. Deshalb **Ordner für Ordner** hochladen und nach jedem
Schritt die Anzahl prüfen.

## 1. Hochladen (Repo GradeGoal → „Add file“ → „Upload files“)

| Schritt | Zielordner im Repo | Dateien | Anzahl |
|---|---|---|---|
| 1 | Wurzel | `.gitignore`, `AENDERUNGEN.md`, `README.md`, `index.html`, `package.json`, `package-lock.json` | 6 |
| 2 | `public/` | `datenschutz.html`, `datenschutz-en.html` (neu), `impressum.html`, `impressum-en.html` (neu), `recht.css`, `recht.js` (neu) | 6 |
| 3 | `pages/` (neu) | `index.html` | 1 |
| 4 | `src/` | `App.jsx`, `styles.css` | 2 |
| 5 | `src/components/` | `AbiCalc.jsx`, `ErrorBoundary.jsx`, `icons.jsx`, `panels.jsx`, `ui.jsx` | 5 |
| 6 | `src/lib/` | `demo.js` (neu), `exporters.js`, `filesave.js`, `i18n.js`, `meta.js` (neu), `platform.js`, `purchase.js`, `review.js` (neu), `state.js` | 9 |
| 7 | `store/` | `APP-STORE-CHECKLISTE.md`, `APP-STORE-TEXTE.md`, `PLAY-CONSOLE-CHECKLISTE.md`, `STORE-TEXTE.md`, `feature-graphic.png` (neu) | 5 |
| 8 | `tests/` (neu) | `grades.test.mjs`, `meta.test.mjs`, `setup.mjs`, `state.test.mjs` | 4 |
| 9 | `tools/` | `check_icons.py`, `make_feature_graphic.py`, `make_icons.py`, `prepare-ios.sh`, `store-bilder.mjs` (neu), `store-video.mjs` (neu) | 6 |
| 10 | `tools/apple/` (neu) | `PrivacyInfo.xcprivacy`, `add-resource.rb` | 2 |
| 11 | `.github/workflows/` | `build-apk.yml`, `deploy-pages.yml`, `ios-testflight.yml`, `release-aab.yml` | 4 |

**Neue Ordner** (`pages/`, `tests/`, `tools/apple/`): Den Ordner aus dem
entpackten ZIP ins Upload-Fenster ziehen, dann legt GitHub ihn mit an.

**Versteckte Dateien** (`.gitignore`, `.github/…`): Windows zeigt sie im
Dateidialog oft nicht an. Per Ziehen aus dem Explorer klappt es. Sonst
die Datei im Repo öffnen → Stift → Inhalt aus der ZIP-Datei einfügen.

**Wichtig:** `package-lock.json` unbedingt mit hochladen. Darin steht die
neue Erweiterung für die Bewertung. Ohne sie bricht `npm ci` in jedem
Workflow ab.

## 2. Löschen (Datei öffnen → „…“ oben rechts → „Delete file“)

Reste der Lite/Pro-Zeit und die alten Einzel-Changelogs (jetzt in
`AENDERUNGEN.md`). Nichts davon wird noch verwendet.

```
.env.pro
capacitor.config.pro.json
src/lib/tier.js
public/icon-lite.svg
store/feature-graphic-lite.png
store/feature-graphic-pro.png
CHANGELOG-1.4.0.md
CHANGELOG-1.5.0.md
CHANGELOG-1.5.1.md
CHANGELOG-1.6.0.md
CHANGELOG-1.6.2.md
CHANGELOG-1.8.0.md
assets-lite/icon-background.png
assets-lite/icon-foreground.png
assets-lite/icon-only.png
assets-lite/icon.png
assets-lite/preview-rounded.png
assets-lite/splash-dark.png
assets-lite/splash.png
```

Insgesamt 19 Dateien. Ist die letzte Datei aus `assets-lite/` gelöscht,
verschwindet der Ordner von selbst.

## 3. Prüfen

1. **Actions:** „Build Android APK“ startet automatisch. Neu ist der
   Schritt „Tests der Rechenlogik“, er muss grün sein.
2. **Rechtsseiten:** Der Workflow heißt jetzt „Rechtsseiten (GitHub Pages)“.
   Nach ein bis zwei Minuten prüfen:
   - https://simaehlmann-cloud.github.io/GradeGoal/ – nur noch eine kleine Startseite, **keine App mehr**
   - https://simaehlmann-cloud.github.io/GradeGoal/impressum.html – USt-IdNr. sichtbar, keine grauen Arbeitshinweise
   - https://simaehlmann-cloud.github.io/GradeGoal/datenschutz-en.html – englische Fassung erreichbar

   Hast du die alte Web-Version am Handy auf dem Startbildschirm abgelegt,
   kannst du das Symbol löschen. Es führt jetzt nur noch zur Startseite.
3. **TestFlight:** „iOS – TestFlight → Run workflow“. Im Protokoll von
   „iOS-Projekt vorbereiten“ muss stehen:
   `PrivacyInfo.xcprivacy ist Ressource im Ziel App.`
4. **Auf dem iPad:**
   - Info & Impressum → Datenschutz: Dort steht nur Apple, kein Google
   - Impressum auch im Flugmodus öffnen
   - Beispielzeugnis laden und wieder entfernen
   - Neues Halbjahr anlegen: Die Fächer werden übernommen
   - Ein Fach umbenennen

## 4. Store-Bilder und Videos

Liegen in eigenen ZIPs und gehören **nicht** ins Repo:

- `GradeGoal-1.9.0-Store-Bilder.zip`: 36 Screenshots (iPhone, iPad, Android; de/en)
- `GradeGoal-1.9.0-Vorschauvideos.zip`: 4 App-Vorschauvideos (iPhone, iPad; de/en)

Wohin damit in App Store Connect: `store/APP-STORE-CHECKLISTE.md`,
Abschnitt E. Selbst neu erzeugen: README, Abschnitte „Store-Screenshots“
und „App-Vorschauvideos“.
