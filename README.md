# Ideal Dental Solutions website

An exact copy of the WordPress site idealdentalsolutions.com (Blocksy theme + Elementor Pro), rebuilt on Next.js 16 with all content in Sanity (embedded Studio at `/cms`). Built by TTR Digital Marketing, on the same architecture as the Alpha Hardscapes site.

- **Identical output:** every page prints the same HTML, CSS and scripts as the WordPress site, so it looks and behaves the same (header menus, mobile menu, carousels, FAQ accordions, before/after sliders, the appointment form). URLs are unchanged.
- **Editable:** all text, links, images, menus, FAQs and SEO fields are in Sanity. The layout of each block stays fixed (it is stored with the block), so edits never break the design.
- **Proven:** `npm run verify` re-renders all 57 crawled URLs (51 pages, 2 category and 3 author archives, the 404 page) and compares them with the WordPress HTML, tag by tag, head included: 57/57 identical.

## How it works

| Part | Where |
|---|---|
| Every public URL | `app/[[...path]]/route.ts`: loads the document for the path and renders it with `lib/site/render.ts` |
| Page skeletons (head, stylesheets, scripts) | `lib/generated/shells.json` |
| Block templates and renderer | `lib/render/template.ts` (slots like `[[@text:title]]` are filled from the CMS fields) |
| Header and mobile menu (Blocksy) | one **Header & menu** document: logo and menu items, rendered into the desktop header and the mobile panel |
| Footer and shared sections (Elementor) | **Footer & shared sections** documents |
| Sitemaps, feed, robots | `/sitemap_index.xml`, `/page-sitemap.xml` (same Yoast URLs), `/feed/`, `/robots.txt` |
| Images, fonts, theme scripts | `public/wp-content/...` and `public/wp-includes/...` at the original URLs; inline head styles in `public/assets/css` |
| Built-in copy | `content/seed.json`: used when the CMS is empty or unreachable, and the source for `npm run seed` |

The WordPress site did not combine its stylesheets (no SiteGround optimizer bundle), so every theme and plugin stylesheet is served as its own original file.

## Setup

1. **Sanity project:** `ncba5cqx`, dataset `production`. The project ID is pinned in `sanity/env.ts` on purpose (a `NEXT_PUBLIC_SANITY_PROJECT_ID` meant for another site cannot redirect this one).
2. **Content:** put an Editor token in `.env.local` as `SANITY_WRITE_TOKEN`, then `npm run seed` (adds missing documents) or `npm run seed -- --force` (overwrites the CMS with the built-in copy).
3. **Run locally:** `npm install`, `npm run dev`, open http://localhost:3000 and http://localhost:3000/cms.

## Development

```bash
npm run dev        # local site
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # production build
npm run verify -- <crawl-dir> [--server=http://localhost:3000]  # compare with the WordPress HTML
npm run seed -- --force  # publish content/seed.json to Sanity
```

### Migration tools

- `scripts/crawl.mjs`: crawls the live site (raw HTML of every URL, every asset referenced by HTML/CSS or requested by a browser at 1440px and 390px). It uses curl, because the host (SiteGround) challenges Node's TLS fingerprint with a 202 captcha page.
- `scripts/extract.ts`: converts the crawl into `content/seed.json`, `content/form-fields.json` and `lib/generated/shells.json`.
- `scripts/verify.ts`: proves the CMS renders what WordPress printed.

The crawl itself is not in the repo.
