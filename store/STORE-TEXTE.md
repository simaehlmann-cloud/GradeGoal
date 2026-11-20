# Google-Play-Texte (Stand 1.9.0)

Seit 1.8.0 gibt es **einen** Eintrag (`de.maehlmann.gradegoal`) statt
Lite und Pro: ein Schuljahr gratis mit allen Funktionen, danach ein
einmaliger In-App-Kauf. Alle Zeichenzahlen sind nachgezählt.

Google verlangt: App-Name höchstens 30 Zeichen, Kurzbeschreibung
höchstens 80, ausführliche Beschreibung höchstens 4000. Keine Wörter
wie „Nr. 1“, „beste“, „kostenlos“ oder Preise im Namen – das lehnt Google ab.

**Adressen für die Play Console**

| Feld | Inhalt |
|---|---|
| Datenschutzerklärung | `https://simaehlmann-cloud.github.io/GradeGoal/datenschutz.html` |
| Website (optional) | `https://simaehlmann-cloud.github.io/GradeGoal/impressum.html` |
| E-Mail | `smaehlmann.appdev@gmail.com` |

**Grafiken**

| Was | Datei |
|---|---|
| App-Symbol 512 × 512 | aus `assets/icon.png` verkleinern |
| Feature-Grafik 1024 × 500 | `store/feature-graphic.png` (`python3 tools/make_feature_graphic.py`) |
| Telefon-Screenshots 1080 × 2160 | `store-bilder/android-de`, `store-bilder/android-en` (`npm run store-bilder`) |
| Tablet-Screenshots | `store-bilder/ipad-de` bzw. `-en` passen auch für 10″-Tablets |
| Video (optional) | Google nimmt nur einen YouTube-Link. Dafür z. B. `store-bilder/video/iphone-de.mp4` als „nicht gelistet“ bei YouTube hochladen. |

---

## Deutsch

### App-Name (max. 30) – 28 Zeichen
```
GradeGoal: Noten bis zum Abi
```

### Kurzbeschreibung (max. 80) – 75 Zeichen
```
Noten eintragen, Schnitt berechnen, Wunschnoten erreichen – bis zum Abitur.
```

### Ausführliche Beschreibung (max. 4000)
```
GradeGoal behält deine Noten im Blick – von der ersten Klassenarbeit bis zum Abi: Zeugnisnoten eintragen, Durchschnitt berechnen, Wunschnoten setzen und sehen, was du noch brauchst, um sie zu erreichen.

★ DEIN ZEUGNIS AUF EINEN BLICK
Alle Fächer mit Zeugnisnote und Gesamtschnitt. Setz dir Wunschnoten – erreichst du eine, gibt es Konfetti. Ein Beispielzeugnis zeigt dir alle Funktionen, bevor du selbst etwas einträgst.

★ EINZELNOTEN MIT GEWICHTUNG
Klassenarbeiten, Mündliches, Tests, Referate: Trag Einzelnoten in Kategorien ein und gewichte sie wie an deiner Schule. Daraus ergibt sich ein Notenvorschlag. Fächer und Kategorien lassen sich umbenennen und sortieren.

★ WAS BRAUCHE ICH NOCH?
Der Zielrechner zeigt, welche Note du in der nächsten Arbeit brauchst, um deine Wunschnote zu schaffen. Mit dem Was-wäre-wenn-Regler siehst du sofort, wie eine weitere Note deinen Schnitt verändert.

★ NOTENVERLAUF
Ein Diagramm je Fach zeigt die Entwicklung deiner Noten, der Langzeitverlauf alle Halbjahre im Vergleich.

★ ABITUR-RECHNER
Block I und Block II nach der bundesweit einheitlichen Formel: Gesamtpunkte, Abiturnote und die wichtigsten Bedingungen. Welche Halbjahre eingebracht werden, legt dein Bundesland fest – die App rechnet mit dem, was du einträgst.

★ NOTENSCHLÜSSEL
34 von 50 Punkten – welche Note ist das? Linear oder mit eigenem Schlüssel je Fach, inklusive Notenspiegel. Punkte lassen sich direkt als Note eintragen.

★ FÜR JEDE SCHULFORM
Noten 1–6 (auch mit Tendenzen), Punkte 0–15, Prozent oder jede eigene Zahlenskala – zum Beispiel 1–5 wie in Österreich oder 6 als beste Note wie in der Schweiz. Fachgewichtung, ausgewählte Durchschnitte für Abschlüsse, Profile für Geschwister. Ein neues Halbjahr übernimmt deine Fächer und Einstellungen – ohne Noten.

★ SICHER UND PRIVAT
Keine Werbung, kein Konto, kein Tracking. Alle Daten bleiben auf deinem Gerät, die App funktioniert offline. Optional schützt eine PIN vor neugierigen Blicken. Sicherung, CSV-Export und Zeugnis zum Drucken sind eingebaut – und die App erinnert dich, wenn eine Sicherung fällig ist.

★ GRATIS STARTEN
Ein Schuljahr mit bis zu zwei Halbjahren ist gratis – mit allen Funktionen. Für beliebig viele Schuljahre schaltest du die App einmalig frei. Kein Abo.

Entwickelt von Simon Mählmann, Wisdompeak Apps.
```

