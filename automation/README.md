# Automation — Status

**Live-Betrieb aktuell:** Kontaktformular + KI-Check laufen über Web3Forms (siehe
`index.html`, Kommentar am Anfang des `<script>`-Blocks). Kein n8n nötig, um Leads
nicht mehr zu verlieren — das war der akute Fix.

## n8n-lead-workflow.json

Entwurf aus einer früheren Session: Webhook (`POST /webhook/agentic-gateway-lead`) →
Pflichtfeld-Validierung → Anhängen an lokales JSONL-Log → Response 200/401.

- **Secret ist Platzhalter** (`REPLACE_LEAD_WEBHOOK_SECRET`) — vor Wiederverwendung
  echtes Secret setzen, nie den Platzhalter deployen.
- n8n 2.37 blockt `$env`-Zugriff in Code-Nodes standardmäßig — falls das Secret aus
  einer Umgebungsvariable gelesen werden soll: `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`.
- Der lokale Docker-Container (`agentic-gateway-n8n`, nur `127.0.0.1:5678`) wurde
  Anfang September gebaut, einmal getestet, ist seit ca. 20.09. weg (vermutlich
  Docker-Reset). Kein öffentlicher Tunnel wurde eingerichtet.
- Relevant erst wieder, wenn n8n einen echten, öffentlich erreichbaren Host bekommt
  (siehe Hosting-Entscheidung in `docs/umsatz-luecken.md`) — dann kann der Workflow
  reaktiviert und die Website direkt auf den n8n-Webhook statt auf Web3Forms zeigen,
  falls mehr Automatisierung (Lead-Qualifizierung, CRM-Anbindung) gewünscht ist.
