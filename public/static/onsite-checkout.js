/* Beacon on-site checkout (Nov 27, 2026). The page stays on this site; Stripe's Payment Element collects payment
   details and Stripe processes the payment. Prices are fixed on the server. */
(function () {
  "use strict";
  function $(root, sel) { return root.querySelector(sel); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  function money(c) { return "$" + (c % 100 ? (c / 100).toFixed(2) : String(c / 100)); }
  function setupCheckout(form) {
    var api = form.getAttribute("data-api"), offer = form.getAttribute("data-offer"), ret = form.getAttribute("data-return");
    var status = $(form, "[data-status]"), btn = $(form, "[data-submit]"), payBox = $(form, "[data-payment]"), contact = $(form, "[data-contact]");
    var stripe = null, elements = null, amount = null, details = null, busy = false;
    function say(msg, bad) { status.textContent = msg || ""; if (bad) status.setAttribute("data-state", "error"); else status.removeAttribute("data-state"); }
    fetch(api + "/config?offer=" + encodeURIComponent(offer)).then(function (r) { return r.json(); }).then(function (c) {
      if (c && c.amount) { amount = c.amount; var p = document.querySelectorAll("[data-live-price]"); for (var i = 0; i < p.length; i++) p[i].textContent = money(c.amount); }
    }).catch(function () {});
    form.addEventListener("submit", function (ev) {
      ev.preventDefault(); if (busy) return;
      if (!elements) return start(); return pay();
    });
    function start() {
      if (!form.reportValidity()) return;
      if (!window.Stripe) { say("The secure payment form didn't load. Please refresh the page, or check that your browser allows js.stripe.com.", true); return; }
      details = { offer: offer, attemptId: uuid() };
      var fields = form.querySelectorAll("[data-field]");
      for (var i = 0; i < fields.length; i++) details[fields[i].getAttribute("data-field")] = fields[i].value.trim();
      busy = true; btn.disabled = true; say("Opening the secure payment form…");
      fetch(api + "/intent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(details) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Something went wrong."); return j; }); })
        .then(function (j) {
          amount = j.amount;
          stripe = window.Stripe(j.publishableKey);
          elements = stripe.elements({ clientSecret: j.clientSecret, appearance: { theme: "stripe", variables: { fontSizeBase: "17px", borderRadius: "6px" } } });
          var pe = elements.create("payment", { layout: "tabs", fields: { billingDetails: { name: "never", email: "never" } }, wallets: { link: "never" } });
          pe.mount($(form, "[data-payment-element]"));
          var inputs = contact.querySelectorAll("input,textarea"); for (var k = 0; k < inputs.length; k++) inputs[k].readOnly = true;
          payBox.hidden = false; btn.textContent = "Pay " + money(amount); say("");
          pe.on("ready", function () { busy = false; btn.disabled = false; });
        })
        .catch(function (e) { busy = false; btn.disabled = false; elements = null; say(e.message, true); });
    }
    function pay() {
      busy = true; btn.disabled = true; say("Confirming with Stripe…");
      stripe.confirmPayment({ elements: elements, confirmParams: { return_url: ret, receipt_email: details.email, payment_method_data: { billing_details: { name: details.name, email: details.email } } } })
        .then(function (r) { if (r.error) { busy = false; btn.disabled = false; say(r.error.message || "The payment didn't go through. Nothing was charged.", true); } });
    }
  }
  function setupReturn(box) {
    var api = box.getAttribute("data-api"), offer = box.getAttribute("data-offer");
    var q = new URLSearchParams(location.search), pi = q.get("payment_intent"), cs = q.get("payment_intent_client_secret");
    var show = function (name) { var all = box.querySelectorAll("[data-state]"); for (var i = 0; i < all.length; i++) all[i].hidden = all[i].getAttribute("data-state") !== name; };
    if (!pi || !cs) { show("missing"); return; }
    var tries = 0;
    (function check() {
      fetch(api + "/status?offer=" + encodeURIComponent(offer) + "&payment_intent=" + encodeURIComponent(pi) + "&client_secret=" + encodeURIComponent(cs))
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.status === "succeeded") {
            var a = box.querySelector("[data-download]"); if (a && j.downloadUrl) a.href = j.downloadUrl;
            var e = box.querySelector("[data-email]"); if (e) e.textContent = j.email || "your email";
            show("paid"); return;
          }
          if ((j.status === "processing" || j.status === "requires_capture") && tries++ < 20) { show("processing"); setTimeout(check, 3000); return; }
          if (j.status === "processing") { show("processing"); return; }
          show(j.status === "unknown" ? "missing" : "failed");
        })
        .catch(function () { if (tries++ < 5) setTimeout(check, 3000); else show("missing"); });
    })();
  }
  document.addEventListener("DOMContentLoaded", function () {
    var f = document.querySelectorAll("form[data-onsite-checkout]"); for (var i = 0; i < f.length; i++) setupCheckout(f[i]);
    var r = document.querySelectorAll("[data-onsite-return]"); for (var j = 0; j < r.length; j++) setupReturn(r[j]);
  });
})();