### Versionshinweise 1.9.0 (max. 500)
```
• Beispielzeugnis zum Ausprobieren
• Neues Halbjahr übernimmt Fächer und Einstellungen
• Fächer und Kategorien umbenennen, Fächer sortieren
• Erinnerung an die Sicherung
• Impressum und Datenschutz auch offline
• Viele kleine Verbesserungen
```

---

## Englisch (en-US bzw. en-GB)

### App name (max. 30) – 24 Zeichen
```
GradeGoal: School Grades
```

### Short description (max. 80) – 77 Zeichen
```
Track grades, GPA and averages – and see what you need for your target grade.
```

### Full description (max. 4000)
```
GradeGoal keeps track of your grades: enter report grades, calculate your average, set target grades and see what you still need to reach them.

★ YOUR REPORT CARD AT A GLANCE
All subjects with report grade and overall average. Set target grades – reach one and the confetti flies. A sample report card shows every feature before you enter anything yourself.

★ WEIGHTED SINGLE GRADES
Tests, oral participation, quizzes, presentations: enter single grades in categories and weight them the way your school does. GradeGoal suggests the resulting grade. Subjects and categories can be renamed and reordered.

★ WHAT DO I STILL NEED?
The goal calculator shows the grade you need in your next test to reach your target. The what-if slider shows instantly how another grade would change your average.

★ GRADE HISTORY
A chart per subject shows how your grades develop; the long-term view compares all terms.

★ ABITUR CALCULATOR
For students in Germany: Block I and Block II using the nationwide formula for the Abitur – total points, final grade and the key conditions.

★ GRADE KEY
34 out of 50 points – which grade is that? Linear or with your own key per subject, including a full grade table.

★ FOR YOUR GRADING SYSTEM
Works with any numeric scale you set up – for example GPA 0–4, percentages 0–100, grades 1–5 or 1–6 (with + and –) and points 0–15. You decide whether the lowest or the highest number is the best grade. Letter grades (A–F) are not supported. Subject weighting, selected averages for qualifications, profiles for siblings. A new term takes over your subjects and settings – without grades.

★ SAFE AND PRIVATE
No ads, no account, no tracking. All data stays on your device and the app works offline. An optional PIN keeps curious eyes out. Backup, CSV export and a printable report card are built in – and the app reminds you when a backup is due.

★ START WITHOUT PAYING
One school year with up to two terms is included – with every feature. Unlock unlimited school years once. No subscription.

Developed by Simon Mählmann, Wisdompeak Apps.
```

### Release notes 1.9.0 (max. 500)
```
• Sample report card to try everything
• A new term takes over your subjects and settings
• Rename subjects and categories, reorder subjects
• Backup reminder
• Legal notice and privacy policy available offline
• Many small improvements
```

---

## In-App-Produkt `gradegoal_unlimited`

Play Console → Monetarisieren → Produkte → In-App-Produkte → Produkt erstellen

| Feld | Deutsch | Englisch |
|---|---|---|
| Produkt-ID | `gradegoal_unlimited` (exakt so) | |
| Name (max. 55) | `Unbegrenzte Schuljahre` | `Unlimited school years` |
| Beschreibung (max. 200) | `Beliebig viele Schuljahre und Halbjahre anlegen. Einmaliger Kauf, kein Abo.` | `Add as many school years and terms as you like. One-time purchase, no subscription.` |
| Preis | 0,99 € | |

## Datensicherheit (Data safety)

- Erhebt die App Nutzerdaten? **Nein**
- Werden Daten geteilt? **Nein**
- Begründung: Alle Eingaben bleiben auf dem Gerät; kein Konto, keine
  Analyse, keine Werbung. Kauf und Bewertung laufen über Google Play
  selbst und gelten nicht als Datenerhebung der App.

## Weitere Angaben

| Frage | Antwort |
|---|---|
| Kategorie | Bildung |
| Werbung enthalten | Nein |
| In-App-Käufe | Ja |
| Zielgruppe | auch unter 13 – Einzelheiten zum Programm „Für Familien“ in `PLAY-CONSOLE-CHECKLISTE.md` |
| Inhaltseinstufung | Fragebogen: keine Gewalt, keine Nutzerkommunikation, Käufe ja |
