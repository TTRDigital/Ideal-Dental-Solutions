/**
 * The privacy policy page (/privacy-policy/): plain text on the site's own blocks (the McLean gum graft page's hero, heading and
 * text blocks), no photos. It also adds "Privacy Policy" to the Patient Resources menu next to the Notice of Privacy Practices, and
 * the old 301 from /privacy-policy/ to the home page is removed (content/redirects-search-console.json). Idempotent.
 *
 *   npm run privacy
 *
 * The wording is the practice's to approve before it goes live: Kia, then Dr. Adili.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

type Node = Record<string, unknown> & { _key?: string; elId?: string; children?: Node[]; items?: Node[]; content?: Node[]; link?: string };
type Doc = Record<string, unknown> & { _id: string; _type: string; path?: string };

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = "https://idealdentalsolutions.com";
const PATH = "/privacy-policy/";
const WP_ID = 9201;
const DATE = "2026-10-28";
const TITLE = "Privacy Policy | Ideal Dental Solutions";
const DESCRIPTION = "How Ideal Dental Solutions in McLean, VA handles the information you give us on this website, and where to read our Notice of Privacy Practices.";
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

/** Stable keys: the same text gives the same keys, so a re-run leaves seed.json unchanged. */
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

const P = 'style="font-size:18px;line-height:28px;letter-spacing:0.4px;margin-bottom:14px;"';
const P_HERO = 'style="color:#ffffff;font-size:18px;line-height:26px;letter-spacing:0.9px;max-width:720px;"';
const LINK_HERO = 'style="color:#ffffff;text-decoration:underline;"';
const prose = (html: string, p = P) =>
  html.replace(/<p>/g, `<p ${p}>`).replace(/<ul>/g, '<ul style="font-size:18px;line-height:28px;margin:0 0 14px 1.2em;padding:0;">').replace(/<li>/g, '<li style="margin-bottom:6px;">');

const NPP = "/wp-content/uploads/2026/01/NPP-2026-1.pdf";
const ADDRESS = "8280 Greensboro Drive, Unit 105, McLean, VA 22102";
const PHONE = "(703) 442-0442";

const SECTIONS: { heading: string; html: string }[] = [
  {
    heading: "Who we are",
    html: `<p>Ideal Dental Solutions is a dental practice with one office at ${ADDRESS}. You can reach us at <a href="tel:+17034420442">${PHONE}</a>. This page explains how we handle the information you give us on this website, idealdentalsolutions.com.</p>`,
  },
  {
    heading: "What we collect on this website",
    html: `<p>When you send us a form, such as an appointment request, we receive what you type in: your name, phone number, email address, your message, and the page you sent it from. Please do not put medical details or emergency information in a form. If it is urgent, call us at <a href="tel:+17034420442">${PHONE}</a>.</p>
<p>When you visit, standard tools also record simple visit information: which pages were read, the kind of device and browser, and roughly where in the world the visit came from. This does not include your name.</p>`,
  },
  {
    heading: "How we use it",
    html: `<ul><li>To answer your message and book or confirm your visit.</li><li>To follow up on your request.</li><li>To understand which pages help patients, so we can improve the site.</li></ul><p>We do not sell your information.</p>`,
  },
  {
    heading: "Cookies and visit counters",
    html: `<p>This site uses Google Analytics and a visit counter run by our marketing agency, TTR Digital Marketing, to count visits and see which pages are read. These tools can set cookies in your browser. You can block or delete cookies in your browser settings, and the site will still work.</p>`,
  },
  {
    heading: "Who helps us run the site",
    html: `<p>We use outside services to run this website and handle forms: web hosting, the system where our pages are written, the tool that delivers form messages to our team, and the analytics tools above. They get only what they need to do that job. We do not give your information to anyone to market to you.</p>`,
  },
  {
    heading: "Your health information",
    html: `<p>Information about your care as a patient is protected by the federal privacy rule known as HIPAA. How we use and share that information is described in our <a href="${NPP}">Notice of Privacy Practices (PDF)</a>. This website is not the place to send medical records. Please bring them to your visit or ask our team how to send them securely.</p>`,
  },
  {
    heading: "Children",
    html: `<p>This website is meant for adults. If you are a parent or guardian and think a child sent us information through a form, call us at <a href="tel:+17034420442">${PHONE}</a> and we will remove it.</p>`,
  },
  {
    heading: "Your choices",
    html: `<p>You can ask us to show you, correct or delete the information you sent us through a form by calling ${PHONE} or visiting the office. If you no longer want messages from us, tell us and we will stop.</p>`,
  },
  {
    heading: "Changes to this page",
    html: `<p>If we change how this website handles information, we will update this page. It was last updated on October 28, 2026.</p>`,
  },
  {
    heading: "Contact us",
    html: `<p>Questions about this page? Call <a href="tel:+17034420442">${PHONE}</a> or visit us at ${ADDRESS}.</p>`,
  },
];

