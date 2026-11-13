# TODO — Digital Grandpa book pages and GitHub Pages

**Status as of 2026-11-13:** User requested the existing static site and three book pages be committed to GitHub and configured for GitHub Pages deployment. The repository is public. The Pages site will use a separate `beaconmomentum-dev.github.io/digitalgrandpa-org/` URL; the current Cloudflare-served `digitalgrandpa.org` domain and DNS will not be changed. Pages and the included draft URLs will be publicly reachable, even though the drafts carry `noindex` metadata.

## Outcome 1 — Three-book preview hub: complete, labeled for public URL access

- `public/drafts/index.html` presents *When the World Changes Fast*, *AI Without Fear*, and the already-existing *The Work You Still Carry* as distinct titles.
- The Work link explicitly opens its existing public page and identifies that page's live checkout; that page and checkout were not changed.
- The hub and both new book pages carry `noindex,nofollow,noarchive`; they are not linked from public navigation or the public sitemap. This is crawl guidance, not access control; direct URLs are publicly accessible on Pages.

## Outcome 2 — Free-book page: preview deployed; reader release blocked

- `public/drafts/when-the-world-changes-fast.html` uses the previously approved title and compassionate page copy.
- The email-request layout is a disabled mockup, not a working form. It has no `<form>` submission, no endpoint, and no data collection. Book delivery is not active because the final download package is not present in the site repository.
- The draft keeps book delivery separate from the optional, unchecked updates choice. The flow may not be activated until the Section 4 release gates are met.

## Outcome 3 — AI Without Fear page: preview deployed; offer release blocked

- `public/drafts/ai-without-fear.html` uses inclusive, person-first language and does not frame Digital Grandpa as technology training for seniors.
- No price, package promise, download, signup, checkout, or purchase action appears. Final public offer terms and owner approval remain open.

## Outcome 4 — GitHub Pages deployment path: implemented

- `.github/workflows/deploy-pages.yml` builds from the locked Vite project on `main` pushes or manual dispatch and deploys through GitHub's custom Pages workflow.
- `scripts/prepare-github-pages.py` rewrites local root paths for the repository subpath and copies only the three requested draft pages plus their CSS and behavior script into the artifact.
- No GitHub Pages custom domain or DNS change is made. The current Cloudflare-served `digitalgrandpa.org` remains untouched.
- The repository is public; the Pages URL is public. Noindex metadata does not make a page private.

## Outcome 5 — Scope and property boundaries: amendment retained

- `DIGITAL_GRANDPA_TRANSFORMATION_SCOPE.md` records the narrow owner-approved allowance for confirmed delivery of *When the World Changes Fast*, with separate optional updates consent, no Beacon audience transfer, and no email-sending authorization.
- No customer data, consent record, payment, email, or CRM action was created.

## Outcome 6 — Local verification and GitHub delivery: pending

- Run the existing `pnpm lint` and `pnpm build`, validate the GitHub Pages path rewrite and preview inclusion, then commit and push the approved changes.
- Enable Pages in workflow mode and confirm the Actions deployment and resulting Pages URL.
- The final book asset, email provider and privacy/data-handling details, AI offer terms, and separate reader-release approval remain prerequisites before activating any reader signup, download, price, or checkout.
