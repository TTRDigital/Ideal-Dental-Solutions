# Ideal Dental Solutions website

An exact copy of the WordPress site idealdentalsolutions.com (Blocksy theme + Elementor Pro, Yoast SEO), rebuilt on Next.js 16 with all content in Sanity (embedded Studio at `/cms`). Built by TTR Digital Marketing, on the same architecture as the Alpha Hardscapes site.

- **Identical output:** every page prints the same HTML, CSS and scripts as the WordPress site, so it looks and behaves the same (header and mobile menu, carousels, FAQ accordions, before/after galleries, the appointment form, site search). URLs are unchanged and the old redirects are kept.
- **Editable:** all text, links, images, menus, FAQs and SEO fields are in Sanity. The layout of each block stays fixed (it is stored with the block), so edits never break the design.
- **Proven:** `npm run verify` re-renders all 57 crawled URLs (51 pages, 2 category and 3 author archives, the 404 page) and 20 live search result pages, and compares them with the WordPress HTML tag by tag, head included: **77/77 identical** before the review fixes. Screenshots of every page at 1440px and 390px (lazy images forced in) match the live site pixel for pixel. The review fixes below are then applied on top by `npm run fixes`.

## Review fixes (scripts/fixes.ts)

Applied to the migrated content (idempotent; re-run after every extract):

