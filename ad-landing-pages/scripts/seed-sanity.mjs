/**
 * Seeds content/*.json into the client's Sanity project as `landingPage` documents.
 *   node scripts/seed-sanity.mjs            DRY RUN (default): prints what would be created, writes nothing
 *   SANITY_WRITE_TOKEN=... node scripts/seed-sanity.mjs --write
 * Uses createIfNotExists, so an existing (edited) document is never overwritten.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const PROJECT = 'ncba5cqx', DATASET = process.env.SANITY_DATASET || 'production';
const write = process.argv.includes('--write');
const token = process.env.SANITY_WRITE_TOKEN;
if (write && !token) { console.error('--write needs SANITY_WRITE_TOKEN in the environment.'); process.exit(1); }

const docs = readdirSync(join(ROOT, 'content')).filter((f) => f.endsWith('.json')).map((f) => {
  const c = JSON.parse(readFileSync(join(ROOT, 'content', f), 'utf8'));
  return { ...c, _id: `landingPage.${c.slug}`, _type: 'landingPage', slug: { _type: 'slug', current: c.slug } };
});
const mutations = docs.map((d) => ({ createIfNotExists: d }));
console.log(`${write ? 'WRITE' : 'DRY RUN'} -> ${PROJECT}/${DATASET}: ${docs.map((d) => d._id).join(', ')}`);

const url = `https://api.sanity.io/v2024-01-01/data/mutate/${PROJECT}/${DATASET}?returnIds=true${write ? '' : '&dryRun=true'}`;
if (!write && !token) { console.log('No token set: validated locally only. Document keys:', Object.keys(docs[0]).join(', ')); process.exit(0); }
const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ mutations }) });
const j = await r.json().catch(() => ({}));
if (!r.ok) { console.error('Sanity refused:', r.status, j.error?.description || ''); process.exit(1); }
console.log(write ? 'Done (existing documents left untouched).' : 'Dry run accepted by Sanity. Nothing written.', JSON.stringify(j.results || []));
