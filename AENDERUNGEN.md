# Änderungen

Neueste Version oben. Bis 1.8.0 lagen die Einträge in einzelnen
`CHANGELOG-x.y.z.md`-Dateien; sie sind hier unverändert zusammengeführt.

---

# GradeGoal 1.9.0 – Feinschliff nach dem Vorbild von FairMix und PitchPro

## Rechtstexte

- **Impressum:** USt-IdNr. DE430437820 ergänzt (Pflicht nach § 5 Abs. 1
  Nr. 6 DDG, in FairMix und PitchPro schon vorhanden). Abschnitt
  „Vertrieb“ ergänzt: Vertragspartner beim Kauf ist der Store.
  **Interne Arbeitsnotizen entfernt**, die öffentlich sichtbar waren
  (Hinweise zur Kontaktpflicht, zum Steuerrecht, zum alten EU-OS-Link).
- **Datenschutz:** auf den Stand seit 1.8.0 gebracht – kein „Pro“ mehr,
  keine Druckfunktion des Betriebssystems in der App, der Kasten oben
  widerspricht nicht mehr der Store-Abfrage. Neu beschrieben: Zweitablage
  (UserDefaults/SharedPreferences), Kaufstatus, Merker für
  Sicherungserinnerung und Bewertungsbitte, Bewertungsfenster.
- **Englische Fassungen:** `impressum-en.html`, `datenschutz-en.html`
  (wie FairMix 1.23.1). Die App öffnet je nach Sprache die passende Seite.
- **Offline in der App:** Impressum und Datenschutz werden aus dem
  App-Paket angezeigt (`recht.js` blendet im Rahmen die eigene Navigation
  aus, meldet die Höhe und reicht Verweise nach außen an die App weiter).
  Vorher brauchte die Anzeige Internet.
- Untertitel überall „Noten bis zum Abi“ (vorher „Schulnoten & Grades“).

## Neue Funktionen

- **Beispielzeugnis** (wie die Beispielklasse in FairMix): erscheint,
  solange noch keine Note eingetragen ist. „Beispiel entfernen“ stellt
  den vorherigen Stand wieder her (eigene Fächer bleiben erhalten).
- **Neues Halbjahr übernimmt** Fächer, Notensystem, Fach- und
  Kategoriegewichtung, Notenschlüssel und Fächergruppen aus dem
  geöffneten Halbjahr – ohne Noten. Vorher entstanden immer die
  15 Standardfächer mit Skala 1–6; die Oberstufe musste jedes Halbjahr
  neu auf Punkte umstellen.
- **Fächer und Kategorien umbenennen** (vorher nur löschen und neu anlegen).
- **Fächer sortieren** über „Reihenfolge ändern“ (Pfeile statt Ziehen –
  funktioniert zuverlässig in jeder WebView).
- **Sicherungserinnerung** (wie FairMix und PitchPro): nach 30 Tagen
  und 15 Änderungen ohne Sicherung, „Später“ verschiebt um 14 Tage.
  In den Einstellungen steht, wann zuletzt gesichert wurde.
- **Bitte um Bewertung** über das Bewertungsfenster des Systems
  (`@capawesome/capacitor-app-review`): frühestens nach 7 Tagen und
  10 Noten, nur nach einer erreichten Wunschnote oder einer neuen
  Einzelnote, höchstens einmal je Version, nie im Beispiel, nie im
  Browser. Kein eigenes Vorfenster. Dazu „App bewerten“ unter Info
  (Android sofort, iOS sobald `APPSTORE_ID` in `src/lib/review.js`
  eingetragen ist).
- Das erste Schuljahr heißt automatisch z. B. „2026/27“, das erste
  Halbjahr passend zur gewählten Sprache.

## Bedienung und Aussehen

- Neue Ansichten beginnen oben; zurück auf der Startseite landet man an
  der alten Stelle (vorher öffnete sich ein Fach weit unten mitten im
  Inhalt).
