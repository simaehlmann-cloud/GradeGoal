# App Store & TestFlight – Checkliste

Ziel: GradeGoal ohne eigenen Mac nach TestFlight bringen. Gebaut wird auf
einem Mac von GitHub (Workflow **iOS – TestFlight**), du klickst nur im
Browser.

Reihenfolge: Teil A einmalig erledigen, dann Teil B (Repo), dann C
(Build). Teil E ist erst für die Veröffentlichung nötig.

---

## A. Einmalig bei Apple

### A1. Apple Developer Program

- Beitreten unter developer.apple.com/programs (99 € pro Jahr).
- Als **Einzelperson**. Im Store steht dann dein Name als Anbieter.
  „Wisdompeak Apps“ als Anbietername ginge nur mit einer Organisation
  (D-U-N-S-Nummer, eingetragene Rechtsform) – für den Start nicht nötig.
- Die Freischaltung dauert meist wenige Stunden, manchmal 1–2 Tage.

### A2. Team-ID notieren

developer.apple.com → **Account → Membership details → Team ID**
(10 Zeichen, z. B. `AB12CD34EF`).

### A3. Bundle-ID registrieren

developer.apple.com → **Certificates, Identifiers & Profiles →
Identifiers → +**

- Typ: **App IDs → App**
- Description: `GradeGoal`
- Bundle ID: **Explicit**, `de.maehlmann.gradegoal`
- Capabilities: nichts ändern. „In-App Purchase“ ist automatisch aktiv.

### A4. App in App Store Connect anlegen

appstoreconnect.apple.com → **Apps → + → Neue App**

| Feld | Eintrag |
|---|---|
| Plattform | iOS |
| Name | `GradeGoal: Noten bis zum Abi` |
| Primäre Sprache | Deutsch |
| Bundle-ID | `de.maehlmann.gradegoal` |
| SKU | `gradegoal-ios` |
| Benutzerzugriff | Vollzugriff |

### A5. Verträge, Steuern, Bank – **Pflicht für den In-App-Kauf**

App Store Connect → **Geschäftliches** (früher „Verträge, Steuern und
Bankwesen“)

1. **Vertrag für kostenpflichtige Apps** akzeptieren.
2. Bankkonto hinterlegen.
3. Steuerformular ausfüllen (als Privatperson in Deutschland: W-8BEN).
4. **Händlerstatus nach dem EU-Gesetz über digitale Dienste (DSA)**
   angeben: Da du etwas verkaufst, bist du „Händler“. Adresse, Telefon
   und E-Mail werden dann in der EU auf der Produktseite angezeigt – die
   Adresse steht ohnehin schon in deinem Impressum.

> **Wichtig:** Solange der Vertrag nicht den Status „Aktiv“ hat, liefert
> der Store **auch in TestFlight** keine Produkte. Die App zeigt dann
> „Der Store ist gerade nicht erreichbar“ statt des Kauf-Knopfs.

Steuer: Apple ist beim App-Verkauf in der EU selbst Verkäufer und führt
die Umsatzsteuer ab. Du erhältst eine Gutschrift von Apple. Das ändert
nichts an deiner Kleinunternehmerregelung, die Einnahmen zählen aber zum
Umsatz – im Zweifel kurz mit der Steuerberatung abstimmen.

### A6. In-App-Kauf anlegen

App Store Connect → GradeGoal → **Monetarisierung → In-App-Käufe → +**

| Feld | Eintrag |
|---|---|
| Typ | **Nicht-verbrauchbar** (Non-Consumable) |
| Referenzname | `Unbegrenzte Schuljahre` |
| Produkt-ID | `gradegoal_unlimited` – **exakt so**, sonst findet die App ihn nicht |

Danach im Produkt:

- **Preis:** Basisland Deutschland, 0,99 €. Die übrigen Länder setzt
  Apple automatisch passend.
- **Verfügbarkeit:** alle Länder.
- **Lokalisierung** (Texte siehe `APP-STORE-TEXTE.md`):
  Deutsch und Englisch (USA) – Anzeigename und Beschreibung.
- **Familienfreigabe:** Empfehlung **an** – dann gilt ein Kauf für die
  ganze Familie (passt zu „Profile für Geschwister“). Achtung: lässt
  sich danach nicht mehr ausschalten.
