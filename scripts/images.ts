/**
 * WebP copies of the uploaded images (npm run images).
 *
 * For every PNG/JPEG under public/wp-content/uploads it writes, next to the
 * original:
 *   <file>.webp        same image as WebP, at most 1920px wide
 *   <file>-768w.webp   phone copy, 768px wide (only for images wider than 1000px)
 * and records the original size and the copies in lib/generated/images.json.
 * lib/site/optimize.ts reads that file to serve the copies (img src/srcset,
 * inline backgrounds, the per-page stylesheets). The originals stay in place,
 * so old links to them keep working. Copies that are not smaller than the
 * original are not used. Re-run after adding images; existing copies are kept.
 */
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const UPLOADS = join(PUBLIC, "wp-content/uploads");
const MAX = 1920;
const PHONE = 768;

/** [width, height, webp width or 0 (no copy), phone copy width or 0] */
type Entry = [number, number, number, number];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

async function toWebp(file: string, out: string, width: number | null, alpha: boolean) {
  if (!existsSync(out)) {
    let img = sharp(file, { failOn: "none" }).rotate();
    if (width) img = img.resize({ width, withoutEnlargement: true });
    await img.webp({ quality: alpha ? 82 : 74, alphaQuality: 90, effort: 5, smartSubsample: true }).toFile(out);
  }
  return statSync(out).size;
}

const manifest: Record<string, Entry> = {};
const files = walk(UPLOADS).filter((f) => /\.(png|jpe?g)$/i.test(f) && !/-768w\.webp$/.test(f));
let before = 0;
let after = 0;
for (const file of files) {
  const meta = await sharp(file, { failOn: "none" }).metadata();
  const w = meta.autoOrient?.width || meta.width || 0;
  const h = meta.autoOrient?.height || meta.height || 0;
  if (!w || !h) continue;
  const size = statSync(file).size;
  const alpha = Boolean(meta.hasAlpha);
  const full = await toWebp(file, `${file}.webp`, w > MAX ? MAX : null, alpha);
  const webpW = full < size ? Math.min(w, MAX) : 0;
  let phoneW = 0;
  if (w > 1000) {
    const phone = await toWebp(file, `${file}-${PHONE}w.webp`, PHONE, alpha);
    if (phone < (webpW ? full : size)) phoneW = PHONE;
  }
  manifest[`/${relative(PUBLIC, file).split("\\").join("/")}`] = [w, h, webpW, phoneW];
  before += size;
  after += webpW ? full : size;
}

writeFileSync(join(ROOT, "lib/generated/images.json"), `${JSON.stringify(manifest)}\n`);
console.log(`${Object.keys(manifest).length} images: ${(before / 1e6).toFixed(1)} MB as uploaded, ${(after / 1e6).toFixed(1)} MB as WebP (full size)`);
