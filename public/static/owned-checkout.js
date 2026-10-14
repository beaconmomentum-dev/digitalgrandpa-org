(() => {
  "use strict";

  const form = document.querySelector("[data-checkout-form]");
  if (!form) return;

  const apiBase = String(form.dataset.checkoutApi || "").replace(/\/$/, "");
  const contactStep = form.querySelector("[data-checkout-contact]");
  const paymentStep = form.querySelector("[data-checkout-payment]");
  const status = form.querySelector("[data-checkout-status]");
  const submit = form.querySelector("[data-checkout-submit]");
  const paymentElement = form.querySelector("[data-payment-element]");
  const nameField = form.querySelector("[name='name']");
  const emailField = form.querySelector("[name='email']");
  const policyField = form.querySelector("[name='policyAccepted']");

  const state = { stripe: null, elements: null, initialized: false };

  function setStatus(message, type = "info") {
    status.textContent = message;
    status.dataset.state = type;
  }

  function setBusy(isBusy) {
    submit.disabled = isBusy;
    submit.setAttribute("aria-busy", String(isBusy));
  }

  if (new URLSearchParams(window.location.search).get("purchase") === "processing") {
    submit.disabled = true;
    submit.setAttribute("aria-disabled", "true");
    setStatus("Your payment is being verified securely. Reader access is granted only after Stripe’s signed confirmation. Please check the delivery email shortly; if it does not arrive, use Reader access help.");
    return;
  }

  function checkoutAttemptId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const value = (window.crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (character === "x" ? 0 : 1);
      return (character === "x" ? value : (value & 3) | 8).toString(16);
    });
  }

  async function request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "checkout_request_failed");
    return body;
  }

  async function startPayment() {
    if (!apiBase) throw new Error("checkout_configuration_missing");
    if (!window.Stripe) throw new Error("stripe_library_unavailable");

    const config = await request("/api/checkout/config", { method: "GET" });
    if (!config.ready || config.mode !== "live" || !config.publishableKey) throw new Error("checkout_not_ready");
    if (config.amount !== 29700 || config.currency !== "usd") throw new Error("checkout_amount_mismatch");

    const payment = await request("/api/checkout/payment-intent", {
      method: "POST",
      body: JSON.stringify({
        name: nameField.value.trim(),
        email: emailField.value.trim(),
        policyAccepted: policyField.checked,
        checkoutAttemptId: checkoutAttemptId(),
      }),
    });
    if (payment.amount !== 29700 || payment.currency !== "usd" || !payment.clientSecret) throw new Error("payment_setup_failed");

    state.stripe = window.Stripe(config.publishableKey);
    state.elements = state.stripe.elements({
      clientSecret: payment.clientSecret,
      appearance: {
        theme: "stripe",
        variables: { colorPrimary: "#82501a", colorText: "#172b4d", borderRadius: "4px", fontFamily: "Manrope, Arial, sans-serif" },
      },
    });
    const element = state.elements.create("payment", { layout: "tabs" });
    element.mount(paymentElement);
    state.initialized = true;

    contactStep.hidden = true;
    paymentStep.hidden = false;
    submit.textContent = "Complete secure $297 purchase";
    setStatus("Payment details are handled securely by Stripe. Digital Grandpa does not receive or store card numbers.");
  }

  async function confirmPayment() {
    const returnUrl = `${window.location.origin}${window.location.pathname}?purchase=processing`;
    const { error, paymentIntent } = await state.stripe.confirmPayment({
      elements: state.elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (error) {
      setStatus(error.message || "Stripe could not complete the payment. No access has been granted.", "error");
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      paymentStep.hidden = true;
      setStatus("Payment received. Secure reader access is now being verified. Please check the delivery email shortly; if it does not arrive, use Reader access help.", "success");
      return;
    }

    setStatus("Your payment is processing. Secure reader access is granted only after Stripe’s verified server confirmation.", "info");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    setBusy(true);
    setStatus("");
    try {
      if (!state.initialized) await startPayment();
      else await confirmPayment();
    } catch (error) {
      const code = error instanceof Error ? error.message : "checkout_unavailable";
      const message = {
        checkout_not_ready: "Secure checkout is not ready yet. No payment has been taken. Please try again shortly or use Reader access help.",
        checkout_amount_mismatch: "Checkout configuration could not be verified. No payment has been taken.",
        stripe_library_unavailable: "Stripe’s secure payment form did not load. Please check your connection and try again.",
        invalid_checkout_request: "Please complete the required name, email, and policy acknowledgement before continuing.",
      }[code] || "Secure checkout could not be started. No payment has been taken. Please try again or use Reader access help.";
      setStatus(message, "error");
    } finally {
      setBusy(false);
    }
  });
})();
