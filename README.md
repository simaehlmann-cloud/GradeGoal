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

## Signierte App-Bundles (.aab) bauen lassen

### Einmalig: Keystore erzeugen und hinterlegen

```bash
keytool -genkey -v -keystore gradegoal.jks -alias gradegoal \
        -keyalg RSA -keysize 2048 -validity 10000
```

**Diese Datei sicher aufbewahren und mehrfach sichern.** Geht sie verloren,
lässt sich keine Aktualisierung mehr veröffentlichen – die App müsste unter
neuem Namen neu eingereicht werden. Ein Keystore für beide Ausgaben genügt.

Dann in Base64 umwandeln:

```bash
base64 -w0 gradegoal.jks > keystore.txt     # Linux
base64 -i gradegoal.jks | tr -d '\n'        # macOS
certutil -encode gradegoal.jks keystore.txt # Windows, danach Kopf- und Fußzeile entfernen
```

Unter **Settings → Secrets and variables → Actions → New repository secret**
vier Einträge anlegen:

| Name | Inhalt |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Inhalt von `keystore.txt`, ohne Zeilenumbrüche |
| `ANDROID_KEYSTORE_PASSWORD` | Kennwort des Keystores |
| `ANDROID_KEY_ALIAS` | `gradegoal` |
| `ANDROID_KEY_PASSWORD` | Kennwort des Schlüssels (oft identisch) |

Der Keystore selbst gehört **nicht** ins Repo; `.gitignore` schließt
`*.jks` und `*.keystore` aus.

### Release auslösen

**Actions → Release AAB (Play Store) → Run workflow.** Dort eintragen:

- **version_name** – muss zu `package.json` passen, z. B. `1.6.0`
- **version_code** – ganze Zahl, **höher als beim letzten Upload**. Play
  nimmt jeden Wert nur einmal je App-ID an. Beim ersten Mal `1`.
- **tier** – `beide`, `lite` oder `pro`

Ergebnis: `gradegoal-lite-…-aab` und `gradegoal-pro-…-aab` unter Artifacts.
Diese `.aab` in der Play Console hochladen.

Der Workflow läuft bewusst **nicht** bei jedem Push: jeder Lauf verbraucht
einen versionCode.

## Später: iOS

Vorbereitet ist bereits alles, was sich ohne Mac erledigen lässt:

- Die App-Icons sind randlos und **ohne Alphakanal** – App Store Connect
  lehnt Icons mit Transparenz oder eigenen runden Ecken ab.
- Safe Areas sind im Stylesheet berücksichtigt (Notch, Home-Indikator).
- `capacitor.config*.json` enthält bereits den `ios`-Abschnitt.
- Die Bundle-IDs entsprechen den App-IDs.

Was ein Mac braucht:

```bash
npm install @capacitor/ios
npm run build          # oder build:pro
npx cap add ios
npx capacitor-assets generate --ios
npx cap sync ios
npx cap open ios       # dann in Xcode signieren und hochladen
```

Nicht vergessen: Apple verlangt eine erreichbare Datenschutz-URL und die
Angaben unter „App Privacy". Für GradeGoal lautet die Antwort überall
**„Data Not Collected"**.

## Hinweise zur Einreichung

- **Datenschutzerklärung als Webseite.** Beide Stores verlangen eine
  öffentlich erreichbare URL. Die GitHub-Pages-Adresse eignet sich dafür.
- **Zielgruppe.** Die App richtet sich auch an Kinder unter 13. In der Play
  Console führt das ins Programm „Für Familien" mit zusätzlichen Fragen.
  Weil GradeGoal keine Daten erhebt, keine Werbung zeigt und keine
  Netzwerkverbindung aufbaut, sind die Antworten unkritisch – die Angaben
  müssen aber gemacht werden.
- **Keine In-App-Käufe.** Lite und Pro sind getrennte Einträge; in beiden
  Formularen „nein" angeben.

## Store-Vorbereitung

Im Ordner `store/` liegt alles Nicht-Technische fertig vor:

| Datei | Inhalt |
|---|---|
| `PLAY-CONSOLE-CHECKLISTE.md` | Zeitplan und alle Formularantworten |
| `STORE-TEXTE.md` | Namen und Beschreibungen, deutsch und englisch, für beide Ausgaben |
| `feature-graphic-lite.png` | 1024 × 500, fertig zum Hochladen |
| `feature-graphic-pro.png` | dasselbe für Pro |

Die Datenschutzerklärung liegt als `public/datenschutz.html` im Projekt
und wird über GitHub Pages mitveröffentlicht:
`https://DEINNAME.github.io/REPOSITORY/datenschutz.html`

**Wichtig:** Beide Stores verlangen eine erreichbare Datenschutz-URL, und
das Impressum braucht eine ladungsfähige Anschrift. In der Datei stehen
dafür markierte Platzhalter.

Der wichtigste Zeitfaktor steht in der Checkliste: Neue persönliche
Entwicklerkonten müssen vor dem Produktionszugriff einen geschlossenen
Test mit 12 Testern über 14 zusammenhängende Tage bestehen. Das lässt
sich nicht abkürzen – deshalb möglichst früh damit anfangen.

Feature-Grafiken neu erzeugen: `python3 tools/make_feature_graphic.py`
