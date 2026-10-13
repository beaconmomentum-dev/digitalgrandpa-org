const OFFERING_KEY = "digital_grandpa_the_work_you_still_carry_2026";
const AMOUNT_CENTS = 29_700;
const CURRENCY = "usd";
const MAX_CLOCK_SKEW_SECONDS = 300;

function json(body, status = 200, origin = null) {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function clientOrigin(request, env) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = (env.ALLOWED_ORIGINS || "https://digitalgrandpa.org,https://www.digitalgrandpa.org")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : "";
}

function allowClientRequest(request, env) {
  const origin = clientOrigin(request, env);
  return { origin, allowed: !origin || origin.length > 0 };
}

function isEmail(value) {
  return typeof value === "string" && value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUUID(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function checkoutReady(env) {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY && env.STRIPE_WEBHOOK_SECRET && env.HIGHLEVEL_LOCATION_ID && env.HIGHLEVEL_PRIVATE_TOKEN && env.HIGHLEVEL_OFFER_ID);
}

function stripeHeaders(env, idempotencyKey = null) {
  const headers = new Headers({
    authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    "content-type": "application/x-www-form-urlencoded",
  });
  if (idempotencyKey) headers.set("idempotency-key", idempotencyKey);
  return headers;
}

async function stripeRequest(env, path, body, idempotencyKey) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: stripeHeaders(env, idempotencyKey),
    body: body.toString(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Stripe request failed with ${response.status}: ${payload?.error?.type || "unknown"}`);
  }
  return payload;
}

function fromHex(value) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

function constantTimeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array) || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function signatureParts(signature) {
  const values = new Map();
  for (const part of signature.split(",")) {
    const [key, value] = part.trim().split("=");
    if (!key || !value) continue;
    const list = values.get(key) || [];
    list.push(value);
    values.set(key, list);
  }
  return values;
}

async function verifyStripeSignature(rawBody, header, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  const parts = signatureParts(header);
  const timestamp = Number(parts.get("t")?.[0]);
  const candidates = parts.get("v1") || [];
  if (!Number.isFinite(timestamp) || candidates.length === 0 || Math.abs(nowSeconds - timestamp) > MAX_CLOCK_SKEW_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`)));
  return candidates.some((candidate) => {
    const supplied = fromHex(candidate);
    return supplied ? constantTimeEqual(signature, supplied) : false;
  });
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function createPaymentIntent(request, env) {
  const origin = clientOrigin(request, env);
  if (origin === "") return json({ error: "origin_not_allowed" }, 403);
  if (!checkoutReady(env)) return json({ error: "checkout_not_ready" }, 503, origin);

  const input = await parseJson(request);
  if (!input || !isEmail(input.email) || typeof input.name !== "string" || input.name.trim().length < 1 || input.name.trim().length > 128 || input.policyAccepted !== true || !isUUID(input.checkoutAttemptId)) {
    return json({ error: "invalid_checkout_request" }, 400, origin);
  }

  const existing = await env.DG_CHECKOUT_DB.prepare("SELECT payment_intent_id, status FROM checkout_attempts WHERE checkout_attempt_id = ?").bind(input.checkoutAttemptId).first();
  if (existing?.payment_intent_id) return json({ error: "checkout_attempt_already_started" }, 409, origin);

  await env.DG_CHECKOUT_DB.prepare(
    "INSERT INTO checkout_attempts (checkout_attempt_id, email, name, policy_accepted, status) VALUES (?, ?, ?, 1, 'created') ON CONFLICT(checkout_attempt_id) DO NOTHING",
  ).bind(input.checkoutAttemptId, input.email.trim().toLowerCase(), input.name.trim()).run();

  const form = new URLSearchParams({
    amount: String(AMOUNT_CENTS),
    currency: CURRENCY,
    receipt_email: input.email.trim().toLowerCase(),
    description: "Digital Grandpa — The Work You Still Carry Reader & Listening Library",
    "automatic_payment_methods[enabled]": "true",
    "metadata[offering]": OFFERING_KEY,
    "metadata[checkout_attempt_id]": input.checkoutAttemptId,
    "metadata[checkout_mode]": env.CHECKOUT_MODE || "test",
  });

  try {
    const paymentIntent = await stripeRequest(env, "/payment_intents", form, `dg-${env.CHECKOUT_MODE || "test"}-${input.checkoutAttemptId}`);
    await env.DG_CHECKOUT_DB.prepare(
      "UPDATE checkout_attempts SET payment_intent_id = ?, status = 'payment_intent_created', updated_at = CURRENT_TIMESTAMP WHERE checkout_attempt_id = ?",
    ).bind(paymentIntent.id, input.checkoutAttemptId).run();
    return json({ clientSecret: paymentIntent.client_secret, amount: AMOUNT_CENTS, currency: CURRENCY }, 200, origin);
  } catch (error) {
    await env.DG_CHECKOUT_DB.prepare(
      "UPDATE checkout_attempts SET status = 'payment_intent_failed', updated_at = CURRENT_TIMESTAMP WHERE checkout_attempt_id = ?",
    ).bind(input.checkoutAttemptId).run();
    console.error("Digital Grandpa payment-intent creation failed", { reason: error instanceof Error ? error.message : "unknown" });
    return json({ error: "payment_setup_failed" }, 502, origin);
  }
}

