# GradeGoal: Schulnoten & Grades

Zeugnisnoten eintragen, Durchschnitte berechnen, Wunschnoten erreichen.
Entwickelt von Simon Mählmann · Version 1.8.0

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
npm run build      # erzeugt dist/index.html
```

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
    i18n.js                alle Texte (de/en)
    security.js            PIN
    logger.js              lokales Diagnose-Protokoll
  components/
    icons.jsx  ui.jsx  charts.jsx  panels.jsx
    KeyCalc.jsx  AbiCalc.jsx  LockScreen.jsx  ErrorBoundary.jsx

tools/
  prepare-release.sh       Android: Version und Signierung
  prepare-ios.sh           iOS: Version, Info.plist-Einträge
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

- **version_name** – muss zu `package.json` passen, z. B. `1.6.2`
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
| `PLAY-CONSOLE-CHECKLISTE.md` | Google Play (Stand vor 1.8.0, vor Nutzung anpassen) |
| `STORE-TEXTE.md` | Play-Texte (Stand vor 1.8.0, vor Nutzung anpassen) |

Impressum und Datenschutzerklärung liegen als `public/impressum.html` und
`public/datenschutz.html` im Projekt und werden über GitHub Pages
veröffentlicht. Die App verlinkt unter „Info & Impressum“ dorthin
(`PRIVACY_URL`, `IMPRINT_URL` in `src/lib/i18n.js`).

Der wichtigste Zeitfaktor bei Google Play: Neue persönliche
Entwicklerkonten müssen vor dem Produktionszugriff einen geschlossenen
Test mit 12 Testern über 14 zusammenhängende Tage bestehen.
