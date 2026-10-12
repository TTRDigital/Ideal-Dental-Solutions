/**
 * One-off migration: turns the crawled WordPress site (Blocksy theme +
 * Elementor) into CMS documents.
 *
 *   npm run extract -- <crawl-dir>
 *
 * <crawl-dir> holds html/*.html (one file per URL, "home.html" for "/",
 * "a__b.html" for "/a/b/", "_404.html" for the error page) and wp/*.json
 * (WordPress REST API dumps). See scripts/crawl.mjs.
 *
 * Writes content/seed.json (all documents), content/form-fields.json and
 * lib/generated/shells.json (the page skeletons: head, scripts, wrappers).
 */
import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { relativeUrl } from "../lib/render/html.ts";
import type { Seo } from "../lib/render/seo.ts";
import type { Fields } from "../lib/render/template.ts";
import { blocksyMenu, convertChildren, convertElement, htmlToPortableText, imageFields, outer, relativizeTpl, resolveLazy, stats, type ConvertCtx } from "./lib/convert.ts";

const SRC = process.argv[2];
if (!SRC) throw new Error("Usage: npm run extract -- <crawl-dir>");
const ROOT = new URL("..", import.meta.url).pathname;
const CSS_OUT = join(ROOT, "public/assets/css");
mkdirSync(CSS_OUT, { recursive: true });

type WpItem = { id: number; link: string; parent?: number; title: { rendered: string }; slug: string; date: string; modified: string; template?: string; author?: number; excerpt?: { rendered: string } };
const wpPages: WpItem[] = JSON.parse(readFileSync(join(SRC, "wp/pages.json"), "utf8"));
const wpCats: { id: number; name: string; slug: string; link: string }[] = JSON.parse(readFileSync(join(SRC, "wp/categories.json"), "utf8"));
const wpUsers: { id: number; name: string; slug: string; link: string }[] = JSON.parse(readFileSync(join(SRC, "wp/users.json"), "utf8"));

const pathOf = (link: string) => relativeUrl(link);
const pagesByPath = new Map<string, number>();
for (const p of wpPages) pagesByPath.set(pathOf(p.link), p.id);
const wpById = new Map<number, WpItem>(wpPages.map((p) => [p.id, p]));

const docs = new Map<string, Record<string, unknown>>();
const shells = new Map<string, string>();
const templateIds = new Set<number>();

function hash(s: string, n = 10) {
  return createHash("sha1").update(s).digest("hex").slice(0, n);
}

function decode(html: string) {
  return cheerio.load(`<b>${html}</b>`, null, false)("b").text();
}

/* ---------------- head / shell ---------------- */

function extractSeo($: CheerioAPI): Seo {
  const meta = (sel: string) => $(sel).attr("content") || undefined;
  const misc: Seo["twitterMisc"] = [];
  for (let i = 1; i < 5; i++) {
    const label = meta(`meta[name="twitter:label${i}"]`);
    const data = meta(`meta[name="twitter:data${i}"]`);
    if (label || data) misc.push({ _key: `t${i}`, label, data });
  }
  return {
    title: $("head > title").text() || undefined,
    description: meta('meta[name="description"]'),
    robots: meta('meta[name="robots"]'),
    canonical: $('link[rel="canonical"]').attr("href") || undefined,
    ogLocale: meta('meta[property="og:locale"]'),
    ogType: meta('meta[property="og:type"]'),
    ogTitle: meta('meta[property="og:title"]'),
    ogDescription: meta('meta[property="og:description"]'),
    ogUrl: meta('meta[property="og:url"]'),
    ogSiteName: meta('meta[property="og:site_name"]'),
    articlePublisher: meta('meta[property="article:publisher"]'),
    articleAuthor: meta('meta[property="article:author"]'),
    publishedTime: meta('meta[property="article:published_time"]'),
    modifiedTime: meta('meta[property="article:modified_time"]'),
    ogImage: meta('meta[property="og:image"]'),
    ogImageWidth: meta('meta[property="og:image:width"]'),
    ogImageHeight: meta('meta[property="og:image:height"]'),
    ogImageType: meta('meta[property="og:image:type"]'),
    author: meta('meta[name="author"]'),
    twitterCard: meta('meta[name="twitter:card"]'),
    twitterTitle: meta('meta[name="twitter:title"]'),
    twitterMisc: misc.length ? misc : undefined,
    schema: $("script.yoast-schema-graph").html() || undefined,
  };
}

