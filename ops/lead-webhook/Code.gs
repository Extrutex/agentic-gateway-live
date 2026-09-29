/**
 * Agentic Gateway – Lead-Webhook (Google Apps Script, an ein Google Sheet gebunden)
 *
 * Nimmt Leads von agentic-gateway.de entgegen (Kontaktformular + KI-Check +
 * Pilotliste "Anfragen-Postfach"), schreibt sie als Zeile ins passende Tabellenblatt
 * ("Leads" bzw. "Warteliste"), benachrichtigt per E-Mail und schickt dem Interessenten
 * eine Bestätigung bzw. sein KI-Check-Ergebnis.
 *
 * Einrichtung: siehe ops/README.md. Kosten: keine (Google-Konto genügt).
 *
 * Designentscheidungen:
 * - LockService serialisiert parallele Requests → keine verlorenen/überschriebenen Zeilen.
 * - Werte mit führendem = + - @ werden entschärft → keine Formel-Injection im Sheet.
 * - Auto-Antworten sind pro Empfänger (6 h) und pro Tag gedeckelt → das Formular
 *   kann nicht als Spam-Schleuder gegen fremde Adressen missbraucht werden.
 * - Der Honeypot wird serverseitig ein zweites Mal geprüft (Bots ohne JS-Ausführung).
 */

// ---------------------------------------------------------------- Konfiguration
var CONFIG = {
  NOTIFY_TO: "info@agentic-gateway.de",      // Empfänger der Lead-Benachrichtigung
  FROM_ALIAS: "info@agentic-gateway.de",     // Absender, falls in Gmail als "Senden als"-Alias eingerichtet
  SENDER_NAME: "Agentic Gateway",
  REPLY_TO: "info@agentic-gateway.de",
  SHEET_NAME: "Leads",
  WAITLIST_SHEET_NAME: "Warteliste",
  MAX_FIELD_LEN: 2000,
  AUTOREPLY_PER_ADDRESS_SECONDS: 6 * 60 * 60,
  AUTOREPLY_DAILY_CAP: 40,
  SITE_URL: "https://agentic-gateway.de"
};

var COLUMNS = [
  ["zeitpunkt", "Zeitpunkt"],
  ["typ", "Typ"],
  ["status", "Status"],
  ["email", "E-Mail"],
  ["firma", "Firma"],
  ["team", "Teamgröße"],
  ["branche", "Branche"],
  ["engpass", "Engpass"],
  ["heute", "Heute"],
  ["stunden", "Bürostunden/Woche"],
  ["potenzial", "Potenzial"],
  ["einsparung_h_woche", "Einsparung h/Woche"],
  ["zeitwert_monat_eur", "Zeitwert €/Monat"],
  ["empfehlung", "Empfehlung"],
  ["nachricht", "Nachricht"],
  ["utm_source", "utm_source"],
  ["utm_medium", "utm_medium"],
  ["utm_campaign", "utm_campaign"],
  ["utm_term", "utm_term"],
  ["gclid", "gclid"],
  ["referrer", "Referrer"],
  ["landing", "Landingpage"],
  ["seite", "Seite"]
];

var WAITLIST_TYPE = "warteliste-anfragen-postfach";

var WAITLIST_COLUMNS = [
  ["zeitpunkt", "Zeitpunkt"],
  ["status", "Status"],
  ["name", "Name"],
  ["firma", "Firma"],
  ["email", "E-Mail"],
  ["team", "Betriebsgröße"],
  ["anfragen_woche", "Anfragen/Woche"],
  ["kanaele", "Kanäle"],
  ["problem", "Größtes Problem"],
  ["einwilligung", "Einwilligung (Zeitpunkt)"],
  ["utm_source", "utm_source"],
  ["utm_medium", "utm_medium"],
  ["utm_campaign", "utm_campaign"],
  ["utm_term", "utm_term"],
  ["gclid", "gclid"],
  ["referrer", "Referrer"],
  ["landing", "Landingpage"],
  ["seite", "Seite"]
];

var ALLOWED_TYPES = ["kontakt", "ki-check", WAITLIST_TYPE];
var EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

// ---------------------------------------------------------------- Fehlerklassen
function ValidationError(message) {
  this.name = "ValidationError";
  this.message = message;
}
ValidationError.prototype = Object.create(Error.prototype);

