# Betrieb: Leads, Tracking, Suchmaschinen

Alles hier ist kostenlos. Zwei Werte in `index.html` schalten die Funktionen scharf:

```js
window.AG_CONFIG = {
  leadEndpoint: "",   // 1. Lead-Webhook (Google Apps Script)
  umamiWebsiteId: ""  // 2. Umami Cloud (cookieloses Tracking)
};
```

Solange ein Wert leer ist, läuft die Seite normal weiter: Leads gehen per E-Mail-Programm (mailto) raus, Tracking ist aus.

---

## 1. Leads automatisch ins Google Sheet (≈ 10 Minuten)

Ergebnis: Jede Anfrage aus Kontaktformular und KI-Check landet als Zeile im Sheet, du bekommst eine Benachrichtigung, der Interessent eine Bestätigung bzw. sein KI-Check-Ergebnis. Funktioniert auch bei Besuchern ohne Mail-Programm.

1. Auf <https://sheets.google.com> ein neues Sheet anlegen, Name z. B. `Agentic Gateway – Leads`.
2. Im Sheet: **Erweiterungen → Apps Script**.
3. Den Inhalt von `Code.gs` im Editor komplett durch `ops/lead-webhook/Code.gs` ersetzen, speichern.
4. Oben in `CONFIG` prüfen: `NOTIFY_TO` = Adresse, an die Lead-Benachrichtigungen gehen.
5. Funktion `testLead` auswählen → **Ausführen** → Berechtigungen erlauben (Google warnt „nicht verifizierte App“, weil es dein eigenes Skript ist: *Erweitert → Zu … wechseln*).
   Prüfen: Im Sheet erscheint Tab `Leads` mit einer Testzeile, bei `NOTIFY_TO` kommen zwei Mails an. Testzeile danach löschen.
6. **Bereitstellen → Neue Bereitstellung** → Typ **Web-App**
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
   → **Bereitstellen**, die **Web-App-URL** (endet auf `/exec`) kopieren.
7. URL in `index.html` bei `leadEndpoint` eintragen, committen, pushen.
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
3. **Website-ID** kopieren (UUID) → in `index.html` bei `umamiWebsiteId` eintragen, pushen.
4. In Umami unter **Goals** die Conversions anlegen: Event `lead_submit` (Hauptziel), dazu `check_complete` und `demo_run`.

Erfasste Events:

| Event | Wann | Daten |
|---|---|---|
| `cta_click` | Klick auf KI-Check / Demo / Preise / Kontakt | Ziel, Position |
| `check_start` | erste Antwort im KI-Check | – |
| `check_complete` | KI-Check-Ergebnis angezeigt | Potenzial, Branche |
| `demo_run` | Live-Demo ausgewertet | Quelle (Beispiel/eigene), Status, offene Punkte |
| `lead_submit` | Formular oder KI-Check abgeschickt | Typ, Branche, Engpass/Potenzial |
| `lead_mailto` | Fallback aufs Mail-Programm | Typ |
| `mail_click` / `tel_click` | Klick auf E-Mail/Telefon | Position |

Der Text aus der Live-Demo wird nie übertragen – nur, ob ein Beispiel oder eigener Text genutzt wurde.

Kennzahlen, auf die es ankommt: Besucher → `check_start` → `check_complete` → `lead_submit`. Wo der größte Abbruch ist, wird optimiert.

---

## 3. Google Search Console (≈ 10 Minuten)

Ohne Search Console siehst du nicht, für welche Suchbegriffe die Seite erscheint.

1. <https://search.google.com/search-console> → **Property hinzufügen → Domain** → `agentic-gateway.de`.
2. Den angezeigten TXT-Eintrag bei IONOS unter *Domains & SSL → agentic-gateway.de → DNS* als TXT-Record für `@` anlegen, dann **Bestätigen** (DNS braucht teils bis zu einer Stunde).
3. **Sitemaps** → `https://agentic-gateway.de/sitemap.xml` einreichen.
4. **URL-Prüfung** → Startseite und neuen Blogartikel eingeben → **Indexierung beantragen**.

Optional gleich mit erledigen: **Bing Webmaster Tools** (<https://www.bing.com/webmasters>) → „Aus Google Search Console importieren“.

---

## 4. Kampagnen-Links (für später)

Wenn du Links in LinkedIn-Posts, E-Mails oder Ads setzt, UTM-Parameter anhängen – sie landen automatisch in der Lead-Zeile:

```
https://agentic-gateway.de/?utm_source=linkedin&utm_medium=post&utm_campaign=demo-anfragecheck
```
