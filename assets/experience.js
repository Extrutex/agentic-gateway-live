/* Illustrative workflow selector. Does not call models or connect customer systems. */
(function () {
  "use strict";
  // Pointer light follows the visitor without moving text or capturing the cursor.
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll(".service,.sector,.tier-card,.blog-card").forEach(function (card) {
    card.setAttribute("data-spotlight", "");
    card.addEventListener("pointermove", function (event) {
      if (!finePointer.matches || reducedMotion.matches) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--pointer-x", (event.clientX - rect.left) + "px");
      card.style.setProperty("--pointer-y", (event.clientY - rect.top) + "px");
    });
    card.addEventListener("pointerleave", function () {
      card.style.removeProperty("--pointer-x");
      card.style.removeProperty("--pointer-y");
    });
  });

  var flows = {
    inbox: { title: "Eine Anfrage wird zum prüfbaren Vorgang.", nodes: ["E-Mail-Eingang", "Angaben prüfen", "Rückfrage entwerfen", "Team gibt frei"], rule: "Regel: Kein Versand und keine Preiszusage ohne Freigabe.", process: "Anfragen und Rückfragen" },
    documents: { title: "Ein Dokument wird zu strukturierten Angaben.", nodes: ["Dokumenteneingang", "Felder auslesen", "Unklarheiten markieren", "Daten geprüft übergeben"], rule: "Regel: Unklare Angaben werden markiert; die Übergabe erfolgt an ein vereinbartes Ziel.", process: "Dokumente und Nachweise" },
    knowledge: { title: "Eine Frage führt zu einer Antwort mit Quellen.", nodes: ["Interne Frage", "Erlaubte Quellen suchen", "Antwort vorbereiten", "Quellen prüfen"], rule: "Regel: Nur freigegebene Quellen verwenden; fehlende Grundlagen als Wissenslücke anzeigen.", process: "Internes Firmenwissen" },
    service: { title: "Eine Serviceanfrage erreicht die richtige Stelle.", nodes: ["Kundenanfrage", "Anliegen zuordnen", "Antwort vorbereiten", "Freigabe oder Übergabe"], rule: "Regel: Verbindliche Zusagen und unbekannte Fälle an eine zuständige Person übergeben.", process: "Kundenservice und Vertrieb" }
  };
  var tabs = document.querySelectorAll("[data-flow]");
  var title = document.getElementById("labTitle");
  var nodes = document.getElementById("labNodes");
  var rule = document.getElementById("labRule");
  var cta = document.getElementById("labCta");
  var selected = "inbox";
  if (!title || !nodes || !rule || !cta) return;
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-flow");
      var flow = flows[key];
      if (!flow) return;
      selected = key;
      tabs.forEach(function (item) { item.setAttribute("aria-pressed", String(item === tab)); });
      title.textContent = flow.title;
      nodes.replaceChildren();
      nodes.setAttribute("data-flow-active", key);
      flow.nodes.forEach(function (label) { var node = document.createElement("span"); node.textContent = label; nodes.appendChild(node); });
      rule.textContent = flow.rule;
    });
  });
  cta.addEventListener("click", function () {
    var select = document.getElementById("process");
    if (!select) return;
    var value = flows[selected].process;
    if (Array.from(select.options).some(function (option) { return option.value === value; })) select.value = value;
  });
})();