- **Prüfungsinformationen:** ein Bildschirmfoto der Kaufkarte (fürs Erste
  genügt eins aus dem Browser) und als Notiz:
  `Einstellungen → „Neues Schuljahr“ antippen – die Kaufkarte erscheint.`

Erst wenn alle Felder gefüllt sind, steht der Kauf auf **„Bereit zur
Einreichung“**. Vorher ist er in TestFlight oft nicht abrufbar.

### A7. API-Schlüssel für GitHub erzeugen

App Store Connect → **Benutzer und Zugriff → Integrationen → App Store
Connect API → Teamschlüssel**

1. Beim ersten Mal „Zugriff anfordern“ bestätigen.
2. **+** → Name `GitHub Actions`, Zugriff **Admin**.
   *Admin ist nötig:* Nur damit darf GitHub per „Cloud Signing“
   signieren. Mit „App Manager“ scheitert der Build mit „Cloud signing
   permission error“. Die Rolle lässt sich später nicht ändern.
3. **.p8-Datei herunterladen** – das geht **nur einmal**. Sicher
   aufbewahren.
4. Notieren: **Schlüssel-ID** (in der Liste) und **Issuer-ID** (oben
   über der Liste).

### A7b. Verteilungszertifikat (einmalig)

Reines Cloud Signing genügt nicht: App Store Connect lehnt dann die
eingebetteten Frameworks (Capacitor) als ungültig signiert ab. Deshalb
einmalig ein eigenes Zertifikat erzeugen – ohne Mac, über GitHub:

1. Secret `IOS_DIST_P12_PASSWORD` anlegen: ein langes, selbst gewähltes
   Kennwort (mindestens 12 Zeichen) – im Passwortmanager notieren.
2. Actions → **iOS – Zertifikat erstellen** → Run workflow.
3. Im fertigen Lauf unten unter Artifacts **zertifikat-base64**
   herunterladen, ZIP öffnen, Inhalt der Textdatei kopieren.
4. Als Secret `IOS_DIST_P12_BASE64` eintragen.
5. Das Artefakt im Lauf löschen (Papierkorb-Symbol) und die
   heruntergeladene Datei ebenfalls.

Das Zertifikat ist ein Jahr gültig. Danach Schritte 2–4 wiederholen.

### A8. Secrets in GitHub hinterlegen

GitHub → Repository → **Settings → Secrets and variables → Actions →
New repository secret**

| Name | Inhalt |
|---|---|
| `APPLE_TEAM_ID` | Team-ID aus A2 |
| `ASC_KEY_ID` | Schlüssel-ID aus A7 |
| `ASC_ISSUER_ID` | Issuer-ID aus A7 |
| `ASC_KEY_P8_BASE64` | die .p8-Datei als Base64, siehe unten |
| `IOS_DIST_P12_PASSWORD` | Kennwort aus A7b |
| `IOS_DIST_P12_BASE64` | Ergebnis aus A7b |

