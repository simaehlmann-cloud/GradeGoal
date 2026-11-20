# GradeGoal: Noten bis zum Abi

Zeugnisnoten eintragen, Durchschnitte berechnen, Wunschnoten erreichen.
Entwickelt von Simon Mählmann (Wisdompeak Apps) · Version 1.9.0

Was sich geändert hat: `AENDERUNGEN.md`.

## Gratis-Rahmen und Kauf

Seit 1.8.0 gibt es **eine** App mit allen Funktionen (vorher: Lite und Pro).

| | Gratis | Nach dem Kauf |
|---|---|---|
| Alle Funktionen (Rechner, Diagramme, PIN, CSV …) | ✓ | ✓ |
| Schuljahre | 1 | beliebig viele |
| Halbjahre bzw. Profile | bis zu 2 | beliebig viele |

- Einmaliger In-App-Kauf, Produkt-ID `gradegoal_unlimited`
  (nicht-verbrauchbar), über `@capgo/native-purchases` (StoreKit 2 bzw.
  Google Play Billing).
- Grenzen, Produkt-ID und Store-Abfrage stehen an **einer** Stelle:
  `src/lib/purchase.js`.
- Daten werden nie gesperrt: Eine importierte Sicherung mit mehreren
  Schuljahren bleibt vollständig nutzbar, nur **neue** Schuljahre bzw.
  Halbjahre über den Rahmen hinaus brauchen den Kauf.
- Der Kaufstatus liegt nicht in der Sicherungsdatei.
- Im Browser (GitHub Pages) gibt es keinen Kauf – dort gilt der
  Gratis-Rahmen. `npm run dev` ist immer freigeschaltet. Zum Testen des
  freigeschalteten Zustands im Browser: in der Konsole
  `localStorage.setItem("gradegoal:unlocked", "1")` und neu laden
  (zurück mit `localStorage.removeItem("gradegoal:unlocked")`).

## Lokal entwickeln

```bash
npm install
npm run dev        # http://localhost:5173 (freigeschaltet)
npm test           # Rechenlogik prüfen (läuft auch in jedem Workflow)
npm run build      # erzeugt dist/index.html
```

**Bei jeder Version:** `version` in `package.json` und `APP_VER` in
`src/lib/i18n.js` gleich setzen. Ändert sich, was die App speichert:
Abschnitt 2 in `public/datenschutz.html` **und** `datenschutz-en.html`
ergänzen.

## Prüfen

`npm test` führt die Tests in `tests/` aus (`node --test`, keine
zusätzlichen Pakete): Notenwerte, gewichteter Schnitt, Zielrechner,
Schlüssel, die komplette Abitur-Tabelle 300–900 Punkte, Datenmigration,
„Neues Halbjahr übernimmt Fächer“, Beispielzeugnis, Sicherungserinnerung
und Bewertungsregeln. Schlägt ein Test fehl, bricht jeder Build ab –
eine falsch rechnende Version kommt so nicht in die Stores.

## Store-Screenshots

```bash
npm install --no-save playwright
npx playwright install chromium
npm run store-bilder
```

Steuert die gebaute App mit dem Beispielzeugnis (`src/lib/demo.js`) und
legt in `store-bilder/` sechs Bilder je Satz ab: iPhone 6,9″
(1320 × 2868), iPad 13″ (2064 × 2752) und Android (1080 × 2160), jeweils
Deutsch und Englisch. Jedes Bild wird gegen sein Sollmaß geprüft.
`store-bilder/` steht in `.gitignore`.

## Bewertungen

`src/lib/review.js` bittet über das Bewertungsfenster des Systems um
eine Bewertung – frühestens nach 7 Tagen und 10 Noten, höchstens einmal
je Version, nur nach einer erreichten Wunschnote oder einer neuen
Einzelnote. Sobald die App im App Store steht, die Apple-ID bei
`APPSTORE_ID` eintragen; dann erscheint „App bewerten“ auch auf iOS.

