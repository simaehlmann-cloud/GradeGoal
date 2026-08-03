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
