/**
 * One stylesheet per page (npm run optimize, after npm run images).
 *
 * Every page, archive, the 404 page and the search results are rendered from
 * content/seed.json (the same content as the CMS). Pages that load the same
 * set of theme and Elementor stylesheets share one bundle: those files are
 * joined in order (media queries kept, url()s made absolute, background
 * images swapped for their WebP copies, with the 768px copy on phones), the
 * rules none of these pages can use are removed (PurgeCSS; every theme and
 * plugin script counts as content, so classes added by scripts are kept) and
 * the result is minified to public/assets/page-css/<hash>.css.
 *
 * lib/generated/page-css.json maps each stylesheet set to its bundle and lists
 * the classes and ids whose rules were removed: a page that uses one of them
 * (content added in the CMS later) gets its original stylesheets back
 * (lib/site/optimize.ts). Re-run after changing the content's layout.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { transform } from "lightningcss";
import postcss from "postcss";
import { PurgeCSS } from "purgecss";
import { buildSiteData, resolvePath, resolveSearch, type SeedDoc } from "../lib/site/local.ts";
import { bundleKey, headStylesheets, markupTokens, phoneCopy, webp } from "../lib/site/optimize.ts";
import { renderDocument, type Resolved } from "../lib/site/render.ts";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const OUT = join(PUBLIC, "assets/page-css");
const docs: SeedDoc[] = JSON.parse(readFileSync(join(ROOT, "content/seed.json"), "utf8"));
const data = buildSiteData(docs);
const opts = { projectId: "ncba5cqx", dataset: "production", origin: "https://idealdentalsolutions.com", recaptchaSiteKey: "" };

/* ---------------- every page as HTML ---------------- */

const resolved: Resolved[] = [];
for (const d of docs) if ((d._type === "page" || d._type === "archivePage") && d.path) resolved.push(resolvePath(docs, d.path as string)!);
resolved.push(resolvePath(docs, "/no-such-page-xyz/")!);
for (const q of ["", "dental", "implants", "zzzz-no-results"]) {
  const r = resolveSearch(docs, q, 1);
  if (r) resolved.push(r);
  const r2 = resolveSearch(docs, q, 2);
  if (r2) resolved.push(r2);
}
const pages = resolved.filter(Boolean).map((r) => renderDocument(r, data, r.kind === "page" || r.kind === "archive" ? r.doc.path || "/" : "/", opts));

/* ---------------- scripts count as content ---------------- */

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}
const scripts = [join(PUBLIC, "wp-content"), join(PUBLIC, "wp-includes")]
  .flatMap(walk)
  .filter((f) => f.endsWith(".js"))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

/* ---------------- stylesheets ---------------- */

function absoluteUrls(css: string, href: string) {
  const base = posix.dirname(href.split("?")[0]);
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q: string, url: string) => {
    if (/^(data:|https?:|\/\/|#)/.test(url)) return m;
    const abs = url.startsWith("/") ? url : posix.normalize(posix.join(base, url));
    return `url(${q}${abs}${q})`;
  });
}

function read(href: string) {
  const file = join(PUBLIC, decodeURIComponent(href.split("?")[0]));
  if (!existsSync(file)) throw new Error(`Missing stylesheet ${href}`);
  return absoluteUrls(readFileSync(file, "utf8"), href);
}

/** WebP backgrounds, with the phone copy below 768px for rules outside media queries. */
function webpBackgrounds(css: string) {
  const root = postcss.parse(css);
  root.walkDecls(/^background(-image)?$/, (decl) => {
    const urls = [...decl.value.matchAll(/url\((['"]?)(\/wp-content\/uploads\/[^'")]+)\1\)/g)].map((m) => m[2]);
    if (!urls.length) return;
    const phone = urls.length === 1 ? phoneCopy(urls[0]) : null;
    for (const u of urls) decl.value = decl.value.split(u).join(webp(u));
    const rule = decl.parent;
    if (!phone || rule?.type !== "rule" || rule.parent?.type !== "root") return;
    const override = postcss.atRule({ name: "media", params: "(max-width:767px)" });
    override.append(postcss.rule({ selector: (rule as postcss.Rule).selector }).append({ prop: "background-image", value: `url(${phone})`, important: decl.important }));
    rule.after(override);
  });
  return root.toString();
}

function selectorTokens(css: string) {
  const tokens = new Set<string>();
  postcss.parse(css).walkRules((rule) => {
    for (const m of rule.selector.matchAll(/[.#](-?[_a-zA-Z][\w-]*)/g)) tokens.add(m[1]);
  });
  return tokens;
}

type Group = { sheets: { href: string; media: string }[]; html: string[] };
const groups = new Map<string, Group>();
for (const html of pages) {
  const sheets = headStylesheets(html).map(({ href, media }) => ({ href, media }));
  const key = bundleKey(sheets);
  if (!groups.has(key)) groups.set(key, { sheets, html: [] });
  groups.get(key)!.html.push(html);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const dictionary: string[] = [];
const index = new Map<string, number>();
const bundles: Record<string, { file: string; dropped: string }> = {};
let before = 0;
let after = 0;

for (const [key, group] of groups) {
  const full = group.sheets.map(({ href, media }) => (media && media !== "all" ? `@media ${media}{${read(href)}}` : read(href))).join("\n");
  const content = group.html.join("\n");
  const [purged] = await new PurgeCSS().purge({
    content: [
      { raw: content, extension: "html" },
      { raw: scripts, extension: "js" },
    ],
    css: [{ raw: full }],
    // Kept whatever the content: states set by scripts and the browser.
    safelist: { standard: [/^(is-|has-|ct-|e-|swiper|elementor-(active|item-active|motion|invisible|sticky|animation))/], greedy: [/data-/] },
  });
  const css = webpBackgrounds(purged.css);
  const { code } = transform({ filename: `${key}.css`, code: Buffer.from(css), minify: true, errorRecovery: true });
  const hash = createHash("sha1").update(code).digest("hex").slice(0, 12);
  const file = `/assets/page-css/${hash}.css`;
  writeFileSync(join(OUT, `${hash}.css`), code);

  const kept = selectorTokens(css);
  const used = markupTokens(content);
  const dropped = [...selectorTokens(full)].filter((t) => !kept.has(t) && !used.has(t)).sort();
  bundles[key] = {
    file,
    dropped: dropped
      .map((t) => {
        if (!index.has(t)) index.set(t, dictionary.push(t) - 1);
        return index.get(t)!.toString(36);
      })
      .join(","),
  };
  before += Buffer.byteLength(full);
  after += code.length;
}

mkdirSync(dirname(join(ROOT, "lib/generated/page-css.json")), { recursive: true });
writeFileSync(join(ROOT, "lib/generated/page-css.json"), `${JSON.stringify({ dictionary, bundles })}\n`);
console.log(`${pages.length} pages, ${groups.size} stylesheet sets: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
