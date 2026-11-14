# TODO — Digital Grandpa custom-domain deployment

**Status, 2026-11-13:** The custom domain is assigned in GitHub Pages and the root-path site is deployed from commit `e490fec1e3258ad0e9f8c7987b2e550b10f6066f` on `main`. Cloudflare DNS now points the apex and `www` to GitHub Pages. Public DNS checks pass, HTTP pages load, and GitHub reports “DNS check successful.” **HTTPS certificate issuance is still pending.** The Pages API currently reports `https_enforced: false`, and the certificate presented for the domain is the default `*.github.io` certificate, not a valid `digitalgrandpa.org` certificate. Do not mark the cutover fully complete until a hostname-valid certificate is present and HTTPS enforcement is on.

## Outcome 1 — Root-domain artifact, responsive behavior, and route checks: complete

The existing Vite site builds at `/` for `https://digitalgrandpa.org/`; the artifact preparer retains the project-site fallback and the Pages workflow uses `PAGES_BASE_PATH=/`. Lint, build, root-path artifact checks, and the 390px mobile review passed. All 11 production and draft routes were exercised locally and again on the live HTTP origin: titles are present, shared headers/footers match, mobile menus open and close, internal links resolve, no horizontal overflow or browser page errors occur, and live routes return 200. Sitemap and robots work at the custom domain; the sitemap excludes `/drafts/` and uses the custom-domain origin.

## Outcome 2 — GitHub domain verification and repository setting: complete

The owner account `beaconmomentum-dev` verified `digitalgrandpa.org` with a TXT record that remains in Cloudflare. The repository Pages setting now specifies `digitalgrandpa.org`, and the site source remains GitHub Actions.

## Outcome 3 — Cloudflare web DNS cutover and email-DNS preservation: complete

The two previous proxied CNAMEs—to `digitalgrandpa-org.pages.dev` at the apex and `www`—were replaced with DNS-only records using automatic TTL: apex A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; apex AAAA records `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`; and `www` CNAME `beaconmomentum-dev.github.io`. Cloudflare's batch verification showed four A, four AAAA, and one CNAME record at the expected names, all DNS-only with Auto TTL. Both Cloudflare and Google public DNS-over-HTTPS resolvers return the expected targets.

All three Email Routing MX records and all nine TXT records remain in the zone, including SPF, DKIM, DMARC, and GitHub ownership verification. Nameservers and routing rules were not changed. The previous Cloudflare Pages origin `digitalgrandpa-org.pages.dev` is retained in the deployment plan for rollback. No email, mailbox, or forwarding settings were modified.

## Outcome 4 — GitHub Pages HTTPS: pending GitHub certificate issuance

The deployed site currently responds over HTTP at the apex; `www` and the old GitHub project URL redirect to the apex. GitHub's custom-domain DNS check is successful, but HTTPS is not yet available: HTTPS requests receive a certificate for `*.github.io`, and GitHub reports enforcement unavailable until the custom domain is properly configured for HTTPS. DNS A/AAAA/CNAME values are correct and no CAA records are published. GitHub documents that DNS/HTTPS provisioning may take up to 24 hours. When GitHub issues a certificate whose SAN covers `digitalgrandpa.org`, verify both HTTPS hosts and then enable “Enforce HTTPS”; do not leave HTTPS marked complete before that.

## Outcome 5 — Book preview visibility and release boundaries: preserved

The owner approved keeping the three `/drafts/` routes in the public Pages artifact. They are unlinked from the public navigation, excluded from the sitemap, and marked `noindex,nofollow,noarchive`, but remain directly reachable by anyone with the URL; `noindex` is not access control. The free-book email-request control remains disabled; *AI Without Fear* has no price, download, signup, or checkout. Existing *The Work You Still Carry* content and checkout are unchanged. No customer-data action, email/CRM transfer, payment action, or mass communication occurred.
