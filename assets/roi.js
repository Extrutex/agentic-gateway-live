/*
 * Agentic Gateway – ROI-Rechenkern für Prozessautomatisierung.
 *
 * Reine Rechenbibliothek ohne DOM: läuft im Browser (window.AGRoi) und in Node
 * (module.exports, Tests in test/roi.test.js). Formeln und Grenzen: ops/ROI-MODELL.md.
 *
 * Grundsätze:
 * - Freigesetzte Arbeitszeit ist nicht automatisch Geld. Nur der Anteil
 *   `anteilCashwirksam` zählt als Nutzen; der volle Zeitwert wird getrennt
 *   und ausdrücklich als kalkulatorisch ausgewiesen.
 * - Kosten werden genau einmal gezählt: Gesamtkosten = Einmalkosten + laufende Kosten im Zeitraum.
 * - Amortisation nur bei positivem monatlichem Netto-Cashflow, sonst null mit Grund.
 * - Einfaches Modell: konstante Monatswerte, keine Abzinsung, keine Anlaufkurve.
 */
(function (root) {
  "use strict";

  var SZENARIEN = Object.freeze({
    konservativ: 0.5,
    basis: 0.8,
    optimistisch: 1
  });

  var FELDER = [
    "vorgaengeProMonat",
    "minutenVorher",
    "minutenNachher",
    "stundensatz",
    "anteilCashwirksam",
    "zusatzAuftraegeProMonat",
    "deckungsbeitragJeAuftrag",
    "sonstigeEinsparungProMonat",
    "einmalkosten",
    "interneEinmalkosten",
    "laufendeKostenProMonat",
    "zeitraumMonate",
    "realisierungsgrad"
  ];

  var STANDARD = Object.freeze({
    zusatzAuftraegeProMonat: 0,
    deckungsbeitragJeAuftrag: 0,
    sonstigeEinsparungProMonat: 0,
    interneEinmalkosten: 0,
    laufendeKostenProMonat: 0,
    zeitraumMonate: 12,
    realisierungsgrad: 1
  });

  function pruefe(eingabe) {
    var e = {};
    var fehler = [];
    FELDER.forEach(function (feld) {
      var wert = eingabe[feld];
      if (wert === undefined || wert === null || wert === "") wert = STANDARD[feld];
      if (typeof wert === "string") wert = Number(wert.replace(",", "."));
      if (typeof wert !== "number" || !isFinite(wert)) {
        fehler.push(feld + ": Zahl erwartet");
        return;
      }
      if (wert < 0) fehler.push(feld + ": darf nicht negativ sein");
      e[feld] = wert;
    });
    if (fehler.length === 0) {
      if (e.anteilCashwirksam > 1) fehler.push("anteilCashwirksam: höchstens 1 (100 %)");
      if (e.realisierungsgrad > 1) fehler.push("realisierungsgrad: höchstens 1 (100 %)");
      if (e.zeitraumMonate < 1 || Math.floor(e.zeitraumMonate) !== e.zeitraumMonate) {
        fehler.push("zeitraumMonate: ganze Zahl ab 1");
      }
    }
    if (fehler.length) {
      var err = new Error("Ungültige Eingabe: " + fehler.join("; "));
      err.fehler = fehler;
      throw err;
    }
    return e;
  }

  function berechne(eingabe) {
    var e = pruefe(eingabe);
    var n = e.zeitraumMonate;

    // Zeitersparnis kann negativ sein (neuer Ablauf dauert länger) – das wird nicht geschönt.
    var minutenErsparnisJeVorgang = (e.minutenVorher - e.minutenNachher) * e.realisierungsgrad;
    var gesparteStundenProMonat = (e.vorgaengeProMonat * minutenErsparnisJeVorgang) / 60;
    var zeitwertProMonat = gesparteStundenProMonat * e.stundensatz;

    var cashZeitProMonat = zeitwertProMonat * e.anteilCashwirksam;
    var deckungsbeitragProMonat = e.zusatzAuftraegeProMonat * e.deckungsbeitragJeAuftrag;
    var nutzenProMonat = cashZeitProMonat + deckungsbeitragProMonat + e.sonstigeEinsparungProMonat;
    var nettoProMonat = nutzenProMonat - e.laufendeKostenProMonat;

    var einmal = e.einmalkosten + e.interneEinmalkosten;
    var gesamtnutzen = nutzenProMonat * n;
    var gesamtkosten = einmal + e.laufendeKostenProMonat * n;
    var nettoGesamt = gesamtnutzen - gesamtkosten;

    var roiProzent = gesamtkosten > 0 ? (nettoGesamt / gesamtkosten) * 100 : null;

    // Zum Vergleich: wenn jede freigesetzte Stunde Geld wäre (kalkulatorisch, kein Cashflow).
    var nutzenKalkProMonat = zeitwertProMonat + deckungsbeitragProMonat + e.sonstigeEinsparungProMonat;
    var nettoKalkGesamt = nutzenKalkProMonat * n - gesamtkosten;
    var roiKalkProzent = gesamtkosten > 0 ? (nettoKalkGesamt / gesamtkosten) * 100 : null;

    var amortisation;
    if (nettoProMonat <= 0) {
      amortisation = { monate: null, grund: "Kein positiver monatlicher Netto-Cashflow" };
    } else if (einmal === 0) {
      amortisation = { monate: 0, grund: "Keine Einmalkosten" };
    } else {
      var monate = einmal / nettoProMonat;
      amortisation = {
        monate: monate,
        grund: monate > n ? "Amortisation liegt nach dem Betrachtungszeitraum" : null
      };
    }

    return {
      eingabe: e,
      gesparteStundenProMonat: gesparteStundenProMonat,
      zeitwertProMonat: zeitwertProMonat,
      nutzenProMonat: nutzenProMonat,
      nettoProMonat: nettoProMonat,
      gesamtnutzen: gesamtnutzen,
      gesamtkosten: gesamtkosten,
      nettoGesamt: nettoGesamt,
      roiProzent: roiProzent,
      roiKalkulatorischProzent: roiKalkProzent,
      amortisation: amortisation
    };
  }

  function szenarien(eingabe, grade) {
    var g = grade || SZENARIEN;
    var out = {};
    Object.keys(g).forEach(function (name) {
      var e = Object.assign({}, eingabe, { realisierungsgrad: g[name] });
      out[name] = berechne(e);
    });
    return out;
  }

  // Jede Eingabe einzeln um ±schritt verändern; sortiert nach Wirkung auf das Netto im Zeitraum.
  var SENSITIV = [
    "vorgaengeProMonat",
    "minutenVorher",
    "minutenNachher",
    "stundensatz",
    "anteilCashwirksam",
    "laufendeKostenProMonat",
    "einmalkosten"
  ];

  function sensitivitaet(eingabe, schritt) {
    var s = schritt === undefined ? 0.2 : schritt;
    var basis = berechne(eingabe);
    return SENSITIV.map(function (feld) {
      function mit(faktor) {
        var e = Object.assign({}, basis.eingabe);
        e[feld] = e[feld] * faktor;
        if (feld === "anteilCashwirksam") e[feld] = Math.min(1, e[feld]);
        return berechne(e).nettoGesamt;
      }
      var runter = mit(1 - s);
      var hoch = mit(1 + s);
      return {
        feld: feld,
        nettoRunter: runter,
        nettoHoch: hoch,
        spanne: Math.abs(hoch - runter)
      };
    }).sort(function (a, b) { return b.spanne - a.spanne; });
  }

  var api = Object.freeze({
    berechne: berechne,
    szenarien: szenarien,
    sensitivitaet: sensitivitaet,
    SZENARIEN: SZENARIEN
  });

  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AGRoi = api;
})(typeof window !== "undefined" ? window : this);