Die erzeugte `dist/index.html` enthält den kompletten Code und läuft
offline. Zum Entwickeln immer `npm run dev` verwenden – die `index.html`
im Projektordner ist nur das Gerüst.

## Web-Version am Handy (ohne APK)

Der Workflow `deploy-pages.yml` veröffentlicht bei jedem Push über GitHub
Pages. Einmalig aktivieren:
**Repository → Settings → Pages → Source: „GitHub Actions"**

Danach ist die App unter `https://DEINNAME.github.io/REPOSITORY-NAME/`
erreichbar – am Handy im Browser öffnen und über „Zum Startbildschirm
hinzufügen" ablegen.

Im Browser gilt der Gratis-Rahmen; ein Kauf ist nur in der App möglich.

## iOS / TestFlight (ohne eigenen Mac)

Workflow **iOS – TestFlight** (`.github/workflows/ios-testflight.yml`):
baut auf einem Mac von GitHub, signiert per Apple Cloud Signing und lädt
direkt zu App Store Connect hoch. Start von Hand unter **Actions → iOS –
TestFlight → Run workflow**.

Benötigte Secrets: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`,
`ASC_KEY_P8_BASE64` (optional `IOS_DIST_P12_BASE64` und
`IOS_DIST_P12_PASSWORD` für ein eigenes Zertifikat).

Alles Weitere Schritt für Schritt: `store/APP-STORE-CHECKLISTE.md`.

## Android-APK

Bei jedem Push auf `main` baut GitHub Actions eine Test-APK:
**Actions → letzter Lauf → Artifacts**. Sind die Keystore-Secrets
hinterlegt (siehe unten), ist sie mit dem Release-Schlüssel signiert und
lässt sich über eine ältere Test-APK installieren.

Lokal (Android Studio):

```bash
npm install && npm run build
npx cap add android
npx capacitor-assets generate --android
npx cap sync android
npx cap open android
```

Voraussetzungen ab Capacitor 8: Node 22, JDK 21; iOS braucht Xcode 26.

## Icon ändern

`assets/icon.png` (1024×1024) und `assets/splash.png` /
`assets/splash-dark.png` (2732×2732) ersetzen, dann
`npx capacitor-assets generate --android` bzw. `--ios` erneut ausführen.
`public/icon.svg` ist das Favicon der Web-Version.

## Play-Store-Release

Signierte App-Bundles baut der Workflow **Release AAB** (siehe unten).
Vor der Play-Veröffentlichung `store/PLAY-CONSOLE-CHECKLISTE.md`
anpassen: ein Eintrag (`de.maehlmann.gradegoal`), In-App-Käufe „ja“,
In-App-Produkt `gradegoal_unlimited` in der Play Console anlegen.

## Datenschutz

Alle Daten bleiben auf dem Gerät. Kein Server, keine Werbung, kein Konto,
kein Tracking. Auch das Diagnose-Protokoll wird nicht übertragen.

Die PIN-Sperre ist ein **Sichtschutz, keine Verschlüsselung** – die Noten
liegen weiterhin im Klartext im lokalen Speicher. Das steht so auch in der App.

## Projektstruktur

```
index.html                 Gerüst (nur für den Build)
vite.config.js             Single-File-Ausgabe
capacitor.config.json      App-ID, Name, Plattform-Einstellungen

src/
  App.jsx                  Bildschirme und Ablauf
  main.jsx                 Einstiegspunkt
  styles.css               gesamtes Aussehen
  lib/
    grades.js              Rechenlogik (Noten, Schlüssel, Abitur, Datum)
    state.js               Datenschema, Migration, Validierung
    storage.js             Speicher (in der App zusätzlich Preferences)
    exporters.js           Sicherung, CSV, Druckansicht
    filesave.js            Dateien herausgeben (Download bzw. Teilen-Menü)
    platform.js            App oder Browser, externe Verweise
    purchase.js            Gratis-Rahmen und In-App-Kauf
    meta.js                Sicherungserinnerung, Nutzungsbeginn (nicht in der Sicherung)
    review.js              Bitte um Bewertung, „App bewerten“
    demo.js                Beispielzeugnis (auch für die Store-Bilder)
    i18n.js                alle Texte (de/en)
    security.js            PIN
    logger.js              lokales Diagnose-Protokoll
  components/
    icons.jsx  ui.jsx  charts.jsx  panels.jsx
    KeyCalc.jsx  AbiCalc.jsx  LockScreen.jsx  ErrorBoundary.jsx

