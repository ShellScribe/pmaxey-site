(function () {
  "use strict";
  var gate = document.querySelector("[data-contact-gate]");
  if (!gate) return;
  var button = gate.querySelector("[data-contact-start]");
  var status = gate.querySelector("[data-contact-status]");
  var widget = gate.querySelector("[data-contact-widget]");
  var result = gate.querySelector("[data-contact-result]");
  var sitekey = gate.getAttribute("data-sitekey");
  var widgetId;
  var apiPromise;
  var attempt = 0;
  var checking = false;
  var fallback = " Please use a professional profile above if the problem continues.";
  if (!sitekey || (location.hostname !== "localhost" && location.hostname !== "127.0.0.1" && /^[123]x0+/.test(sitekey))) return;

  button.hidden = false;
  status.hidden = true;

  function failed(message) {
    checking = false;
    button.disabled = false;
    button.textContent = "Try verification again";
    status.textContent = message + fallback;
  }

  function loadTurnstile() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      var timer = window.setTimeout(function () {
        script.remove();
        reject(new Error("timeout"));
      }, 15000);
      window.pmaxeyTurnstileReady = function () {
        window.clearTimeout(timer);
        resolve(window.turnstile);
      };
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=pmaxeyTurnstileReady&render=explicit";
      script.async = true;
      script.onerror = function () {
        window.clearTimeout(timer);
        script.remove();
        reject(new Error("unavailable"));
      };
      document.head.appendChild(script);
    });
    return apiPromise;
  }

  async function reveal(token, currentAttempt) {
    if (currentAttempt !== attempt || checking) return;
    checking = true;
    status.textContent = "Checking verification…";
    try {
      var response = await fetch(gate.getAttribute("data-endpoint"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ token: token }),
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error("verification");
      var data = await response.json();
      if (typeof data.email !== "string" || !data.email.includes("@")) throw new Error("response");
      var link = document.createElement("a");
      link.href = "mailto:" + encodeURIComponent(data.email);
      link.textContent = data.email;
      result.replaceChildren(link);
      result.hidden = false;
      button.hidden = true;
      window.turnstile.remove(widgetId);
      widget.hidden = true;
      widgetId = undefined;
      status.textContent = "";
      status.hidden = true;
      // Keep keyboard focus at the result after removing Turnstile's iframe.
      link.focus();
    } catch (_) {
      failed("Verification could not be completed. Try a fresh check.");
    }
  }

  button.addEventListener("click", async function () {
    button.disabled = true;
    status.hidden = false;
    status.textContent = "Verification helps prevent spam. Loading…";
    var currentAttempt = ++attempt;
    try {
      var api = await loadTurnstile();
      if (widgetId !== undefined) api.remove(widgetId);
      widget.replaceChildren();
      checking = false;
      status.textContent = "Verification helps prevent spam. Complete the check below.";
      widget.hidden = false;
      widgetId = api.render(widget, {
        sitekey: sitekey,
        action: gate.getAttribute("data-action"),
        theme: "auto",
        size: widget.clientWidth < 300 ? "compact" : "flexible",
        "response-field": false,
        retry: "never",
        "refresh-expired": "manual",
        callback: function (token) { reveal(token, currentAttempt); },
        "expired-callback": function () {
          if (currentAttempt === attempt && !checking) failed("The check expired. Please try again.");
        },
        "timeout-callback": function () {
          if (currentAttempt === attempt && !checking) failed("The check timed out. Please try again.");
        },
        "error-callback": function () {
          if (currentAttempt === attempt && !checking) failed("Verification is unavailable right now.");
          return true;
        }
      });
    } catch (_) {
      apiPromise = undefined;
      failed("Verification is unavailable right now.");
    }
  });
}());
