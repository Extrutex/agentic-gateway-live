/*
 * Agentic Gateway – Live-Demo "Anfrage-Check"
 *
 * Regelbasierte, vollständig clientseitige Auswertung einer Fertigungsanfrage.
 * Es werden keine Inhalte übertragen; an das Tracking gehen nur Quelle und Ergebnisstatus.
 *
 * Warum regelbasiert statt LLM: deterministisch, ohne Serverkosten, ohne Datenabfluss
 * und in Millisekunden – als Demo des Ablaufs, nicht als Ersatz für das Kundenprojekt.
 */
(function () {
  "use strict";

  var root = document.getElementById("demo-app");
  if (!root) return;

  var input = document.getElementById("demoInput");
  var runBtn = document.getElementById("demoRun");
  var out = document.getElementById("demoOut");
  var sampleBtns = root.querySelectorAll("[data-sample]");

  var SAMPLES = {
    a: "Hallo,\n\nkönnen Sie uns das Teil aus dem Anhang fertigen? Wir brauchen es dringend, das Material sollte stabil sein.\n\nGruß\nMartin Keller",
    b: "Guten Tag,\n\nwir suchen einen Fertiger für eine Montagevorrichtung zum Fixieren von Gehäusedeckeln. Bedarf ca. 20 Stück, später eventuell mehr. Die Vorrichtung steht neben einer Presse, Umgebungstemperatur ca. 60 °C. Die Zeichnung folgt in den nächsten Tagen.\n\nMit freundlichen Grüßen\nJana Lorenz\nArbeitsvorbereitung",
    c: "Sehr geehrte Damen und Herren,\n\nbitte senden Sie uns ein Angebot über 250 Stück Kabelhalter gemäß beiliegender Zeichnung (KH-104_RevB.pdf) und STEP-Datei.\nMaterial: PA12, Farbe schwarz.\nToleranzen: Bohrungen ±0,1 mm, sonst ISO 2768-m.\nLiefertermin: KW 46, Lieferung frei Haus nach Offenbach.\nBitte einen Erstmusterprüfbericht mitliefern.\n\nMit freundlichen Grüßen\nThomas Brandt\nEinkauf"
  };

  var MAX_LEN = 4000;

  /* ---------- Hilfsfunktionen ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function clean(s) {
    return String(s).replace(/\s+/g, " ").trim();
  }

  function firstMatch(text, patterns) {
    for (var i = 0; i < patterns.length; i++) {
      var m = text.match(patterns[i]);
      if (m) return m;
    }
    return null;
  }

  function track(name, data) {
    if (typeof window.agTrack === "function") window.agTrack(name, data);
  }

  /* ---------- Erkennung ---------- */

  var NUM = "(\\d{1,3}(?:[.\\s]\\d{3})+|\\d+)";

  function detectQuantity(t) {
    var perPeriod = t.match(new RegExp(NUM + "\\s*(?:stk\\.?|stück|teile)?\\s*(?:pro|je|\\/)\\s*(jahr|monat|woche)", "i"));
    if (perPeriod) {
      return { status: "ok", value: clean(perPeriod[1]) + " Stück pro " + perPeriod[2].charAt(0).toUpperCase() + perPeriod[2].slice(1).toLowerCase() };
    }
    var m = firstMatch(t, [
      new RegExp(NUM + "\\s*(?:stk\\.?|stück|stueck|teile\\b|exemplare|pcs\\b|einheiten)", "i"),
      new RegExp("(?:stückzahl|menge|losgröße|auflage|anzahl|bedarf)\\s*(?:von|:|ca\\.?|etwa|rund)?\\s*(?:ca\\.?\\s*)?" + NUM, "i"),
      new RegExp("\\b" + NUM + "\\s*x\\s+(?=[a-zäöü])", "i")
    ]);
    if (m) return { status: "ok", value: clean(m[1]) + " Stück" };
    if (/einzelteil|einzelstück|\bprototyp|\bein muster\b|\b1 muster\b/i.test(t)) {
      return { status: "ok", value: "1 Stück (Einzelteil/Prototyp)" };
    }
    var vague = t.match(/kleinserie|kleine serie|\bserie\b|mehrere|einige/i);
    if (vague) return { status: "unklar", value: "„" + vague[0] + "“ ohne Zahl" };
    return { status: "fehlt", value: "" };
  }

  var MATERIAL_RE = /\b(PA[\s-]?12|PA[\s-]?11|PA[\s-]?6(?:[\s-]?(?:CF|GF))?|PA[\s-]?(?:CF|GF)|PETG|PLA|ABS|ASA|PC[\s-]?ABS|PC|TPU|TPE|PEEK|PEI|ULTEM|POM|PMMA|Nylon|Polyamid|Polycarbonat|Aluminium|Alu|Edelstahl|Stahl|Messing|Kupfer|Titan|1\.4301|1\.4404|1\.4571|S235[\wäöüÄÖÜß]*|S355[\wäöüÄÖÜß]*|42CrMo4|EN AW-[\wäöüÄÖÜß]+|AlMg[\wäöüÄÖÜß]*)\b/i;

  function detectMaterial(t) {
    var m = t.match(MATERIAL_RE);
    if (m) return { status: "ok", value: m[1] };
    var vague = t.match(/material\s+(?:ist\s+)?egal|beliebig(?:es)?\s+material|kunststoff|metall|stabil|robust|hitzebeständig|temperaturbeständig/i);
    if (vague) return { status: "unklar", value: "nur Anforderung: „" + vague[0] + "“" };
    return { status: "fehlt", value: "" };
  }

  function detectDrawing(t) {
    if (/(zeichnung|skizze|unterlagen|cad|daten|modell|step|datei)[\wäöüÄÖÜß]*\s+(?:[\wäöüÄÖÜß]+\s+){0,3}(folg[\wäöüÄÖÜß]*|reichen wir nach|schicken wir nach|senden wir nach|kommt noch|kommen noch)/i.test(t) ||
        /(folgt|folgen)\s+(?:[\wäöüÄÖÜß]+\s+){0,3}(zeichnung|skizze|unterlagen|daten|modell)/i.test(t)) {
      return { status: "unklar", value: "angekündigt, liegt noch nicht vor" };
    }
    var file = t.match(/\b[\w-]+\.(pdf|step|stp|dxf|dwg|stl|igs|iges|3mf)\b/i);
    var fmt = t.match(/\b(STEP|STP|IGES|DXF|DWG|STL|3MF)\b/);
    if (file || fmt) {
      var parts = [];
      if (file) parts.push(file[0]);
      if (fmt && (!file || fmt[1].toLowerCase() !== file[1].toLowerCase())) parts.push(fmt[1] + "-Datei");
      return { status: "ok", value: parts.join(" + ") };
    }
    if (/(anbei|beiliegend[\wäöüÄÖÜß]*|im anhang|aus dem anhang|angehängt[\wäöüÄÖÜß]*|anhängend)/i.test(t)) {
      return { status: "ok", value: "Anhang erwähnt – Format bei Eingang prüfen" };
    }
    if (/zeichnung|skizze|cad/i.test(t)) return { status: "unklar", value: "erwähnt, aber nicht beigefügt" };
    return { status: "fehlt", value: "" };
  }

  function detectTolerance(t, drawing) {
    var m = firstMatch(t, [
      /±\s*\d+(?:[.,]\d+)?\s*(?:mm)?/,
      /\+\/-\s*\d+(?:[.,]\d+)?\s*(?:mm)?/,
      /(?:din\s*)?iso\s*2768[\s-]*[fmcv]?\b/i,
      /\bIT\s?\d{1,2}\b/,
      /\b[Hh][6-9]\b/,
      /toleranz[\wäöüÄÖÜß]*\s*(?:von|:)?\s*\d+(?:[.,]\d+)?\s*(?:mm|µm)?/i
    ]);
    if (m) {
      var all = t.match(/±\s*\d+(?:[.,]\d+)?\s*(?:mm)?|(?:din\s*)?iso\s*2768[\s-]*[fmcv]?\b|\bIT\s?\d{1,2}\b|\b[Hh][6-9]\b/gi) || [m[0]];
      var uniq = [];
      all.forEach(function (x) { x = clean(x); if (uniq.indexOf(x) === -1) uniq.push(x); });
      return { status: "ok", value: uniq.join(", ") };
    }
    var vague = t.match(/sehr genau|genau|präzise|maßhaltig|passgenau/i);
    if (vague) return { status: "unklar", value: "„" + vague[0] + "“ ohne Zahlenwert" };
    if (drawing.status === "ok") return { status: "unklar", value: "nicht im Text – in der Zeichnung prüfen" };
    return { status: "fehlt", value: "" };
  }

  var MONTHS = "januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember";

  function detectDeadline(t) {
    var m = firstMatch(t, [
      /\bKW\s*\d{1,2}\b/i,
      /kalenderwoche\s*\d{1,2}/i,
      /\b\d{1,2}\.\s?\d{1,2}\.(?:\s?\d{2,4})?(?!\d)/,
      new RegExp("(?:bis|zum|spätestens|ab)\\s+(?:ende|mitte|anfang)\\s+(?:" + MONTHS + ")", "i"),
      new RegExp("(?:bis|zum|spätestens)\\s+(?:\\d{1,2}\\.\\s*)?(?:" + MONTHS + ")", "i"),
      /(?:innerhalb|binnen)\s+(?:von\s+)?\d+\s*(?:tagen|wochen|werktagen|arbeitstagen)/i,
      /\bin\s+\d+\s*(?:tagen|wochen|werktagen)/i
    ]);
    if (m) return { status: "ok", value: clean(m[0]) };
    var vague = t.match(/dringend|asap|schnellstmöglich|so schnell wie möglich|eilig|zeitnah|sofort/i);
    if (vague) return { status: "unklar", value: "„" + vague[0] + "“ ohne Datum" };
    return { status: "fehlt", value: "" };
  }

  function detectHints(t) {
    var hints = [];
    var use = t.match(/(?:ca\.?\s*)?-?\d+\s*°\s*C/i) || t.match(/temperatur[\wäöüÄÖÜß]*|hitze|kälte|\bUV\b|außenbereich|outdoor|chemikalie[\wäöüÄÖÜß]*|(?:^|\s)öl(?=[\s.,;:!?]|$)|kraftstoff|lebensmittel[\wäöüÄÖÜß]*|belastung|drehmoment|vibration[\wäöüÄÖÜß]*|dauerbetrieb/i);
    if (use) hints.push({ k: "Einsatzbedingungen", v: clean(use[0]) });
    var surf = t.match(/oberfläche[\wäöüÄÖÜß]*[^.\n]{0,30}|gestrahlt|lackiert|eingefärbt|farbe\s*:?\s*[\wäöüÄÖÜß]+|eloxiert|poliert|Ra\s*\d+(?:[.,]\d+)?/i);
    if (surf) hints.push({ k: "Oberfläche/Farbe", v: clean(surf[0]) });
    var qa = t.match(/erstmuster[\wäöüÄÖÜß]*|\bEMPB\b|\bEZB\b|prüfbericht[\wäöüÄÖÜß]*|messprotokoll[\wäöüÄÖÜß]*|materialzeugnis[\wäöüÄÖÜß]*|abnahmeprüfzeugnis[\wäöüÄÖÜß]*|\b3\.1\b|\bPPAP\b|zertifikat[\wäöüÄÖÜß]*/i);
    if (qa) hints.push({ k: "Prüfdokumentation", v: clean(qa[0]) + " – Aufwand in Kalkulation einplanen", warn: true });
    var ship = t.match(/lieferung\s+(?:frei haus\s+)?nach\s+[A-ZÄÖÜ][\wäöüß-]+|frei haus|lieferadresse[^.\n]{0,30}|abholung|\bDDP\b|\bEXW\b|\bDAP\b/i);
    if (ship) hints.push({ k: "Lieferung", v: clean(ship[0]) });
    var repeat = t.match(/später\s+(?:eventuell|evtl\.?|ggf\.?|vielleicht)?\s*mehr|folgeaufträge|rahmenvertrag|abruf[\wäöüÄÖÜß]*|wiederkehrend[\wäöüÄÖÜß]*/i);
    if (repeat) hints.push({ k: "Potenzial", v: "Folgebedarf angedeutet („" + clean(repeat[0]) + "“)" });
    return hints;
  }

  function detectSender(t) {
    var m = t.match(/(?:grüßen|grüße|gruß|viele grüße|beste grüße)[,!]?\s*\n\s*([A-ZÄÖÜ][a-zäöüß]+(?:[- ][A-ZÄÖÜ][a-zäöüß]+)+)/i);
    return m ? m[1] : "";
  }

  /* ---------- Rückfragen ---------- */

  function questionFor(key, f, ctx) {
    var s = f.status;
    switch (key) {
      case "qty":
        return s === "fehlt"
          ? "Welche Stückzahl benötigen Sie – einmalig oder als wiederkehrender Bedarf (z. B. pro Monat oder Jahr)?"
          : "Können Sie die Stückzahl konkretisieren? Für die Kalkulation reicht eine Größenordnung (z. B. 10, 50 oder 250 Stück).";
      case "mat":
        if (ctx.hasUse) {
          return s === "fehlt"
            ? "Ist ein bestimmter Werkstoff vorgegeben? Falls nicht, schlagen wir auf Basis der genannten Einsatzbedingungen einen passenden Werkstoff vor – bitte ergänzen Sie dazu noch die mechanische Belastung."
            : "Sie nennen " + f.value.replace(/^nur Anforderung: /, "") + " – ist ein konkreter Werkstoff vorgegeben? Wenn nicht, schlagen wir auf Basis der Einsatzbedingungen einen vor.";
        }
        return s === "fehlt"
          ? "Ist ein bestimmter Werkstoff vorgegeben? Falls nicht: Unter welchen Bedingungen wird das Teil eingesetzt (Temperatur, mechanische Last, Kontakt mit Öl oder Chemikalien, UV)? Dann schlagen wir einen passenden Werkstoff vor."
          : "Sie nennen " + f.value.replace(/^nur Anforderung: /, "") + " – ist ein konkreter Werkstoff vorgegeben? Wenn nicht, beschreiben Sie bitte kurz die Einsatzbedingungen (Temperatur, Last, Medien), damit wir den Werkstoff festlegen können.";
      case "tol":
        if (s === "unklar" && ctx.drawingOk) {
          return "Sind alle funktionskritischen Maße in der Zeichnung toleriert, oder sollen wir für nicht tolerierte Maße mit Allgemeintoleranzen nach ISO 2768-m kalkulieren?";
        }
        return "Welche Maße sind funktionskritisch und mit welcher Toleranz? Ohne Angabe kalkulieren wir mit Allgemeintoleranzen nach ISO 2768-m.";
      case "due":
        return s === "fehlt"
          ? "Bis wann benötigen Sie die Teile (Datum oder Kalenderwoche)?"
          : "Sie schreiben " + f.value.replace(/ ohne Datum$/, "") + " – welcher späteste Liefertermin (Datum oder Kalenderwoche) ist für Sie verbindlich?";
      case "cad":
        return s === "unklar" && /angekündigt/.test(f.value)
          ? "Sobald Zeichnung und 3D-Modell vorliegen, prüfen wir die Machbarkeit – bitte senden Sie uns die Zeichnung als PDF und das Modell als STEP-Datei."
          : "Bitte senden Sie uns eine Zeichnung als PDF und – falls vorhanden – das 3D-Modell als STEP-Datei.";
    }
    return "";
  }

  /* ---------- Auswertung ---------- */

  function analyze(text) {
    var t = text.slice(0, MAX_LEN);
    var drawing = detectDrawing(t);
    var hints = detectHints(t);
    var fields = [
      { key: "qty", label: "Stückzahl", r: detectQuantity(t) },
      { key: "mat", label: "Werkstoff", r: detectMaterial(t) },
      { key: "tol", label: "Toleranzen", r: detectTolerance(t, drawing) },
      { key: "due", label: "Liefertermin", r: detectDeadline(t) },
      { key: "cad", label: "Zeichnung / CAD", r: drawing }
    ];
    var ctx = {
      hasUse: hints.some(function (h) { return h.k === "Einsatzbedingungen"; }),
      drawingOk: drawing.status === "ok"
    };
    var open = fields.filter(function (f) { return f.r.status !== "ok"; });
    open.forEach(function (f) { f.q = questionFor(f.key, f.r, ctx); });
    return { fields: fields, open: open, hints: hints, sender: detectSender(t) };
  }

  function buildMail(res) {
    var lines = [];
    lines.push(res.sender ? "Guten Tag " + res.sender + "," : "Guten Tag,");
    lines.push("");
    if (res.open.length) {
      lines.push("vielen Dank für Ihre Anfrage. Damit wir Ihnen ein verbindliches Angebot erstellen können, benötigen wir noch folgende Angaben:");
      lines.push("");
      res.open.forEach(function (f, i) { lines.push((i + 1) + ". " + f.q); });
      lines.push("");
      lines.push("Sobald uns die Angaben vorliegen, prüfen wir die Machbarkeit und senden Ihnen unser Angebot.");
    } else {
      lines.push("vielen Dank für Ihre vollständige Anfrage. Wir prüfen jetzt die Machbarkeit und senden Ihnen im Anschluss unser Angebot.");
    }
    lines.push("");
    lines.push("Mit freundlichen Grüßen");
    lines.push("Ihr Vertriebsteam");
    return lines.join("\n");
  }

  var ICON = {
    ok: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    unklar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 7v6M12 17h.01"/></svg>',
    fehlt: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };
  var LABEL = { ok: "erkannt", unklar: "unklar", fehlt: "fehlt" };

  function render(res, ms) {
    var complete = res.open.length === 0;
    var h = '<div class="demo-result">';
    h += '<div class="demo-status ' + (complete ? "is-ok" : "is-open") + '">';
    h += '<strong>' + (complete ? "Angebotsreif – an Kalkulation übergeben" : "Rückfrage nötig: " + res.open.length + (res.open.length === 1 ? " offener Punkt" : " offene Punkte")) + '</strong>';
    h += '<span>ausgewertet in ' + esc(ms.toLocaleString("de-DE", { maximumFractionDigits: 1 })) + ' ms</span></div>';

    h += '<ul class="demo-fields">';
    res.fields.forEach(function (f) {
      h += '<li class="st-' + f.r.status + '"><span class="demo-ico">' + ICON[f.r.status] + '</span>' +
        '<span class="demo-k">' + esc(f.label) + '</span>' +
        '<span class="demo-v">' + (f.r.value ? esc(f.r.value) : '<em>' + LABEL[f.r.status] + '</em>') + '</span></li>';
    });
    h += '</ul>';

    if (res.hints.length) {
      h += '<div class="demo-hints"><div class="demo-sub">Hinweise für Machbarkeit &amp; Kalkulation</div><ul>';
      res.hints.forEach(function (x) {
        h += '<li' + (x.warn ? ' class="warn"' : '') + '><span>' + esc(x.k) + '</span>' + esc(x.v) + '</li>';
      });
      h += '</ul></div>';
    }

    h += '<div class="demo-mail"><div class="demo-mail-head"><div class="demo-sub">' +
      (complete ? "Entwurf: Eingangsbestätigung" : "Entwurf: Rückfrage an den Kunden") +
      '</div><button type="button" class="demo-copy" id="demoCopy">Kopieren</button></div>' +
      '<pre id="demoMail">' + esc(buildMail(res)) + '</pre>' +
      '<p class="demo-free">Freigabe durch Ihr Team – nichts geht automatisch raus.</p></div>';
    h += '</div>';
    out.innerHTML = h;

    var copy = document.getElementById("demoCopy");
    copy.addEventListener("click", function () {
      var txt = document.getElementById("demoMail").textContent;
      try {
        navigator.clipboard.writeText(txt).then(function () {
          copy.textContent = "Kopiert";
          setTimeout(function () { copy.textContent = "Kopieren"; }, 1800);
        }, function () { copy.textContent = "Bitte manuell markieren"; });
      } catch (e) {
        copy.textContent = "Bitte manuell markieren";
      }
    });
  }

  var source = "eigene";

  function run() {
    var text = input.value.trim();
    if (text.length < 15) {
      out.innerHTML = '<div class="demo-empty">Bitte fügen Sie eine Anfrage mit mindestens einem Satz ein – oder wählen Sie oben ein Beispiel.</div>';
      input.focus();
      return;
    }
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    var res = analyze(text);
    var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
    render(res, Math.max(0.1, t1 - t0));
    track("demo_run", { quelle: source, offen: res.open.length, status: res.open.length ? "rueckfrage" : "angebotsreif" });
  }

  Array.prototype.forEach.call(sampleBtns, function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-sample");
      if (!SAMPLES[key]) return;
      Array.prototype.forEach.call(sampleBtns, function (b) { b.classList.toggle("sel", b === btn); });
      input.value = SAMPLES[key];
      source = "beispiel-" + key;
      run();
    });
  });

  input.addEventListener("input", function () {
    source = "eigene";
    Array.prototype.forEach.call(sampleBtns, function (b) { b.classList.remove("sel"); });
  });
  input.setAttribute("maxlength", String(MAX_LEN));
  runBtn.addEventListener("click", run);

  // Für Tests exponiert (keine Seiteneffekte)
  window.agDemoAnalyze = analyze;
})();
