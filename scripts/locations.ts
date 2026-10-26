/**
 * Location pages: /locations/ (areas served) and /locations/<town>/ for the
 * towns patients come from. Only the McLean office exists; every page says so.
 * The text is in scripts/locations-content.ts; this script builds the pages
 * into content/seed.json from the blocks of the McLean gum graft page (same
 * layout and stylesheet, the block layouts stay fixed as everywhere else) and
 * writes their social images. Idempotent.
 *
 *   npm run locations
 *
 * Until `npm run seed` publishes them, the site serves these pages from the
 * built-in copy (lib/site/data.ts). After that they are edited in /cms.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import sharp from "sharp";
import { HUB, MCLEAN, MCLEAN_PAGE, TOWNS, type Faq, type Page, type Town } from "./locations-content.ts";

type Node = Record<string, unknown> & { _key?: string; elId?: string; children?: Node[]; items?: Node[]; content?: Node[] };
type Doc = Record<string, unknown> & { _id: string; _type: string; path?: string };

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = "https://idealdentalsolutions.com";
const file = join(ROOT, "content/seed.json");
const docs: Doc[] = JSON.parse(readFileSync(file, "utf8"));
const source = docs.find((d) => d.path === "/locations/mclean/gum-graft-surgery/");
if (!source) throw new Error("No /locations/mclean/gum-graft-surgery/ in content/seed.json");
const SOURCE_ID = source.wpId as number;

/** The hero photo: Kaveh Sanatjou, RDH, at the reception sign of the McLean office. */
const HERO_PHOTO = "/wp-content/uploads/2026/07/IMG_6255-2048x1602.jpeg";

/* ---------------- blocks ---------------- */

function find(nodes: Node[], elId: string): Node | undefined {
  for (const n of nodes) {
    if (n.elId === elId) return n;
    const inner = find(n.children || [], elId);
    if (inner) return inner;
  }
}

function block(elId: string): Node {
  const n = find(source!.content as Node[], elId);
  if (!n) throw new Error(`Block ${elId} not found on the source page`);
  return n;
}

/** Stable keys: the same page text gives the same keys, so re-runs leave seed.json unchanged. */
let keySeed = "";
let keyCount = 0;
const newKey = () => createHash("sha1").update(`${keySeed}:${keyCount++}`).digest("hex").slice(0, 12);

function copy<T>(n: T): T {
  const out = JSON.parse(JSON.stringify(n)) as T;
  const rekey = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(rekey);
    else if (v && typeof v === "object") {
      const o = v as Node;
      if (typeof o._key === "string") o._key = newKey();
      Object.values(o).forEach(rekey);
    }
  };
  rekey(out);
  return out;
}

