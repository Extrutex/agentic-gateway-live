// Tests für assets/roi.js – Aufruf: node --test test/
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const roi = require("../assets/roi.js");

const nah = (ist, soll, eps = 1e-9) =>
  assert.ok(Math.abs(ist - soll) < eps, `erwartet ${soll}, erhalten ${ist}`);

const BEISPIEL = {
  vorgaengeProMonat: 40,
  minutenVorher: 45,
  minutenNachher: 15,
  stundensatz: 60,
  anteilCashwirksam: 0.5,
  einmalkosten: 2900,
  laufendeKostenProMonat: 149,
  zeitraumMonate: 12
};

test("Kernformeln: Stunden, Zeitwert, Nutzen, ROI", () => {
  const r = roi.berechne(BEISPIEL);
  // 40 × 30 min = 20 h; 20 h × 60 € = 1.200 €
  nah(r.gesparteStundenProMonat, 20);
  nah(r.zeitwertProMonat, 1200);
  // nur 50 % cashwirksam
  nah(r.nutzenProMonat, 600);
  nah(r.nettoProMonat, 451);
  nah(r.gesamtnutzen, 7200);
  nah(r.gesamtkosten, 2900 + 149 * 12);
  nah(r.nettoGesamt, 7200 - 4688);
  nah(r.roiProzent, ((7200 - 4688) / 4688) * 100);
});

test("Amortisation = Einmalkosten / monatliches Netto", () => {
  const r = roi.berechne(BEISPIEL);
  nah(r.amortisation.monate, 2900 / 451);
  assert.equal(r.amortisation.grund, null);
});

test("freigesetzte Zeit ist nicht automatisch Cashflow", () => {
  const r = roi.berechne({ ...BEISPIEL, anteilCashwirksam: 0 });
  nah(r.nutzenProMonat, 0);
  assert.ok(r.roiProzent < 0);
  assert.ok(r.roiKalkulatorischProzent > 0, "kalkulatorischer ROI wird getrennt ausgewiesen");
});

test("negative Zeitersparnis wird nicht geschönt", () => {
  const r = roi.berechne({ ...BEISPIEL, minutenNachher: 60 });
  assert.ok(r.gesparteStundenProMonat < 0);
  assert.ok(r.nettoProMonat < 0);
  assert.equal(r.amortisation.monate, null);
  assert.match(r.amortisation.grund, /Kein positiver/);
});

test("Nullwerte: keine Kosten → kein ROI, keine Division durch null", () => {
  const r = roi.berechne({ ...BEISPIEL, einmalkosten: 0, laufendeKostenProMonat: 0 });
  assert.equal(r.roiProzent, null);
  assert.equal(r.amortisation.monate, 0);
});

test("Nullwerte: keine Vorgänge → kein Nutzen, keine Amortisation", () => {
  const r = roi.berechne({ ...BEISPIEL, vorgaengeProMonat: 0 });
  nah(r.nutzenProMonat, 0);
  assert.equal(r.amortisation.monate, null);
});

test("Amortisation nach dem Zeitraum wird gekennzeichnet", () => {
  const r = roi.berechne({ ...BEISPIEL, einmalkosten: 20000, zeitraumMonate: 12 });
  assert.ok(r.amortisation.monate > 12);
  assert.match(r.amortisation.grund, /nach dem Betrachtungszeitraum/);
});

test("Zusatzerlöse zählen nur als Deckungsbeitrag, nicht als Umsatz", () => {
  const r = roi.berechne({ ...BEISPIEL, zusatzAuftraegeProMonat: 2, deckungsbeitragJeAuftrag: 150 });
  nah(r.nutzenProMonat, 600 + 300);
});

test("Kosten werden nicht doppelt gezählt", () => {
  const r = roi.berechne(BEISPIEL);
  nah(r.gesamtnutzen - r.gesamtkosten, r.nettoGesamt);
  nah(r.nettoProMonat * 12 - 2900, r.nettoGesamt);
});

test("Szenarien sind geordnet: konservativ ≤ basis ≤ optimistisch", () => {
  const s = roi.szenarien(BEISPIEL);
  assert.ok(s.konservativ.nettoGesamt <= s.basis.nettoGesamt);
  assert.ok(s.basis.nettoGesamt <= s.optimistisch.nettoGesamt);
  nah(s.konservativ.gesparteStundenProMonat, 10);
});

test("Sensitivität: alle Hebel, absteigend nach Wirkung", () => {
  const sens = roi.sensitivitaet(BEISPIEL);
  assert.equal(sens.length, 7);
  for (let i = 1; i < sens.length; i++) assert.ok(sens[i - 1].spanne >= sens[i].spanne);
  const vorgaenge = sens.find((x) => x.feld === "vorgaengeProMonat");
  assert.ok(vorgaenge.nettoHoch > vorgaenge.nettoRunter);
  const kosten = sens.find((x) => x.feld === "laufendeKostenProMonat");
  assert.ok(kosten.nettoHoch < kosten.nettoRunter);
});

test("reproduzierbar: gleiche Eingabe, gleiches Ergebnis", () => {
  assert.deepEqual(roi.berechne(BEISPIEL), roi.berechne({ ...BEISPIEL }));
});

test("Eingaben werden geprüft", () => {
  assert.throws(() => roi.berechne({ ...BEISPIEL, stundensatz: -1 }), /negativ/);
  assert.throws(() => roi.berechne({ ...BEISPIEL, anteilCashwirksam: 1.5 }), /höchstens 1/);
  assert.throws(() => roi.berechne({ ...BEISPIEL, zeitraumMonate: 0 }), /ganze Zahl/);
  assert.throws(() => roi.berechne({ ...BEISPIEL, minutenVorher: "abc" }), /Zahl erwartet/);
  assert.throws(() => roi.berechne({ ...BEISPIEL, vorgaengeProMonat: undefined }), /Zahl erwartet/);
});

test("Komma als Dezimaltrenner wird akzeptiert", () => {
  const r = roi.berechne({ ...BEISPIEL, stundensatz: "60,5" });
  nah(r.zeitwertProMonat, 20 * 60.5);
});