- **Hidden content:** removed elements that were hidden on desktop, tablet and mobile: a before/after carousel section on the home and thank-you pages, and a "Digital X-Rays" technology switcher on the home page. The six "View Transformation" lightbox buttons on the home page were inside that section: they are in WordPress' HTML but never displayed (the section computes to `display: none` at every width; only the mobile, tablet and desktop breakpoints are enabled), so nothing visible was lost. The 21 before/after photos are unchanged.
- **About Us on tablets:** the bios of Dr. Sepahi, Fozia Mohamed and Tiana Norris exist in a desktop and a mobile version. WordPress hid the mobile versions only on desktop, so at 768–1024px each of them (and both of Fozia's photos) appeared twice, the second time squeezed into a narrow column. The mobile versions are now hidden on tablets too: every team member appears exactly once at every width (desktop version on desktop and tablet, mobile version on phones).
- **Saturday hours:** the Appointment page said "Sat: 8:00 – 2:00" while the footer says "Every Other Saturday: 8am – 2pm". The Appointment page now reads "Sat: 8:00 – 2:00 (every other week)". *Please confirm with the practice which is right*; if Saturdays are every week, change the footer and the business schema instead.
- **Copy-paste errors:** the McLean TMJ page said "TMJ Care in Northern VA" (now "in McLean, VA"); "Mclean" is spelled "McLean" in all headings. Other mentions were checked and are correct (the office is in McLean, which is in Northern Virginia).
- **H1s:** one H1 per page. The About pages had 12 H1s (each team member's name); the extra ones are H2s now and look exactly the same. The Dr. Adili profile had no heading and now starts with "Dr. Mehdi S. Adili, DDS, Prosthodontist".
- **Titles:** every title tag follows the page's H1 and ends with "| Ideal Dental Solutions" instead of "- idealdental". Page titles that were slugs or lower case are fixed ("tmj-tmd-treatments", "locations", "Mclean", "Before/After Page").
- **Meta descriptions:** written for all 46 indexable pages (none had one).
- **Not indexed** (still online, removed from the sitemap): the published draft "About us draft" and the duplicate "Dental Fillings in McLean, VA" (`-2`), both with a canonical to the real page; `/locations/` and `/locations/mclean/`, which are blank on the live site; the thank-you page; the two empty category archives.
- **Alt text** on all 90 content photos: doctors and hygienists by name and credential, before/after cases, and a description of each stock photo. Logos say "Ideal Dental Solutions". Icons next to their own title and divider graphics keep `alt=""` on purpose. The call-to-action background images have a description instead of the file name.
- **Menus** already pointed at the final URLs (every header, footer and in-page link answers 200 directly; `npm run audit` checks this).
- **Copyright year:** the live footer has no copyright line, so there was nothing to fix. If one is added, `{year}` in any text field prints the current year.
- **Structured data:** Yoast's graph is kept (WebPage, BreadcrumbList, WebSite) and its Organization is replaced with a **Dentist** (LocalBusiness): name, phone, address, map coordinates, opening hours, areas served (Northern Virginia, McLean, Tysons Corner, Vienna, Falls Church, Arlington, Fairfax, Alexandria), logo, Facebook and Instagram, medical specialties and the 24 services. It is editable in **Site settings > Business schema**. The site search action was removed from the WebSite node. Every page's JSON-LD is validated by `npm run audit`.
  - Saturday hours are listed as 8:00–14:00 with the note "Every other Saturday" (schema.org has no alternate-week rule). The coordinates are approximate for 8280 Greensboro Drive; adjust them in Site settings if needed.
- **Favicons** at the site root (favicon.ico with 16/32/48 px, 32/192/512 px PNGs, apple-touch-icon, web manifest), rendered from the orange logo mark of the 831px header logo (`npm run favicons`). The site has no vector logo, and WordPress' site icon was an upscaled low-resolution image.
- **Social images:** a 1200x630 photo per page in `public/og/` (most pages had none).
- `<html lang="en-US">` and `<meta charset="UTF-8">` (first in the head) on every page, checked by the audit.
- **Root-relative URLs everywhere:** HTML widgets (e.g. the homepage technology section) and other HTML fields kept absolute `https://idealdentalsolutions.com/wp-content/...` image URLs; they are now root-relative like the rest of the site, so images load from this deployment before and after the domain moves. No absolute site URL is left in any content field (only canonical/Open Graph/schema URLs, which are absolute on purpose).

## Redirects

- `content/redirects.json` (loaded by `next.config.ts`, all 301): every redirect the live WordPress site answered when probed with ~3,400 old and alternative URLs (dental service slugs under 15 possible parents, existing slugs under other parents, common practice pages, feeds, `/sitemap.xml`, `/index.php`). 483 path rules, each pointing straight at the final page, all tested on a production build.
- 125 shortlinks (`/?p=ID`, `/?page_id=ID`, `/?author=ID`, `/?cat=ID`) are answered in `proxy.ts` (config redirects would carry the query string over).
- Any other unknown URL whose last part matches a page is 301'd at request time (`lib/site/guess.ts`), exactly as WordPress did: the rules plus the guessing agree with the live site on all 2,855 probed URLs that were not real pages (including the 404s, e.g. WordPress does not guess below an existing page like `/locations/mclean/<anything>/`).
- `/<page>/page/2/` (WordPress showed the page again) now 301s to the page; `/<page>/feed/` returns an empty feed like WordPress. Upper-case URLs 301 to the lower-case page (WordPress showed a duplicate). URLs without the trailing slash get Next.js' own permanent redirect (308).
- The redirect plugin's own list could not be exported without a WordPress login. If you have one, export it and add any rule missing from `content/redirects.json`.

## Forms

The appointment form (Elementor Pro, `/appointment/`) posts to `/wp-admin/admin-ajax.php`, which is now this site's route (`app/wp-admin/admin-ajax.php/route.ts`), not WordPress. The lead is sent with readable field names (Full Name, Email Address, Phone Number, Preferred Callback Time, Comments) to GoHighLevel and/or by email, and the visitor is sent to the form's thank-you page (**Site settings > Forms**: `314:4c3fd22` → `/thank-you/`). It was submitted end to end in a browser at 1440px and 390px against a local webhook: lead delivered with labels, phone in E.164, visitor on /thank-you/.

- reCAPTCHA in the form only works on idealdentalsolutions.com (the site key is tied to that domain). Set `RECAPTCHA_SECRET_KEY` to check it server side.
- WordPress kept the thank-you page in Elementor's form settings, which are not visible without a login; `/thank-you/` is the site's only thank-you page.

## Site search

The search box (404 page and archives) works as on WordPress: `/?s=words`, `/page/2/?s=words` and `/search/words/` show Blocksy's results page with the same results in the same order (title matches first, then newest), the same cards, pagination and no-results page, and Yoast's (noindex) tags. The search reads the pages from the CMS, so edits are searchable right away. **Search results** in /cms holds the heading, results per page and SEO template.

## How it works

| Part | Where |
|---|---|
| Every public URL | `app/[[...path]]/route.ts`: loads the document for the path and renders it with `lib/site/render.ts` |
| Shortlinks and search URLs | `proxy.ts` (301s, and rewrites to `app/search-results/[[...args]]/route.ts`) |
| Page skeletons (head, stylesheets, scripts) | `lib/generated/shells.json` |
| Block templates and renderer | `lib/render/template.ts` (slots like `[[@text:title]]` are filled from the CMS fields) |
| Header and mobile menu (Blocksy) | one **Header & menu** document: logo and menu items, rendered into the desktop header and the mobile panel, with WordPress' current-page classes |
| Footer and shared sections (Elementor) | **Footer & shared sections** documents |
| Search cards and pagination | `lib/render/blocksy.ts`, `lib/site/search.ts` |
| Forms | `app/wp-admin/admin-ajax.php/route.ts` and `lib/lead.ts` |
| Sitemaps, feed, robots | `/sitemap_index.xml`, `/page-sitemap.xml` (same Yoast URLs), `/feed/`, `/robots.txt` |
| Images, fonts, theme scripts | `public/wp-content/...` and `public/wp-includes/...` at the original URLs (including the scripts the theme and Elementor load on demand); inline head styles in `public/assets/css` |
| Built-in copy | `content/seed.json`: used when the CMS is empty or unreachable, and the source for `npm run seed` |

The WordPress site did not combine its stylesheets, so every theme and plugin stylesheet is served as its own original file.

## Setup

1. **Sanity project:** `ncba5cqx`, dataset `production`. The project ID is pinned in `sanity/env.ts` on purpose (a `NEXT_PUBLIC_SANITY_PROJECT_ID` meant for another site cannot redirect this one).
2. **Content:** put an Editor token in `.env.local` as `SANITY_WRITE_TOKEN`, then `npm run seed` (adds missing documents) or `npm run seed -- --force` (overwrites the CMS with the built-in copy). The seed writes through the global API host (`api.sanity.io/.../projects/ncba5cqx/...`). Until the CMS has content, the site serves the built-in copy (response header `X-Content-Source: built-in`).
3. **CORS:** in sanity.io/manage > API > CORS origins, allow with credentials: `http://localhost:3000`, `https://idealdentalsolutions.com`, `https://www.idealdentalsolutions.com` and the Vercel URL.
4. **Run locally:** `npm install`, `npm run dev`, open http://localhost:3000 and http://localhost:3000/cms.
5. **Vercel:** import the repo, add the variables from `.env.example` (not `SANITY_WRITE_TOKEN`), deploy, then point idealdentalsolutions.com at it.
6. **Publish webhook:** in Sanity, API > Webhooks: URL `https://idealdentalsolutions.com/api/revalidate`, triggers create/update/delete, secret = `SANITY_REVALIDATE_SECRET`. Changes then go live within seconds (otherwise within 5 minutes).
7. **Form leads:** set `GHL_WEBHOOK_URL` and/or `RESEND_API_KEY` + `LEAD_EMAIL_TO`. Without either, submissions are only logged.

## Editing in /cms

- **Pages:** open a page, then its sections. Each block shows its text, link and image fields. To add a block like an existing one, duplicate it (the copy keeps the design). The Dr. Adili profile is a plain text page (block editor styles).
- **Images:** use *Replace image* on any image field. The new image is shown at the same size and crop as the old one. Fill in the alt text.
- **Header & menu:** logo and the main menu (shown in the desktop header and the mobile menu). **Footer & shared sections:** address, phone, hours, social links.
- **Site settings:** forms (thank-you pages) and the business schema.
- **SEO** tab on every page: title, description, canonical, robots, social image, schema, and the excerpt shown in search results.
- **Search results** and **404 page:** headings and SEO.
- The *Developer* sections hold the layout templates and are read-only.

## Development

```bash
npm run dev        # local site
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # production build
npm run verify -- <crawl-dir> [--server=http://localhost:3000] [--fixed]  # compare with the WordPress HTML
npm run fixes      # apply the review fixes to content/seed.json (after extract)
npm run seed -- --force  # publish content/seed.json to Sanity
npm run audit -- https://<site>  # launch checks on a running site
npm run favicons   # re-render the favicon set from the logo
```

### Migration tools

- `scripts/crawl.mjs`: crawls the live site (raw HTML of every URL, every asset referenced by HTML/CSS or requested by a browser at 1440px and 390px). It uses curl, because the host (SiteGround) answers Node's TLS fingerprint with a 202 captcha page.
- `scripts/extract.ts`: converts the crawl into `content/seed.json`, `content/form-fields.json` and `lib/generated/shells.json`.
- `scripts/verify.ts`: proves the CMS renders what WordPress printed (`--fixed` after `npm run fixes`: alt text, image labels and demoted H1s are ignored, so only the deliberate content fixes remain).

Order: `extract` → `verify` (must be identical) → `fixes` → `verify --fixed` → `seed -- --force`. The crawl itself is not in the repo.

## Notes from the review

- The site has no blog posts (WordPress had none published), so there is no blog index; the category and author archives are kept at their URLs.
- `/locations/` and `/locations/mclean/` are blank pages on the live site; they are kept (they are parents in the URL structure) but not indexed. Add content or a location landing page before indexing them.