const container = (elId: string, children: Node[], style?: string) => {
  const c: Node = copy({ ...block(elId), children: [] as Node[] });
  c.children = children;
  if (style) c.tpl = String(c.tpl).replace(/^(<div class="[^"]*")/, `$1 style="${style}"`);
  return c;
};
const heading = (elId: string, title: string) => ({ ...copy({ ...block(elId) }), title });
const text = (elId: string, html: string) => ({ ...copy({ ...block(elId) }), body: [{ _type: "htmlBlock", _key: newKey(), html }] });

/** An accordion like `elId`, with the source item layouts (first one open) and new titles and answers. */
function accordion(elId: string, items: { title: string; html: string }[]) {
  const src = block(elId);
  const layouts = src.items as Node[];
  if (items.length > layouts.length) throw new Error(`Accordion ${elId} has ${layouts.length} item layouts, ${items.length} needed`);
  const acc: Node = copy({ ...src, items: [] as Node[] });
  acc.items = items.map((it, i) => {
    const item = copy(layouts[i]);
    const inner = (item.content as Node[])[0];
    item.title = it.title;
    if (inner._type === "elText") inner.body = [{ _type: "htmlBlock", _key: newKey(), html: it.html }];
    else inner.title = it.html.replace(/<[^>]+>/g, "");
    item.content = [inner];
    return item;
  });
  return acc;
}

/* ---------------- text helpers ---------------- */

const P_HERO = 'style="color:#ffffff;font-size:18px;line-height:26px;letter-spacing:0.9px;max-width:720px;"';
const P = 'style="font-size:18px;line-height:28px;letter-spacing:0.4px;margin-bottom:14px;"';
const P_DARK = 'style="color:#ffffff;font-size:18px;line-height:26px;letter-spacing:0.9px;max-width:814px;"';
const LINK_HERO = 'style="color:#ffffff;text-decoration:underline;"';

/** Paragraphs and lists of a section, with the site's text style. */
const prose = (html: string, p = P) => html.replace(/<p>/g, `<p ${p}>`).replace(/<ul>/g, '<ul style="font-size:18px;line-height:28px;margin:0 0 14px 1.2em;padding:0;">').replace(/<li>/g, '<li style="margin-bottom:6px;">');

function breadcrumb(trail: [string, string?][]) {
  const parts = trail.map(([label, href]) => (href ? `<a href="${href}" ${LINK_HERO}>${label}</a>` : `<span aria-current="page">${label}</span>`));
  return `<nav aria-label="Breadcrumb"><p style="color:#ffffff;font-size:14px;letter-spacing:0.6px;margin-bottom:8px;">${parts.join(" / ")}</p></nav>`;
}

/* ---------------- page ---------------- */

function sections(pg: Page, crumbs: [string, string?][]) {
  const out: Node[] = [];
  out.push(
    container(
      "bc61501",
      [text("f716402", breadcrumb(crumbs)), heading("4d1056f", pg.h1), heading("65bba16", pg.subtitle), text("f716402", prose(pg.answer, P_HERO).replace(/<a href/g, `<a ${LINK_HERO} href`))],
      `background-image:url(${HERO_PHOTO})`,
    ),
  );
  for (const s of pg.sections) {
    if (s.kind === "text") out.push(container("a5658b6", [heading("c826dbe", s.heading), text("2bb8729", prose(s.html))]));
    else
      out.push(
        container("8a23a75", [
          heading("31c37ae", s.heading),
          text("f36453c", prose(`<p>${s.intro}</p>`, P_DARK)),
          container("0e416a2", [
            container("d54f03a", [{ ...copy(block("088e71c")), image: { ...(block("088e71c").image as Node), ...s.photo, srcset: undefined, sizes: undefined, attrs: 'decoding="async" class="attachment-full size-full"' } }]),
            container("07aad87", [accordion("954b86a", s.items.map((i) => ({ title: i.title, html: i.text }))), text("ec83923", s.link)]),
          ]),
        ]),
      );
  }
  out.push(
    container("e68da39", [
      container("8183bb8", [heading("a484b10", pg.faqHeading), text("0fcfee9", `<p>${pg.faqIntro}</p>`), accordion("5f18e52", pg.faqs.map((f: Faq) => ({ title: f.q, html: `<p>${f.a}</p>` })))]),
    ]),
  );
  out.push(container("da7b818", [heading("9fad9d2", pg.cta.heading), text("cff12d7", prose(pg.cta.html, 'style="font-size:18px;line-height:26px;letter-spacing:0.9px;max-width:728px;"'))], `background-image:url(${pg.cta.photo})`));
  return out;
}

function schema(pg: Page, path: string, published: string, modified: string, crumbs: [string, string?][], areaServed?: Node[]) {
  const url = `${SITE}${path}`;
  const og = `${SITE}/og/${ogSlug(path)}.jpg`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: pg.title,
        isPartOf: { "@id": `${SITE}/#website` },
        about: { "@id": `${SITE}/#organization` },
        primaryImageOfPage: { "@id": `${url}#primaryimage` },
        image: { "@id": `${url}#primaryimage` },
        thumbnailUrl: og,
        datePublished: published,
        dateModified: modified,
        description: pg.description,
        breadcrumb: { "@id": `${url}#breadcrumb` },
        inLanguage: "en-US",
        potentialAction: [{ "@type": "ReadAction", target: [url] }],
      },
      { "@type": "ImageObject", inLanguage: "en-US", "@id": `${url}#primaryimage`, url: og, contentUrl: og, width: 1200, height: 630 },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: crumbs.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, ...(href ? { item: `${SITE}${href}` } : {}) })),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: `${SITE}/`,
        name: "Ideal Dental Solutions",
        description: "",
        publisher: { "@id": `${SITE}/#organization` },
        inLanguage: "en-US",
        alternateName: "idealdental",
      },
      // Replaced by the business details from Site settings when rendered (lib/render/seo.ts); the page's areaServed is kept.
      { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Ideal Dental Solutions", url: `${SITE}/`, ...(areaServed ? { areaServed } : {}) },
    ],
  });
}

const ogSlug = (path: string) => path.split("/").filter(Boolean).join("-");

