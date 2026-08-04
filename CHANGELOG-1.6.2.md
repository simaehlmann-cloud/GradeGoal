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
