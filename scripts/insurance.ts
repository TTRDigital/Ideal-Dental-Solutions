/**
 * The Insurance and Payment page (/insurance-and-payment/), TTR-971: the practice's own wording from the sections that used to repeat on
 * the service pages (scripts/fixes.ts step 8f takes those off), in one place. Same blocks and colours as the location pages, no photos.
 * Also links it (and the privacy policy) from the footer and from Patient Resources in the menu. Idempotent.
 *
 *   npm run insurance
 *
 * Nothing here is new: the plan list and the payment lines are the practice's existing text. The practice must confirm the plan
 * list before this goes live.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { STYLE, band, card, esc } from "./location-design.ts";
import { ADDRESS, PHONE } from "./locations-content.ts";

type Node = Record<string, unknown> & { _key?: string; elId?: string; children?: Node[]; items?: Node[]; content?: Node[]; link?: string };
type Doc = Record<string, unknown> & { _id: string; _type: string; path?: string };

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = "https://idealdentalsolutions.com";
const PATH = "/insurance-and-payment/";
const PRIVACY = "/privacy-policy/";
const NPP = "/wp-content/uploads/2026/01/NPP-2026-1.pdf";
const WP_ID = 9203;
const DATE = "2026-10-28";
const TITLE = "Insurance and Payment | Ideal Dental Solutions";
const DESCRIPTION = "Dental insurance plans we work with and the ways to pay at Ideal Dental Solutions in McLean, VA: major credit cards, Cherry payment plans and CareCredit.";
const file = join(ROOT, "content/seed.json");
const docs: Doc[] = JSON.parse(readFileSync(file, "utf8"));
const source = docs.find((d) => d.path === "/locations/mclean/gum-graft-surgery/");
if (!source) throw new Error("No /locations/mclean/gum-graft-surgery/ in content/seed.json");
const SOURCE_ID = source.wpId as number;

function find(nodes: Node[], elId: string): Node | undefined {
  for (const n of nodes) {
    if (n.elId === elId) return n;
    const inner = find(n.children || [], elId);
    if (inner) return inner;
  }
}
const block = (elId: string): Node => {
  const n = find(source!.content as Node[], elId);
  if (!n) throw new Error(`Block ${elId} not found on the source page`);
  return n;
};
let keyCount = 0;
const newKey = () => createHash("sha1").update(`${PATH}:${keyCount++}`).digest("hex").slice(0, 12);
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
let rawCount = 0;
function raw(html: string): Node {
  const id = createHash("sha1").update(`${PATH}:raw:${rawCount++}`).digest("hex").slice(0, 7);
  const wid = `${id.slice(0, 6)}w`;
  const w: Node = {
    _key: newKey(),
    elId: wid,
    _type: "elRaw",
    widget: "shortcode",
    tpl: `<div class="elementor-element elementor-element-${wid} elementor-widget elementor-widget-shortcode" data-id="${wid}" data-element_type="widget" data-e-type="widget" data-widget_type="shortcode.default">\n\t\t\t\t\t\t\t<div class="elementor-shortcode">${html}</div>\n\t\t\t\t\t\t</div>`,
  };
  return { _key: newKey(), elId: id, _type: "elContainer", children: [w], tpl: `<div class="elementor-element elementor-element-${id} e-con-full e-flex e-con e-parent" data-id="${id}" data-element_type="container" data-e-type="container">\n\t\t\t\t[[@nodes:children]]</div>` };
}

const P_HERO = 'style="color:#ffffff;font-size:18px;line-height:26px;letter-spacing:0.9px;max-width:720px;"';
const LINK_HERO = 'style="color:#ffffff;text-decoration:underline;"';
const crumbs = `<nav aria-label="Breadcrumb"><p style="color:#ffffff;font-size:14px;letter-spacing:0.6px;margin-bottom:8px;"><a href="/" ${LINK_HERO}>Home</a> / <span aria-current="page">Insurance and Payment</span></p></nav>`;

/** The practice's own words, as they stood on the service pages. */
const INTRO = "Understanding that financial concerns should never be a barrier to achieving optimal health, we offer a variety of flexible payment options for our dental patients and accept numerous dental insurance plans to accommodate your needs.";
const PLANS_LEAD = "We work with a wide range of Northern Virginia dental insurance providers to help you maximize your benefits and minimize out-of-pocket expenses. Our knowledgeable staff will assist you in understanding your coverage and filing insurance claims on your behalf.";
// The list as the service pages and the McLean FAQ have always had it (14 plans). The practice must confirm it before this goes live.
const PLANS = ["Aetna", "Ameritas", "Anthem", "CareFirst", "Cigna", "Delta Dental", "GEHA", "Guardian", "Humana", "Lincoln", "MetLife", "Principal", "United Concordia", "United Healthcare"];
const PAY_LEAD = "For patients without dental insurance or those requiring additional payment flexibility, we offer several convenient payment options:";
const PAY = [
  ["Credit Cards", "We accept major credit cards, including Visa, MasterCard, American Express, and Discover."],
  ["Payment Plans", "Flexible payment plans through Cherry make dental care more affordable with budget-friendly monthly payments."],
  ["CareCredit", "CareCredit offers convenient financing for dental expenses with low monthly payment options."],
];

