# Digital Grandpa book pages — GitHub Pages deployment plan

## Goal and boundaries

Deploy the existing Digital Grandpa static site and the three requested book-preview pages to a separate GitHub Pages project URL. The custom domain `digitalgrandpa.org` remains on its existing Cloudflare-served host; do not set a GitHub Pages custom domain or change DNS. The repository is public, and the Pages site and included draft pages will be publicly reachable by URL. Keep the drafts plainly labeled, `noindex,nofollow,noarchive`, unlinked from the production navigation and sitemap, and do not imply that either new offer is released.

The Pages artifact contains the already-public site plus the existing preview hub and draft pages for *When the World Changes Fast* and *AI Without Fear*. The free-book email form remains a disabled mockup; no address can be submitted or stored. The AI page has no price, download, signup, checkout, or purchase action. The existing *The Work You Still Carry* checkout is included as part of the already-public site but is not altered by this Pages work.

## Implementation approach and project structure

Use the existing Vite static build in `/home/ubuntu/digitalgrandpa-org/public`; do not add runtime services, email providers, databases, or payment integrations. Deploy via a GitHub Actions custom workflow on pushes to `main` and manual dispatch. Use the default project Pages URL under `https://beaconmomentum-dev.github.io/digitalgrandpa-org/`; keep the `digitalgrandpa.org` custom domain and DNS untouched.

- `.github/workflows/deploy-pages.yml` — installs the locked dependencies, builds the static site, prepares the Pages artifact, and deploys it with least-required Pages and OIDC permissions.
- `scripts/prepare-github-pages.py` — prefixes local root URLs for the repository subpath, adds `.nojekyll`, and copies only the three preview HTML files plus their local CSS and script to the deployment artifact.
- `public/drafts/index.html` — the clearly labeled review hub for the three distinct titles.
- `public/drafts/when-the-world-changes-fast.html` — free-book page draft with disabled form mockup and separate optional-updates choice.
- `public/drafts/ai-without-fear.html` — informational draft without active offer or purchase controls.
- `public/drafts/draft-pages.css` and `public/drafts/draft-page.js` — preview styling and standalone behavior; each HTML file embeds the shared Digital Grandpa CSS fallback for direct-file review.
- `DIGITAL_GRANDPA_TRANSFORMATION_SCOPE.md` — retains the narrow free-book request-flow amendment and its prerequisites.

Do not modify the existing live site host, Cloudflare configuration, DNS, public navigation, production sitemap, book assets, payment handling, or any audience/email system. The Pages site is a separate public mirror, not the canonical Digital Grandpa domain.

## Design direction

Retain the site's editorial porch-light style: calm paper backgrounds; deep ink-blue structure; restrained amber for warmth and emphasis; serif headlines paired with readable sans-serif body copy; generous reading space; accessible headings, focus states, and navigation; and direct, compassionate language. The page should put the reader before the procedure and offer a useful next step without pressure.