public/
  impressum(-en).html  datenschutz(-en).html  recht.css  recht.js

tests/                     npm test

tools/
  prepare-release.sh       Android: Version und Signierung
  prepare-ios.sh           iOS: Version, Info.plist-Einträge, Privacy-Manifest
  apple/PrivacyInfo.xcprivacy  apple/add-resource.rb
  store-bilder.mjs         Store-Screenshots
  make_icons.py  make_feature_graphic.py  check_icons.py
```

## Signierte App-Bundles (.aab) bauen lassen

### Einmalig: Keystore erzeugen und hinterlegen

```bash
keytool -genkey -v -keystore gradegoal.jks -alias gradegoal \
        -keyalg RSA -keysize 2048 -validity 10000
```

**Diese Datei sicher aufbewahren und mehrfach sichern.** Geht sie verloren,
lässt sich keine Aktualisierung mehr veröffentlichen – die App müsste unter
neuem Namen neu eingereicht werden.

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

- **version_name** – muss zu `package.json` passen, z. B. `1.9.0`
- **version_code** – ganze Zahl, **höher als beim letzten Upload**. Play
  nimmt jeden Wert nur einmal je App-ID an. Beim ersten Mal `1`.

Ergebnis: `gradegoal-…-aab` unter Artifacts.
Diese `.aab` in der Play Console hochladen.

Der Workflow läuft bewusst **nicht** bei jedem Push: jeder Lauf verbraucht
einen versionCode.

## Hinweise zur Einreichung

- **Datenschutzerklärung als Webseite.** Beide Stores verlangen eine
  öffentlich erreichbare URL. Die GitHub-Pages-Adresse eignet sich dafür.
- **App-Datenschutz / Datensicherheit:** „Keine Daten erfasst“. Den Kauf
  wickelt der Store ab.
- **In-App-Kauf:** ja – ein nicht-verbrauchbarer Artikel.
- **Zielgruppe.** Die App richtet sich auch an Kinder unter 13. Nicht in
  die App-Store-Kategorie „Kinder“ einordnen (dort gelten für Käufe
  zusätzliche Elternschranken in der App).

## Store-Vorbereitung

Im Ordner `store/`:

| Datei | Inhalt |
|---|---|
| `APP-STORE-CHECKLISTE.md` | Apple: Konto, App, Kauf, API-Schlüssel, TestFlight |
| `APP-STORE-TEXTE.md` | Name, Untertitel, Beschreibung, Schlüsselwörter, Kauf – de/en |
| `PLAY-CONSOLE-CHECKLISTE.md` | Google Play: Konto, Test mit 12 Personen, Kauf, Angaben |
| `STORE-TEXTE.md` | Play-Texte de/en, In-App-Produkt, Datensicherheit |
| `feature-graphic.png` | Feature-Grafik 1024 × 500 für Google Play |

Impressum und Datenschutzerklärung liegen als `public/impressum.html`,
`public/datenschutz.html` und englisch als `…-en.html` im Projekt. Sie
werden über GitHub Pages veröffentlicht (Adressen für die Stores) und
stecken außerdem im App-Paket: Die App zeigt sie unter „Info &
Impressum“ ohne Internet an (`public/recht.js` sorgt für die Darstellung
im Rahmen).

Der wichtigste Zeitfaktor bei Google Play: Neue persönliche
Entwicklerkonten müssen vor dem Produktionszugriff einen geschlossenen
Test mit 12 Testern über 14 zusammenhängende Tage bestehen.