- Kurze Ladeanzeige statt leerer Fläche beim Start.
- Rückmeldungen als schwebender Hinweis unten. Vorher erschien dieselbe
  Meldung in mehreren Karten gleichzeitig (PIN, Daten, Halbjahre).
- Kategoriezeile zweizeilig: Name, Schnitt und Löschen oben, Gewichtung
  darunter. Vorher brach die Zeile auf dem Handy unschön um.
- Fächerliste: Bei wenig Platz wird die Verlaufslinie gekürzt, nicht
  der Fachname („Sp…“).
- Abitur-Rechner: Zeilen brechen auf schmalen Handys nicht mehr um.
- Kontakt-Adresse unter Info ist anklickbar.
- Sprache des Dokuments folgt der App (Vorlesefunktion, Silbentrennung).
- Englische Anführungszeichen im Zielrechner.

## Fehler behoben

- Kaufkarte blieb bis zum Neustart auf „Store nicht erreichbar“, wenn
  der Store beim Start nicht antwortete. Jetzt neuer Versuch beim
  Anzeigen der Karte.
- Screenreader las beim Löschen einer Kategorie „Fach löschen“ vor,
  beim Löschen einer Note nur „✕“.
- Abgebrochenes Teilen-Menü zählt nicht als Sicherung.

## Technik

- **Privacy-Manifest für iOS** (`tools/apple/PrivacyInfo.xcprivacy`, wie
  FairMix/PitchPro): kein Tracking, keine erhobenen Daten, UserDefaults
  mit Grund CA92.1. `tools/prepare-ios.sh` kopiert es bei jedem Build ins
  Projekt und trägt es als Ressource ein (`tools/apple/add-resource.rb`).
- **Tests** (`npm test`, 20 Prüfungen mit `node --test`, ohne neue
  Abhängigkeiten): Rechenlogik inkl. kompletter Abitur-Tabelle
  300–900 Punkte, Migration, Halbjahr übernehmen, Beispielzeugnis,
  Sicherungs- und Bewertungsregeln. Läuft in allen Workflows vor dem Build.
- **Store-Screenshots** per `npm run store-bilder` (wie FairMix): iPhone
  6,9″, iPad 13″ und Android, jeweils Deutsch und Englisch, Maße geprüft.
- Feature-Grafik nur noch einmal (`store/feature-graphic.png`).
- Aufgeräumt: Reste der Lite/Pro-Zeit (siehe Löschliste in der
  Upload-Anleitung), ungenutzte CSS-Klassen.
- Neue Abhängigkeit: `@capawesome/capacitor-app-review` (MIT).

---

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

---

# GradeGoal 1.6.2 – Rechtsseiten mit echten Daten

Baut auf 1.6.1 auf (Komma im Notenschlüssel, Standardschlüssel,
Store-Verweise). Neu ist der Abgleich mit der FairMix-Vorlage.

## Aus deiner Vorlage übernommen

**Ein Abschnitt, der mir gefehlt hat: Eingabe von Daten Dritter.**
GradeGoal richtet sich ausdrücklich auch an Eltern und Lehrkräfte. Wer
Noten oder Namen anderer Personen einträgt, verarbeitet personenbezogene
Daten in eigener Verantwortung. Für Lehrkräfte kommt hinzu, dass in
mehreren Bundesländern die Verarbeitung von Schülerdaten auf privaten
Geräten eingeschränkt oder genehmigungspflichtig ist – und Noten sind
besonders schutzwürdig. Das steht jetzt als eigener Abschnitt 3 drin,
mit dem Rat, nur Vornamen oder Kürzel zu verwenden.

**§ 18 Abs. 2 MStV** bei der Verantwortlichkeit für den Inhalt.

**Der Ablauf beim Export**: Die Datei wird zunächst in einem temporären
Verzeichnis der App abgelegt und an die Speichern- oder Teilen-Funktion
des Geräts übergeben.

