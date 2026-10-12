/**
 * Migration check: renders every crawled URL from content/seed.json and
 * compares it with the WordPress HTML (canonical form, see lib/normalize).
 *
 *   npm run verify -- <crawl-dir> [file-filter]
 */
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderDocument } from "../lib/site/render.ts";
import { buildSiteData, resolvePath, type SeedDoc } from "../lib/site/local.ts";
import { resolveLazy } from "./lib/convert.ts";
import { canonical, firstDiff, relHost } from "./lib/normalize.ts";

const SRC = process.argv[2];
const SERVER = process.argv.find((a) => a.startsWith("--server="))?.slice(9);
const FILTER = process.argv.slice(3).find((a) => !a.startsWith("--"));
/** --fixed: content has been through scripts/fixes.ts (SEO intentionally differs); compare the body only. */
const FIXED = process.argv.includes("--fixed");
if (!SRC) throw new Error("Usage: npm run verify -- <crawl-dir> [filter]");
const ROOT = new URL("..", import.meta.url).pathname;
const docs: SeedDoc[] = JSON.parse(readFileSync(join(ROOT, "content/seed.json"), "utf8"));
const data = buildSiteData(docs);

function prep(html: string) {
  const $ = cheerio.load(html);
  resolveLazy($);
  $('input[name="queried_id"], input[name="referer_title"]').attr("value", "");
  return $;
}

/**
 * Head check: same stylesheets in the same order (inline <style> blocks are
 * now files, compared by content), same scripts, same SEO tags. Favicons,
 * WordPress API links and generator tags are replaced on purpose.
 */
const sha = (s: string) => createHash("sha1").update(s.replace(/(https?:)?\/\/(www\.)?idealdentalsolutions\.com\//gi, "/").trim()).digest("hex").slice(0, 10);
function headSignature($: cheerio.CheerioAPI) {
  const out: string[] = [];
  $("head").find("link[rel=stylesheet], style, script[src]").each((_, el) => {
    const $el = $(el);
    if (el.tagName === "style") out.push(`css:inline:${sha($el.html() || "")}`);
    else if (el.tagName === "script") out.push(`js:${relHost($el.attr("src") || "")}`);
    else {
      const href = relHost($el.attr("href") || "");
      const local = /^\/assets\/css\/i-[a-f0-9]+\.css$/.test(href) ? join(ROOT, "public", href) : null;
      out.push(local && existsSync(local) ? `css:inline:${sha(readFileSync(local, "utf8"))}` : `css:${href}`);
    }
  });
  $("body script[src]").each((_, el) => {
    out.push(`js:${relHost($(el).attr("src") || "")}`);
  });
  const seo = ['meta[name="robots"]', 'meta[name="description"]', 'link[rel="canonical"]', 'meta[property^="og:"]', 'meta[property^="article:"]', 'meta[name^="twitter:"]', "title"];
  for (const sel of seo) $(sel).each((_, el) => {
    out.push(`seo:${sel}:${relHost($(el).attr("content") || $(el).attr("href") || $(el).text()).trim()}`);
  });
  const schema = $("script.yoast-schema-graph").html();
  if (schema) out.push(`schema:${sha(JSON.stringify(JSON.parse(schema)))}`);
  return out.join("\n");
}

const htmlDir = join(SRC, "html");
let ok = 0;
const failures: string[] = [];
for (const file of readdirSync(htmlDir).filter((f) => f.endsWith(".html")).sort()) {
  if (FILTER && !file.includes(FILTER)) continue;
  const base = file.replace(/\.html$/, "");
  const path = base === "home" ? "/" : base === "_404" ? "/this-page-does-not-exist-xyz/" : `/${base.replace(/__/g, "/")}/`;
  let html: string;
  if (SERVER) {
    // Full check of a running site (reads the CMS like production does).
    html = await (await fetch(SERVER + path)).text();
  } else {
    const resolved = resolvePath(docs, path);
    if (!resolved) {
      failures.push(`${path}: not resolved`);
      continue;
    }
    html = renderDocument(resolved, data, path, { projectId: "ncba5cqx", dataset: "production" });
  }
  const a = prep(readFileSync(join(htmlDir, file), "utf8"));
  const b = prep(html);
  const ca = canonical(a("body").html() || "");
  const cb = canonical(b("body").html() || "");
  const bodyClassOk = a("body").attr("class") === b("body").attr("class");
  const d = firstDiff(ca, cb, 3) || (FIXED ? null : firstDiff(headSignature(a), headSignature(b), 2));
  if (!d && bodyClassOk) {
    ok++;
    continue;
  }
  failures.push(`${path}: ${!bodyClassOk ? "body class differs; " : ""}${d ? `line ${d.line}\n  expected:\n    ${d.expected.join("\n    ")}\n  actual:\n    ${d.actual.join("\n    ")}` : ""}`);
  if (FILTER) {
    writeFileSync(`${process.env.VERIFY_OUT || "/tmp"}/verify-expected.txt`, ca);
    writeFileSync(`${process.env.VERIFY_OUT || "/tmp"}/verify-actual.txt`, cb);
  }
}
console.log(failures.join("\n\n"));
console.log(`\n${ok} identical, ${failures.length} different`);
