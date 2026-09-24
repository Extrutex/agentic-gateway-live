# Was agentic-gateway.de heute noch vom Umsatz trennt

Stand 2026-09-24, Grundlage: aktueller Live-Stand der Seite (12 Commits, redesignt
seit dem 12-Agenten-Report vom 05.09.) + `leads_log/` + externe Indexierungsprüfung.
Top 5, nach Wirkung sortiert. **Positionierungsfrage (Automatisierungsagentur vs.
Nische) wird hier bewusst NICHT neu entschieden** — das bleibt Sebastians Entscheidung,
diese Liste gilt unabhängig davon.

## 1. Formular-Zuverlässigkeit — heute behoben, Aufwand: 2 Min. · Wirkung: kritisch

`FORM_ENDPOINT=""` ließ jeden KI-Check-Lead auf einen `mailto`-Fallback laufen.
Beleg: Die einzigen zwei Einträge in `leads_log/leads.jsonl` sind Testadressen
(`test@handwerk-mueller.de`, `probe2@betrieb.de`) — **null echte Leads seit Live-Gang**,
obwohl der Funnel technisch lief. Jetzt auf Web3Forms umgestellt (beide Formulare,
Honeypot, Datenschutz ergänzt) — aktiv erst, sobald der Access Key eingetragen ist
(siehe separate Nachricht).

## 2. Sichtbarkeit — Aufwand: niedrig (Setup) + laufend (Ansprache) · Wirkung: hoch

`site:agentic-gateway.de` liefert **keinen einzigen Google-Treffer** — die Seite ist
nicht auffindbar indexiert. Zusätzlich: keine Analytics installiert (kein gtag/
Plausible/Fathom o.ä.) — es gibt keine Möglichkeit zu wissen, ob überhaupt jemand die
Seite besucht. Mit nur einem Blogpost seit Live-Gang trägt SEO ohnehin noch Monate
nicht. Konsequenz: Der Engpass ist nicht "Copy überzeugt nicht genug", sondern
"niemand sieht die Seite". Sofort: Search Console + Sitemap-Einreichung, einfache
Analytics einbauen. Eigentlicher Hebel: aktive Ansprache (siehe bereits bestehender
30/60/90-Plan im Report vom 05.09.) statt auf organischen Traffic zu warten.

## 3. n8n-Substanzbeleg fehlt noch auf der Seite — Aufwand: niedrig, sobald Case existiert · Wirkung: mittel-hoch

"Workflow-Automatisierung mit n8n" steht prominent in Hero, Meta-Description und
Leistungsblock — aber kein sichtbarer eigener Case, Screenshot oder Beleg auf der
Seite selbst. Genau diese Lücke hatte die Gegenprobe im Report vom 05.09. aufgedeckt;
Sebastian hat entschieden, sie durch einen echten n8n-Case zu schließen (läuft
separat). Sobald der erste Case steht: kurzer, konkreter Beleg-Absatz ergänzen
(nicht mehr Behauptung, sondern Beispiel mit Zahlen).

## 4. Kein Ein-Klick-Buchungsweg — Aufwand: niedrig · Wirkung: mittel

"Erstgespräch anfragen" endet weiterhin in Formular oder E-Mail, kein Kalender-Link
(Cal.com o. ä.). Für einen Interessenten, der schon überzeugt ist, ist jeder
zusätzliche Klick verlorene Conversion — besonders jetzt, wo das Formular endlich
zuverlässig ankommt.

## 5. Nur eine (Eigen-)Referenz — Aufwand: hoch (Ergebnis, kein Task) · Wirkung: hoch

3D-Windt ist die einzige Referenz, und es ist die eigene Firma — nachvollziehbar
glaubwürdig, aber kein externer Beweis. Ein unbekannter neuer Anbieter ohne
Fremdreferenz bleibt für einen Interessenten ein Vertrauensrisiko. Kein Content-
Problem, sondern Ergebnis: der erste echte (notfalls kostenlose Pilot-)Kunde mit
Testimonial zieht hier mehr als jede weitere Formulierung auf der Seite.

---

**Nicht mitgezählt, weil außerhalb der Seite selbst:** Preisgerüst ist laut
Marktvergleich vom 05.09. bereits marktkonform, keine Änderung nötig. AGB/Impressum
sind vorhanden und solide (siehe `docs/POSITIONING_DECISION.md`).