// ---------------------------------------------------------------- HTTP-Einstieg
function doGet() {
  return json_({ ok: true, service: "agentic-gateway-leads" });
}

function doPost(e) {
  var lead;
  try {
    lead = parseLead_(e);
  } catch (err) {
    if (err instanceof ValidationError) return json_({ ok: false, error: err.message });
    console.error("Parse-Fehler: " + err);
    return json_({ ok: false, error: "bad-request" });
  }

  if (lead.isBot) return json_({ ok: true }); // Honeypot: still verwerfen

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    appendRow_(lead);
  } catch (err) {
    console.error("Speichern fehlgeschlagen: " + err);
    return json_({ ok: false, error: "storage" });
  } finally {
    try { lock.releaseLock(); } catch (ignore) { /* Lock evtl. nie erhalten */ }
  }

  // Mails nach dem Speichern: ein Mailfehler darf keinen Lead kosten.
  try { notifyOwner_(lead); } catch (err) { console.error("Benachrichtigung fehlgeschlagen: " + err); }
  try { autoReply_(lead); } catch (err) { console.error("Auto-Antwort fehlgeschlagen: " + err); }

  return json_({ ok: true });
}

// ---------------------------------------------------------------- Verarbeitung
function parseLead_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new ValidationError("empty");
  if (e.postData.contents.length > 20000) throw new ValidationError("too-large");

  var raw;
  try {
    raw = JSON.parse(e.postData.contents);
  } catch (err) {
    throw new ValidationError("invalid-json");
  }
  if (!raw || typeof raw !== "object") throw new ValidationError("invalid-json");

  var typ = str_(raw.typ);
  if (ALLOWED_TYPES.indexOf(typ) === -1) throw new ValidationError("invalid-type");

  var email = str_(raw.email).toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) throw new ValidationError("invalid-email");

  var attr = raw.attribution && typeof raw.attribution === "object" ? raw.attribution : {};

  if (typ === WAITLIST_TYPE) return parseWaitlist_(raw, email, attr);

  return {
    isBot: str_(raw.website) !== "",
    zeitpunkt: new Date(),
    typ: typ,
    status: "neu",
    email: email,
    firma: str_(raw.firma),
    team: str_(raw.team),
    branche: str_(raw.branche),
    engpass: str_(raw.engpass),
    heute: str_(raw.heute),
    stunden: str_(raw.stunden),
    potenzial: str_(raw.potenzial),
    einsparung_h_woche: num_(raw.einsparung_h_woche),
    zeitwert_monat_eur: num_(raw.zeitwert_monat_eur),
    empfehlung: str_(raw.empfehlung),
    nachricht: str_(raw.nachricht),
    utm_source: str_(attr.utm_source),
    utm_medium: str_(attr.utm_medium),
    utm_campaign: str_(attr.utm_campaign),
    utm_term: str_(attr.utm_term),
    gclid: str_(attr.gclid),
    referrer: str_(attr.referrer),
    landing: str_(attr.landing),
    seite: str_(raw.seite)
  };
}

function parseWaitlist_(raw, email, attr) {
  var name = str_(raw.name);
  var firma = str_(raw.firma);
  if (!name) throw new ValidationError("missing-name");
  if (!firma) throw new ValidationError("missing-firma");
  // Einwilligung ist Pflicht (Art. 6 Abs. 1 lit. a DSGVO) – ohne sie wird nichts gespeichert.
  if (raw.einwilligung !== true) throw new ValidationError("missing-consent");
  var kanaele = Array.isArray(raw.kanaele) ? raw.kanaele.map(str_).filter(Boolean).join(", ") : str_(raw.kanaele);

  return {
    isBot: str_(raw.website) !== "",
    zeitpunkt: new Date(),
    typ: WAITLIST_TYPE,
    status: "neu",
    name: name,
    firma: firma,
    email: email,
    team: str_(raw.team),
    anfragen_woche: str_(raw.anfragen_woche),
    kanaele: str_(kanaele),
    problem: str_(raw.problem),
    einwilligung: new Date().toISOString(), // Serverzeit des Eingangs, nicht vom Client übernommen
    utm_source: str_(attr.utm_source),
    utm_medium: str_(attr.utm_medium),
    utm_campaign: str_(attr.utm_campaign),
    utm_term: str_(attr.utm_term),
    gclid: str_(attr.gclid),
    referrer: str_(attr.referrer),
    landing: str_(attr.landing),
    seite: str_(raw.seite)
  };
}