const HOST_CSS = /(https?:)?\/\/(www\.)?idealdentalsolutions\.com\//gi;

function writeInlineCss(css: string) {
  const body = css.replace(HOST_CSS, "/");
  const name = `i-${hash(body)}.css`;
  const file = join(CSS_OUT, name);
  if (!existsSync(file)) writeFileSync(file, body);
  return `/assets/css/${name}`;
}

const ICON_LINKS = [
  '<link rel="icon" href="/favicon.ico" sizes="48x48">',
  '<link rel="icon" href="/icon-32.png" type="image/png" sizes="32x32">',
  '<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">',
  '<link rel="manifest" href="/site.webmanifest">',
  '<meta name="theme-color" content="#F7861E">',
  '<meta name="msapplication-TileImage" content="/icon-192.png">',
].join("\n");

/** Per-request WordPress nonces: meaningless outside WordPress, and they would make every skeleton unique. */
function stripNonces(js: string) {
  return js
    .replace(/("[A-Za-z_]*[Nn]once"\s*:\s*")[a-f0-9]{10}"/g, '$1"')
    .replace(/"nonces"\s*:\s*\{[^}]*\}/g, (m) => m.replace(/:"[a-f0-9]{10}"/g, ':""'));
}

/** Builds the page skeleton. Mutates $ (call last). */
function buildShell($: CheerioAPI): string {
  const head = $("head");
  // SEO tags are rendered from the CMS.
  const seoSel = [
    'meta[name="robots"]', 'meta[name="description"]', 'link[rel="canonical"]', 'meta[property^="og:"]', 'meta[property^="article:"]',
    'meta[name^="twitter:"]', 'meta[name="author"]', "script.yoast-schema-graph",
  ].join(",");
  head.find(seoSel).remove();
  head.find("title").replaceWith("[[@ctx:seo]]");
  // Business details live in the Yoast graph (Site settings > Business schema).
  head.find('script[type="application/ld+json"]:not(.yoast-schema-graph)').remove();
  // Favicons: one proper set at the site root.
  const icons = head.find('link[rel="icon"], link[rel="apple-touch-icon"], meta[name="msapplication-TileImage"]');
  icons.first().before(ICON_LINKS);
  icons.remove();
  // Dead WordPress endpoints.
  head.find('link[rel="https://api.w.org/"], link[rel="EditURI"], link[rel="shortlink"], link[type="application/json+oembed"], link[type="text/xml+oembed"], link[rel="alternate"][type="application/json"], meta[name="generator"]').remove();
  head.find('link[rel="alternate"][type="application/rss+xml"]').filter((_, el) => /comments/i.test($(el).attr("href") || "")).remove();
  // Inline <style> blocks in the head become cacheable files, same order.
  head.find("style").each((_, el) => {
    const css = $(el).html() || "";
    const id = $(el).attr("id");
    $(el).replaceWith(`<link rel="stylesheet"${id ? ` id="${id}"` : ""} href="${writeInlineCss(css)}" media="all">`);
  });
  $("link[href]").each((_, el) => {
    $(el).attr("href", relativeUrl($(el).attr("href") || ""));
  });
  $("script[src]").each((_, el) => {
    $(el).attr("src", relativeUrl($(el).attr("src") || ""));
  });
  $("script:not([src])").each((_, el) => {
    let js = $(el).html() || "";
    js = js.replace(/,"post":\{"id":\d+,"title":"(?:[^"\\]|\\.)*","excerpt":"(?:[^"\\]|\\.)*","featuredImage":(?:false|"(?:[^"\\]|\\.)*")\}/, ',"post":[[@ctx:elementorPost]]');
    js = stripNonces(js);
    js = js.replace(/https?:\\\/\\\/(www\.)?idealdentalsolutions\.com\\\//gi, "\\/").replace(/https?:\/\/(www\.)?idealdentalsolutions\.com\//gi, "/");
    $(el).html(js);
  });
  // Body regions
  $("body").attr("class", "[[@ctxattr:bodyClass]]");
  $('body > .ct-drawer-canvas[data-location="start"]').replaceWith("[[@ctx:drawer]]");
  $("header#header").replaceWith("[[@ctx:header]]");
  $("footer.elementor-location-footer").replaceWith("[[@ctx:footer]]");
  $("main#main").replaceWith("[[@ctx:content]]");
  let html = $.html();
  html = relativizeTpl(html);
  const k = hash(html);
  shells.set(k, html);
  return k;
}

/* ---------------- header (Blocksy) ---------------- */

function extractHeader($: CheerioAPI, ctx: ConvertCtx) {
  if (docs.has("siteHeader")) return;
  const header = $("header#header").clone() as Cheerio<Element>;
  const drawer = $('body > .ct-drawer-canvas[data-location="start"]').clone() as Cheerio<Element>;
  const doc: Fields = { _id: "siteHeader", _type: "siteHeader", title: "Header & menu" };
  // Logo (printed in the desktop and the mobile row).
  const logos = header.find(".site-logo-container img");
  doc.logo = imageFields($, logos.first() as Cheerio<Element>);
  logos.each((_, img) => {
    $(img).replaceWith("[[@img:logo]]");
  });
  header.find("a.site-logo-container").attr("href", "[[@attr:logoLink]]");
  doc.logoLink = "/";
  const mainUl = header.find("nav#header-menu-1 > ul").first() as Cheerio<Element>;
  const mobileUl = drawer.find("nav.mobile-menu > ul").first() as Cheerio<Element>;
  doc.items = blocksyMenu($, mainUl, mobileUl, ctx);
  doc.tpl = relativizeTpl(outer($, header));
  doc.drawerTpl = relativizeTpl(outer($, drawer));
  docs.set("siteHeader", doc);
}

/* ---------------- Elementor templates (footer, shared sections) ---------------- */

function extractTemplate($: CheerioAPI, root: Element, ctx: ConvertCtx) {
  const id = Number(root.attribs["data-elementor-id"]);
  if (templateIds.has(id)) return id;
  templateIds.add(id);
  const kind = root.attribs["data-elementor-type"];
  const clone = $(root).clone();
  const children = (clone[0] as Element).children as AnyNode[];
  const nodes: Fields[] = [];
  const firstEl = children.find((c) => c.type === "tag");
  for (const c of children) if (c.type === "tag") nodes.push(convertElement($, c as Element, ctx));
  if (firstEl) $(firstEl).before("[[@nodes:content]]");
  for (const c of children.slice()) if (c.type === "tag") $(c).remove();
  docs.set(`template-${id}`, {
    _id: `template-${id}`,
    _type: "elementorTemplate",
    title: kind === "footer" ? "Footer" : `${kind === "popup" ? "Popup" : "Template"} ${id}`,
    kind,
    wpId: id,
    tpl: relativizeTpl(outer($, clone)),
    content: nodes,
  });
  return id;
}

/* ---------------- main loop ---------------- */

const htmlDir = join(SRC, "html");
const files = readdirSync(htmlDir).filter((f) => f.endsWith(".html"));
const pathFromFile = (f: string) => {
  const base = f.replace(/\.html$/, "");
  if (base === "home") return "/";
  if (base === "_404") return null;
  return `/${base.replace(/__/g, "/")}/`;
};

for (const file of files.sort()) {
  const path = pathFromFile(file);
  const html = readFileSync(join(htmlDir, file), "utf8");
  const $ = cheerio.load(html);
  resolveLazy($);
  const bodyClass = $("body").attr("class") || "";
  const pageIdM = /\bpage-id-(\d+)\b/.exec(bodyClass);
  const wpId = pageIdM ? Number(pageIdM[1]) : undefined;
  const ctx: ConvertCtx = { pageId: wpId, pagesByPath };

  extractHeader($, ctx);
  for (const t of $('footer[data-elementor-type="footer"], body > [data-elementor-type="popup"]').toArray()) extractTemplate($, t as Element, ctx);
  const seo = extractSeo($);
  const wp = wpId ? wpById.get(wpId) : undefined;

  // Content frame: Blocksy's <main>, with the Elementor document inside.
  const frame = $("main#main").clone();
  const doc: Record<string, unknown> = { seo, bodyClass };
  const cls = new Set(bodyClass.split(/\s+/));
  const isArchive = cls.has("archive");
  const is404 = cls.has("error404");

  const root = frame.find('[data-elementor-type="wp-page"]').first();
  if (root.length) {
    const kids = (root[0].children as AnyNode[]).filter((k) => k.type !== "comment");
    const firstTag = kids.findIndex((k) => k.type === "tag");
    const run = firstTag >= 0 ? kids.slice(firstTag) : [];
    doc.content = convertChildren($, run, ctx);
    if (run.length) $(run[0]).before("[[@nodes:content]]");
    for (const k of run) $(k).remove();
  }
  // Pages written in the block editor: the text after the (empty) Elementor document.
  const ec = frame.find(".entry-content").first();
  if (cls.has("page") && ec.length && !(doc.content as unknown[] | undefined)?.length) {
    const kids = (ec.contents().toArray() as AnyNode[]).filter(
      (n) => n.type === "tag" && (n as Element).name !== "script" && !(n as Element).attribs["data-elementor-type"],
    );
    if (kids.length) {
      const pt = htmlToPortableText(relativizeTpl(kids.map((n) => outer($, n)).join("\n")));
      if (!pt) throw new Error(`Block editor content of ${file} cannot be represented as rich text`);
      doc.body = pt;
      $(kids[0]).before("[[@rich:body]]");
      for (const k of kids) $(k).remove();
    }
  }
  // The page heading of archives and the 404 page.
  const h1 = frame.find("h1.page-title").first();
  if (h1.length && !root.length) {
    doc.headingHtml = (h1.html() || "").trim();
    h1.html("[[@html:headingHtml]]");
  }

  // Forms in the page body
  frame.find('input[name="queried_id"]').attr("value", "[[@ctxattr:queriedId]]");
  frame.find('input[name="referer_title"]').attr("value", "[[@ctxattr:refererTitle]]");

  doc.frameTpl = relativizeTpl(outer($, frame));
  doc.shell = buildShell($);

  if (is404) {
    Object.assign(doc, { _id: "notFound", _type: "notFoundPage", title: "Page not found" });
    docs.set("notFound", doc);
    continue;
  }
  if (isArchive) {
    const kind = cls.has("author") ? "author" : "category";
    const slug = path!.split("/").filter(Boolean).pop()!;
    const name = kind === "author" ? wpUsers.find((u) => u.slug === slug)?.name : wpCats.find((c) => c.slug === slug)?.name;
    Object.assign(doc, { _id: `archive-${kind}-${slug}`, _type: "archivePage", title: `${kind === "author" ? "Author" : "Category"}: ${name || slug}`, kind, path });
    docs.set(String(doc._id), doc);
    continue;
  }
  if (!wpId) {
    console.warn("No WordPress id for", file);
    continue;
  }
  const parent = wp?.parent ? wpById.get(wp.parent) : undefined;
  Object.assign(doc, {
    _id: `page-${wpId}`,
    _type: "page",
    title: decode(wp?.title.rendered || seo.title || ""),
    path,
    wpId,
    parent: parent ? { _type: "reference", _ref: `page-${parent.id}`, _weak: true } : undefined,
    ancestorPaths: (() => {
      const out: string[] = [];
      for (let a = parent; a; a = a.parent ? wpById.get(a.parent) : undefined) out.push(pathOf(a.link));
      return out;
    })(),
    wpTemplate: wp?.template || "default",
    // Search result cards: publish date, author and WordPress' excerpt.
    published: wp?.date ? `${wp.date}Z` : undefined,
    excerpt: wp?.excerpt ? decode(wp.excerpt.rendered).replace(/\s*\[…\]\s*$/, "").replace(/\s+/g, " ").trim() : undefined,
    authorName: wpUsers.find((u) => u.id === wp?.author)?.name,
    authorSlug: wpUsers.find((u) => u.id === wp?.author)?.slug,
  });
  docs.set(`page-${wpId}`, doc);
}

/* ---------------- search results (Blocksy) ---------------- */

// <crawl-dir>/search: the live results page with Prev/Next (s-dental-p2), the
// no-results page (s-xyzzyqq) and a page for an unknown word (s-template, SEO).
const searchDir = join(SRC, "search");
if (existsSync(join(searchDir, "s-dental-p2.html"))) {
  const load = (f: string) => cheerio.load(readFileSync(join(searchDir, f), "utf8"));
  const $r = load("s-dental-p2.html");
  const results = $r("main#main").clone();
  results.find("h1.page-title").first().html("[[@ctx:searchHeading]]");
  results.find(".entries").first().html("[[@ctx:cards]]");
  const nav = results.find("nav.ct-pagination").first();
  const prevIcon = $r.html(nav.find("a.prev svg").first());
  const nextIcon = $r.html(nav.find("a.next svg").first());
  nav.replaceWith("[[@ctx:pagination]]");
  const resultsBody = ($r("body").attr("class") || "").split(/\s+/).filter((c) => !/^(paged|paged-\d+|search-paged-\d+)$/.test(c)).join(" ");
  const resultsTpl = relativizeTpl(outer($r, results));
  // Blocksy prints the pagination stylesheet only when there is more than one page.
  const paginationLink = (doc: CheerioAPI) => {
    const link = doc("link#ct-pagination-styles-css");
    const html = relativizeTpl(doc.html(link));
    link.replaceWith("[[@ctx:paginationCss]]");
    return html;
  };
  const paginationCss = paginationLink($r);
  const resultsShell = buildShell($r);
  // WordPress adds the block library stylesheet when the first result is a block-editor page.
  const $b = load("s-dental.html");
  paginationLink($b);
  const blocksShell = buildShell($b);

  const $e = load("s-xyzzyqq.html");
  const empty = $e("main#main").clone();
  empty.find("h1.page-title").first().html("[[@ctx:searchHeading]]");
  empty.find('input[name="s"]').attr("value", "[[@ctxattr:query]]");
  const emptyBody = $e("body").attr("class") || "";
  const emptyTpl = relativizeTpl(outer($e, empty));
  const emptyShell = buildShell($e);

  // SEO as Yoast printed it, with the search words as {q}.
  const $t = load("s-template.html");
  const seo = JSON.parse(JSON.stringify(extractSeo($t)).replace(/qqzzxxqq/g, "{q}")) as Seo;
  docs.set("searchPage", {
    _id: "searchPage",
    _type: "searchPage",
    title: "Search results",
    headingPrefix: "Search Results for ",
    perPage: 10,
    seo,
    frameTpl: resultsTpl,
    shell: resultsShell,
    blocksShell,
    bodyClass: resultsBody,
    emptyFrameTpl: emptyTpl,
    emptyShell,
    emptyBodyClass: emptyBody,
    prevIcon,
    nextIcon,
    paginationCss,
  });
}

/* ---------------- form field labels ---------------- */

// Elementor posts fields by ID (form_fields[field_32e2b58]); leads are sent with the labels.
const formFields: Record<string, Record<string, string>> = {};
for (const file of files) {
  const $ = cheerio.load(readFileSync(join(htmlDir, file), "utf8"));
  $("form.elementor-form").each((_, f) => {
    const key = `${$(f).find('input[name="post_id"]').val()}:${$(f).find('input[name="form_id"]').val()}`;
    const map = (formFields[key] ||= {});
    $(f).find("[name^='form_fields[']").each((_, el) => {
      const id = /^form_fields\[([^\]]+)\]/.exec($(el).attr("name") || "")?.[1];
      if (!id || map[id]) return;
      const group = $(el).closest(".elementor-field-group");
      const label = group.find("label.elementor-field-label").first().text().trim() || $(el).attr("placeholder") || id;
      map[id] = label.replace(/\s+/g, " ").replace(/\s*\*$/, "");
    });
  });
}
writeFileSync(join(ROOT, "content/form-fields.json"), JSON.stringify(formFields, null, 1));

/* ---------------- settings ---------------- */

docs.set("siteSettings", {
  _id: "siteSettings",
  _type: "siteSettings",
  title: "Ideal Dental Solutions",
  siteUrl: "https://idealdentalsolutions.com",
  header: { _type: "reference", _ref: "siteHeader" },
  footer: { _type: "reference", _ref: "template-30" },
  // Thank-you page of each form (WordPress kept this in Elementor's form settings).
  forms: Object.keys(formFields).map((formKey) => ({
    _type: "formSetting",
    _key: formKey.replace(/\W/g, ""),
    name: formKey === "314:4c3fd22" ? "Appointment Form" : `Form ${formKey}`,
    formKey,
    redirect: "/thank-you/",
  })),
});

mkdirSync(join(ROOT, "content"), { recursive: true });
mkdirSync(join(ROOT, "lib/generated"), { recursive: true });
// Referenced documents first, so the seed can be written in order.
const ORDER = ["siteHeader", "elementorTemplate", "page", "archivePage", "notFoundPage", "searchPage", "siteSettings"];
const sorted = [...docs.values()].sort((a, b) => ORDER.indexOf(String(a._type)) - ORDER.indexOf(String(b._type)));
writeFileSync(join(ROOT, "content/seed.json"), JSON.stringify(sorted, null, 1));
writeFileSync(join(ROOT, "lib/generated/shells.json"), JSON.stringify(Object.fromEntries(shells)));
console.log(`docs: ${docs.size}, shells: ${shells.size}, templates: ${templateIds.size}`);
console.log("widgets", stats.widgets, "rich", stats.rich, "rich fallback", stats.richFallback);
