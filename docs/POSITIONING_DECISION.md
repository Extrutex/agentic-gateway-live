# Agentic-Gateway.de — Entscheidungsvorlage Positionierung & Leistungsangebot

> Stand: 2026-08-30. Erstellt als Entscheidungsgrundlage für Sebastian.
> **Keine Rechtsberatung** — der AI-Act-/DSGVO-Teil ist Orientierung mit Quellen,
> final mit Anwalt klären. Dieses Dokument ändert nichts an der Live-Site.

---

## 1. Bestandsaufnahme der Live-Site (agentic-gateway.de, Repo-Klon 2026-08-30)

### Was die Site heute wem verspricht

Die Site ist deutlich weiter, als „ohne echtes Leistungsangebot" vermuten lässt —
sie ist eine vollständige, gut gemachte Agentur-Landingpage. Sie verspricht:

- **Positionierung:** „KI-Agentur für kleine & mittlere Betriebe" — KI-Agenten,
  die „wirklich arbeiten", mit menschlicher Freigabe, ohne Wunder-KI-Rhetorik.
- **Zielgruppe:** KMU 1–20+ Mitarbeitende in drei Branchen: Handwerk & Bau (SHK,
  Elektro, Ausbau), Fertigung & Industrie, Büro & Dienstleistung (Agenturen,
  Kanzleien, Praxen). Regional verankert: Rodgau / Rhein-Main + remote.
- **Vier Leistungen:** (1) KI-Agenten für wiederkehrende Vorgänge,
  (2) **Workflow-Automatisierung mit n8n**, (3) KI-Assistenten & Chatbots,
  (4) KI-Beratung & Einführung.
- **Drei Preisstufen** (bereits öffentlich!): KI-Potenzial-Check **490 € Festpreis**
  (bei Umsetzung angerechnet) → Automatisierungs-Sprint **ab 2.900 €** (2–4 Wochen)
  → Laufende Betreuung **ab 290 €/Monat** (monatlich kündbar).
- **Ablauf mit Compliance-Schritt:** Erstgespräch → Potenzial-Check → **Scope & AVV
  vor Echtdaten** → Umsetzung → Übergabe. Sicherheits-Sektion mit Eyebrow
  „DSGVO & EU AI Act": Datenminimierung, AVV/TOMs, keine Automatikentscheidung,
  EU-taugliche Tools.
- **Referenz:** 3D-Windt als „eigener Betrieb, läuft auf genau diesen Abläufen"
  (Anfrage-Intake, technische Prüfung, Angebotsvorbereitung, Status-Updates,
  Rückmeldung < 24 h). Das ist die auf der Dual-Branding-Regel erlaubte Nutzung
  (Referenzkunde, kein gemeinsames Asset).
- **Lead-Funnel:** 5-Fragen-KI-Check mit Potenzial-Einschätzung (h/Woche,
  €/Monat bei 40 €/h) und E-Mail-Capture.

### Lücken (nach Schwere sortiert)

1. **Der Lead-Funnel hat keinen Endpoint.** `FORM_ENDPOINT = ""` in `index.html`
   (~Z. 1199) — jeder Lead läuft über einen `mailto:`-Fallback. Auf Mobilgeräten
   und bei Webmail-Nutzern (Gmail im Browser) öffnet sich oft nichts → **Leads
   gehen heute stillschweigend verloren.** Auch das Kontaktformular ist reiner
   mailto. Das ist die teuerste Lücke, unabhängig von jeder Positionierung.
2. **Substanzlücke n8n:** Die Site verspricht prominent „Workflow-Automatisierung
   mit n8n". In keinem von Sebastians Repos existiert ein n8n-Projekt oder eine
   n8n-Referenz — seine belegte Kompetenz ist Individual-Code (Python stdlib,
   TS/React, API-Integrationen). Entweder n8n real aufbauen (1–2 interne
   Workflows) oder das Versprechen auf „n8n oder Individual-Lösung" ehrlich machen.