function columnsFor_(lead) {
  return lead.typ === WAITLIST_TYPE ? WAITLIST_COLUMNS : COLUMNS;
}

function appendRow_(lead) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = lead.typ === WAITLIST_TYPE ? CONFIG.WAITLIST_SHEET_NAME : CONFIG.SHEET_NAME;
  var columns = columnsFor_(lead);
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(columns.map(function (c) { return c[1]; }));
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, columns.length).setFontWeight("bold");
  }
  sheet.appendRow(columns.map(function (c) {
    var v = lead[c[0]];
    return v instanceof Date ? v : safeCell_(v);
  }));
}

function notifyOwner_(lead) {
  var subject;
  if (lead.typ === WAITLIST_TYPE) {
    subject = "[Pilotliste Anfragen-Postfach] " + lead.firma + " · " + lead.name;
  } else {
    subject = (lead.typ === "ki-check" ? "Neuer Lead (KI-Check): " : "Neue Anfrage: ") +
      (lead.firma || lead.email) + (lead.branche ? " · " + lead.branche : "");
  }
  var lines = columnsFor_(lead)
    .filter(function (c) { return c[0] !== "zeitpunkt" && c[0] !== "status" && lead[c[0]] !== "" && lead[c[0]] !== null; })
    .map(function (c) { return c[1] + ": " + lead[c[0]]; });
  lines.push("", "Tabelle: " + SpreadsheetApp.getActiveSpreadsheet().getUrl());
  MailApp.sendEmail({
    to: CONFIG.NOTIFY_TO,
    subject: subject,
    body: lines.join("\n"),
    replyTo: lead.email,
    name: "Website-Leads"
  });
}

function autoReply_(lead) {
  if (!mayAutoReply_(lead.email)) return;

  var subject, body;
  if (lead.typ === WAITLIST_TYPE) {
    subject = "Sie stehen auf der Pilotliste – Anfragen-Postfach";
    body = [
      "Guten Tag " + lead.name + ",",
      "",
      "danke, Sie stehen auf der Pilotliste für das Anfragen-Postfach für 3D-Druck-Dienstleister.",
      "Wir melden uns persönlich per E-Mail.",
      "",
      "Zur Einordnung: Das Anfragen-Postfach ist in Entwicklung. Wir suchen Betriebe, die es im Pilot",
      "mit echten Anfragen prüfen – das erste Gespräch dreht sich darum, wie Sie heute mit Anfragen arbeiten.",
      "",
      "Ihre Einwilligung können Sie jederzeit mit einer kurzen Antwort auf diese E-Mail widerrufen;",
      "Ihre Angaben werden dann gelöscht.",
      "",
      "Mit freundlichen Grüßen",
      "Sebastian Windt",
      "Agentic Gateway · " + CONFIG.SITE_URL + "/anfragen-postfach/"
    ].join("\n");
  } else if (lead.typ === "ki-check") {
    subject = "Ihr KI-Check-Ergebnis – Agentic Gateway";
    body = [
      "Guten Tag,",
      "",
      "vielen Dank für Ihren KI-Check auf agentic-gateway.de. Hier Ihre Einschätzung auf Basis Ihrer Angaben:",
      "",
      "Automatisierungs-Potenzial: " + (lead.potenzial || "–"),
      "Realistisch einsparbar: ca. " + (lead.einsparung_h_woche || "–") + " Stunden pro Woche",
      "Zeitwert: ca. " + (lead.zeitwert_monat_eur ? formatEuro_(lead.zeitwert_monat_eur) : "–") + " pro Monat (bei 40 €/h)",
      "Empfohlener Start: " + (lead.empfehlung || "–"),
      "",
      "Wichtig: Das ist eine grobe erste Einschätzung, kein verbindliches Angebot.",
      "",
      "Nächster Schritt: In einem kostenlosen 20-Minuten-Erstgespräch schauen wir gemeinsam auf einen",
      "echten Vorgang aus Ihrem Betrieb und klären, ob sich Automatisierung für Sie rechnet.",
      "Antworten Sie einfach auf diese E-Mail mit zwei, drei Terminvorschlägen.",
      "",
      "Mit freundlichen Grüßen",
      "Sebastian Windt",
      "Agentic Gateway · " + CONFIG.SITE_URL
    ].join("\n");
  } else {
    subject = "Ihre Anfrage bei Agentic Gateway";
    body = [
      "Guten Tag,",
      "",
      "vielen Dank für Ihre Anfrage" + (lead.firma ? " für " + lead.firma : "") + ". Sie ist bei uns eingegangen.",
      "Wir melden uns innerhalb von 24 Stunden (werktags) mit einem Terminvorschlag für das kostenlose Erstgespräch.",
      "",
      "Bitte senden Sie vorab keine vertraulichen Unterlagen – das klären wir im Gespräch.",
      "",
      "Mit freundlichen Grüßen",
      "Sebastian Windt",
      "Agentic Gateway · " + CONFIG.SITE_URL
    ].join("\n");
  }

  var opts = { name: CONFIG.SENDER_NAME, replyTo: CONFIG.REPLY_TO };
  var aliases = [];
  try { aliases = GmailApp.getAliases(); } catch (err) { aliases = []; }
  if (aliases.indexOf(CONFIG.FROM_ALIAS) !== -1) {
    opts.from = CONFIG.FROM_ALIAS;
    GmailApp.sendEmail(lead.email, subject, body, opts);
  } else {
    MailApp.sendEmail(lead.email, subject, body, opts);
  }
}