async function ogImage(path: string, photo: string) {
  const out = join(ROOT, "public/og", `${ogSlug(path)}.jpg`);
  await sharp(join(ROOT, "public", photo)).rotate().flatten({ background: "#ffffff" }).resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(`${out}.tmp`);
  const fresh = readFileSync(`${out}.tmp`);
  if (!existsSync(out) || !fresh.equals(readFileSync(out))) writeFileSync(out, fresh);
  unlinkSync(`${out}.tmp`);
}

function frame(id: number) {
  return String(source!.frameTpl).replace(new RegExp(`<article id="post-${SOURCE_ID}" class="post-${SOURCE_ID} `), `<article id="post-${id}" class="post-${id} `);
}

function bodyClass(id: number, child: boolean) {
  return `wp-singular page-template-default page page-id-${id}${child ? " page-child parent-pageid-868" : " page-parent"} wp-custom-logo wp-embed-responsive wp-theme-blocksy elementor-default elementor-kit-5 elementor-page elementor-page-${id} ct-elementor-default-template`;
}

async function build(pg: Page, opts: { id: string; wpId: number; path: string; title: string; crumbs: [string, string?][]; ancestors: string[]; parent?: string; areaServed?: Node[] }) {
  keySeed = opts.path;
  keyCount = 0;
  const existing = docs.find((d) => d._id === opts.id);
  const published = (existing?.published as string) || pg.date;
  const modified = pg.date;
  const url = `${SITE}${opts.path}`;
  await ogImage(opts.path, pg.ogPhoto);
  const doc: Doc = {
    seo: {
      title: pg.title,
      description: pg.description,
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      canonical: url,
      ogLocale: "en_US",
      ogType: "article",
      ogTitle: pg.title,
      ogDescription: pg.description,
      ogUrl: url,
      ogSiteName: "Ideal Dental Solutions",
      modifiedTime: `${modified}T12:00:00+00:00`,
      ogImage: `${SITE}/og/${ogSlug(opts.path)}.jpg`,
      ogImageWidth: "1200",
      ogImageHeight: "630",
      ogImageType: "image/jpeg",
      twitterCard: "summary_large_image",
      schema: schema(pg, opts.path, `${published.slice(0, 10)}T12:00:00+00:00`, `${modified}T12:00:00+00:00`, opts.crumbs, opts.areaServed),
    },
    bodyClass: bodyClass(opts.wpId, Boolean(opts.parent)),
    content: sections(pg, opts.crumbs),
    frameTpl: frame(opts.wpId),
    shell: source!.shell,
    _id: opts.id,
    _type: "page",
    title: opts.title,
    path: opts.path,
    wpId: opts.wpId,
    ...(opts.parent ? { parent: { _type: "reference", _ref: opts.parent, _weak: true } } : {}),
    ancestorPaths: opts.ancestors,
    wpTemplate: "default",
    published: existing?.published || `${pg.date}T12:00:00Z`,
    excerpt: pg.description,
    authorName: "admin",
    authorSlug: "admin",
  };
  const at = docs.findIndex((d) => d._id === opts.id);
  if (at >= 0) docs[at] = doc;
  else docs.splice(docs.findIndex((d) => d.path === "/locations/mclean/") + 1 + TOWNS.findIndex((t) => opts.path.includes(`/${t.slug}/`)), 0, doc);
}

await build(HUB, { id: "page-868", wpId: 868, path: "/locations/", title: "Areas We Serve", crumbs: [["Home", "/"], ["Locations"]], ancestors: [], areaServed: [MCLEAN, ...TOWNS.map((t) => t.place)] });
await build(MCLEAN_PAGE, {
  id: "page-931",
  wpId: 931,
  path: "/locations/mclean/",
  title: "McLean",
  crumbs: [["Home", "/"], ["Locations", "/locations/"], ["McLean"]],
  ancestors: ["/locations/"],
  parent: "page-868",
  areaServed: [MCLEAN],
});
for (const [i, t] of TOWNS.entries()) {
  await build(t, {
    id: `page-location-${t.slug}`,
    wpId: 9101 + i,
    path: `/locations/${t.slug}/`,
    title: t.name,
    crumbs: [["Home", "/"], ["Locations", "/locations/"], [t.name]],
    ancestors: ["/locations/"],
    parent: "page-868",
    areaServed: [t.place],
  });
}

writeFileSync(file, JSON.stringify(docs, null, 1));
console.log(`Location pages: /locations/, /locations/mclean/ and ${TOWNS.map((t: Town) => `/locations/${t.slug}/`).join(", ")}`);
