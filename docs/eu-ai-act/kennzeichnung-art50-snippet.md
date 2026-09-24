# Kennzeichnungs-Baustein (Art. 50 EU AI Act)

**Pflicht seit 02.08.2026.** Jedes System, das direkt mit einer natürlichen Person
interagiert (Chatbot, Sprachassistent, KI-E-Mail-Antwort ohne menschliche Redaktion),
muss spätestens bei der ersten Interaktion offenlegen, dass eine KI beteiligt ist —
außer es ist für eine "informierte, aufmerksame Person" ohnehin offensichtlich.

Einbauen in **jedes** Kundenprojekt mit direktem Personenkontakt. Kein Sonderaufwand,
sondern Standard-Baustein — genau das ist der Verkaufssatz.

## 1. Chat-Widget: erste Nachricht

```
Hallo! Ich bin der KI-gestützte Assistent von {{Kundenname}}. Ich helfe Ihnen bei
{{Anwendungsfall, z.B. "Terminanfragen und häufigen Fragen"}} weiter. Bei komplexeren
Anliegen verbinde ich Sie jederzeit mit einem Menschen — schreiben Sie einfach
"Mitarbeiter".
```

Diese Nachricht ist Pflichttext, nicht optional — sie muss als allererste Nachricht
erscheinen, bevor der Nutzer etwas eingibt (Opt-out ist keine Option unter Art. 50).

## 2. Sichtbares Badge (UI-Baustein)

Kleines, permanent sichtbares Label am Chat-Fenster/Widget:

```html
<span class="ai-disclosure" title="Kennzeichnung gemäß Art. 50 EU AI Act">
  🤖 KI-Assistent
</span>
```

```css
.ai-disclosure {
  font-size: 11px;
  opacity: .75;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(0,0,0,.06);
}
```

Grund für ein permanentes Badge statt nur der Eröffnungsnachricht: Nutzer, die
mitten im Gespräch einsteigen (z.B. Widget bleibt über mehrere Seitenaufrufe offen),
müssen die Information weiterhin sehen können.

## 3. Sprachassistenten / Telefon-Bots

Akustische Entsprechung am Gesprächsanfang, z.B.:
```
"Sie sprechen mit dem KI-gestützten Assistenten von {{Kundenname}}. Für ein
Gespräch mit einem Mitarbeiter sagen Sie jederzeit 'Mitarbeiter'."
```

## 4. KI-generierte Inhalte ohne menschliche Redaktion

Betrifft z.B. automatisch generierte Kundenmails, die kein Mensch vor Versand liest.
Kennzeichnung im Footer/Signatur:
```
Diese Nachricht wurde KI-gestützt erstellt und vor Versand nicht individuell
redigiert.
```
**Wichtig:** Wenn ein Mensch die KI-Ausgabe vor Versand prüft/freigibt (empfohlener
Standard-Workflow für dieses Geschäft), ist das kein rein synthetischer Content mehr
— dann entfällt diese spezielle Kennzeichnung, Art. 50 Abs. 1 (Chatbot-Offenlegung)
gilt aber unabhängig davon weiter, sobald überhaupt ein KI-System mit der Person
interagiert.

## 5. Standard-Vertragssatz für Angebote

Für jedes Angebot/jeden Sprint-Vertrag:
```
Jedes im Rahmen dieses Projekts gebaute KI-System wird mit einer Art.-50-konformen
Kennzeichnung ausgeliefert (Stand EU AI Act: {{Datum}}).
```
Das ist der Differenzierer gegenüber generischen n8n-Agenturen, die das nicht
standardmäßig mitliefern — als fester, kostenloser Bestandteil jedes Sprints
kommunizieren, nicht als Extra-Posten.

## Offene regulatorische Baustelle — nicht überversprechen

Art. 50 Abs. 2 (maschinenlesbare Markierung *synthetischer Inhalte*, z.B. KI-Bilder/
-Texte) ist Stand 05.09.2026 noch nicht final terminiert — Trilog-Verhandlung läuft,
Parlament will 11/2026, Kommission 02/2027. Nicht als bereits geltende Pflicht
verkaufen, nur als "wir beobachten das für Sie" erwähnen.