## Echte Daten eingesetzt

Keine Platzhalter mehr – beides ist fertig zum Veröffentlichen:

```
Wisdompeak Apps
Inhaber: Simon Mählmann
Oderstraße 13
28844 Weyhe
smaehlmann.appdev@gmail.com
Kleinunternehmer gemäß § 19 UStG
```

Ebenfalls gesetzt in `src/lib/i18n.js`:

```
CONTACT      smaehlmann.appdev@gmail.com
PUBLISHER    Wisdompeak Apps
PRIVACY_URL  …github.io/GradeGoal/datenschutz.html
IMPRINT_URL  …github.io/GradeGoal/impressum.html
```

Im Info-Bildschirm der App steht jetzt „Herausgeber: Wisdompeak Apps"
über dem Entwicklernamen, dazu zwei Schaltflächen zu den Rechtsseiten.

## Was ich gegenüber deiner Vorlage ergänzt habe

- **Rechtsgrundlage** ausdrücklich benannt: Art. 6 Abs. 1 lit. b DSGVO
  und § 25 Abs. 2 Nr. 2 TDDDG. Letzteres ist der Grund, warum kein
  Zustimmungsbanner nötig ist.
- **Speicherdauer** als eigener Abschnitt – Art. 13 Abs. 2 lit. a DSGVO
  verlangt ihn.
- **Tabelle aller lokal gespeicherten Daten** statt Fließtext.
- **GitHub Pages als Hoster** der Webversion mit eigener Rechtsgrundlage
  (Art. 6 Abs. 1 lit. f DSGVO).
- **Apple** neben Google, für den späteren App Store.
- **Beschwerderecht** nach Art. 77 DSGVO mit der zuständigen
  niedersächsischen Behörde.
- **Keine automatisierte Entscheidungsfindung** nach Art. 22 DSGVO.
- **Haftungsabschnitt zu den Rechenfunktionen** im Impressum:
  Notenschlüssel, Abschlussanforderungen und Abitur-Einbringungsregeln
  unterscheiden sich je Bundesland und ändern sich.
- **Lizenzen** der verwendeten Bestandteile (React, Space Grotesk, Karla).
- Beide Seiten in **Deutsch und Englisch**, mit gemeinsamem Stylesheet
  `public/recht.css` und gegenseitiger Verlinkung.

## Ein Hinweis

Der EU-Link zur Online-Streitbeilegung fehlt in deiner Vorlage
richtigerweise – die Plattform wurde im Juli 2025 eingestellt. Viele
ältere Impressumsvorlagen führen ihn noch und laufen damit ins Leere.

## Noch zu tun

Die beiden Adressen funktionieren erst, wenn GitHub Pages aktiv ist.
Einmal im Browser aufrufen, bevor du sie in der Play Console einträgst.

Ich bin kein Anwalt. Für einen kostenpflichtigen Store-Eintrag mit
Wohnanschrift kann sich eine kurze anwaltliche Durchsicht lohnen.

---

# GradeGoal 1.6.0 – Eigene Notenschlüssel

## Der Kern

Notenschlüssel unterscheiden sich von Schule zu Schule **und von Fach zu
Fach**. Bisher gab es nur zwei feste Umrechnungen (linear und IHK) – das
traf die Schulwirklichkeit nicht.

Jetzt legst du eigene Schlüssel an, mit beliebig vielen Stufen, und
ordnest sie den Fächern zu.

## Zwei Entwurfsentscheidungen

**Schlüssel gehören zum Halbjahr, nicht zum Fach.** Meist gilt derselbe
Schlüssel für mehrere Fächer. Wären sie am Fach festgemacht, müsstest du
dieselbe Tabelle mehrfach eintippen und bei einer Änderung mehrfach
nachziehen. Stattdessen: benannte Schlüssel, und jedes Fach zeigt auf
einen. Ein Fach ohne eigene Wahl nutzt die Vorgabe des Halbjahres.