Base64 unter Windows (PowerShell, legt das Ergebnis in die
Zwischenablage):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Pfad\AuthKey_XXXXXXXXXX.p8")) | Set-Clipboard
```

Dann im GitHub-Feld einfügen. Keine Zeilenumbrüche, nichts davor oder
dahinter.

---

## B. Repo aktualisieren

Siehe `UPLOAD-ANLEITUNG.md` im ZIP: Dateien hochladen, alte Dateien
löschen. Danach sag mir Bescheid – ich prüfe das Repo.

---

## C. Build nach TestFlight

1. GitHub → **Actions → iOS – TestFlight → Run workflow → Run workflow**.
   Das Feld „Build-Nummer“ leer lassen.
2. Dauer: etwa 15–25 Minuten. Grüner Haken = hochgeladen.
3. App Store Connect → GradeGoal → **TestFlight**. Der Build steht dort
   erst auf „Wird verarbeitet“ (5–30 Minuten), dann bereit.
4. **Interne Tests → + Gruppe** (z. B. „Ich“) → dich selbst als Tester
   hinzufügen → Build der Gruppe zuweisen.
5. Auf dem iPhone die App **TestFlight** aus dem App Store laden,
   Einladung (Mail) öffnen, GradeGoal installieren.

Interne Tester (bis 100 Personen aus deinem Team) brauchen keine
Prüfung durch Apple. **Externe** Tester (z. B. Referendare per
öffentlichem Link) gehen erst nach einer kurzen Beta-Prüfung des ersten
Builds.

### Kauf in TestFlight testen

In TestFlight laufen Käufe automatisch in der Testumgebung –
**es wird nichts berechnet.**

1. Einstellungen → „Neues Schuljahr“ antippen → Kaufkarte mit Preis.
2. Kaufen → bestätigen → „Danke! … freigeschaltet“.
3. Info & Impressum → „Unbegrenzt freigeschaltet“.
4. App löschen, neu installieren → Info & Impressum → „Kauf
   wiederherstellen“ → wieder freigeschaltet.

### Prüfliste auf dem Gerät

- [ ] Kopfbereich nicht unter Dynamic Island / Notch, unten frei über dem
      Home-Balken
- [ ] Sicherung exportieren → Teilen-Menü → „In Dateien sichern“
- [ ] Sicherung importieren (aus „Dateien“)
- [ ] CSV-Export, Diagramm als Bild (auch „Bild sichern“ → Fotos)
- [ ] Zeugnis teilen → in „Dateien“ öffnen → drucken
- [ ] Impressum/Datenschutz öffnen sich (Safari-Ansicht in der App)
- [ ] PIN-Sperre setzen, App schließen, wieder öffnen
- [ ] Dunkles Design

---

## D. Wenn der Build scheitert

| Meldung im Protokoll | Ursache und Lösung |
|---|---|
| „Diese Secrets fehlen …“ | Secret-Name genau prüfen (A8). |
| „kein gültiger .p8-Schlüssel“ | Base64 unvollständig kopiert – neu erzeugen. |
| „Cloud signing permission error“ | API-Schlüssel nicht „Admin“ → neuen Schlüssel anlegen (A7). |
| „No profiles for 'de.maehlmann.gradegoal' were found“ | Bundle-ID nicht registriert (A3) oder Team-ID falsch. |
| „No suitable application records were found“ | App in App Store Connect fehlt (A4). |
| „The bundle version must be higher …“ | Workflow erneut starten und eine höhere Build-Nummer eintragen. |
| „maximum number of certificates“ | Unter Certificates alte „Apple Distribution“-Einträge widerrufen. |

In der App erscheint „Store nicht erreichbar“: Vertrag aus A5 noch nicht
aktiv, Kauf nicht „Bereit zur Einreichung“ (A6) oder Produkt-ID
abweichend. Nach dem Anlegen kann es bis zu einige Stunden dauern.

Kommst du nicht weiter: Protokoll des Laufs (Actions → Lauf → Schritt
aufklappen) hier hineinkopieren.

---

## E. Später: Veröffentlichung

- **Screenshots:** iPhone 6,9" (1320 × 2868) genügt für alle iPhones.
  Weil die App auch auf dem iPad läuft, zusätzlich iPad 13"
  (2064 × 2752).
- **App-Datenschutz:** „Keine Daten erfasst“. Den Kauf wickelt Apple ab;
  die App sendet nichts an eigene Server.
- **Altersfreigabe:** Fragebogen ehrlich ausfüllen – ergibt 4+.
- **Kategorie:** Bildung (zweite: Produktivität).
- **Support-URL:** `https://simaehlmann-cloud.github.io/GradeGoal/impressum.html`
- **Datenschutz-URL:** `https://simaehlmann-cloud.github.io/GradeGoal/datenschutz.html`
- **Nicht** in die Kategorie „Kinder“ einordnen – dort gelten für Käufe
  zusätzliche Elternschranken in der App.
- Der **erste In-App-Kauf** wird zusammen mit der App-Version zur
  Prüfung eingereicht: in der Version unter „In-App-Käufe“ auswählen.
- Hinweis für die Prüfung (Feld „Notizen“):
  `Gratis: ein Schuljahr mit bis zu zwei Halbjahren. Einstellungen → „Neues Schuljahr“ zeigt die Kaufkarte (gradegoal_unlimited, nicht-verbrauchbar). „Kauf wiederherstellen“ befindet sich in der Kaufkarte und unter Info & Impressum.`