3. **Substanzlücke Referenz-Case:** „3D-Windt läuft auf genau diesen Abläufen"
   ist heute nur teilweise wahr. Die Kette Anfrage→Messung→Angebot existiert und
   ist getestet (PrintOps, 368+ Tests, `POST /api/parts/analyze` + `/quote`),
   läuft aber **lokal auf dem Mac**, nicht produktiv im Betrieb (Pi-Deployment
   steht aus, Stand `~/.claude/CLAUDE.md` append 16). Der Case muss wahr gemacht
   werden, bevor ein technischer Einkäufer nachfragt.
4. **Blog:** genau **ein** Artikel („KI im Handwerk sinnvoll nutzen"). Für die
   SEO-Keyword-Welt (KI-Agentur Mittelstand, Prozessautomatisierung KMU,
   n8n Agentur Rhein-Main) fehlt fast alles.
5. **Kein Buchungsweg:** „Erstgespräch anfragen" endet in E-Mail. Ein
   Kalender-Link (Cal.com o. ä.) würde die Hürde messbar senken.

### Rechtlicher Zustand der Site

- **Impressum:** vorhanden, korrekt aufgebaut (§ 5 DDG, § 18 Abs. 2 MStV,
  Verbraucherstreitbeilegung). Passt zu einer Einzelunternehmer-Dienstleistung.
- **AGB:** B2B-AGB vorhanden und inhaltlich schon auf KI-Leistungen zugeschnitten
  (Leistungsgrenzen: „KI-gestützte Ausgaben dienen als Entwurf … vom Kunden
  fachlich zu prüfen"; Haftungsklausel; Vertragsschluss erst per Angebot).
  Solide Basis. **Fehlt für eine KI-Agentur 2026:** Rollenklärung
  Anbieter/Betreiber i. S. d. AI Act, Mitwirkungspflicht des Kunden zur
  KI-Kennzeichnung (Art. 50), Nutzungsrechte an gebauten Workflows/Prompts,
  Regelung zu Drittanbieter-KI-Diensten (Modellwechsel, Verfügbarkeit). → Anwalt.
- **Datenschutzerklärung:** passt zur statischen Site (Hosting-Logs, Kontakt,
  keine Tracking-Cookies, „keine vertraulichen Uploads").
- **⚠️ Konkreter Fund: Google Fonts werden auf allen Seiten von
  `fonts.googleapis.com` geladen** (index, Impressum, AGB, Datenschutz, Blog).
  In Deutschland seit LG München 2022 ein bekanntes Abmahnrisiko (IP-Übertragung
  an Google ohne Einwilligung) — und die Datenschutzerklärung erwähnt Google
  Fonts nicht einmal. Für eine Agentur, die mit „Datenschutz ist Teil des
  Produkts" wirbt, doppelt schlecht. **Fix: Fonts self-hosten** (WOFF2 ins Repo,
  eine Stunde Arbeit) — an senior-developer delegieren, sobald entschieden ist.

---

## 2. EU AI Act für eine kleine deutsche KI-Agentur (Orientierung, Stand 2026-08)

**Disclaimer: Orientierung, keine Rechtsberatung. Vor Vertragsmustern,
AGB-Anpassung und Hochrisiko-Grenzfällen final mit Anwalt klären.**

### Was seit wann gilt

| Datum | Pflicht | Betrifft Agentic Gateway? |
|---|---|---|
| 02.02.2025 | Verbotene Praktiken (Art. 5) + **KI-Kompetenz (Art. 4)** für Anbieter UND Betreiber | Ja — gilt bereits. Auch die Kunden brauchen KI-Kompetenz → verkaufbare Schulungsleistung |
| 02.08.2025 | GPAI-Modell-Pflichten | Nein (betrifft Modellanbieter wie OpenAI/Anthropic, nicht Integratoren) |
| **02.08.2026** | **Art. 50 Transparenzpflichten** — Chatbots/KI-Assistenten müssen sich spätestens bei der ersten Interaktion als KI zu erkennen geben; KI-generierte Inhalte kennzeichnen | **Ja, seit vier Wochen scharf.** Jeder Chatbot, den die Agentur baut, braucht die Offenlegung. Vom Digital Omnibus explizit NICHT verschoben |
| 02.12.2027 (verschoben) | Hochrisiko-Pflichten Anhang III (vorläufige Trilog-Einigung Digital Omnibus, Mai 2026; Anhang I sogar 08/2028) | Nur falls Hochrisiko-Use-Cases angefasst werden — s. u. |
| offen (Trilog) | Maschinenlesbare Markierung synthetischer Inhalte (Art. 50 Abs. 2): Parlament will 11/2026, Kommission 02/2027 | Beobachten; betrifft generierte Inhalte (z. B. automatische Kundenmails) |

### Rollen: Wer ist Sebastian im AI-Act-Sinn?

- **Regelfall Agenturgeschäft = der Kunde ist „Betreiber" (Deployer), Sebastian
  ist Dienstleister/Integrator**, der bestehende KI-Systeme (GPT-/Claude-APIs,
  n8n-Nodes) konfiguriert. Die Deployer-Pflichten (Art. 26 bei Hochrisiko,
  Art. 50 Transparenz, Art. 4 Kompetenz) treffen primär den Kunden — aber der
  Kunde kann sie nicht selbst erfüllen. **Genau das ist das Geschäft: die
  Pflichten des Kunden als Leistung übernehmen.**
- **Vorsicht Provider-Falle (Art. 25):** Wer ein KI-System unter eigenem
  Namen/Marke vermarktet (z. B. LeadPilot als Produkt, ein „Agentic Gateway"
  als SaaS) oder ein Hochrisiko-System wesentlich verändert, rutscht in die
  **Anbieter-Rolle** mit deutlich schwereren Pflichten. Für produktisierte
  Eigenentwicklungen also: Risikoklasse des Use Cases prüfen, BEVOR ein
  Produktname draufsteht.

### Risikoklassen der typischen Agentur-Use-Cases

| Use Case | Einstufung | Konsequenz |
|---|---|---|
| Lead-Qualifizierung, Angebotsvorbereitung, E-Mail-Triage, Dokumentenautomatisierung, Wiedervorlagen | Minimales Risiko (keine Anhang-III-Kategorie) | Keine besonderen AI-Act-Pflichten; DSGVO/AVV bleibt |
| Website-Chatbot, KI-Telefonassistent | Begrenztes Risiko → **Art. 50**: Offenlegung als KI (ein Satz in der Begrüßung genügt) | In jedes Chatbot-Paket standardmäßig einbauen — kostet nichts, ist Verkaufsargument |
| KI-generierte Inhalte (Blogposts, Kundenmails ohne menschliche Redaktion) | Art. 50: Kennzeichnung/Markierung | Freigabe-Workflow der Site löst das elegant: Mensch redigiert = keine rein synthetische Veröffentlichung |
| **Bewerber-Screening, CV-Ranking, Mitarbeiter-Bewertung** | **Hochrisiko (Anhang III Nr. 4)** | Als Agentur-Leistung **explizit ausschließen** (in AGB + Angebotsvorlage), bis das Geschäft es rechtfertigt |
| Emotionserkennung am Arbeitsplatz, Social Scoring | **Verboten (Art. 5)** | Nie anbieten — auch nicht auf Kundenwunsch |

### Praktische Konsequenz: AI Act ist hier Verkaufsargument, kein Kostenblock

Die Site behauptet schon „DSGVO & EU AI Act" — dahinter steht aber nichts
Konkretes. Vier Bausteine machen daraus Substanz, alle klein:

1. **KI-Kennzeichnung ab Werk** in jedem Chatbot/Assistenten (Art. 50) —
   „unsere Assistenten sind seit dem 2. August 2026 pflichtgemäß gekennzeichnet,
   Ihrer auch?" ist ein zeitlich perfekter Türöffner.
2. **KI-Kompetenz-Kurzschulung (Art. 4)** als Bestandteil jedes Sprints —
   Material existiert durch die AURELIA-Dozentur ohnehin (persönliche
   Doppelverwertung, kein Markenkonflikt).
3. **Risiko-Kurzeinstufung** je Use Case als fester Punkt im Potenzial-Check
   (die Site nennt schon eine „Datenschutz-Kurzbewertung" — erweitern auf
   „DSGVO- + AI-Act-Kurzbewertung", Einseiter je Workflow).
4. **Vertragliche Rollenklärung + Hochrisiko-Ausschluss** in AGB/Angebotsvorlage
   (→ Anwalt, einmalige Investition).

**Quellen:** [artificialintelligenceact.eu — Article 50 Guide](https://artificialintelligenceact.eu/transparency-rules-article-50/),
[Fraunhofer Academy — Art. 50 tritt in Kraft](https://blog.academy.fraunhofer.de/blogbeitraege/transparenzpflicht/),
[TÜV Rheinland — Transparenzpflichten Art. 50](https://consulting.tuv.com/aktuelles/ki-im-fokus/transparenzpflichten-eu-ai-act-art-50),
[re.think Consulting — Kennzeichnungspflicht ab 08/2026 & Omnibus-Stand](https://rethink.consulting/transparenzpflichten-nach-artikel-50-des-eu-ai-acts-alles-zur-kennzeichnungspflicht-fur-ki-inhalte-ab-august-2026/),
[meiti — Chatbot/Telefonassistent unter dem AI Act](https://meiti.ai/wissen/eu-ai-act-ki-telefonassistent),
[Skill Sprinters — Anhang III Hochrisiko für KMU](https://skill-sprinters.de/blog/compliance/eu-ai-act-anhang-iii-hochrisiko-kmu/),
[secjur — AI-Act-Stand Mai 2026 inkl. Verschiebung auf 12/2027](https://www.secjur.com/blog/eu-ai-act),
[Hamburger Software — Was KMU bis 08/2026 erledigen sollten](https://www.hamburger-software.de/blog/artikel/eu-ai-act-was-kmu-nun-tun-sollten).

---

## 3. Positionierungs-Optionen

### Marktpreis-Referenz DACH (recherchiert, nicht geraten)

- n8n-/Automatisierungs-Agenturen für KMU: Setup **900–4.050 €** einmalig plus
  Care-Retainer **100–499 €/Monat** ([Automationsmanufaktur — Preise](https://automationsmanufaktur.de/preise),
  [n8n-agentur.de](https://n8n-agentur.de/), [Pixel & Process](https://pixelandprocess.de/services/n8n-automation)).
- Allgemeine KI-Beratung: Workshops **3.000–7.000 €**, PoC **3.000–10.000 €**,
  Retainer **2.000–8.000 €/Monat** ([fachkraft-jetzt — KI-Beratung Kosten 2026](https://ki.fachkraft-jetzt.de/magazin/ki-beratung-kosten/),
  [OptimusFlow](https://optimusflow.consulting/ki-beratung-kosten), [foxifai](https://foxifai.com/ki-agentur-kosten)).
- **Fazit:** Die Live-Site-Preise (490 / ab 2.900 / ab 290 mtl.) liegen sauber
  im Markt — eher am unteren Rand des Sprints. Kein Repricing nötig, um zu
  starten; Spielraum nach oben existiert.

### Option A — Umsetzer-Agentur: „Done-for-you-Automatisierung für KMU" (Status quo mit Substanz füllen)

- **Zielkunde:** Inhabergeführte Betriebe 3–20 MA in Rhein-Main (Handwerk,
  Fertigung, Dienstleistung), die im Büro Zeit verlieren. Genau die Zielgruppe,
  die die Site heute schon adressiert.
- **Pakete (= die drei Live-Stufen, unverändert):**
  1. KI-Potenzial-Check, 490 € Festpreis (anrechenbar)
  2. Automatisierungs-Sprint, ab 2.900 € Festpreis (ein Workflow/Agent, 2–4 Wochen)
  3. Laufende Betreuung, ab 290 €/Monat
- **Heute lieferbar:** Potenzial-Check vollständig (Prozessanalyse ist belegte
  Kernkompetenz — die eigene Messung→Angebot-Kette bei 3D-Windt ist das
  Anschauungsbeispiel); Sprints als Individual-Code (E-Mail-Triage,
  Anfrage-Intake, API-Anbindung Lexware/Sevdesk-Konnektoren aus dem Archiv,
  LeadPilot-Bausteine für Kontaktformular/WhatsApp-Kanäle).
- **Muss gebaut werden:** n8n-Praxis (2 interne Workflows als Beweis) ODER
  Site-Text auf „n8n oder Individual-Lösung" ehrlich anpassen; Lead-Endpoint;
  3D-Windt-Case produktiv wahr machen; 1 externer Referenzkunde.
- **Rolle der Archiv-Prototypen:** Steinbruch, kein Produkt. `masking.ts`
  (E-Mail/IBAN/Telefon/Steuer-ID) und die Lexware/Sevdesk-Konnektoren als
  wiederverwendbare Bausteine in Kundenprojekten; die Stripe-Tier-/Auth-Teile
  bleiben liegen.

### Option B — Compliance-first: „KI-Einführung, die durch die Datenschutz-Prüfung kommt"

- **Zielkunde:** KMU 10–50 MA mit sensiblen Daten und echtem Prüfdruck:
  Steuerkanzleien, Praxen, Versicherungsmakler, Zulieferer mit Kunden-Audits.
  (HR-/Bewerberprozesse bewusst ausgeklammert — Hochrisiko.)
- **Pakete:**
  1. **KI- & AI-Act-Readiness-Check**, 990–1.490 € (Tool-Inventur, Risiko-Einstufung
     je Use Case, Maßnahmenliste — unterhalb der 3–7k-Workshops der Berater positioniert)
  2. **Konforme KI-Einführung**, ab 4.900 € (ein Workflow inkl. PII-Masking-Schicht,
     Kennzeichnung, AVV-Doku, Art.-4-Teamschulung)
  3. **Compliance-Retainer**, ab 490 €/Monat (Monitoring, Tool-Updates,
     jährliche Neubewertung bei Rechtsänderungen)
- **Heute lieferbar:** PII-Masking ist production-grade belegt (LeadPilot, inkl.
  des am 2026-08-29 gefixten Prose-Bugs — er zeigt, dass Sebastian die
  Fallstricke wirklich kennt); Dokumentationsdisziplin; Schulungskompetenz
  (AURELIA-Dozentur ab 31.08.).
- **Muss gebaut werden:** Der archivierte Privacy-Gateway-Prototyp wäre hier der
  technische Differenzierer, ist aber ein Frontend-lastiger MVP — die
  Masking-Logik liegt teils clientseitig, für Kundeneinsatz wäre eine gehärtete
  Server-Variante nötig (Wochen, nicht Tage). Dazu Schulungsmaterial in
  Agentur-Form und zwingend eine Anwalts-Kooperation (Grenze zur Rechtsberatung).
- **Risiko:** Längster Weg zum ersten Umsatz; Beratungs-Positionierung
  konkurriert mit Kanzleien und TÜV-artigen Anbietern mit mehr Autorität.

### Option C — Produkt-first: LeadPilot als Agentic-Gateway-Produkt

- **Zielkunde:** Lokale Dienstleister, Self-Service, Stripe-Abo.
- **Bewertung: nicht als Hauptweg empfohlen.** SaaS-Vertrieb an KMU ist der
  härteste Kanal; LeadPilot hat null zahlende Kunden; die market-scout-Historie
  (FORGE-Lektion, Resonanz-Verdikt) zeigt das Muster „Produkt bauen statt
  verkaufen" als Sebastians teuerste Falle. Außerdem: sobald LeadPilot unter der
  Marke Agentic Gateway vermarktet wird, greift die Provider-Rolle nach AI Act
  für dieses System. LeadPilot bleibt besser das, was es ist: ein Baustein-Fundus
  und ggf. späteres Produkt, wenn Agenturkunden danach fragen.

### Empfehlung: **Option A mit dem Compliance-Baustein aus B als Differenzierer**

Begründung in einem Satz: **Die Live-Site verkauft Option A bereits zu
marktkonformen Preisen — die Lücke zwischen Versprechen und Lieferbarkeit ist
dort am kleinsten, und der seit 02.08.2026 scharfe Art. 50 macht „konforme
Umsetzung inklusive" (Kennzeichnung + Art.-4-Kurzschulung + Risiko-Einseiter in
jedem Sprint) zum Differenzierer, den generische n8n-Agenturen nicht bieten —
ohne dass Sebastian ein Compliance-Beratungsgeschäft (Option B) aufbauen muss,
bevor er den ersten zahlenden Kunden hat.**

Nicht Positionierung entscheidet jetzt über Erfolg, sondern: erster externer
zahlender Potenzial-Check. Alles an Option B lässt sich später hochziehen, wenn
Kunden nach Compliance fragen; der umgekehrte Weg (erst Beratungsautorität
aufbauen) dauert Quartale.

---

## 4. Nächster konkreter Schritt pro Option

**Option A (empfohlen):** Lead-Endpoint setzen (`FORM_ENDPOINT` in `index.html`
+ Formular-POST statt mailto, z. B. Formspree oder eigener Mini-Endpoint) und
Google Fonts self-hosten — beides an senior-developer, ein Nachmittag. Parallel
den 3D-Windt-Fall wahr machen: PrintOps-Kette produktiv nehmen und als
Ein-Seiten-Case mit echten Zahlen dokumentieren. Dann 10 Betriebe im Umkreis
Rodgau aktiv ansprechen mit dem 490-€-Check als Angebot.

**Option B:** Zuerst Anwaltstermin (AGB-Erweiterung AI-Act-Rollen +
Hochrisiko-Ausschluss + Grenze Rechtsberatung klären), erst danach den
Readiness-Check als Ein-Seiten-Leistungsbeschreibung produktisieren. Der
Gateway-Prototyp bleibt liegen, bis der erste Check verkauft ist — er ist
Differenzierer für Projekt 3+, nicht Voraussetzung für Projekt 1.

**Option C:** Nur weiterverfolgen, wenn ein Agenturkunde aus A/B von sich aus
nach einem Self-Service-Tool fragt. Dann LeadPilot-Demo zeigen, Zahlungsbereitschaft
abfragen, und erst bei „ja, ich zahle X" die Provider-Pflichten (AI Act) prüfen.

---

## 5. Sofortmaßnahmen unabhängig von der Entscheidung (alle klein, alle jetzt sinnvoll)

1. **`FORM_ENDPOINT` konfigurieren** — der Funnel verliert heute Leads (mailto-only).
2. **Google Fonts lokal hosten** — Abmahnrisiko + Glaubwürdigkeitsproblem für
   eine „Datenschutz ist Teil des Produkts"-Agentur.
3. **Datenschutzerklärung um Hosting-Anbieter-Details ergänzen** (GitHub Pages
   ⇒ US-Anbieter, gehört benannt) — mit Anwalt oder Generator prüfen.
4. **AGB-Erweiterung AI Act** (Rollenklärung, Kennzeichnungs-Mitwirkung,
   Hochrisiko-Ausschluss, IP an Workflows) beim Anwalt beauftragen — einmalig,
   dient jeder Option.
5. **Ein Satz auf der Site präzisieren:** Der „Sicherheit"-Block nennt den
   EU AI Act nur im Eyebrow. Ein konkreter Punkt „Chatbots mit
   Kennzeichnungspflicht ab Werk (Art. 50, gilt seit 02.08.2026)" macht aus der
   Behauptung ein überprüfbares Versprechen. (Text-Änderung erst nach
   Positionierungs-Entscheidung umsetzen.)
