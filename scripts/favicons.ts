/**
 * Favicon set at the site root, rendered from the logo mark (the orange
 * circle-and-"i" of the 831px header logo; the site has no vector logo and
 * WordPress' 512px site icon is an upscaled low-resolution image).
 *
 *   node --experimental-strip-types scripts/favicons.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "public/wp-content/uploads/2026/07/image__4_-removebg-preview.png");
const ORANGE = "#F7861E";

// Keep only the orange mark (drops the dark drop-shadow arc), cropped to its box.
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < Math.min(info.width, 260); x++) {
    const i = (y * info.width + x) * 4;
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    const orange = a > 20 && r > 150 && r > g + 40 && g > b + 20;
    if (!orange) data[i + 3] = 0;
    else [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  }
  for (let x = 260; x < info.width; x++) data[(y * info.width + x) * 4 + 3] = 0;
}
const side = Math.max(x1 - x0, y1 - y0) + 1;
const mark = await sharp(data, { raw: info })
  .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
  .extend({ top: Math.floor((side - (y1 - y0 + 1)) / 2), bottom: Math.ceil((side - (y1 - y0 + 1)) / 2), left: Math.floor((side - (x1 - x0 + 1)) / 2), right: Math.ceil((side - (x1 - x0 + 1)) / 2), background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

/** Mark centered on a square, `pad` of the side left free around it. */
async function icon(size: number, pad: number, background?: string) {
  const inner = Math.round(size * (1 - 2 * pad));
  const m = await sharp(mark).resize(inner, inner, { kernel: "lanczos3" }).toBuffer();
  const base = sharp({ create: { width: size, height: size, channels: 4, background: background || { r: 0, g: 0, b: 0, alpha: 0 } } });
  return base.composite([{ input: m, gravity: "center" }]).png().toBuffer();
}

const out = (f: string, b: Buffer) => writeFileSync(join(ROOT, "public", f), b);
out("icon-32.png", await icon(32, 0.02));
out("icon-192.png", await icon(192, 0.08, "#ffffff"));
out("icon-512.png", await icon(512, 0.08, "#ffffff"));
out("apple-touch-icon.png", await icon(180, 0.1, "#ffffff"));

// favicon.ico with 16, 32 and 48 px PNG images.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => icon(s, 0.02)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
out("favicon.ico", Buffer.concat([header, ...pngs]));

out(
  "site.webmanifest",
  Buffer.from(
    JSON.stringify(
      {
        name: "Ideal Dental Solutions",
        short_name: "Ideal Dental",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        theme_color: ORANGE,
        background_color: "#ffffff",
        display: "browser",
      },
      null,
      2,
    ),
  ),
);
console.log("favicons written");