**Schwellen in Prozent, nicht in Punkten.** Eine Arbeit hat 50 Punkte,
die nächste 120. „Ab 92 %" gilt für beide, „ab 46 Punkte" nur für die
eine.

## Neu im Einzelnen

- **Schlüsselverwaltung** unter „Notenschlüssel": anlegen, benennen,
  Zeilen frei bearbeiten, löschen
- **Zuordnung je Fach** im Fach-Detail, mit Rückfall auf die Vorgabe
- **Punkte statt Note eintragen**: bei den Einzelnoten auf `%`
  umschalten, „34 von 50" eingeben – die App rechnet mit dem Schlüssel
  des Fachs um und merkt sich die Punkte
- **Notenspiegel** zeigt die Schreibweise, wie du sie eingetippt hast
  (also „2+", nicht „1,7")
- **Vorlagen** als Startpunkt: Ganze Noten, Mit Tendenzen, IHK
- **CSV-Export** um die Spalten „Punkte" und „von" erweitert

## Zu den Vorlagen

„Ganze Noten" legt genau die Noten deiner Skala an – bei 1–6 also sechs
Zeilen, bei Oberstufen-Punkten sechzehn.

„Mit Tendenzen" ergänzt 2+ und 3− als eigene Stufen und ergibt 15
Stufen. Die Liste endet bewusst bei glatter 1 und glatter 6: 1+ wäre
rechnerisch 0,7 und läge außerhalb der Skala.

Beides sind **Startpunkte**, keine Vorgaben. Jede Zeile lässt sich
danach frei ändern, und + oder − kannst du überall selbst eintippen.
Einen bundesweit gültigen Schulschlüssel gibt es nicht – nur der
IHK-Schlüssel ist ein verbindlicher Standard und deshalb fest
hinterlegt.

## Nebenbei behoben

Die Vorlage verweigerte bei Oberstufen-Punkten 0–15 die Arbeit, weil ich
eine Obergrenze von 10 Zeilen eingebaut hatte. Eine 16-zeilige Tabelle
ist an Schulen aber genau das Übliche. Die Sperre ist raus.

## Schema

Version 4. Die Migration ergänzt `keys` und `defaultKeyId` am Halbjahr
sowie `keyId` am Fach. Verweise auf gelöschte Schlüssel werden beim Laden
zurückgesetzt, damit kein Fach einen Namen anzeigt, hinter dem nichts
mehr steckt.

## Dateien

```
ERSETZT src/lib/grades.js         Schlüssellogik, keyOf, Vorlagen
ERSETZT src/lib/state.js          Schema v4
ERSETZT src/lib/i18n.js           neue Texte, Version 1.6.0
ERSETZT src/lib/exporters.js      Punktespalten im CSV
ERSETZT src/components/KeyCalc.jsx    Rechner + Verwaltung
ERSETZT src/components/ui.jsx     Punkteeingabe in der Schnelleingabe
ERSETZT src/App.jsx               Zuordnung im Fach-Detail
ERSETZT package.json              Version 1.6.0
```

---

# GradeGoal 1.5.1

## Behobener Fehler

**Aussperrung in der Lite-Ausgabe.** Wer in Pro eine PIN gesetzt, eine
Sicherung exportiert und diese in Lite importiert hatte, kam nicht mehr
in die App: Die Sperre griff, der Knopf zum Aufheben lag aber hinter dem
Pro-Hinweis. Einziger Ausweg wäre das Löschen aller Daten gewesen.
Das Aufheben liegt jetzt bewusst außerhalb des Pro-Hinweises.

## Neu

- **Eigenes App-Icon für Lite** mit gelbem LITE-Streifen.
- **Signierte App-Bundles (.aab)** über den Workflow „Release AAB".
- **Bildmaterial neu erzeugt** – siehe unten.
- **iOS vorbereitet**: `ios`-Abschnitt in beiden Capacitor-Konfigurationen,
  Icons ohne Alphakanal.

