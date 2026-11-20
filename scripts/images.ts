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
 *
 * Images uploaded as WebP are served as they are, with:
 *   <file>-768w.webp   phone copy (only for images wider than 1000px)
 * and a WebP upload over 300 KB is re-encoded in place at the same pixel size
 * (quality 82) when that makes it at least 25% smaller (TTR-2515: six uploads
 * of 380 KB to 1.1 MB were nearly lossless). Running it again changes nothing.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";
import { INLINE_IMAGE, inlineHash } from "../lib/site/inline-images.ts";

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

/** Images uploaded as WebP (not the copies above): big ones re-encoded in place, phone copies of wide ones. */
const BIG = 300 * 1024;
const uploadedWebp = walk(UPLOADS).filter((f) => /\.webp$/i.test(f) && !/\.(png|jpe?g)\.webp$/i.test(f) && !/-768w\.webp$/i.test(f));
for (const file of uploadedWebp) {
  const meta = await sharp(file, { failOn: "none" }).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (!w || !h) continue;
  const alpha = Boolean(meta.hasAlpha);
  const size = statSync(file).size;
  if (size > BIG) {
    const smaller = await sharp(readFileSync(file), { failOn: "none" })
      .webp({ quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true })
      .toBuffer();
    if (smaller.length < size * 0.75) {
      writeFileSync(file, smaller);
      console.log(`re-encoded ${relative(PUBLIC, file)}: ${(size / 1024).toFixed(0)} KB -> ${(smaller.length / 1024).toFixed(0)} KB`);
    }
  }
  let phoneW = 0;
  if (w > 1000) {
    const phone = await toWebp(file, `${file}-${PHONE}w.webp`, PHONE, alpha);
    if (phone < statSync(file).size) phoneW = PHONE;
  }
  if (phoneW) manifest[`/${relative(PUBLIC, file).split("\\").join("/")}`] = [w, h, 0, phoneW];
}

writeFileSync(join(ROOT, "lib/generated/images.json"), `${JSON.stringify(manifest)}\n`);

/**
 * Images pasted into the content as base64 (PNG photos inside inline SVG icons, about 94 KB of HTML
 * on each service page): written once to public/assets/inline/<hash>.<ext>, byte for byte, and listed
 * in lib/generated/inline-images.json; lib/site/optimize.ts points the page at the file instead.
 */
{
  const seedText = readFileSync(join(ROOT, "content/seed.json"), "utf8").replace(/\\\//g, "/");
  const dir = join(PUBLIC, "assets/inline");
  mkdirSync(dir, { recursive: true });
  const inline: Record<string, string> = {};
  for (const m of seedText.matchAll(INLINE_IMAGE)) {
    const hash = inlineHash(m[2]);
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const file = `/assets/inline/${hash}.${ext}`;
    if (!existsSync(join(PUBLIC, file))) writeFileSync(join(PUBLIC, file), Buffer.from(m[2], "base64"));
    inline[hash] = file;
  }
  writeFileSync(join(ROOT, "lib/generated/inline-images.json"), `${JSON.stringify(inline)}\n`);
  console.log(`${Object.keys(inline).length} inline base64 images written to public/assets/inline`);
}
console.log(`${Object.keys(manifest).length} images: ${(before / 1e6).toFixed(1)} MB as uploaded, ${(after / 1e6).toFixed(1)} MB as WebP (full size)`);
