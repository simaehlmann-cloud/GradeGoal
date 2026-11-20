# Play Console – Checkliste

> **Stand 1.9.0:** **Ein** Eintrag (`de.maehlmann.gradegoal`): ein
> Schuljahr gratis mit allen Funktionen, danach einmaliger In-App-Kauf
> `gradegoal_unlimited`. Texte: `STORE-TEXTE.md`. Für den App Store
> gilt `APP-STORE-CHECKLISTE.md` bzw. `APP-STORE-TEXTE.md`.


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
also nur einmal durchlaufen. Prüf das in deiner Console gegen, bevor
du dich darauf verlässt.

Zwölf Tester zusammenzubekommen, ist der unangenehmste Teil. Familie,
Klassenkameraden, Kollegium, Bekannte – jede Person braucht ein eigenes
Google-Konto und ein echtes Gerät. Emulatoren und Zweitkonten zählen
nicht.

---

## Reihenfolge

**Sofort**
1. Entwicklerkonto anlegen (25 USD einmalig), Identitätsprüfung starten
2. App „GradeGoal: Noten bis zum Abi“ anlegen, Zahlungsprofil einrichten
   (ohne Zahlungsprofil kein In-App-Produkt)
3. Datenschutz-Seite veröffentlichen (siehe unten)
4. Erste `.aab` hochladen und geschlossenen Test starten
5. 12 Tester einladen

**Während der 14 Tage**
6. Store-Eintrag ausfüllen (Texte liegen fertig vor)
7. Screenshots erzeugen: `npm run store-bilder` (siehe README)
8. Datensicherheit und Inhaltseinstufung ausfüllen
9. In-App-Produkt `gradegoal_unlimited` anlegen (Angaben in `STORE-TEXTE.md`)
   und mit den Testern einen Testkauf machen (Lizenztester eintragen)

**Danach**
10. Produktionszugriff beantragen
11. App veröffentlichen

---

## Datenschutz-URL

Beide Stores verlangen eine öffentlich erreichbare Adresse.
Zwei Seiten werden über GitHub Pages mitveröffentlicht:

```
https://simaehlmann-cloud.github.io/GradeGoal/datenschutz.html
https://simaehlmann-cloud.github.io/GradeGoal/impressum.html
```

Die erste Adresse trägst du im Store-Eintrag als Datenschutz-URL ein.
Englische Fassungen: `datenschutz-en.html`, `impressum-en.html`.

Beide Seiten sind mit den Daten von **Wisdompeak Apps** ausgefüllt
(einschließlich USt-IdNr.), es sind keine Platzhalter offen. Die App
zeigt dieselben Seiten unter „Info & Impressum“ aus dem App-Paket an –
also auch offline.

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
| Digitale Käufe | **ja** (einmalige Freischaltung) |

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

| Feld | Eintrag |
|---|---|
| Kategorie | Bildung |
| Tags | Notenrechner, Schule, Lernen |
| Preis der App | kostenlos (Download) |
| In-App-Käufe | **ja** – `gradegoal_unlimited`, 0,99 € |
| Werbung | nein |
| Länder | Deutschland, Österreich, Schweiz (später ausweiten) |

Beim Kauf behält Google 15 % statt 30 %, wenn du am Programm für kleine
Entwickler teilnimmst. Das musst du **aktiv beantragen** –
Zahlungsprofil → Google Play Programm für kleine Entwickler.

Die App-ID `de.maehlmann.gradegoal` lässt sich nach der
Veröffentlichung **nicht mehr ändern**.

---

## Versionsnummern

`versionCode` ist eine ganze Zahl, muss je App-ID bei jedem Upload
steigen und lässt sich nie wiederverwenden – auch nicht, wenn die
Version verworfen wurde.

Vorschlag, damit es nachvollziehbar bleibt:

| Upload | versionName | versionCode |
|---|---|---|
| erster geschlossener Test | 1.9.0 | 1 |
| Korrektur währenddessen | 1.9.1 | 2 |
| Produktion | 1.9.x | 3 |

---

## Vor dem ersten Upload

- [ ] Beide Rechtsseiten (de und en) im Browser aufgerufen und erreichbar
- [ ] Entwicklername in der Play Console: **Wisdompeak Apps**
- [ ] Keystore erzeugt, **mehrfach gesichert**, vier Secrets hinterlegt
- [ ] Test-APK auf einem echten Gerät im Flugmodus getestet
- [ ] Besonders geprüft: PIN setzen, App schließen, neu öffnen, entsperren
- [ ] Sicherung exportieren und wieder importieren
- [ ] Gratis-Rahmen: drittes Halbjahr anlegen → Kaufkarte erscheint
- [ ] Testkauf mit Lizenztester, danach „Kauf wiederherstellen“
- [ ] GitHub Pages aktiv, Datenschutz-Seite über die URL erreichbar
