/**
 * Crawl of idealdentalsolutions.com used for the migration (not needed to run the site).
 *
 *   node scripts/crawl.mjs <crawl-dir> [--html] [--assets] [--browser]
 *
 * Expects <crawl-dir>/wp/{pages,posts,categories,users}.json and page-sitemap.xml
 * (WordPress REST API / Yoast dumps). Writes html/*.html (raw server HTML of
 * every URL plus the 404 page) and mirror/ (every /wp-content and /wp-includes
 * file referenced by the HTML, the CSS, or requested by a real browser at
 * 1440px and 390px). Copy mirror/* into public/ afterwards.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const OUT = process.argv[2];
const ORIGIN = "https://idealdentalsolutions.com";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const want = (f) => process.argv.includes(f) || process.argv.length <= 3;
mkdirSync(join(OUT, "html"), { recursive: true });
mkdirSync(join(OUT, "mirror"), { recursive: true });

const pages = JSON.parse(readFileSync(join(OUT, "wp/pages.json"), "utf8"));
const posts = JSON.parse(readFileSync(join(OUT, "wp/posts.json"), "utf8"));
const cats = JSON.parse(readFileSync(join(OUT, "wp/categories.json"), "utf8"));
const users = JSON.parse(readFileSync(join(OUT, "wp/users.json"), "utf8"));
const sitemap = readFileSync(join(OUT, "wp/page-sitemap.xml"), "utf8");

const rel = (u) => u.replace(/^https?:\/\/(www\.)?idealdentalsolutions\.com/i, "") || "/";
const paths = new Set(["/"]);
for (const p of [...pages, ...posts]) paths.add(rel(p.link));
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) if (!/\.(jpe?g|png|webp|gif|svg)$/i.test(m[1])) paths.add(rel(m[1]));
for (const c of cats) paths.add(rel(c.link));
for (const u of users) paths.add(rel(u.link));
const fileOf = (p) => (p === "/" ? "home" : p.split("/").filter(Boolean).join("__"));
const urls = [...paths].sort();

import { execFileSync } from "node:child_process";
/** curl, not fetch: SiteGround challenges Node's TLS fingerprint (HTTP 202 sgcaptcha). */
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const out = execFileSync("curl", ["-sS", "-A", "curl/8.5", "-D", "-", "--max-time", "60", url], { maxBuffer: 1 << 30 });
      // Split headers/body (skip the proxy's "200 Connection Established" block).
      let rest = out;
      let status = 0, headers = "";
      for (;;) {
        const idx = rest.indexOf("\r\n\r\n");
        headers = rest.subarray(0, idx).toString("latin1");
        rest = rest.subarray(idx + 4);
        status = Number(/^HTTP\/[\d.]+ (\d+)/.exec(headers)?.[1] || 0);
        if (!/Connection Established/i.test(headers)) break;
      }
      const loc = /^location:\s*(.+)$/im.exec(headers)?.[1]?.trim() || null;
      if (status === 202 && i < tries - 1) { await new Promise((r) => setTimeout(r, 5000 * (i + 1))); continue; }
      return { status, headers: { get: (h) => (h === "location" ? loc : null) }, text: async () => rest.toString("utf8"), arrayBuffer: async () => rest };
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

if (want("--html")) {
  for (const p of urls) {
    const r = await get(ORIGIN + p);
    if (r.status !== 200) {
      console.log("skip", r.status, p, r.headers.get("location"));
      continue;
    }
    writeFileSync(join(OUT, "html", `${fileOf(p)}.html`), await r.text());
  }
  const nf = await get(ORIGIN + "/this-page-does-not-exist-xyz/");
  writeFileSync(join(OUT, "html", "_404.html"), await nf.text());
  console.log("html:", urls.length + 1);
}

/* ---------------- assets ---------------- */
const seen = new Set();
const queue = [];
function enqueue(u, base = ORIGIN + "/") {
  if (!u || /^(data|blob|javascript|mailto|tel):/i.test(u) || u.startsWith("#")) return;
  let abs;
  try {
    abs = new URL(u.replace(/&amp;/g, "&").replace(/\\\//g, "/"), base);
  } catch {
    return;
  }
  if (!/^(www\.)?idealdentalsolutions\.com$/i.test(abs.hostname)) return;
  if (!/^\/(wp-content|wp-includes)\//.test(abs.pathname) || /\/$/.test(abs.pathname) || !/\.[a-z0-9]+$/i.test(abs.pathname)) return;
  const key = decodeURIComponent(abs.pathname);
  if (seen.has(key)) return;
  seen.add(key);
  queue.push(abs.origin.replace("www.", "") + abs.pathname);
}

function scanText(text, base) {
  for (const m of text.matchAll(/(?:https?:)?(?:\\?\/){2}(?:www\.)?idealdentalsolutions\.com((?:\\?\/)(?:wp-content|wp-includes)[^"'\s)<>,]+)/gi)) enqueue(m[1].replace(/\\\//g, "/"), base);
  for (const m of text.matchAll(/(?:src|href|data-src|data-srcset|srcset|data-thumbnail|poster)=["']([^"']+)["']/gi))
    for (const part of m[1].split(/,\s*/)) enqueue(part.trim().split(/\s+/)[0], base);
}
function scanCss(css, base) {
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) enqueue(m[1], base);
  for (const m of css.matchAll(/@import\s+['"]([^'"]+)['"]/g)) enqueue(m[1], base);
}

async function download(url) {
  const path = decodeURIComponent(new URL(url).pathname);
  const file = join(OUT, "mirror", path);
  if (existsSync(file)) return statSync(file).isFile() ? readFileSync(file) : null;
  const r = await get(url);
  if (r.status !== 200) {
    console.log("asset", r.status, url);
    return null;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  await new Promise((r) => setTimeout(r, 30));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
  return buf;
}

async function drain() {
  while (queue.length) {
    const batch = queue.splice(0, 12);
    await Promise.all(
      batch.map(async (url) => {
        const buf = await download(url);
        if (!buf) return;
        if (/\.css$/i.test(new URL(url).pathname)) scanCss(buf.toString("utf8"), url);
      }),
    );
  }
}

if (want("--assets")) {
  for (const f of readdirSync(join(OUT, "html"))) scanText(readFileSync(join(OUT, "html", f), "utf8"), ORIGIN + "/");
  await drain();
  console.log("static assets:", seen.size);
}

if (want("--browser")) {
  const require = createRequire("/opt/node22/lib/node_modules/");
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const net = new Set();
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    page.on("request", (req) => net.add(req.url()));
    for (const p of [...urls, "/this-page-does-not-exist-xyz/"]) {
      try {
        await page.goto(ORIGIN + p, { waitUntil: "load", timeout: 60000 });
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 400) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
        });
        // Open menus / mobile panel so their assets load too.
        if (mobile) await page.click('[data-toggle-panel="#offcanvas"], .ct-header-trigger', { timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(800);
      } catch (e) {
        console.log("browser fail", p, String(e).slice(0, 120));
      }
    }
    await ctx.close();
  }
  await browser.close();
  writeFileSync(join(OUT, "network.json"), JSON.stringify([...net].sort(), null, 1));
  for (const u of net) enqueue(u);
  await drain();
  console.log("after browser:", seen.size, "external hosts:", [...new Set([...net].map((u) => new URL(u).host))].join(" "));
}
