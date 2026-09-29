# Betrieb: Leads, Tracking, Suchmaschinen

Alles hier ist kostenlos. Die zentrale Konfiguration steht in **`assets/site.js`** (wird von jeder Seite geladen, einzige Stelle):

```js
leadEndpoint: "",                 // 1. Lead-Webhook (Google Apps Script)
umamiWebsiteId: "",               // 2. Umami Cloud (cookieloses Tracking, optional)
ga4MeasurementId: GA4_PLACEHOLDER // 3. Google Analytics 4, z. B. "G-AB12CD34EF"
```

Solange ein Wert leer bzw. Platzhalter ist, läuft die Seite normal weiter: Leads gehen per E-Mail-Programm (mailto) raus, Tracking ist aus, es erscheint kein Einwilligungsbanner.

---

## 1. Leads automatisch ins Google Sheet (≈ 10 Minuten)

Ergebnis: Jede Anfrage aus Kontaktformular und KI-Check landet als Zeile im Tab `Leads`, Einträge der Pilotliste `/anfragen-postfach/` im Tab `Warteliste` (Betreff der Benachrichtigung: `[Pilotliste Anfragen-Postfach] …`), du bekommst eine Benachrichtigung, der Interessent eine Bestätigung bzw. sein KI-Check-Ergebnis. Funktioniert auch bei Besuchern ohne Mail-Programm.

1. Auf <https://sheets.google.com> ein neues Sheet anlegen, Name z. B. `Agentic Gateway – Leads`.
2. Im Sheet: **Erweiterungen → Apps Script**.
3. Den Inhalt von `Code.gs` im Editor komplett durch `ops/lead-webhook/Code.gs` ersetzen, speichern.
4. Oben in `CONFIG` prüfen: `NOTIFY_TO` = Adresse, an die Lead-Benachrichtigungen gehen.
5. Funktion `testLead` auswählen → **Ausführen** → Berechtigungen erlauben (Google warnt „nicht verifizierte App“, weil es dein eigenes Skript ist: *Erweitert → Zu … wechseln*).
   Prüfen: Im Sheet erscheint Tab `Leads` mit einer Testzeile, bei `NOTIFY_TO` kommen zwei Mails an. Danach genauso `testWaitlist` ausführen → Tab `Warteliste`. Testzeilen danach löschen.
6. **Bereitstellen → Neue Bereitstellung** → Typ **Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
   → **Bereitstellen**, die **Web-App-URL** (endet auf `/exec`) kopieren.
7. URL in `assets/site.js` bei `leadEndpoint` eintragen, committen, pushen.
8. Live-Test: auf der Website KI-Check mit eigener Adresse durchspielen → Zeile im Sheet + Ergebnis-Mail.

Absenderadresse: Standardmäßig gehen Auto-Antworten von deinem Google-Konto raus (Anzeigename „Agentic Gateway“, Antworten gehen an info@agentic-gateway.de). Soll `info@agentic-gateway.de` direkt als Absender erscheinen, in Gmail unter *Einstellungen → Konten → „Senden als“* die Adresse mit den IONOS-SMTP-Daten hinzufügen – das Skript nutzt den Alias dann automatisch.

Schutz eingebaut: Honeypot gegen Bots, Formel-Injection-Schutz im Sheet, Auto-Antwort max. 1× pro Adresse in 6 h und max. 40 pro Tag (Google-Limit für Privatkonten: 100 Mails/Tag).

Änderungen am Skript: nach dem Speichern **Bereitstellen → Bereitstellungen verwalten → Bearbeiten → Version: Neue Version**, sonst läuft die alte Version weiter. Die URL bleibt gleich.

Spalte **Status** im Sheet ist deine Pipeline: `neu` → `kontaktiert` → `Termin` → `Angebot` → `gewonnen`/`verloren`.

---

## 2. Conversion-Tracking mit Umami Cloud (≈ 5 Minuten)

Umami arbeitet ohne Cookies und ohne personenbezogene Profile – kein Cookie-Banner nötig. Der kostenlose Hobby-Tarif reicht (100.000 Events/Monat, 3 Websites, 6 Monate Datenhaltung).

1. Konto anlegen auf <https://cloud.umami.is> (Hobby, ohne Kreditkarte).
2. **Websites → Add website**: Name `Agentic Gateway`, Domain `agentic-gateway.de`.
3. **Website-ID** kopieren (UUID) → in `assets/site.js` bei `umamiWebsiteId` eintragen, pushen.
4. In Umami unter **Goals** die Conversions anlegen: Event `generate_lead` (Hauptziel), dazu `waitlist_signup`, `check_complete` und `demo_run`.

Hinweis: Umami und GA4 können parallel laufen, messen aber dasselbe. Empfehlung: nur eines aktivieren und den nicht genutzten Absatz in der Datenschutzerklärung (Abschnitt 5) entfernen.

Erfasste Events:

