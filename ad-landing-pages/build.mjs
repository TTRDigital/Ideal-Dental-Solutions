// Builds public/<slug>/index.html for every content/*.json (static fallback),
// overlaid with the matching `landingPage` document from the client's own
// Sanity project when it exists. Sanity is optional: any failure = fallback.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderPage } from './src/template.mjs';

const ROOT = new URL('.', import.meta.url).pathname;
const OUT = join(ROOT, 'public');
const PROJECT = 'ncba5cqx'; // Ideal Dental Solutions Sanity project (public id, same as ../sanity/env.ts)
const DATASET = process.env.SANITY_DATASET || 'production';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const merge = (base, over) => {
  if (!isObj(over)) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (k.startsWith('_') || v == null || v === '' || (Array.isArray(v) && !v.length)) continue;
    out[k] = isObj(v) && isObj(base[k]) ? merge(base[k], v) : v;
  }
  return out;
};

async function fromSanity(slug) {
  if (process.env.SANITY_SKIP) return null;
  try {
    const q = encodeURIComponent(`*[_type=="landingPage" && slug.current==$s][0]`);
    const url = `https://${PROJECT}.apicdn.sanity.io/v2025-02-19/data/query/${DATASET}?query=${q}&$s=${encodeURIComponent(JSON.stringify(slug))}&perspective=published`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const { result } = await r.json();
    return result || null;
  } catch { return null; }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
cpSync(join(ROOT, 'src/assets'), join(OUT, 'assets'), { recursive: true });
cpSync(join(ROOT, 'src/number.js'), join(OUT, 'number.js'));
cpSync(join(ROOT, 'src/page.js'), join(OUT, 'assets/page.js'));
cpSync(join(ROOT, 'src/page.css'), join(OUT, 'assets/page.css'));

for (const f of readdirSync(join(ROOT, 'content')).filter((n) => n.endsWith('.json'))) {
  const fallback = JSON.parse(readFileSync(join(ROOT, 'content', f), 'utf8'));
  const cms = await fromSanity(fallback.slug);
  const data = merge(fallback, cms);
  mkdirSync(join(OUT, data.slug), { recursive: true });
  writeFileSync(join(OUT, data.slug, 'index.html'), renderPage(data));
  console.log(`built /${data.slug}/  (content: ${cms ? 'Sanity + fallback' : 'static fallback'})`);
}