async function highLevelRequest(env, path, method, body = null) {
  const headers = new Headers({
    authorization: `Bearer ${env.HIGHLEVEL_PRIVATE_TOKEN}`,
    accept: "application/json",
    Version: env.HIGHLEVEL_API_VERSION || "v3",
  });
  if (body) headers.set("content-type", "application/json");
  const response = await fetch(`https://services.leadconnectorhq.com${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`HighLevel request failed with ${response.status}`);
  return payload;
}

async function findOrCreateHighLevelContact(env, attempt) {
  const query = new URLSearchParams({ locationId: env.HIGHLEVEL_LOCATION_ID, query: attempt.email });
  const matches = await highLevelRequest(env, `/contacts/?${query.toString()}`, "GET");
  const existing = (matches.contacts || []).find((contact) => String(contact.email || "").toLowerCase() === attempt.email);
  if (existing?.id) return existing.id;

  const contact = await highLevelRequest(env, "/contacts/", "POST", {
    locationId: env.HIGHLEVEL_LOCATION_ID,
    name: attempt.name,
    email: attempt.email,
    source: "digitalgrandpa.org/owned-stripe-checkout",
  });
  if (!contact?.contact?.id) throw new Error("HighLevel contact response lacked an identifier");
  return contact.contact.id;
}

async function grantLibraryAccess(env, contactId) {
  const locationId = encodeURIComponent(env.HIGHLEVEL_LOCATION_ID);
  return highLevelRequest(env, `/courses/enrollments?locationId=${locationId}`, "POST", {
    contactId,
    offerId: env.HIGHLEVEL_OFFER_ID,
  });
}

async function claimEvent(env, eventId) {
  const inserted = await env.DG_CHECKOUT_DB.prepare(
    "INSERT INTO stripe_events (event_id, status) VALUES (?, 'processing') ON CONFLICT(event_id) DO NOTHING",
  ).bind(eventId).run();
  if ((inserted.meta?.changes || 0) === 1) return "claimed";

  const existing = await env.DG_CHECKOUT_DB.prepare("SELECT status FROM stripe_events WHERE event_id = ?").bind(eventId).first();
  if (existing?.status === "completed") return "completed";
  if (existing?.status === "failed") {
    const reclaimed = await env.DG_CHECKOUT_DB.prepare(
      "UPDATE stripe_events SET status = 'processing', last_error = NULL, updated_at = CURRENT_TIMESTAMP WHERE event_id = ? AND status = 'failed'",
    ).bind(eventId).run();
    return (reclaimed.meta?.changes || 0) === 1 ? "claimed" : "processing";
  }
  return "processing";
}

async function webhook(request, env) {
  const rawBody = await request.text();
  const valid = await verifyStripeSignature(rawBody, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return json({ received: false }, 400);

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ received: false }, 400);
  }
  if (event.type !== "payment_intent.succeeded") return json({ received: true });

  const paymentIntent = event.data?.object;
  if (!paymentIntent || paymentIntent.metadata?.offering !== OFFERING_KEY || paymentIntent.metadata?.checkout_mode !== (env.CHECKOUT_MODE || "test")) {
    return json({ received: true });
  }
  if (paymentIntent.amount !== AMOUNT_CENTS || paymentIntent.currency !== CURRENCY || paymentIntent.status !== "succeeded") {
    return json({ received: true });
  }

  const eventClaim = await claimEvent(env, event.id);
  if (eventClaim === "completed") return json({ received: true, duplicate: true });
  if (eventClaim === "processing") return json({ received: false }, 409);

  try {
    const attempt = await env.DG_CHECKOUT_DB.prepare(
      "SELECT checkout_attempt_id, email, name, policy_accepted, status FROM checkout_attempts WHERE checkout_attempt_id = ? AND payment_intent_id = ?",
    ).bind(paymentIntent.metadata.checkout_attempt_id, paymentIntent.id).first();
    if (!attempt || attempt.policy_accepted !== 1) throw new Error("No approved checkout attempt matched payment event");

    const contactId = await findOrCreateHighLevelContact(env, attempt);
    const enrollment = await grantLibraryAccess(env, contactId);
    await env.DG_CHECKOUT_DB.batch([
      env.DG_CHECKOUT_DB.prepare("UPDATE checkout_attempts SET status = 'fulfilled', highlevel_contact_id = ?, highlevel_enrollment_id = ?, updated_at = CURRENT_TIMESTAMP WHERE checkout_attempt_id = ?")
        .bind(contactId, enrollment.offerId || env.HIGHLEVEL_OFFER_ID, attempt.checkout_attempt_id),
      env.DG_CHECKOUT_DB.prepare("UPDATE stripe_events SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE event_id = ?").bind(event.id),
    ]);
    return json({ received: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 500) : "unknown fulfillment error";
    await env.DG_CHECKOUT_DB.prepare(
      "UPDATE stripe_events SET status = 'failed', last_error = ?, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?",
    ).bind(reason, event.id).run();
    console.error("Digital Grandpa fulfillment failed", { eventId: event.id, reason });
    return json({ received: false }, 500);
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === "OPTIONS" && path.startsWith("/api/checkout/")) {
      const { origin, allowed } = allowClientRequest(request, env);
      return allowed ? new Response(null, { status: 204, headers: origin ? { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type", vary: "Origin" } : {} }) : json({ error: "origin_not_allowed" }, 403);
    }
    if (request.method === "GET" && path === "/api/checkout/config") {
      const origin = clientOrigin(request, env);
      if (origin === "") return json({ error: "origin_not_allowed" }, 403);
      return json({ ready: checkoutReady(env), mode: env.CHECKOUT_MODE || "test", priceLabel: "$297 USD · one time", amount: AMOUNT_CENTS, currency: CURRENCY, publishableKey: checkoutReady(env) ? env.STRIPE_PUBLISHABLE_KEY : null }, 200, origin);
    }
    if (request.method === "POST" && path === "/api/checkout/payment-intent") return createPaymentIntent(request, env);
    if (request.method === "POST" && path === "/api/stripe-webhook") return webhook(request, env);
    return json({ error: "not_found" }, 404);
  },
};

export const internals = { AMOUNT_CENTS, CURRENCY, OFFERING_KEY, verifyStripeSignature, constantTimeEqual, fromHex, isUUID };
