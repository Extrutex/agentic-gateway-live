# ROI-Modell (Rechenkern `assets/roi.js`, Seite `/roi-rechner/`)

Stand 20.10.2026. Tests: `node --test test/roi.test.js` (14 Tests).

## Eingaben

| Feld | Einheit | Bedeutung |
|---|---|---|
| `vorgaengeProMonat` | Anzahl | Vorgänge (z. B. Anfrage → Angebot) pro Monat |
| `minutenVorher` / `minutenNachher` | min | Aufwand je Vorgang heute / mit Automatisierung (inkl. menschlicher Freigabe) |
| `stundensatz` | €/h | voll belasteter Personalkostensatz, nicht der Verkaufssatz |
| `anteilCashwirksam` | 0–1 | Anteil der freien Zeit, der wirklich Geld spart oder verkauft wird |
| `zusatzAuftraegeProMonat` × `deckungsbeitragJeAuftrag` | Anzahl × € | zurechenbare zusätzliche Deckungsbeiträge (nicht Umsatz) |
| `sonstigeEinsparungProMonat` | € | belegbare weitere Einsparungen (Ausschuss, Nacharbeit) |
| `einmalkosten`, `interneEinmalkosten` | € | Umsetzung extern + eigene Einführungsstunden |
| `laufendeKostenProMonat` | € | Abo, KI-Nutzung, Pflege |
| `zeitraumMonate` | Monate | Betrachtungszeitraum (ganze Zahl ≥ 1) |
| `realisierungsgrad` | 0–1 | wie viel der erwarteten Zeitersparnis eintritt (Szenarien) |

## Formeln

```
Gesparte Stunden/Monat = Vorgänge × (min vorher − min nachher) × Realisierungsgrad ÷ 60
Zeitwert/Monat         = gesparte Stunden × Stundensatz                       (kalkulatorisch)
Nutzen/Monat           = Zeitwert × Anteil cashwirksam + Deckungsbeiträge + sonstige Einsparung
Netto/Monat            = Nutzen − laufende Kosten
Gesamtkosten           = Einmalkosten + laufende Kosten × Monate
ROI %                  = (Nutzen × Monate − Gesamtkosten) ÷ Gesamtkosten × 100   (null, wenn Kosten = 0)
Amortisation (Monate)  = Einmalkosten ÷ Netto/Monat                          (nur wenn Netto/Monat > 0)
```

Zusätzlich wird ein **kalkulatorischer ROI** ausgegeben (Anteil cashwirksam = 100 %). Er ist ausdrücklich kein Cashflow.

## Szenarien und Sensitivität

- Szenarien setzen nur den Realisierungsgrad: konservativ 0,5 · Basis 0,8 · optimistisch 1,0. Das sind **Annahmen**.
- Sensitivität: Vorgänge, Minuten vorher/nachher, Stundensatz, Anteil cashwirksam, laufende und Einmalkosten je ±20 %, sortiert nach Wirkung auf das Netto im Zeitraum.

## Grenzen

- Konstante Monatswerte, keine Abzinsung, keine Anlaufkurve, keine Steuern.
- Negative Zeitersparnis wird nicht abgefangen, sondern als Verlust gezeigt.
- Das Ergebnis ist eine Rechnung mit den Annahmen des Nutzers, keine Zusage. Belastbar wird es erst, wenn die Minuten
  im Prozess-Check an einem echten Vorgang gemessen sind.
