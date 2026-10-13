import assert from "node:assert/strict";
import test from "node:test";
import worker, { internals } from "../src/index.js";

async function signatureFor(rawBody, secret, timestamp) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`)));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

test("checkout config never exposes a Stripe secret and remains unready without server secrets", async () => {
  const response = await worker.fetch(new Request("https://digitalgrandpa.org/api/checkout/config", { headers: { origin: "https://digitalgrandpa.org" } }), { CHECKOUT_MODE: "test" });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ready, false);
  assert.equal(body.publishableKey, null);
  assert.equal(body.amount, 29700);
  assert.equal(body.currency, "usd");
});

test("payment intent creation rejects missing policy acknowledgement before calling any processor", async () => {
  const response = await worker.fetch(new Request("https://digitalgrandpa.org/api/checkout/payment-intent", {
    method: "POST",
    headers: { origin: "https://digitalgrandpa.org", "content-type": "application/json" },
    body: JSON.stringify({ email: "test@example.invalid", name: "Test Reader", policyAccepted: false, checkoutAttemptId: "6a89a42a-c445-4e84-8175-240fdbca5a3b" }),
  }), { STRIPE_SECRET_KEY: "secret", STRIPE_PUBLISHABLE_KEY: "publishable", STRIPE_WEBHOOK_SECRET: "webhook", HIGHLEVEL_LOCATION_ID: "location", HIGHLEVEL_PRIVATE_TOKEN: "token", HIGHLEVEL_OFFER_ID: "offer" });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_checkout_request" });
});

test("Stripe signature verification accepts the correct raw payload and rejects a changed payload", async () => {
  const raw = JSON.stringify({ id: "evt_test", type: "payment_intent.succeeded" });
  const secret = "whsec_test_only";
  const timestamp = 1_790_000_000;
  const signature = await signatureFor(raw, secret, timestamp);
  assert.equal(await internals.verifyStripeSignature(raw, `t=${timestamp},v1=${signature}`, secret, timestamp), true);
  assert.equal(await internals.verifyStripeSignature(`${raw} `, `t=${timestamp},v1=${signature}`, secret, timestamp), false);
});

test("server checkout constants remain the approved $297 USD one-time offering", () => {
  assert.equal(internals.AMOUNT_CENTS, 29700);
  assert.equal(internals.CURRENCY, "usd");
  assert.equal(internals.OFFERING_KEY, "digital_grandpa_the_work_you_still_carry_2026");
  assert.equal(internals.isUUID("6a89a42a-c445-4e84-8175-240fdbca5a3b"), true);
  assert.equal(internals.isUUID("customer-controlled-amount"), false);
});
