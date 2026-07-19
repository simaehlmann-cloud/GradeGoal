# GradeGoal: Schulnoten & Grades

Zeugnisnoten eintragen, Durchschnitte berechnen, Wunschnoten erreichen.
Entwickelt von Simon Mählmann · Version 1.3.1

## Lokal entwickeln

```bash
npm install
npm run dev        # öffnet die App unter http://localhost:5173
```

## Produktions-Build (Web)

```bash
npm run build      # erzeugt EINE fertige Datei: dist/index.html
npm run preview    # dist/ lokal testen
```

Die erzeugte `dist/index.html` enthaelt den kompletten kompilierten Code
und laesst sich direkt per Doppelklick im Browser oeffnen, verschicken
oder hochladen. Wichtig: Zum Entwickeln immer `npm run dev` verwenden -
die `index.html` im Projektordner selbst ist nur das Geruest und zeigt
beim Direktoeffnen eine weisse Seite.

Der Inhalt von `dist/` kann direkt auf GitHub Pages oder jedem Webspace
veröffentlicht werden. Alles läuft offline – React und die Schriften
(Space Grotesk, Karla) sind einkompiliert, keine CDN-Abhängigkeiten mehr.

## Web-Version am Handy (ohne APK)

Der Workflow `deploy-pages.yml` veroeffentlicht die App bei jedem Push
automatisch ueber GitHub Pages. Einmalig aktivieren:
**Repository → Settings → Pages → Source: "GitHub Actions"**

Danach ist die App unter `https://DEINNAME.github.io/REPOSITORY-NAME/`
erreichbar - einfach am Handy im Browser oeffnen und ueber
"Zum Startbildschirm hinzufuegen" wie eine App ablegen.

## Android-APK

### Automatisch (empfohlen)
Bei jedem Push auf `main` baut GitHub Actions eine Test-APK:
**Actions → letzter Lauf → Artifacts → gradegoal-debug-apk**

### Lokal (Android Studio erforderlich)
```bash
npm install
npm run build
npx cap add android
npx capacitor-assets generate --android   # Icon + Splashscreen aus assets/
npx cap sync android
npx cap open android                      # dann in Android Studio auf ▶
```

## Icon ändern

`assets/icon.png` (1024×1024) und `assets/splash.png` / `assets/splash-dark.png`
(2732×2732) ersetzen, dann `npx capacitor-assets generate --android` erneut
ausführen. `public/icon.svg` ist das Favicon der Web-Version.

## Play-Store-Release

Der Store akzeptiert nur signierte App-Bundles (.aab):
1. Keystore erzeugen (einmalig, sicher aufbewahren!):
   `keytool -genkey -v -keystore gradegoal.keystore -alias gradegoal -keyalg RSA -keysize 2048 -validity 10000`
2. In Android Studio: Build → Generate Signed Bundle / APK → Android App Bundle
3. `.aab` in der Play Console hochladen (siehe ANLEITUNG-APK.md, Etappe 5)

Vor der Einreichung: Kontakt-E-Mail in `src/App.jsx` ersetzen (kontakt@example.de)
und bei jedem Update den `versionCode` in `android/app/build.gradle` erhöhen.