## Zum Bildmaterial

Bisher gab es genau eine `assets/icon.png`. Daraus leitete
`capacitor-assets` alles ab – mit zwei Nachteilen:

**Android beschneidet.** Seit Android 8 sind Icons zweischichtig, und der
Gerätehersteller bestimmt die Maske: Kreis, Squircle, Tropfen. Sicher
sichtbar bleiben nur die inneren 66 % der Fläche. Ein fertiges Quadrat
verliert dabei die Ecken. Jetzt gibt es getrennte Ebenen
(`icon-background.png`, `icon-foreground.png`), und der Generator rechnet
die Größe der Zeichnung selbst aus, statt sie zu schätzen.

**iOS lehnt Transparenz ab.** App Store Connect weist Icons mit Alphakanal
oder selbst gezeichneten runden Ecken zurück. `icon-only.png` ist deshalb
randlos und deckend; die Rundung übernimmt das System.

Die Größen stimmen jetzt exakt: Icons 1024×1024, Splashscreens 2732×2732.

`tools/check_icons.py` prüft all das nach – auch, ob nach einer Änderung
am Motiv noch alles innerhalb der sicheren Zone liegt.

## Dateien

```
NEU     tools/make_icons.py          erzeugt alle Bilddateien
NEU     tools/check_icons.py         prüft sie gegen die Store-Vorgaben
NEU     tools/prepare-release.sh     versionCode + Signierung ins Gradle-Projekt
NEU     .github/workflows/release-aab.yml
NEU     assets-lite/                 Bildmaterial mit LITE-Streifen
NEU     public/icon-lite.svg         Favicon der Lite-Webversion
ERSETZT assets/                      neu erzeugt, richtige Größen
ERSETZT src/App.jsx                  Aussperrung behoben
ERSETZT src/lib/i18n.js              Version 1.5.1
ERSETZT package.json                 Version 1.5.1
ERSETZT capacitor.config*.json       ios-Abschnitt
ERSETZT .gitignore                   *.jks, *.p12, *.mobileprovision
ERSETZT .github/workflows/build-apk.yml
ERSETZT README.md
```

## Bildmaterial neu erzeugen

```bash
python3 tools/make_icons.py    # braucht Pillow: pip install pillow
python3 tools/check_icons.py
```

---

# GradeGoal 1.5.0 – Lite/Pro, Rechner, Schuljahre

## Dateien

```
index.html                        (unverändert seit 1.4.0)
package.json                      ersetzen   – neue Skripte, Version 1.5.0
.env.pro                          NEU        – setzt VITE_TIER=pro
.env.lite                         NEU        – nur zum Testen der Lite-Ausgabe
capacitor.config.json             (unverändert – die Lite-App)
capacitor.config.pro.json         NEU        – eigene App-ID für die Pro-App

src/App.jsx                       ersetzen
src/styles.css                    ersetzen
src/main.jsx                      (unverändert seit 1.4.0)

src/lib/grades.js                 ersetzen   – + Gewichtung, Notenschlüssel, Abitur, Datum
src/lib/state.js                  ersetzen   – Schema v3
src/lib/exporters.js              ersetzen   – Schuljahr + Fachgewicht in CSV/Druck
src/lib/i18n.js                   NEU        – aus App.jsx ausgelagert
src/lib/tier.js                   NEU        – Lite/Pro
src/lib/security.js               NEU        – PIN
src/lib/storage.js                (unverändert seit 1.4.0)
src/lib/logger.js                 (unverändert seit 1.4.0)

src/components/icons.jsx          NEU
src/components/ui.jsx             NEU
src/components/charts.jsx         NEU
src/components/panels.jsx         NEU
src/components/KeyCalc.jsx        NEU
src/components/AbiCalc.jsx        NEU
src/components/LockScreen.jsx     NEU
src/components/ErrorBoundary.jsx  (unverändert seit 1.4.0)
```

