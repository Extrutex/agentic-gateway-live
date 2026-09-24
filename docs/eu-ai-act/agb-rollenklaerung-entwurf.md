# ⚠️ ENTWURF — NICHT VERWENDEN OHNE ANWALTSPRÜFUNG

Dieses Dokument ist ein fachlicher Vorbau für das Anwaltsgespräch, **keine fertige
AGB-Klausel und keine Rechtsberatung.** Ziel: das Anwaltsgespräch kurz und günstig
machen, weil die inhaltliche Vorarbeit schon steht — nicht den Anwalt ersetzen.

## Warum das nötig ist: die Anbieter-Falle (Art. 25)

Wer ein KI-System unter eigenem Namen/eigener Marke vermarktet oder ein
Hochrisiko-System wesentlich verändert, rutscht vom Integrator in die
**Anbieter-Rolle** mit deutlich schwereren Pflichten (u.a. Konformitätsbewertung,
technische Dokumentation, Registrierung). Reines Konfigurieren bestehender Systeme
(Claude-API, n8n-Nodes) im Kundenauftrag ist normalerweise **Betreiber-Unterstützung**,
nicht Anbieterschaft — aber das muss im Vertrag explizit stehen, sonst ist die
Rollenverteilung im Streitfall unklar.

## Regelungspunkte, die die AGB abdecken sollte (Entwurfsformulierungen)

**1. Rollenklärung**
> "Der Kunde ist Betreiber (Deployer) im Sinne der Verordnung (EU) 2024/1689 für
> jedes im Rahmen dieses Vertrags eingeführte oder konfigurierte KI-System. Der
> Auftragnehmer erbringt Integrations-, Konfigurations- und Beratungsleistungen und
> wird durch diese Tätigkeit nicht zum Anbieter des zugrundeliegenden KI-Systems."

**2. Hochrisiko-Ausschluss**
> "Leistungen im Zusammenhang mit Anwendungsfällen nach Anhang III der Verordnung
> (EU) 2024/1689, insbesondere Bewerberauswahl, CV-Ranking oder Leistungsbewertung
> von Mitarbeitenden, sind nicht Gegenstand dieses Vertrags, sofern nicht ausdrücklich
> schriftlich vereinbart."

**3. Mitwirkungspflicht Kennzeichnung**
> "Der Kunde stellt sicher, dass die vom Auftragnehmer bereitgestellte
> Kennzeichnung gemäß Art. 50 der Verordnung (EU) 2024/1689 im laufenden Betrieb
> aktiv bleibt und nicht entfernt wird."

**4. Nutzungsrechte an gebauten Workflows/Prompts**
> Klären: Gehen n8n-Workflows/Prompt-Vorlagen mit Projektabschluss vollständig ins
> Eigentum des Kunden über, oder behält der Auftragnehmer ein Wiederverwendungsrecht
> für vergleichbare Bausteine bei anderen Kunden (Vorlage, keine 1:1-Kopie
> kundenspezifischer Daten)?

**5. Drittanbieter-/Modell-Änderungsklausel**
> "Änderungen, Preisanpassungen oder Einstellung von Diensten Dritter (insbesondere
> KI-Modell-Anbieter wie Anthropic, OpenAI, oder der n8n-Plattform) stellen keinen
> Mangel der Leistung des Auftragnehmers dar. Erforderliche Anpassungen werden als
> gesonderter Auftrag angeboten."

## Fragen, die der Anwalt beantworten muss (nicht wir)

- Trägt Punkt 1 (Rollenklärung) tatsächlich, oder braucht es eine engere Definition,
  je nachdem wie stark ein Workflow "individualisiert" wird (Grenze Integrator ↔
  wesentliche Veränderung ist im Gesetzestext unscharf)?
- Wie weit reicht die Mitwirkungspflicht in Punkt 3 rechtlich — reicht ein Vertrags-
  satz, oder braucht es eine technische Absicherung (z.B. Kennzeichnung serverseitig
  erzwingen)?
- Reicht die bestehende B2B-AGB-Grundlage (Leistungsgrenzen, Haftungsklausel) als
  Trägerdokument, oder braucht es einen eigenen KI-Zusatzvertrag?
- Berufshaftpflicht: deckt die bestehende Versicherung KI-Integrationsleistungen ab?

## Nicht vergessen

Bis zur Anwaltsprüfung: **keine dieser Formulierungen live auf der Website oder in
einem unterschriebenen Vertrag verwenden.**
