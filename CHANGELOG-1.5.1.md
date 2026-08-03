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
