# Play Console – Checkliste

Die Reihenfolge ist bewusst so gewählt: Der geschlossene Test ist der
lange Posten. Alles andere lässt sich parallel dazu erledigen.

---

## Der Zeitplan, den du einplanen musst

Persönliche Entwicklerkonten, die nach dem **13. November 2023** angelegt
wurden, müssen vor dem Produktionszugriff einen geschlossenen Test
bestehen: **mindestens 12 Tester, 14 zusammenhängende Tage**. Die Tester
müssen die App tatsächlich öffnen und angemeldet bleiben – fällt die Zahl
zwischendurch unter 12, beginnt die Frist von vorn. Dazu kommen ein bis
drei Tage Prüfzeit je Version.

Realistisch: **gut drei Wochen ab Kontoeröffnung.** Die `.aab`-Datei ist
davon die Sache von zehn Minuten.

Organisationskonten und ältere persönliche Konten sind ausgenommen.

**Wichtig für dein Vorgehen:** Der Produktionszugriff gilt für das
**Konto**, nicht für die einzelne App. Du musst den geschlossenen Test
also nur einmal durchlaufen – sinnvollerweise mit **Lite**, weil du
dafür leichter Tester findest. Prüf das in deiner Console gegen, bevor
du dich darauf verlässt.

Zwölf Tester zusammenzubekommen, ist der unangenehmste Teil. Familie,
Klassenkameraden, Kollegium, Bekannte – jede Person braucht ein eigenes
Google-Konto und ein echtes Gerät. Emulatoren und Zweitkonten zählen
nicht.

---

## Reihenfolge

**Sofort**
1. Entwicklerkonto anlegen (25 USD einmalig), Identitätsprüfung starten
2. App „GradeGoal“ (Lite) anlegen
3. Datenschutz-Seite veröffentlichen (siehe unten)
4. Erste `.aab` hochladen und geschlossenen Test starten
5. 12 Tester einladen

**Während der 14 Tage**
6. Store-Eintrag ausfüllen (Texte liegen fertig vor)
7. Screenshots aufnehmen
8. Datensicherheit und Inhaltseinstufung ausfüllen
9. Pro-Eintrag vorbereiten

**Danach**
10. Produktionszugriff beantragen
11. Beide Apps veröffentlichen
12. `PRO_URL` in `src/lib/tier.js` eintragen und Lite neu bauen

---

## Datenschutz-URL

Beide Stores verlangen eine öffentlich erreichbare Adresse.
Zwei Seiten werden über GitHub Pages mitveröffentlicht:

```
https://simaehlmann-cloud.github.io/GradeGoal/datenschutz.html
https://simaehlmann-cloud.github.io/GradeGoal/impressum.html
```

Die erste Adresse trägst du im Store-Eintrag als Datenschutz-URL ein.

Beide Seiten sind mit den Daten von **Wisdompeak Apps** ausgefüllt, es
sind keine Platzhalter mehr offen. `CONTACT`, `PRIVACY_URL` und
`IMPRINT_URL` in `src/lib/i18n.js` stehen ebenfalls – in der App
erscheinen unter „Info & Impressum" zwei Schaltflächen dorthin.

