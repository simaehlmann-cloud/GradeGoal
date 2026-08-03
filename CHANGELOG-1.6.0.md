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
