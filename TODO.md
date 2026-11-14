# TODO — Digital Grandpa custom-domain deployment

**Status as of 2026-11-13:** GitHub has verified ownership of `digitalgrandpa.org`. The Cloudflare verification TXT remains in place. The custom-domain root artifact and desktop/mobile previews have been tested locally on branch `feature/digitalgrandpa-custom-domain`; nothing has been committed, pushed, or switched in production. The existing Cloudflare Pages apex and `www` records remain active. The repository Pages `cname` is still unset. The GitHub repository and Pages preview are public; `noindex` does not restrict access.

## Outcome 1 — Root-domain artifact and design QA: complete locally

The existing Vite site now builds for `/` at `https://digitalgrandpa.org/`, not just the repository subpath. The artifact preparer keeps the project-path fallback and uses `PAGES_BASE_PATH=/` for this deployment. `pnpm lint`, `pnpm build`, artifact link checks, and desktop/mobile browser renders passed. All local page and asset targets resolve. The three `/drafts/` routes remain `noindex` and have no active forms or enabled signup/purchase controls.

## Outcome 2 — GitHub domain ownership verification: complete

The owner account `beaconmomentum-dev` verified `digitalgrandpa.org` in GitHub Pages settings using a dedicated TXT record. Keep that verification record. The repository-level Pages custom-domain setting remains unset pending the approved cutover.

## Outcome 3 — Cloudflare web DNS cutover: awaiting final confirmation

The current apex and `www` web records are proxied CNAMEs to `digitalgrandpa-org.pages.dev`. If authorized, replace only those two records with the following DNS-only targets and automatic TTL:

- Apex A: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- Apex AAAA: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
- `www` CNAME: `beaconmomentum-dev.github.io`.

Keep the Cloudflare Email Routing MX records, SPF/DKIM/DMARC and all other TXT records—including the GitHub verification TXT—nameservers, and existing routing configuration unchanged. Do not alter email forwarding or destination verification. Cloudflare's DNS batch is one database transaction, but propagation across its DNS network is not atomic. Before writing, re-read the zone and verify the exact old web records and IDs. The user must confirm the exact replacement payload and accept the brief DNS/HTTPS transition.

## Outcome 4 — Pages custom-domain assignment and HTTPS: pending

After confirmation, set the repository Pages custom domain to `digitalgrandpa.org`, commit and deploy the root-path build, then apply the web-record batch. Verify `www` to apex behavior, the Pages custom-domain status, HTTPS issuance, root-relative assets, sitemap/robots responses, and preserved email DNS. GitHub documents that DNS propagation and HTTPS can take up to 24 hours. Keep the old Cloudflare Pages origin and record inventory for rollback.

## Outcome 5 — New-book product-release boundaries: unchanged

*When the World Changes Fast* has no live email capture or delivery action. Its request control remains disabled until the accessible book file, separate privacy/data handling, confirmed-email delivery, optional updates consent, and reader-care operations are approved and tested. *AI Without Fear* has no price, download, signup, checkout, or purchase action until offer details and a separate release decision are approved. Do not modify the existing *The Work You Still Carry* page or checkout. No email/CRM transfer, customer-data operation, payment action, or mass communication is authorized by the domain request.
