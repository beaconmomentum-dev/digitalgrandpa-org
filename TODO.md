# TODO — Digital Grandpa book pages and GitHub Pages

**Status as of 2026-11-13:** The requested changes are committed on `main` as `234797b` and the GitHub Pages deployment succeeded. The Pages URL is `https://beaconmomentum-dev.github.io/digitalgrandpa-org/`. The existing Cloudflare-served `digitalgrandpa.org` domain and its DNS were not changed. The repository and Pages site are public; the draft pages are directly reachable by URL even though they carry `noindex` metadata.

## Outcome 1 — Three-book preview hub: complete

- `public/drafts/index.html` presents *When the World Changes Fast*, *AI Without Fear*, and the already-existing *The Work You Still Carry* as distinct titles.
- The Work link explicitly opens its existing public page and identifies that page's live checkout; that page and checkout were not changed.
- The hub and both new book pages carry `noindex,nofollow,noarchive`; they are not linked from public navigation or the public sitemap. This is crawl guidance, not access control.

## Outcome 2 — Free-book page: preview deployed; reader release blocked

- `public/drafts/when-the-world-changes-fast.html` uses the approved title and compassionate page copy.
- The email-request layout is a disabled mockup, not a working form. It has no submission, endpoint, or data collection. Book delivery is not active because the final download package is not present in the site repository.
- Delivery remains separate from the optional, unchecked updates choice. Activation still requires every Section 4 release gate.

## Outcome 3 — AI Without Fear page: preview deployed; offer release blocked

- `public/drafts/ai-without-fear.html` uses inclusive, person-first language and does not frame Digital Grandpa as technology training for seniors.
- It has no price, package promise, download, signup, checkout, or purchase action. Final public offer terms and owner approval remain open.

## Outcome 4 — GitHub Pages deployment: complete

- `.github/workflows/deploy-pages.yml` builds the locked Vite project on `main` pushes or manual dispatch and deploys through GitHub's custom Pages workflow.
- `scripts/prepare-github-pages.py` rewrites local root paths for the repository subpath and copies only the three requested draft pages plus their CSS and behavior script into the artifact.
- Pages is in workflow mode with HTTPS enforced and no custom domain. The existing Cloudflare-served `digitalgrandpa.org` remains untouched.
- GitHub Actions run `43530877866` completed successfully. HTTP checks returned 200 for the Pages home, all three preview routes, the shared stylesheet, the draft stylesheet, and the draft script.

## Outcome 5 — Scope and property boundaries: amendment retained

- `DIGITAL_GRANDPA_TRANSFORMATION_SCOPE.md` records the narrow owner-approved allowance for confirmed delivery of *When the World Changes Fast*, with separate optional updates consent, no Beacon audience transfer, and no email-sending authorization.
- No customer data, consent record, payment, email, or CRM action was created.

## Remaining release gates for the new books

The free-book download, email request, and optional updates must remain disabled until the final accessible book package, Digital Grandpa privacy notice, dedicated sender/list provider, minimal-data and retention/deletion rules, support owner, confirmation/delivery/unsubscribe behavior, and fictional-address end-to-end tests are approved and working. *AI Without Fear* still needs reconciled offer terms and separate owner release approval before price, download, signup, or checkout is added.
