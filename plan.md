# Digital Grandpa custom-domain deployment plan

## Goal and boundaries

The existing GitHub Pages site has been cut over to `https://digitalgrandpa.org/` as its canonical origin, with `www.digitalgrandpa.org` redirecting to the apex. GitHub verified domain ownership, the repository Pages setting now names `digitalgrandpa.org`, the root-path site artifact was deployed from `main`, and Cloudflare's web records now resolve to GitHub Pages. GitHub reports its DNS check successful. As of the latest check, however, GitHub's hostname-matching TLS certificate is still pending: HTTPS enforcement is off and HTTPS requests see the default `*.github.io` certificate. Do not report HTTPS as complete until the certificate matches the custom domain and enforcement is re-enabled.

Only apex and `www` web records were changed. Cloudflare Email Routing's three MX records, SPF/DKIM/DMARC and all other TXT records (including GitHub's domain-verification TXT), nameservers, and mail-routing settings were preserved. The former proxied Cloudflare Pages origin `digitalgrandpa-org.pages.dev` is recorded for rollback. No mailbox or forwarding configuration was changed.

The repository and Pages site are public. The `/drafts/` pages are directly reachable by anyone who knows their URLs. `noindex,nofollow,noarchive` is crawler guidance, not access control; the pages are not password protected. They remain identified as previews, are excluded from the public sitemap and navigation, and have no active signup or purchase action. The *When the World Changes Fast* email-request control remains disabled, and *AI Without Fear* remains informational with no price, download, signup or checkout. The existing *The Work You Still Carry* page and checkout were not changed.

## Implementation and tested site structure

Reuse the existing Vite build in `public/`; no runtime services, email providers, databases, or payment integrations were added. `.github/workflows/deploy-pages.yml` builds on `main` and sets `PAGES_BASE_PATH=/` for the custom-domain root. `scripts/prepare-github-pages.py` retains the project-site fallback and adds the approved draft preview files, their local assets, shared stylesheet, and `.nojekyll` to the Pages artifact. The root custom domain is stored in the GitHub Pages repository setting; a `CNAME` file is not needed for this custom Actions workflow.

GitHub's documented DNS records were set DNS-only with automatic TTL: four apex A records (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`); four apex AAAA records (`2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`); and `www` CNAME to `beaconmomentum-dev.github.io`. The cutover used one Cloudflare DNS batch that deleted only the two reviewed apex/www CNAME records to `digitalgrandpa-org.pages.dev` and created the nine documented GitHub records. Cloudflare applies the batch as one database transaction, though propagation across its distributed DNS network is not atomic.

The final mobile quality pass exercised all 11 existing and draft routes at 390px: shared header/footer are present, the menu opens and closes, internal links resolve, there is no horizontal overflow or page error, and draft pages have no active form or enabled purchase/signup action. The same route/menu/link checks passed on the live HTTP origin after DNS propagation. Public DNS-over-HTTPS resolvers returned all expected A, AAAA and CNAME targets. Live HTTP checks returned 200 for the homepage, existing pages, draft pages, sitemap and robots; `www` and the old project URL redirect to the apex. The sitemap uses the custom domain and excludes `/drafts/`; all draft pages return `noindex,nofollow,noarchive`.

## Remaining release item

GitHub documentation allows DNS and HTTPS provisioning to take up to 24 hours. Once GitHub issues a valid certificate for `digitalgrandpa.org`, verify the certificate and HTTPS routes, then enable “Enforce HTTPS” in the repository Pages settings and confirm that `https://digitalgrandpa.org/` and `https://www.digitalgrandpa.org/` resolve securely with the intended redirects. Keep the old Cloudflare Pages origin and pre-cutover DNS inventory for rollback. Do not modify email, draft publication state, reader data, products, or checkout as part of TLS completion.

## Project files and design

- `.github/workflows/deploy-pages.yml` — builds and deploys the static Pages artifact through GitHub Actions.
- `scripts/prepare-github-pages.py` — applies the configured base path, includes the three approved draft pages and local styles/assets, and adds `.nojekyll`.
- `public/` — existing Digital Grandpa website, sitemap, robots file, and shared design assets.
- `public/drafts/` — preview hub and two book preview pages; not linked from the production navigation or sitemap.
- `DIGITAL_GRANDPA_TRANSFORMATION_SCOPE.md` — owner-approved narrow free-book request scope and release gates.
- `TODO.md` — current cutover, TLS, and product-release status.

Preserve the Digital Grandpa porch-light style: calm paper backgrounds, deep ink-blue structure, restrained amber warmth, serif headlines with readable sans-serif body text, generous reading space, visible focus states, and accessible responsive navigation. Keep the property distinct from Beacon while maintaining the existing family-bar and separation copy.
