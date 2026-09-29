/*
 * Agentic Gateway – shared site runtime (single source of truth for all pages).
 *
 * Loaded synchronously in <head> on every page. Provides:
 *   window.AG_CONFIG   – central configuration (see ops/README.md)
 *   window.agTrack     – analytics event dispatch (Umami + consent-gated GA4)
 *   window.agSendLead  – lead transport to the Apps Script webhook
 *   window.agConsent   – consent state + banner (open via any [data-consent-open] element)
 *
 * GA4 is never loaded before the visitor explicitly opts in to "Statistik".
 * The consent decision itself is stored in localStorage (strictly necessary, § 25 Abs. 2 TDDDG).
 */
(function () {
  "use strict";

  // ------------------------------------------------------------------ configuration
  var GA4_PLACEHOLDER = "G-XXXXXXXXXX";

  var cfg = window.AG_CONFIG = Object.freeze({
    // Web-App URL of the Google Apps Script lead webhook (ops/lead-webhook/Code.gs).
    // Empty = forms fall back to a prepared mailto message.
    leadEndpoint: "",
    // Umami Cloud website ID (cookieless, no consent required). Empty = Umami off.
    umamiWebsiteId: "",
    // Google Analytics 4 measurement ID. The placeholder keeps GA and the consent banner off.
    ga4MeasurementId: GA4_PLACEHOLDER,
    // Bump when the consent text/categories change materially -> visitors are asked again.
    consentVersion: 1
  });

  var GA4_ENABLED = /^G-[A-Z0-9]{6,}$/.test(cfg.ga4MeasurementId) && cfg.ga4MeasurementId !== GA4_PLACEHOLDER;
  var CONSENT_KEY = "ag_consent";

  // ------------------------------------------------------------------ Umami (cookieless)
  var umamiQueue = [];
  if (cfg.umamiWebsiteId) {
    var us = document.createElement("script");
    us.defer = true;
    us.src = "https://cloud.umami.is/script.js";
    us.setAttribute("data-website-id", cfg.umamiWebsiteId);
    us.setAttribute("data-domains", "agentic-gateway.de");
    us.onload = function () {
      var q = umamiQueue.splice(0, umamiQueue.length);
      q.forEach(function (ev) { sendUmami(ev[0], ev[1]); });
    };
    document.head.appendChild(us);
  }

  function sendUmami(name, data) {
    if (!cfg.umamiWebsiteId) return;
    if (window.umami && typeof window.umami.track === "function") window.umami.track(name, data);
    else umamiQueue.push([name, data]);
  }

  // ------------------------------------------------------------------ consent state
  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      if (c && c.v === cfg.consentVersion && typeof c.statistics === "boolean") return c;
    } catch (e) { /* storage blocked or corrupt -> treat as undecided */ }
    return null;
  }

  function writeConsent(statistics) {
    var c = { v: cfg.consentVersion, statistics: statistics, ts: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (e) { /* private mode: decision lasts this page view */ }
    return c;
  }

  var consent = readConsent();

  // ------------------------------------------------------------------ GA4 (opt-in only)
  var gaLoaded = false;

  function gtag() { window.dataLayer.push(arguments); }

  function loadGa() {
    if (!GA4_ENABLED || gaLoaded) return;
    gaLoaded = true;
    window["ga-disable-" + cfg.ga4MeasurementId] = false;
    window.dataLayer = window.dataLayer || [];
    gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    gtag("js", new Date());
    gtag("config", cfg.ga4MeasurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var gs = document.createElement("script");
    gs.async = true;
    gs.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4MeasurementId);
    document.head.appendChild(gs);
  }

  function disableGa() {
    if (!GA4_ENABLED) return;
    window["ga-disable-" + cfg.ga4MeasurementId] = true;
    if (gaLoaded) gtag("consent", "update", { analytics_storage: "denied" });
    // Remove GA cookies (_ga, _ga_<container>) on every domain variant GA may have used.
    var host = location.hostname;
    var domains = ["", host, "." + host.replace(/^www\./, ""), host.replace(/^www\./, "")];
    document.cookie.split(";").forEach(function (part) {
      var name = part.split("=")[0].trim();
      if (name !== "_ga" && name.indexOf("_ga_") !== 0 && name !== "_gid") return;
      domains.forEach(function (d) {
        document.cookie = name + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
      });
    });
  }

  if (GA4_ENABLED && consent && consent.statistics) loadGa();

  // ------------------------------------------------------------------ tracking API
  window.agTrack = function (name, data) {
    var payload = data || {};
    try {
      sendUmami(name, payload);
      if (gaLoaded && consent && consent.statistics) gtag("event", name, payload);
    } catch (e) { /* tracking must never break the page */ }
  };

  // ------------------------------------------------------------------ consent banner
  var STYLE =
    ".ag-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin:0 auto;" +
    "background:#fff;color:#191613;border:1px solid #D8CFBE;border-radius:18px;padding:22px 22px 18px;" +
    "box-shadow:0 24px 60px -24px rgba(25,22,19,.45);font:15px/1.55 \"Instrument Sans\",-apple-system,\"Segoe UI\",sans-serif}" +
    ".ag-consent h2{margin:0 0 8px;font:600 19px/1.25 \"Fraunces\",Georgia,serif}" +
    ".ag-consent p{margin:0 0 10px;color:#3E3931}" +
    ".ag-consent ul{margin:0 0 14px;padding-left:18px;color:#3E3931;font-size:14px}" +
    ".ag-consent li{margin:0 0 4px}" +
    ".ag-consent a{color:#3B5BFD;font-weight:600}" +
    ".ag-consent-actions{display:flex;flex-wrap:wrap;gap:10px}" +
    ".ag-consent-actions button{flex:1 1 200px;min-height:46px;border-radius:999px;border:1px solid #191613;" +
    "background:#fff;color:#191613;font:600 15px/1 \"Instrument Sans\",sans-serif;cursor:pointer;padding:0 18px}" +
    ".ag-consent-actions button:hover{background:#F3EEE5}" +
    ".ag-consent-actions button:focus-visible{outline:3px solid #3B5BFD;outline-offset:2px}" +
    ".ag-consent-state{font-size:13px;color:#71695D;margin:10px 0 0}" +
    "[data-consent-open]{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;text-decoration:none}" +
    "[data-consent-open]:hover{color:#191613}";

  var bannerEl = null;

  function closeBanner() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
  }

  function decide(statistics) {
    var wasGranted = !!(consent && consent.statistics);
    consent = writeConsent(statistics);
    if (statistics) loadGa();
    else if (wasGranted || gaLoaded) disableGa();
    closeBanner();
  }

  function ensureStyle() {
    if (document.getElementById("ag-consent-style")) return;
    var st = document.createElement("style");
    st.id = "ag-consent-style";
    st.textContent = STYLE;
    document.head.appendChild(st);
  }

  function openBanner() {
    if (!GA4_ENABLED) return;
    ensureStyle();
    closeBanner();
    var el = document.createElement("div");
    el.className = "ag-consent";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "false");
    el.setAttribute("aria-labelledby", "ag-consent-title");
    var state = consent
      ? '<p class="ag-consent-state">Aktuelle Einstellung: Statistik ' + (consent.statistics ? "erlaubt" : "abgelehnt") + ".</p>"
      : "";
    el.innerHTML =
      '<h2 id="ag-consent-title">Datenschutz-Einstellungen</h2>' +
      "<p>Wir würden gern messen, wie diese Website genutzt wird. Dafür brauchen wir Ihre Einwilligung.</p>" +
      "<ul>" +
      "<li><strong>Notwendig</strong> (immer aktiv): Speichert nur Ihre Auswahl in diesem Browser.</li>" +
      "<li><strong>Statistik</strong> (optional): Google Analytics 4 setzt Cookies und überträgt Nutzungsdaten an Google, auch in die USA. Ohne Einwilligung wird Google Analytics nicht geladen.</li>" +
      "</ul>" +
      '<p>Sie können Ihre Auswahl jederzeit über „Cookie-Einstellungen“ im Seitenfuß ändern. Details in der <a href="/datenschutz/#statistik">Datenschutzerklärung</a>.</p>' +
      '<div class="ag-consent-actions">' +
      '<button type="button" data-ag-consent="deny">Nur notwendige</button>' +
      '<button type="button" data-ag-consent="allow">Statistik erlauben</button>' +
      "</div>" + state;
    el.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-ag-consent]") : null;
      if (!b) return;
      decide(b.getAttribute("data-ag-consent") === "allow");
    });
    document.body.appendChild(el);
    bannerEl = el;
    var first = el.querySelector("button");
    if (first && consent) first.focus();
  }

  window.agConsent = Object.freeze({
    open: openBanner,
    get: function () { return consent ? { statistics: consent.statistics, ts: consent.ts } : null; },
    gaEnabled: GA4_ENABLED
  });

  function initDom() {
    if (GA4_ENABLED) ensureStyle();
    var openers = document.querySelectorAll("[data-consent-open]");
    Array.prototype.forEach.call(openers, function (o) {
      if (!GA4_ENABLED) { o.hidden = true; return; }
      o.addEventListener("click", function (e) { e.preventDefault(); openBanner(); });
    });
    if (GA4_ENABLED && !consent) openBanner();
  }

  // Generic CTA tracking: any element with data-cta="<ziel>" reports a cta_click.
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-cta]") : null;
    if (!el) return;
    var sec = el.closest("section, header, nav, footer");
    window.agTrack("cta_click", {
      ziel: el.getAttribute("data-cta"),
      position: sec ? (sec.id || sec.tagName.toLowerCase()) : "unbekannt",
      seite: location.pathname
    });
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initDom);
  else initDom();

  // ------------------------------------------------------------------ attribution
  // First-touch attribution (UTM, gclid, external referrer) attached to every lead.
  var ATTR_KEY = "ag_attr";
  var attr = null;
  try { attr = JSON.parse(sessionStorage.getItem(ATTR_KEY) || "null"); } catch (e) { attr = null; }
  if (!attr) {
    var qs = new URLSearchParams(location.search);
    var ref = "";
    try { if (document.referrer && new URL(document.referrer).host !== location.host) ref = document.referrer; } catch (e) { ref = ""; }
    attr = {
      utm_source: qs.get("utm_source") || "",
      utm_medium: qs.get("utm_medium") || "",
      utm_campaign: qs.get("utm_campaign") || "",
      utm_term: qs.get("utm_term") || "",
      utm_content: qs.get("utm_content") || "",
      gclid: qs.get("gclid") || "",
      referrer: ref,
      landing: location.pathname
    };
    try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr)); } catch (e) { /* private mode */ }
  }

  // ------------------------------------------------------------------ lead transport
  // Resolves "sent" once the request left the browser; rejects on missing endpoint,
  // network error or 10 s timeout. no-cors + text/plain avoids a CORS preflight that
  // Apps Script cannot answer; the response body is therefore opaque by design.
  window.agSendLead = function (payload) {
    var body = {};
    Object.keys(payload).forEach(function (k) { body[k] = payload[k]; });
    body.attribution = attr;
    body.seite = location.href.split("#")[0];
    body.zeitpunkt = new Date().toISOString();
    if (!cfg.leadEndpoint) return Promise.reject(new Error("no-endpoint"));
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 10000) : null;
    return fetch(cfg.leadEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function () {
      if (timer) clearTimeout(timer);
      return "sent";
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  };
})();
