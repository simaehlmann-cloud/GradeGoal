# GradeGoal: Schulnoten & Grades

Zeugnisnoten eintragen, Durchschnitte berechnen, Wunschnoten erreichen.
Entwickelt von Simon Mählmann · Version 1.5.0

Die App erscheint in zwei Ausgaben aus **einem** Quellcode:

| | Lite (kostenlos) | Pro |
|---|---|---|
| Fächer, Zeugnisnoten, Gesamtschnitt | ✓ | ✓ |
| Wunschnoten + Konfetti | ✓ | ✓ |
| Kategorien & Einzelnoten | ✓ | ✓ |
| Zielrechner | ✓ | ✓ |
| Notensysteme 1–6 und 0–15 | ✓ | ✓ |
| Sicherung Export **und** Import | ✓ | ✓ |
| Drucken / PDF | ✓ | ✓ |
| Schuljahre, Halbjahre, Profile | – | ✓ |
| Notenverlauf & Langzeitverlauf | – | ✓ |
| Ausgewählte Durchschnitte + Vorlagen | – | ✓ |
| Fachgewichtung | – | ✓ |
| Was-wäre-wenn-Regler | – | ✓ |
| Abitur-Rechner | – | ✓ |
| Notenschlüssel-Rechner | – | ✓ |
| PIN-Sperre | – | ✓ |
| CSV-Export, eigene Skala | – | ✓ |

Der Zuschnitt steht an genau einer Stelle: `PRO_FEATURES` in `src/lib/tier.js`.

## Lokal entwickeln

```bash
npm install
npm run dev        # http://localhost:5173 – Pro-Ausgabe
npm run dev:lite   # dieselbe App als Lite, zum Gegenprüfen
```

## Produktions-Build

```bash
npm run build      # erzeugt dist/index.html als LITE
npm run build:pro  # erzeugt dist/index.html als PRO
```

**Beide schreiben nach `dist/`.** Vor einem Wechsel den Ordner leeren oder
die fertige Datei sofort wegkopieren – sonst baust du versehentlich die
falsche Ausgabe.

Die erzeugte `dist/index.html` enthält den kompletten kompilierten Code und
lässt sich direkt per Doppelklick öffnen, verschicken oder hochladen. Alles
läuft offline – React und die Schriften (Space Grotesk, Karla) sind
einkompiliert, keine CDN-Abhängigkeiten.

Wichtig: Zum Entwickeln immer `npm run dev` verwenden. Die `index.html` im
Projektordner ist nur das Gerüst und zeigt beim Direktöffnen eine weiße Seite.

> Eine Einschränkung beim Direktöffnen per `file://`: dort gibt es keine
> Web-Crypto-API, die PIN-Sperre weicht dann auf ein schwächeres Verfahren
> aus. Über GitHub Pages oder in der APK ist das kein Thema.

## Web-Version am Handy (ohne APK)

Der Workflow `deploy-pages.yml` veröffentlicht bei jedem Push über GitHub
Pages. Einmalig aktivieren:
**Repository → Settings → Pages → Source: „GitHub Actions"**

Danach ist die App unter `https://DEINNAME.github.io/REPOSITORY-NAME/`
erreichbar – am Handy im Browser öffnen und über „Zum Startbildschirm
hinzufügen" ablegen.

Der Workflow ruft `npm run build` auf, veröffentlicht also die **Lite**-Ausgabe.
Willst du auf Pages stattdessen Pro zum Testen, ändere die Zeile in
`.github/workflows/deploy-pages.yml` auf `npm run build:pro`.

## Android-APK

### Automatisch (empfohlen)
Bei jedem Push auf `main` baut GitHub Actions **beide** APKs:
**Actions → letzter Lauf → Artifacts → `gradegoal-lite-debug-apk`
bzw. `gradegoal-pro-debug-apk`**

Beide lassen sich parallel auf demselben Gerät installieren – sie haben
unterschiedliche App-IDs.

### Lokal (Android Studio erforderlich)
```bash
npm install
npm run build                             # oder: npm run build:pro
cp capacitor.config.pro.json capacitor.config.json   # NUR beim Pro-Build
npx cap add android
npx capacitor-assets generate --android
npx cap sync android
npx cap open android                      # dann in Android Studio auf ▶
```

Beim Wechsel zwischen den Ausgaben `dist/` **und** `android/` löschen.

## Icon ändern

`assets/icon.png` (1024×1024) und `assets/splash.png` /
`assets/splash-dark.png` (2732×2732) ersetzen, dann
`npx capacitor-assets generate --android` erneut ausführen.
`public/icon.svg` ist das Favicon der Web-Version.

## Play-Store-Release

Der Store akzeptiert nur signierte App-Bundles (.aab). Für Lite und Pro
entstehen **zwei getrennte Einträge** mit den App-IDs
`de.maehlmann.gradegoal` und `de.maehlmann.gradegoal.pro`.

1. Keystore erzeugen (einmalig, sicher aufbewahren!):
   `keytool -genkey -v -keystore gradegoal.keystore -alias gradegoal -keyalg RSA -keysize 2048 -validity 10000`
   Denselben Keystore für beide Apps verwenden.
2. In Android Studio: Build → Generate Signed Bundle / APK → Android App Bundle
3. `.aab` in der Play Console hochladen

Vor der Einreichung:
- Kontakt-E-Mail in `src/lib/i18n.js` ersetzen (`CONTACT`, steht auf `kontakt@example.de`)
- `PRO_URL` in `src/lib/tier.js` eintragen, sobald der Pro-Eintrag existiert
- In der Play Console für **beide** Einträge: In-App-Käufe „nein",
  Werbung „nein", Datensicherheit „keine Daten erhoben"
- Bei jedem Update den `versionCode` in `android/app/build.gradle` erhöhen

## Datenschutz

Alle Daten bleiben auf dem Gerät. Kein Server, keine Werbung, kein Konto,
kein Tracking. Auch das Diagnose-Protokoll wird nicht übertragen.

Die PIN-Sperre ist ein **Sichtschutz, keine Verschlüsselung** – die Noten
liegen weiterhin im Klartext im lokalen Speicher. Das steht so auch in der App.

## Projektstruktur

```
index.html                 Gerüst (nur für den Build)
vite.config.js             Single-File-Ausgabe
capacitor.config.json      Lite-App
capacitor.config.pro.json  Pro-App (eigene App-ID)
.env.pro / .env.lite       setzen VITE_TIER

src/
  App.jsx                  Bildschirme und Ablauf
  main.jsx                 Einstiegspunkt
  styles.css               gesamtes Aussehen
  lib/
    grades.js              Rechenlogik (Noten, Schlüssel, Abitur, Datum)
    state.js               Datenschema v3, Migration, Validierung
    storage.js             Speicherzugriff
    exporters.js           Sicherung, CSV, Druckansicht
    i18n.js                alle Texte (de/en)
    tier.js                Lite/Pro
    security.js            PIN
    logger.js              lokales Diagnose-Protokoll
  components/
    icons.jsx  ui.jsx  charts.jsx  panels.jsx
    KeyCalc.jsx  AbiCalc.jsx  LockScreen.jsx  ErrorBoundary.jsx
```