const crumbs = `<nav aria-label="Breadcrumb"><p style="color:#ffffff;font-size:14px;letter-spacing:0.6px;margin-bottom:8px;"><a href="/" ${LINK_HERO}>Home</a> / <span aria-current="page">Privacy Policy</span></p></nav>`;

const content: Node[] = [
  container(
    "bc61501",
    [
      text("f716402", crumbs),
      heading("4d1056f", "Privacy Policy"),
      heading("65bba16", "How we handle your information on this website"),
      text("f716402", prose(`<p>Plain answers about what we collect, why, and who sees it. For your health information, see our <a href="${NPP}">Notice of Privacy Practices</a>.</p>`, P_HERO).replace(/<a href/g, `<a ${LINK_HERO} href`)),
    ],
    "background-image:none;background-color:#111518",
  ),
  ...SECTIONS.map((s) => container("a5658b6", [heading("c826dbe", s.heading), text("2bb8729", prose(s.html))])),
];

const url = `${SITE}${PATH}`;
const og = `${SITE}/og/home.jpg`;
const schema = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": url, url, name: TITLE, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#organization` }, datePublished: `${DATE}T12:00:00+00:00`, dateModified: `${DATE}T12:00:00+00:00`, description: DESCRIPTION, breadcrumb: { "@id": `${url}#breadcrumb` }, inLanguage: "en-US" },
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` }, { "@type": "ListItem", position: 2, name: "Privacy Policy" }] },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "Ideal Dental Solutions", description: "", publisher: { "@id": `${SITE}/#organization` }, inLanguage: "en-US", alternateName: "idealdental" },
    { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Ideal Dental Solutions", url: `${SITE}/` },
  ],
});

const swapId = (s: string) => s.split(String(SOURCE_ID)).join(String(WP_ID));
const existing = docs.find((d) => d._id === "page-privacy-policy");
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
    ogImage: og,
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageType: "image/jpeg",
    twitterCard: "summary_large_image",
    schema,
  },
  bodyClass: swapId(String(source.bodyClass)).replace(" page-child parent-pageid-868", " page-parent"),
  content,
  // Only the article id changes: the page wrapper keeps the source page's id, which the shared stylesheet is written for.
  frameTpl: String(source.frameTpl).replace(new RegExp(`<article id="post-${SOURCE_ID}" class="post-${SOURCE_ID} `), `<article id="post-${WP_ID}" class="post-${WP_ID} `),
  shell: source.shell,
  _id: "page-privacy-policy",
  _type: "page",
  title: "Privacy Policy",
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
else docs.splice(docs.findIndex((d) => d.path === "/thank-you/") + 1, 0, doc);

/* The menu: "Privacy Policy" right after the Notice of Privacy Practices, in every menu that has it. */
let menus = 0;
const addMenuItem = (n: unknown) => {
  if (Array.isArray(n)) {
    const i = n.findIndex((x) => x && typeof x === "object" && (x as Node).link === NPP);
    if (i >= 0 && !n.some((x) => x && (x as Node).link === PATH)) {
      const npp = n[i] as Node;
      const item = JSON.parse(JSON.stringify(npp).split("1219").join("9202")) as Node;
      item.link = PATH;
      item.label = "Privacy Policy";
      item._key = createHash("sha1").update(`${PATH}:menu:${menus}`).digest("hex").slice(0, 12);
      n.splice(i + 1, 0, item);
      menus++;
    }
    n.forEach(addMenuItem);
  } else if (n && typeof n === "object") Object.values(n as Node).forEach(addMenuItem);
};
for (const d of docs) addMenuItem(d);

writeFileSync(file, JSON.stringify(docs, null, 1));

/* The old redirect from /privacy-policy/ to the home page would hide the new page. */
const redirectsFile = join(ROOT, "content/redirects-search-console.json");
const redirects = JSON.parse(readFileSync(redirectsFile, "utf8")) as { source: string; destination: string }[];
const kept = redirects.filter((r) => r.source !== PATH);
if (kept.length !== redirects.length) writeFileSync(redirectsFile, JSON.stringify(kept, null, 2) + "\n");

console.log(`Privacy policy page ${PATH} written; menu item added in ${menus} new place(s).`);