const content: Node[] = [
  container(
    "bc61501",
    [
      text("f716402", crumbs),
      heading("4d1056f", "Insurance and Payment"),
      heading("65bba16", "Dental insurance plans and ways to pay"),
      text("f716402", `<p ${P_HERO}>${esc(INTRO)}</p>`),
    ],
    "background-image:none;background-color:#111518",
  ),
  raw(
    STYLE +
      band({
        tone: "light",
        heading: "Accepted insurance plans",
        lead: esc(PLANS_LEAD),
        body: `<ul class="idl-chips">${PLANS.map((p) => `<li><span>${esc(p)}</span></li>`).join("")}</ul>`,
      }),
  ),
  raw(band({ tone: "dark", heading: "Flexible payment options", lead: esc(PAY_LEAD), body: `<div class="idl-grid idl-grid-3">${PAY.map(([t, d]) => card(esc(t), esc(d))).join("")}</div>` })),
  raw(
    band({
      tone: "light",
      heading: "Questions about your coverage?",
      lead: `Call ${PHONE} or <a href="/appointment/">request an appointment online</a>. Our office is at ${esc(ADDRESS)}.`,
      body: `<p>Your health information is covered by our <a href="${NPP}" style="color:#c2570a;text-decoration:underline">Notice of Privacy Practices</a>. Details on this website are in our <a href="${PRIVACY}" style="color:#c2570a;text-decoration:underline">Privacy Policy</a>.</p>`,
    }),
  ),
];