Weiterhin **keine neuen Abhängigkeiten**.

## Bauen

```bash
npm run dev          # Entwicklung, Pro aktiv
npm run dev:lite     # Lite-Ausgabe testen
npm run build        # -> dist/  = LITE
npm run build:pro    # -> dist/  = PRO
```

Wichtig: Beide Builds schreiben nach `dist/`. Vor dem Wechsel `dist/` leeren
oder die fertige Datei sofort wegkopieren.

Für die zwei Play-Store-Einträge braucht die Pro-App eine eigene App-ID.
Vor `npx cap sync` die passende Konfiguration aktivieren:

```bash
cp capacitor.config.pro.json capacitor.config.json   # nur für den Pro-Build
```

## Aufteilung Lite / Pro

**Lite:** Fächer, Zeugnisnoten, Gesamtdurchschnitt, Wunschnoten mit Konfetti,
Kategorien & Einzelnoten, Zielrechner, Notensysteme 1–6 und 0–15, Ziele,
Notizen, Einfacher Modus, Design, Drucken/PDF, **Sicherung Export + Import**.

**Pro:** Schuljahre, Halbjahre & Profile · Notenverlauf, Sparklines,
Langzeitverlauf · Ausgewählte Durchschnitte mit Vorlagen · Fachgewichtung ·
Was-wäre-wenn · Abitur-Rechner · Notenschlüssel · PIN-Sperre · CSV-Export ·
eigene Skala.

Die Zuordnung steht an einer Stelle: `PRO_FEATURES` in `src/lib/tier.js`.

## Neu in 1.5.0

- **Datum je Einzelnote.** Bisher wurde hart `Date.now()` gestempelt.
- **Fachgewichtung** (1 = normal, 2 = doppelt, 0 = zählt nicht mit).
- **Was-wäre-wenn-Regler** im Fach-Detail.
- **Notenschlüssel-Rechner** – linear, IHK, Punkte 0–15, mit Notenspiegel.
- **Abitur-Rechner** – Block I, Block II, KMK-Formel, Bedingungsprüfung.
- **Schuljahre** als Ebene über den Halbjahren, plus Langzeitverlauf.
- **PIN-Sperre** (Sichtschutz, keine Verschlüsselung – steht so auch in der App).
- **Gruppen-Vorlagen**: Kernfächer, Übrige, Naturwissenschaften, Sprachen,
  Gesellschaftswissenschaften.

## Bewusste Entscheidungen

- **Keine fest verdrahteten Landesregeln.** Weder Abschluss-Grenzwerte noch
  Abitur-Einbringungspflichten. Beides unterscheidet sich je Bundesland und
  ändert sich; eine falsche Zahl wäre schlimmer als gar keine. Die Vorlagen
  legen nur Fächergruppen an, den Ziel-Ø trägt der Nutzer selbst ein.
- **Export/Import bleibt in Lite.** Die Daten des Nutzers dürfen nicht als
  Kaufanreiz dienen – und es ist zugleich der Migrationspfad Lite → Pro.
- **Kein Kauf-Knopf ohne Adresse.** `PRO_URL` in `tier.js` ist leer; solange
  sie leer ist, zeigt die App nur den Hinweistext. Ein toter Link ist ein
  Ablehnungsgrund im Store.
- **Lite ist der Standard.** Ein Produktions-Build ohne Flag ist immer Lite –
  ein vergessenes Flag verschenkt nie die Pro-Funktionen.

## Vor der Veröffentlichung

- [ ] `CONTACT` in `src/lib/i18n.js` ersetzen (kontakt@example.de)
- [ ] `PRO_URL` in `src/lib/tier.js` eintragen, sobald der Store-Eintrag steht
- [ ] Play Console: In-App-Käufe „nein", Werbung „nein", Datensicherheit
      „keine Daten erhoben" – für beide Einträge
- [ ] Beide APKs im Flugmodus testen, insbesondere die PIN-Sperre

---

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

---

