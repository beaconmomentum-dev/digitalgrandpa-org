# Digital Grandpa custom-domain deployment plan

## Goal and boundaries

Prepare the existing GitHub Pages site to use `https://digitalgrandpa.org/` as its canonical production origin, with `www.digitalgrandpa.org` redirecting to the apex. GitHub has verified ownership of `digitalgrandpa.org` for the account `beaconmomentum-dev`; the verification TXT record remains in Cloudflare DNS. The repository's Pages custom-domain setting is not yet set, and the current Cloudflare Pages route has not been changed.

A custom-domain cutover replaces only the existing web-origin records at the apex and `www`. Preserve all email-related and unrelated DNS: Cloudflare Email Routing's three MX records; SPF, DKIM, DMARC and all other TXT records; nameservers and the existing routing configuration. Do not change email forwarding, destination verification, or any mail record. New GitHub records should be DNS-only so DNS resolves to GitHub's documented targets.

The repository and Pages site are public. The preview pages under `/drafts/` are directly reachable by anyone who knows their URLs; `noindex,nofollow,noarchive` is crawler guidance, not access control. They remain labeled as drafts. The *When the World Changes Fast* email-request control stays disabled, and *AI Without Fear* remains informational with no price, download, signup, or checkout. The existing *The Work You Still Carry* page and its checkout are unchanged.

Do not change Cloudflare website DNS or the current live host until the owner has reviewed the root-domain and mobile previews and confirms the exact final web-record payload and the visibility of `/drafts/`.

## Tested implementation and project structure

Reuse the existing Vite static build in `/home/ubuntu/digitalgrandpa-org/public`; add no runtime services, email providers, databases, or payment integrations. The Pages workflow builds from `main`. The artifact preparer retains the project-site fallback but accepts `PAGES_BASE_PATH=/` for the custom-domain root. No `CNAME` file is needed for this custom Actions workflow; the repository's Pages setting stores the custom domain.

The locally tested root-domain artifact uses GitHub's current documented DNS targets:

| Record | Type | Target | TTL | Cloudflare proxy |
|---|---|---|---|---|
| `digitalgrandpa.org` (apex) | A | `185.199.108.153` | Auto | DNS only |
| `digitalgrandpa.org` (apex) | A | `185.199.109.153` | Auto | DNS only |
| `digitalgrandpa.org` (apex) | A | `185.199.110.153` | Auto | DNS only |
| `digitalgrandpa.org` (apex) | A | `185.199.111.153` | Auto | DNS only |
| `digitalgrandpa.org` (apex) | AAAA | `2606:50c0:8000::153` | Auto | DNS only |
| `digitalgrandpa.org` (apex) | AAAA | `2606:50c0:8001::153` | Auto | DNS only |
| `digitalgrandpa.org` (apex) | AAAA | `2606:50c0:8002::153` | Auto | DNS only |
| `digitalgrandpa.org` (apex) | AAAA | `2606:50c0:8003::153` | Auto | DNS only |
| `www.digitalgrandpa.org` | CNAME | `beaconmomentum-dev.github.io` | Auto | DNS only |

The replacement affects only the currently observed proxied CNAME at the apex and the currently observed proxied CNAME at `www`, both presently targeting `digitalgrandpa-org.pages.dev`. Before any authorized DNS write, re-read Cloudflare and confirm those exact records and current record IDs. If still unchanged, the planned operation is one Cloudflare DNS batch: delete those two CNAMEs, then post the eight apex address records and the `www` CNAME. Cloudflare applies the batch as one database transaction, but documents that distributed DNS propagation is not atomic; caches may observe the transition at different times. Keep the previous Cloudflare Pages origin and the complete pre-cutover inventory for rollback.

The post-confirmation sequence is: configure the repository Pages custom domain as `digitalgrandpa.org`; commit and deploy the tested root-path artifact; apply the exact Cloudflare web-record batch; then verify apex and `www` redirects, Pages custom-domain status, HTTPS issuance, all root-relative assets, sitemap and robots responses, and preserved MX/TXT records. GitHub says DNS propagation and HTTPS provisioning may take up to 24 hours. The existing Pages setting already has HTTPS enforcement enabled.

Project files and responsibilities:

- `.github/workflows/deploy-pages.yml` — build and publish the static Pages artifact through GitHub Actions.
- `scripts/prepare-github-pages.py` — apply the configured base path, include the three approved draft pages plus local assets and shared stylesheet, and add `.nojekyll`.
- `public/` — the existing Digital Grandpa Vite website, sitemap, robots file, and shared design assets.
- `public/drafts/` — preview hub and two book draft pages; not linked from public navigation or the sitemap.
- `DIGITAL_GRANDPA_TRANSFORMATION_SCOPE.md` — previously owner-approved narrow free-book request scope and release gates.
- `TODO.md` — current status, confirmation boundary, and open product-release gates.

## Design and visitor experience

Keep the current Digital Grandpa porch-light style: calm paper backgrounds, deep ink-blue structure, restrained amber warmth, serif headlines with readable sans-serif body text, generous reading space, visible focus states, and accessible responsive navigation. The root-hosted site should feel like the existing Digital Grandpa site, not a separate GitHub theme.