**Prüfen:** Die beiden Adressen funktionieren erst, wenn GitHub Pages
aktiv ist (Settings → Pages → Source: „GitHub Actions"). Ruf sie einmal
im Browser auf, bevor du sie in der Play Console einträgst.

---

## Datensicherheit

Bei GradeGoal sind alle Antworten dieselben, weil die App wirklich
nichts erhebt:

| Frage | Antwort |
|---|---|
| Werden Nutzerdaten erhoben? | **Nein** |
| Werden Nutzerdaten weitergegeben? | **Nein** |
| Werden Daten bei der Übertragung verschlüsselt? | entfällt – keine Übertragung |
| Können Nutzer Löschung beantragen? | **Ja** – „Alles zurücksetzen“ in der App |
| Unabhängige Sicherheitsprüfung? | Nein |

Der Fragebogen unterscheidet zwischen *erheben* (an einen Server senden)
und *lokal speichern*. GradeGoal speichert nur lokal – das gilt nicht als
Erhebung.

---

## Inhaltseinstufung

| Frage | Antwort |
|---|---|
| Kategorie | Referenz, Nachschlagewerk, Bildung |
| Gewalt, Sexualität, Schimpfwörter, Drogen | überall **nein** |
| Glücksspiel, Lootboxen | nein |
| Nutzerinteraktion, Chat, geteilte Inhalte | nein |
| Standortweitergabe | nein |
| Digitale Käufe | **nein** (Lite und Pro sind getrennte Einträge) |

Erwartetes Ergebnis: USK 0 bzw. PEGI 3.

---

## Zielgruppe und Inhalte

Die App richtet sich auch an Kinder unter 13. In der Play Console führt
das ins Programm „Für Familien“ mit Zusatzfragen:

| Frage | Antwort |
|---|---|
| Altersgruppen | u. a. **unter 13**, plus 13–15, 16–17, 18+ |
| Richtet sich die App an Kinder? | **Ja, auch** |
| Werbung enthalten? | **Nein** |
| Werbe-IDs? | **Nein** |
| Sammelt personenbezogene Daten von Kindern? | **Nein** |

Weil nichts erhoben wird und keine Werbung erscheint, sind die Antworten
unkritisch – gemacht werden müssen sie trotzdem.

---

## App-Zugriff

Frage: „Sind Teile der App eingeschränkt?“ → **Nein, alles frei
zugänglich.** Es gibt kein Login. Wichtig: Die PIN-Sperre ist **keine**
Zugangsbeschränkung im Sinne dieser Frage – sie wird vom Nutzer selbst
gesetzt und ist optional.

---

## Kategorie und Angaben

| Feld | Lite | Pro |
|---|---|---|
| Kategorie | Bildung | Bildung |
| Tags | Notenrechner, Schule, Lernen | dieselben |
| Preis | kostenlos | 1,99 € |
| In-App-Käufe | nein | nein |
| Werbung | nein | nein |
| Länder | Deutschland, Österreich, Schweiz (später ausweiten) | dieselben |

Beim Preis: Google zeigt 1,99 € inklusive Mehrwertsteuer an. Für dich
bleiben rund 1,42 € je Verkauf, wenn du am Programm für kleine
Entwickler teilnimmst (15 % statt 30 %). Das musst du **aktiv
beantragen** – Zahlungsprofil → Google Play Programm für kleine
Entwickler.

---

## Beide Einträge

| | Lite | Pro |
|---|---|---|
| App-ID | `de.maehlmann.gradegoal` | `de.maehlmann.gradegoal.pro` |
| Store-Name | GradeGoal: Noten & Schnitt | GradeGoal Pro: Noten & Abi |
| Feature-Grafik | `store/feature-graphic-lite.png` | `store/feature-graphic-pro.png` |
| Symbol | `assets-lite/icon-only.png` | `assets/icon-only.png` |

Die App-IDs lassen sich nach der Veröffentlichung **nicht mehr ändern**.
Vor dem ersten Hochladen im Log des Workflows gegenprüfen – der Schritt
„Konfiguration und Bildmaterial wählen“ gibt sie aus.

---

## Versionsnummern

`versionCode` ist eine ganze Zahl, muss je App-ID bei jedem Upload
steigen und lässt sich nie wiederverwenden – auch nicht, wenn die
Version verworfen wurde.

Vorschlag, damit es nachvollziehbar bleibt:

| Upload | versionName | versionCode |
|---|---|---|
| erster geschlossener Test | 1.6.2 | 1 |
| Korrektur währenddessen | 1.6.1 | 2 |
| Produktion | 1.7.0 | 3 |

Beide Ausgaben zählen getrennt, weil sie eigene App-IDs haben. Der
Einfachheit halber trotzdem dieselbe Nummer für beide vergeben.

---

## Vor dem ersten Upload

- [ ] Beide Rechtsseiten im Browser aufgerufen und erreichbar
- [ ] Entwicklername in der Play Console: **Wisdompeak Apps**
- [ ] Keystore erzeugt, **mehrfach gesichert**, vier Secrets hinterlegt
- [ ] Beide Debug-APKs auf einem echten Gerät im Flugmodus getestet
- [ ] Besonders geprüft: PIN setzen, App schließen, neu öffnen, entsperren
- [ ] Sicherung exportieren und in der jeweils anderen Ausgabe importieren
- [ ] GitHub Pages aktiv, Datenschutz-Seite über die URL erreichbar

Zu `PRO_URL`: Die Adresse des Pro-Eintrags existiert erst, wenn die App
in der Console angelegt ist. Sie lautet
`https://play.google.com/store/apps/details?id=de.maehlmann.gradegoal.pro`
und funktioniert erst nach der Veröffentlichung. Solange `PRO_URL` leer
ist, zeigt Lite nur den Hinweistext – kein toter Link. Das ist Absicht.
