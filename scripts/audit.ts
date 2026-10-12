/**
 * Launch checks on a running site (local or deployed):
 *
 *   npm run audit -- https://<deployment>
 *
 * For every page in the sitemap plus the archives and the 404 page: status,
 * <html lang>, <meta charset>, one H1, title, meta description (indexable
 * pages), canonical, 1200x630 social image that loads, valid JSON-LD with a
 * Dentist node and no site search action, images with alt text, and menus
 * without redirect hops. Also checks favicons, robots.txt and sitemaps.
 */
import * as cheerio from "cheerio";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const ROOT = new URL("..", import.meta.url).pathname;
const docs: { _type: string; path?: string }[] = JSON.parse(readFileSync(join(ROOT, "content/seed.json"), "utf8"));
const paths = [...docs.filter((d) => d.path).map((d) => d.path!), "/this-page-does-not-exist-xyz/"];
const problems: string[] = [];
const bad = (path: string, msg: string) => problems.push(`${path}: ${msg}`);

async function get(url: string, redirect: RequestRedirect = "follow") {
  return fetch(url, { redirect, headers: { "User-Agent": "launch-audit" } });
}

const checkedLinks = new Map<string, number>();
async function status(path: string) {
  if (!checkedLinks.has(path)) checkedLinks.set(path, (await get(BASE + path, "manual")).status);
  return checkedLinks.get(path)!;
}

/** Absolute site URLs point at the configured origin; check the same path on BASE. */
const local = (u: string) => u.replace(/^https?:\/\/[^/]+/, BASE);

for (const path of paths) {
  const res = await get(BASE + path, "manual");
  const want = path.startsWith("/this-page") ? 404 : 200;
  if (res.status !== want) {
    bad(path, `status ${res.status}`);
    continue;
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  if (!/^<!doctype html>/i.test(html.trim())) bad(path, "no doctype");
  if (!$("html").attr("lang")) bad(path, "no <html lang>");
  if ($("meta[charset]").attr("charset")?.toUpperCase() !== "UTF-8") bad(path, "no <meta charset=UTF-8>");
  if ($("head meta[charset]").index() > 0 && $("head").children().first().attr("charset") == null) bad(path, "<meta charset> is not first in <head>");
  const robots = $('meta[name="robots"]').attr("content") || "";
  const indexable = !/noindex/.test(robots) && want === 200;
  const h1 = $("h1");
  if (indexable && h1.length !== 1) bad(path, `${h1.length} H1s`);
  if (!$("title").text().trim()) bad(path, "no title");
  if (indexable && !$('meta[name="description"]').attr("content")) bad(path, "no meta description");
  if (indexable && !$('link[rel="canonical"]').attr("href")) bad(path, "no canonical");
  const og = $('meta[property="og:image"]').attr("content");
  if (indexable) {
    if (!og) bad(path, "no og:image");
    else {
      if ($('meta[property="og:image:width"]').attr("content") !== "1200" || $('meta[property="og:image:height"]').attr("content") !== "630") bad(path, "og:image is not 1200x630");
      const r = await get(local(og));
      if (!r.ok || !/image\//.test(r.headers.get("content-type") || "")) bad(path, `og:image ${og} answers ${r.status}`);
    }
  }
  // Structured data
  const ld = $('script[type="application/ld+json"]');
  if (indexable && !ld.length) bad(path, "no JSON-LD");
  ld.each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const nodes: Record<string, unknown>[] = json["@graph"] || [json];
      if ($(el).hasClass("yoast-schema-graph")) {
        const types = nodes.flatMap((n) => [n["@type"]].flat());
        if (!types.includes("Dentist")) bad(path, "Yoast graph without a Dentist node");
        if (types.includes("Organization") && !types.includes("Dentist")) bad(path, "plain Organization left");
        if (nodes.some((n) => n.potentialAction && [n["@type"]].flat().includes("WebSite"))) bad(path, "site search action still present");
        const ids = new Set(nodes.map((n) => n["@id"]));
        for (const n of nodes) for (const v of Object.values(n)) {
          const ref = (v as { "@id"?: string })?.["@id"];
          if (ref && Object.keys(v as object).length === 1 && !ids.has(ref)) bad(path, `JSON-LD reference to missing node ${ref}`);
        }
      }
    } catch (e) {
      bad(path, `invalid JSON-LD: ${String(e).slice(0, 80)}`);
    }
  });
  // Images: alt attribute present everywhere (empty only on decorative graphics).
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    const src = $(el).attr("src") || "";
    if (alt == null) bad(path, `img without alt: ${src}`);
    else if (!alt.trim() && !/icon-\d+\.svg|separated-(top|bottom)\.png|gravatar/.test(src)) bad(path, `empty alt on a content image: ${src}`);
  });
  // Header/footer menu links: no redirect hops.
  for (const el of $("#header a[href], #offcanvas a[href], footer a[href]").toArray()) {
    const href = $(el).attr("href")!;
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const s = await status(href.split("#")[0]);
    if (s !== 200) bad(path, `menu link ${href} answers ${s}`);
  }
}

for (const f of ["/favicon.ico", "/icon-32.png", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/site.webmanifest", "/robots.txt", "/sitemap_index.xml", "/page-sitemap.xml", "/feed/"]) {
  const r = await get(BASE + f);
  if (!r.ok) bad(f, `answers ${r.status}`);
}
const sitemap = await (await get(BASE + "/page-sitemap.xml")).text();
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const r = await get(local(m[1]), "manual");
  if (r.status !== 200) bad(m[1], `in sitemap but answers ${r.status}`);
  const $ = cheerio.load(await r.text());
  if (/noindex/.test($('meta[name="robots"]').attr("content") || "")) bad(m[1], "noindex page in sitemap");
}

console.log(problems.join("\n") || "No problems found.");
console.log(`\nChecked ${paths.length} pages, ${checkedLinks.size} menu links, sitemap ${[...sitemap.matchAll(/<loc>/g)].length} URLs.`);
process.exitCode = problems.length ? 1 : 0;
