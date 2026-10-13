# Digital Grandpa owned Stripe checkout

This worker is the narrow payment and entitlement boundary for **The Work You Still Carry** Reader & Listening Library.

## Security contract

- The public page stays on `digitalgrandpa.org` and uses Stripe Elements. Card data goes directly to Stripe.
- The worker, not the browser, fixes the offering to **$297 USD one time**.
- `policyAccepted: true`, valid email, name, and UUID checkout-attempt ID are required before a PaymentIntent is created.
- Browser success state is not payment proof. Stripe's raw-body signed `payment_intent.succeeded` event is the only entitlement trigger.
- D1 records payment attempts and event status so a duplicate event cannot grant more than one entitlement.
- HighLevel is called only after a signed matching Stripe event. Its sole role is to create/reuse the Digital Grandpa location contact and enroll that contact in the exact protected library offer.
- No tags, cross-property enrollment, optional-marketing consent, or Beacon Momentum contact transfer are inferred from payment.

## Required test-only configuration

Use Cloudflare Worker secrets, never repository files or browser JavaScript:

| Secret / variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe **test-mode** secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe **test-mode** publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe **test-mode** endpoint signing secret |
| `HIGHLEVEL_PRIVATE_TOKEN` | Digital Grandpa location token scoped to contacts and courses only |
| `HIGHLEVEL_LOCATION_ID` | Digital Grandpa location ID |
| `HIGHLEVEL_OFFER_ID` | Dedicated non-public test Reader & Listening Library offer |
| `DG_CHECKOUT_DB` | D1 test database binding |

Do not set live credentials while `CHECKOUT_MODE = "test"`. The first checkout trace must use a test Stripe key, a test event, a controlled test mailbox, and a distinct HighLevel test offer.

## Test sequence

1. Create the `digital-grandpa-checkout-test` D1 database and apply `schema.sql`.
2. Replace the test D1 ID in `wrangler.toml`.
3. Store test secrets with `wrangler secret put` or the Cloudflare secrets UI.
4. Deploy a test-only Worker and map only a test route or Worker development URL.
5. Configure a Stripe **test-mode** webhook to `/api/stripe-webhook` and save its test signing secret.
6. Call `/api/checkout/config` and confirm it reports `ready: true` with only a publishable key.
7. Complete one $297 test PaymentIntent using Stripe's test payment method.
8. Verify in evidence: the signed event, D1 event record (`completed`), D1 checkout record (`fulfilled`), exact Digital Grandpa test contact, and exact HighLevel test offer enrollment.
9. Replay the same event and confirm no second entitlement is created.
10. Simulate a rejected payment and a failed HighLevel call; confirm no entitlement and a retryable event failure.

The public sales page stays paused until these test controls pass and the owner separately approves replacement of the pause state with a live owned checkout.