| Event | Wann | Daten |
|---|---|---|
| `cta_click` | Klick auf KI-Check / Demo / Preise / Kontakt / Anfragen-Postfach / Pilotliste | Ziel, Position |
| `form_start` | erste Interaktion mit Kontaktformular, KI-Check oder Pilotliste | form_id |
| `check_complete` | KI-Check-Ergebnis angezeigt | Potenzial, Branche |
| `demo_run` | Live-Demo ausgewertet | Quelle (Beispiel/eigene), Status, offene Punkte |
| `generate_lead` | Kontaktformular oder KI-Check erfolgreich übertragen | form_id, Branche, Engpass/Potenzial |
| `waitlist_signup` | Pilotliste Anfragen-Postfach erfolgreich übertragen | form_id, Betriebsgröße, Anfragen/Woche, Kanäle |
| `lead_mailto` | Fallback aufs Mail-Programm | form_id |
| `mail_click` / `tel_click` | Klick auf E-Mail/Telefon | Position |

Der Text aus der Live-Demo wird nie übertragen – nur, ob ein Beispiel oder eigener Text genutzt wurde.

Kennzahlen, auf die es ankommt: Besucher → `form_start` → `check_complete` → `generate_lead` (bzw. `waitlist_signup` auf `/anfragen-postfach/`).

Die Events gehen an Umami (falls aktiv) und – nur nach Einwilligung – an GA4. E-Mail-Adressen und Freitexte werden nie als Event-Daten gesendet. Wo der größte Abbruch ist, wird optimiert.

---

## 3. Google Analytics 4 mit Einwilligung (≈ 10 Minuten)

GA4 wird erst geladen, wenn der Besucher im Banner „Statistik erlauben“ klickt. „Nur notwendige“ ist gleichwertig daneben. Widerruf jederzeit über „Cookie-Einstellungen“ im Seitenfuß (löscht die `_ga`-Cookies).

1. <https://analytics.google.com> → **Verwaltung → Erstellen → Property** `Agentic Gateway`, Zeitzone Deutschland, Währung EUR.
2. **Datenstream → Web** → `https://agentic-gateway.de`. „Erweiterte Messung“ kann an bleiben.
3. **Mess-ID** (`G-…`) kopieren → in `assets/site.js` bei `ga4MeasurementId` statt `GA4_PLACEHOLDER` eintragen, z. B. `ga4MeasurementId: "G-AB12CD34EF",`.
4. **Verwaltung → Kontodetails / Datenschutzeinstellungen → Zusatz zur Datenverarbeitung** (Data Processing Terms) akzeptieren – die Datenschutzerklärung sagt, dass ein AV-Vertrag besteht.
5. **Verwaltung → Datenerfassung und -änderung → Datenaufbewahrung → Ereignisdaten: 2 Monate** (so steht es in der Datenschutzerklärung).
6. **Verwaltung → Datenerfassung**: Google Signals **aus** lassen; unter „Granulare Standort- und Gerätedaten“ keine Aktivierung für Werbezwecke.
7. **Verwaltung → Ereignisse → Als Schlüsselereignis markieren**: `generate_lead`, `waitlist_signup`.
8. Committen, pushen, Seite in einem privaten Fenster öffnen: Banner erscheint, vor dem Klick lädt nichts von `googletagmanager.com` (DevTools → Netzwerk). Nach „Statistik erlauben“ erscheint man in GA unter **Berichte → Echtzeit**.

Ändern sich Kategorien oder Banner-Text wesentlich: `consentVersion` in `assets/site.js` hochzählen – alle Besucher werden neu gefragt.

---

## 4. Google Search Console (≈ 10 Minuten)

Ohne Search Console siehst du nicht, für welche Suchbegriffe die Seite erscheint.

1. <https://search.google.com/search-console> → **Property hinzufügen → Domain** → `agentic-gateway.de`.
2. Den angezeigten TXT-Eintrag bei IONOS unter *Domains & SSL → agentic-gateway.de → DNS* als TXT-Record für `@` anlegen, dann **Bestätigen** (DNS braucht teils bis zu einer Stunde).
   Der TXT-Wert sieht aus wie `google-site-verification=AbC…`. Prüfen im Terminal: `dig +short TXT agentic-gateway.de` muss den Wert zeigen.
   *Alternative ohne DNS (nur URL-Präfix-Property):* In `index.html` ist das Meta-Tag `google-site-verification` als Kommentar vorbereitet – Kommentar entfernen, `GSC_VERIFICATION_TOKEN` durch den Token ersetzen, pushen, dann in der Search Console bestätigen. Die Domain-Property per DNS ist vorzuziehen (deckt `www`, `http`, `https` und alle Pfade ab).
3. **Sitemaps** → `https://agentic-gateway.de/sitemap.xml` einreichen.
4. **URL-Prüfung** → Startseite, `/anfragen-postfach/` und den neuen Blogartikel eingeben → **Indexierung beantragen**.

Optional gleich mit erledigen: **Bing Webmaster Tools** (<https://www.bing.com/webmasters>) → „Aus Google Search Console importieren“.

---

## 5. Kampagnen-Links (für später)

Wenn du Links in LinkedIn-Posts, E-Mails oder Ads setzt, UTM-Parameter anhängen – sie landen automatisch in der Lead-Zeile:

```
https://agentic-gateway.de/?utm_source=linkedin&utm_medium=post&utm_campaign=demo-anfragecheck
```