const url = `${SITE}${PATH}`;
const schema = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": url, url, name: TITLE, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#organization` }, datePublished: `${DATE}T12:00:00+00:00`, dateModified: `${DATE}T12:00:00+00:00`, description: DESCRIPTION, breadcrumb: { "@id": `${url}#breadcrumb` }, inLanguage: "en-US" },
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` }, { "@type": "ListItem", position: 2, name: "Insurance and Payment" }] },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "Ideal Dental Solutions", description: "", publisher: { "@id": `${SITE}/#organization` }, inLanguage: "en-US", alternateName: "idealdental" },
    { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Ideal Dental Solutions", url: `${SITE}/` },
  ],
});
const existing = docs.find((d) => d._id === "page-insurance-and-payment");
const doc: Doc = {
  seo: {
    title: TITLE,
    description: DESCRIPTION,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    canonical: url,
    ogLocale: "en_US",
    ogType: "article",
    ogTitle: TITLE,
    ogDescription: DESCRIPTION,
    ogUrl: url,
    ogSiteName: "Ideal Dental Solutions",
    modifiedTime: `${DATE}T12:00:00+00:00`,
    ogImage: `${SITE}/og/home.jpg`,
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageType: "image/jpeg",
    twitterCard: "summary_large_image",
    schema,
  },
  bodyClass: String(source.bodyClass).split(String(SOURCE_ID)).join(String(WP_ID)).replace(" page-child parent-pageid-868", " page-parent"),
  content,
  // Only the article id changes: the page wrapper keeps the source page's id, which the shared stylesheet is written for.
  frameTpl: String(source.frameTpl).replace(new RegExp(`<article id="post-${SOURCE_ID}" class="post-${SOURCE_ID} `), `<article id="post-${WP_ID}" class="post-${WP_ID} `),
  shell: source.shell,
  _id: "page-insurance-and-payment",
  _type: "page",
  title: "Insurance and Payment",
  path: PATH,
  wpId: WP_ID,
  ancestorPaths: [],
  wpTemplate: "default",
  published: (existing?.published as string) || `${DATE}T12:00:00Z`,
  excerpt: DESCRIPTION,
  authorName: "admin",
  authorSlug: "admin",
};
const at = docs.findIndex((d) => d._id === doc._id);
if (at >= 0) docs[at] = doc;
else docs.splice(Math.max(docs.findIndex((d) => d.path === PRIVACY), docs.findIndex((d) => d.path === "/thank-you/")) + 1, 0, doc);

/* The menu: "Insurance and Payment" right after the Notice of Privacy Practices (the privacy policy follows it). */
let menus = 0;
const addMenuItem = (n: unknown) => {
  if (Array.isArray(n)) {
    const i = n.findIndex((x) => x && typeof x === "object" && (x as Node).link === NPP);
    if (i >= 0 && !n.some((x) => x && (x as Node).link === PATH)) {
      const item = JSON.parse(JSON.stringify(n[i]).split("1219").join("9203")) as Node;
      item.link = PATH;
      item.label = "Insurance and Payment";
      item._key = createHash("sha1").update(`${PATH}:menu:${menus}`).digest("hex").slice(0, 12);
      n.splice(i + 1, 0, item);
      menus++;
    }
    n.forEach(addMenuItem);
  } else if (n && typeof n === "object") Object.values(n as Node).forEach(addMenuItem);
};
for (const d of docs) addMenuItem(d);

/* The footer: two plain links under the address and phone. */
const footer = docs.find((d) => d._id === "template-30");
let footerLinks = 0;
if (footer) {
  const walkList = (n: unknown) => {
    if (Array.isArray(n)) n.forEach(walkList);
    else if (n && typeof n === "object") {
      const o = n as Node;
      if (o.elId === "ddb95ce" && Array.isArray(o.items)) {
        for (const [label, href] of [["Insurance and Payment", PATH], ["Privacy Policy", PRIVACY]] as const) {
          if (o.items.some((i) => String(i.tpl).includes(`href="${href}"`))) continue;
          o.items.push({
            _type: "iconListItem",
            _key: createHash("sha1").update(`${href}:footer`).digest("hex").slice(0, 12),
            text: label,
            tpl: `\n\t\t\t\t\t\t\t<li class="elementor-icon-list-item">\n\t\t\t\t\t\t\t\t\t\t<a href="${href}">\n\t\t\t\t\t\t\t\t\t\t<span class="elementor-icon-list-text">[[@text:text]]</span>\n\t\t\t\t\t\t\t\t\t</a></li>`,
          } as Node);
          footerLinks++;
        }
      }
      Object.values(o).forEach(walkList);
    }
  };
  walkList(footer.content);
}

writeFileSync(file, JSON.stringify(docs, null, 1));
console.log(`Insurance and payment page ${PATH} written; menu item added in ${menus} new place(s); ${footerLinks} new footer link(s).`);