function mayAutoReply_(email) {
  var cache = CacheService.getScriptCache();
  var key = "ar_" + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email));
  if (cache.get(key)) return false;

  var props = PropertiesService.getScriptProperties();
  var dayKey = "ar_day_" + Utilities.formatDate(new Date(), "Europe/Berlin", "yyyyMMdd");
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var count = parseInt(props.getProperty(dayKey) || "0", 10);
    if (count >= CONFIG.AUTOREPLY_DAILY_CAP) return false;
    props.setProperty(dayKey, String(count + 1));
  } finally {
    lock.releaseLock();
  }
  cache.put(key, "1", CONFIG.AUTOREPLY_PER_ADDRESS_SECONDS);
  return true;
}

// ---------------------------------------------------------------- Hilfsfunktionen
function str_(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\u0000/g, "").trim().slice(0, CONFIG.MAX_FIELD_LEN);
}

function num_(v) {
  var n = Number(v);
  return isFinite(n) ? n : "";
}

function safeCell_(v) {
  if (typeof v !== "string") return v;
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function formatEuro_(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manueller Test im Apps-Script-Editor: Funktion "testLead" auswählen und ausführen.
 * Legt eine Testzeile an und schickt Benachrichtigung + Auto-Antwort an NOTIFY_TO.
 */
function testLead() {
  var res = doPost({
    postData: {
      contents: JSON.stringify({
        typ: "kontakt",
        email: CONFIG.NOTIFY_TO,
        firma: "Testbetrieb (bitte löschen)",
        team: "3 bis 7 Mitarbeitende",
        branche: "Lohnfertigung",
        engpass: "Anfragen mit Zeichnungen und technischer Prüfung",
        nachricht: "Testeintrag aus testLead()",
        website: "",
        attribution: { utm_source: "test", landing: "/" },
        seite: CONFIG.SITE_URL + "/"
      })
    }
  });
  console.log(res.getContent());
}

/**
 * Manueller Test für die Pilotliste: Funktion "testWaitlist" auswählen und ausführen.
 * Legt eine Testzeile im Tab "Warteliste" an und schickt Benachrichtigung + Bestätigung an NOTIFY_TO.
 */
function testWaitlist() {
  var res = doPost({
    postData: {
      contents: JSON.stringify({
        typ: WAITLIST_TYPE,
        name: "Test Person",
        firma: "Testbetrieb (bitte löschen)",
        email: CONFIG.NOTIFY_TO,
        team: "2–3",
        anfragen_woche: "5–15",
        kanaele: ["E-Mail", "WhatsApp"],
        problem: "Testeintrag aus testWaitlist()",
        einwilligung: true,
        website: "",
        attribution: { utm_source: "test", landing: "/anfragen-postfach/" },
        seite: CONFIG.SITE_URL + "/anfragen-postfach/",
        zeitpunkt: new Date().toISOString()
      })
    }
  });
  console.log(res.getContent());
}
