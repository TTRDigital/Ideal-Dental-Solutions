# ad-landing-pages (Ideal Dental Solutions)

Separate static project (not the Next.js site). Replaces the GoHighLevel page at start.idealdentalsolutions.com.
Vercel: root directory `ad-landing-pages`, build `node build.mjs`, output `public`. `vercel.json` sends `noindex` and rewrites `/` on host `start.idealdentalsolutions.com` to `/start/`.

- `content/start.json` static fallback copy (same offer, wording and structure as the GHL page; GTM-58QWDSS9 read from it).
- `build.mjs` overlays the `landingPage` doc (slug `start`) from the client's Sanity project `ncba5cqx` when it exists; otherwise the fallback is used.
- `sanity/landingPage.schema.mjs` schema to add to the studio (main repo untouched).
- `scripts/seed-sanity.mjs` dry run by default; `--write` + `SANITY_WRITE_TOKEN` env uses createIfNotExists (never overwrites).
- `api/lead.js` posts each lead to TTR OS `/api/site/form` and the GHL webhook. Env: `GHL_WEBHOOK_URL` (secret). Optional `TTR_SITE_KEY`, `TTR_FORM_URL`.
- `src/number.js` (published as `/number.js`) swaps tel links for ?gclid visitors via TTR OS `/api/site/number`; falls back to the default number.
- Preview: `npm run preview` (static only; `/api/lead` needs `vercel dev`).
