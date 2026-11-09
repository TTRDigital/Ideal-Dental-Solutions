/**
 * Dental Crowns service page: /services/restorative-dentistry/dental-crowns/
 * (TTR-1360). Built into content/seed.json from the blocks of the McLean gum
 * graft page, like the location pages (scripts/locations.ts on
 * claude/mara-ideal-towns): same layout and stylesheet, the block layouts
 * stay fixed, only the text, photos and SEO fields are new. Also writes the
 * page's social image. Idempotent.
 *
 *   npm run crowns
 *
 * Until `npm run seed` (or POST /api/admin/seed/) publishes it, the site
 * serves the page from the built-in copy (lib/site/data.ts). After that it is
 * edited in /cms. Sources for every medical statement: docs/ttr-1360/sources.md.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import sharp from "sharp";

type Node = Record<string, unknown> & { _key?: string; elId?: string; children?: Node[]; items?: Node[]; content?: Node[] };
type Doc = Record<string, unknown> & { _id: string; _type: string; path?: string };

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = "https://idealdentalsolutions.com";
const file = join(ROOT, "content/seed.json");
const docs: Doc[] = JSON.parse(readFileSync(file, "utf8"));
const source = docs.find((d) => d.path === "/locations/mclean/gum-graft-surgery/");
if (!source) throw new Error("No /locations/mclean/gum-graft-surgery/ in content/seed.json");
const SOURCE_ID = source.wpId as number;

const PATH = "/services/restorative-dentistry/dental-crowns/";
const ID = "page-service-dental-crowns";
const WP_ID = 9201;
const PARENT = "page-413"; // /services/restorative-dentistry/
const DATE = "2026-11-09";

type Photo = { src: string; width: string; height: string; alt: string };

/** The practice's own photos. */
const HERO_PHOTO = "/wp-content/uploads/2026/07/treatment-room-web.jpg"; // a treatment room at the McLean office
const MODEL_PHOTO: Photo = { src: "/wp-content/uploads/2026/06/img-8982346.webp", width: "1024", height: "1024", alt: "Dental model of the upper and lower teeth" };
const TEAM_PHOTO: Photo = { src: "/wp-content/uploads/2026/08/IMG_1980-1-1024x768.jpeg", width: "1024", height: "768", alt: "Ideal Dental Solutions team member at the McLean office" };
const CTA_PHOTO = "/wp-content/uploads/2026/07/IMG_6255-2048x1602.jpeg"; // Kaveh Sanatjou, RDH, at the McLean reception sign

/* ---------------- content ---------------- */

type Faq = { q: string; a: string };
type Section =
  | { kind: "text"; heading: string; html: string }
  | { kind: "accordion"; heading: string; intro: string; photo: Photo; items: { title: string; text: string }[]; link: string };

const PAGE = {
  title: "Dental Crowns in McLean, VA | Ideal Dental Solutions",
  description: "Dental crowns in McLean, VA from prosthodontist Dr. Mehdi Adili: when you need one, crown materials, what to expect over two visits, and how long crowns last.",
  h1: "Dental Crowns in McLean, VA",
  subtitle: "Protect and restore a weak, cracked or worn tooth",
  answer: `<p>A dental crown is a tooth-shaped cap that covers a damaged tooth to protect it and restore its shape and strength. Crowns are used for cracked, weak or worn teeth, after a root canal, and on top of dental implants. Placing one usually takes two visits a few weeks apart, and crowns last five to 15 years on average with good care. At our McLean office, crowns are one of the main areas of focus for <a href="/dr-mehdi-adili/">Dr. Mehdi S. Adili, DDS</a>, a prosthodontist.</p>`,
  sections: [
    {
      kind: "text",
      heading: "What a Dental Crown Does",
      html: `<p>A crown covers the whole visible part of a tooth, down to the gumline. It holds a weakened tooth together, protects it from breaking further, and gives it back a normal shape so you can chew comfortably.</p>
<p>Crowns are a restorative treatment first, but they also change how a tooth looks: a tooth-colored crown can cover a badly stained or misshapen tooth. When a tooth is too damaged for a filling but can still be saved, a crown is often the next step.</p>`,
    },
    {
      kind: "accordion",
      heading: "When You Might Need a Crown",
      intro: "Cleveland Clinic lists these common reasons for a crown. Your exam and X-rays show which applies to your tooth.",
      photo: TEAM_PHOTO,
      items: [
        { title: "A Weak or Heavily Filled Tooth", text: "<p>When decay or an old filling has left too little healthy tooth, a crown can strengthen what remains so it does not break.</p>" },
        { title: "A Cracked Tooth", text: "<p>A crown holds the pieces of a cracked tooth together and protects it from cracking further.</p>" },
        { title: "After a Root Canal", text: '<p>Back teeth treated with a <a href="/services/restorative-dentistry/root-canal-therapy/">root canal</a> usually need a crown to protect them. We handle the root canal and the final restoration in the same office.</p>' },
        { title: "A Worn-Down Tooth", text: "<p>Teeth worn down by grinding or wear can be rebuilt to their normal height and shape with crowns.</p>" },
        { title: "On Top of a Dental Implant", text: '<p>A <a href="/services/dental-implants-dentistry/single-tooth-implants/">single tooth implant</a> is finished with a custom crown that sits on the implant.</p>' },
        { title: "To Hold a Bridge", text: '<p>A traditional <a href="/services/restorative-dentistry/dental-bridges/">dental bridge</a> is held by crowns on the teeth on either side of a gap.</p>' },
      ],
      link: '<p style="color:#ffffff;font-size:18px;line-height:26px;letter-spacing:0.9px;"><a href="/appointment/" style="color:#ffffff;text-decoration:underline;">Request an appointment</a> to find out whether a crown is right for your tooth.</p>',
    },
    {
      kind: "accordion",
      heading: "Crown Materials Compared",
      intro: "Crowns come in several materials. Each balances looks, strength and how much tooth has to be reshaped.",
      photo: MODEL_PHOTO,
      items: [
        { title: "All-Ceramic or Porcelain", text: "<p>Looks the most like natural enamel, so it is a common choice for front teeth. It is also an option for people with metal allergies.</p>" },
        { title: "Zirconia", text: "<p>A very strong ceramic that can withstand heavier biting forces than other ceramic crowns.</p>" },
        { title: "Porcelain-Fused-to-Metal", text: "<p>Combines the strength of metal with a tooth-colored porcelain surface. Over time the porcelain can chip and show the metal underneath.</p>" },
        { title: "Metal (Gold or Alloy)", text: "<p>Rarely chips or breaks and needs only a small amount of enamel removed. The metal color is the main drawback, so it is mostly used for back teeth.</p>" },
        { title: "Resin", text: "<p>Usually less expensive, but more fragile and more likely to break than other types. Temporary crowns are often made of resin.</p>" },
      ],
      link: '<p style="color:#ffffff;font-size:18px;line-height:26px;letter-spacing:0.9px;">We will recommend a material for your tooth and explain why, based on where it is, how you bite and how it should look.</p>',
    },
    {
      kind: "text",
      heading: "What to Expect: Usually Two Visits",
      html: `<p><strong>First visit.</strong> We examine the tooth and take X-rays. The area is numbed, and some enamel is removed so the crown can fit over the tooth. Then we take an impression, either with a putty-like material or with a handheld digital scanner, and place a temporary crown.</p>
<p><strong>While the crown is made.</strong> A dental lab usually takes two to three weeks to make the final crown. The temporary crown protects your tooth in the meantime; avoid sticky and hard foods on that side.</p>
<p><strong>Second visit.</strong> We check the shape, color and fit of the new crown, then bond it to your tooth with dental cement and adjust your bite.</p>
<p>Most people go back to work or school right after. Some sensitivity for a couple of weeks and gum soreness for a few days are normal.</p>`,
    },
    {
      kind: "text",
      heading: "How Long Crowns Last and How to Care for Them",
      html: `<p>According to Cleveland Clinic, the average dental crown lasts five to 15 years, and some last much longer with good care. To help yours last:</p>
<ul>
<li>Brush at least twice a day with a fluoride toothpaste and a soft-bristled toothbrush.</li>
<li>Floss between your teeth once a day.</li>
<li>Avoid chewing ice and very hard, crunchy or sticky foods.</li>
<li>If you grind your teeth, ask about a <a href="/locations/night-guards/">custom night guard</a>.</li>
<li>Keep up with regular cleanings and exams.</li>
</ul>
<p>Call us if a crown feels loose, chips or cracks, or if your bite feels off after it is placed.</p>`,
    },
    {
      kind: "text",
      heading: "Your Crown Dentist in McLean",
      html: `<p><a href="/dr-mehdi-adili/">Dr. Mehdi S. Adili, DDS</a>, is a prosthodontist: a dentist with three to four additional years of specialty training in restoring and replacing teeth with crowns, bridges, dentures and implants. He earned his Doctor of Dental Surgery degree from Georgetown University and completed his prosthodontics training at Virginia Commonwealth University. Crowns are one of his main areas of focus, along with bridges, dentures, dental implants and full-mouth restoration.</p>
<p>Our office is at 8280 Greensboro Drive, Unit 105, in McLean, close to Tysons.</p>`,
    },
  ] as Section[],
  faqHeading: "Frequently Asked Questions About Dental Crowns",
  faqIntro: "Answers to the questions we hear most about crowns. For advice about your own tooth, start with an exam.",
  faqs: [
    { q: "How long does a dental crown last?", a: "Five to 15 years on average, according to Cleveland Clinic, and some last much longer with good care. Brushing, flossing, avoiding very hard foods and regular checkups all help." },
    { q: "Does getting a crown hurt?", a: "The tooth is numbed before it is shaped, and you can ask for more anesthetic if you feel anything. Some sensitivity for a couple of weeks and gum soreness for a few days afterward are normal." },
    { q: "How many visits does a crown take?", a: "Usually two. At the first visit we shape the tooth, take an impression and place a temporary crown. The final crown is bonded at the second visit, typically two to three weeks later." },
    { q: "Do I need a crown or a filling?", a: "A filling repairs a smaller area of decay. A crown is used when too little healthy tooth is left for a filling to hold, when the tooth is cracked, or after a root canal on a back tooth. Your exam and X-rays decide." },
    { q: "What should I do if my crown feels loose or comes off?", a: "Call our office. Keep the crown if it came off, avoid chewing on that side, and we will see whether it can be cemented back or needs to be replaced." },
    { q: "Can a crown go on a dental implant?", a: "Yes. A single tooth implant is finished with a custom crown that attaches to the implant. Implant crowns are cared for much like natural teeth." },
  ] as Faq[],
  cta: {
    heading: "Schedule a Crown Consultation in McLean",
    html: '<p>Have a cracked, worn or weak tooth? Call <a href="tel:+17034420442" style="color:#ffffff;text-decoration:underline;">(703) 442-0442</a> or <a href="/appointment/" style="color:#ffffff;text-decoration:underline;">request an appointment</a>, and we will look at the tooth and explain your options.</p>',
  },
};

/* ---------------- blocks (as in scripts/locations.ts) ---------------- */

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
const keySeed = PATH;
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

const CRUMBS: [string, string?][] = [["Home", "/"], ["Services", "/services/"], ["Restorative Dentistry", "/services/restorative-dentistry/"], ["Dental Crowns"]];

function sections() {
  const out: Node[] = [];
  out.push(
    container(
      "bc61501",
      [text("f716402", breadcrumb(CRUMBS)), heading("4d1056f", PAGE.h1), heading("65bba16", PAGE.subtitle), text("f716402", prose(PAGE.answer, P_HERO).replace(/<a href/g, `<a ${LINK_HERO} href`))],
      `background-image:url(${HERO_PHOTO})`,
    ),
  );
  for (const s of PAGE.sections) {
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
      container("8183bb8", [heading("a484b10", PAGE.faqHeading), text("0fcfee9", `<p>${PAGE.faqIntro}</p>`), accordion("5f18e52", PAGE.faqs.map((f) => ({ title: f.q, html: `<p>${f.a}</p>` })))]),
    ]),
  );
  out.push(container("da7b818", [heading("9fad9d2", PAGE.cta.heading), text("cff12d7", prose(PAGE.cta.html, 'style="font-size:18px;line-height:26px;letter-spacing:0.9px;max-width:728px;"'))], `background-image:url(${CTA_PHOTO})`));
  return out;
}

/* ---------------- SEO ---------------- */

const ogSlug = PATH.split("/").filter(Boolean).join("-");
const OG = `${SITE}/og/${ogSlug}.jpg`;
const URL_ = `${SITE}${PATH}`;
const AUTHOR = { "@type": "Person", "@id": `${SITE}/dr-mehdi-adili/#person`, name: "Dr. Mehdi S. Adili, DDS", jobTitle: "Prosthodontist", url: `${SITE}/dr-mehdi-adili/` };

function schema(published: string, modified: string) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": URL_,
        url: URL_,
        name: PAGE.title,
        isPartOf: { "@id": `${SITE}/#website` },
        about: { "@id": `${URL_}#service` },
        primaryImageOfPage: { "@id": `${URL_}#primaryimage` },
        image: { "@id": `${URL_}#primaryimage` },
        thumbnailUrl: OG,
        datePublished: published,
        dateModified: modified,
        description: PAGE.description,
        author: AUTHOR,
        breadcrumb: { "@id": `${URL_}#breadcrumb` },
        inLanguage: "en-US",
        potentialAction: [{ "@type": "ReadAction", target: [URL_] }],
      },
      {
        "@type": "Service",
        "@id": `${URL_}#service`,
        name: "Dental crowns",
        serviceType: "Dental crown",
        description: "Crowns for cracked, weak or worn teeth, after root canal treatment and on dental implants.",
        provider: { "@id": `${SITE}/#organization` },
        areaServed: [{ "@type": "City", name: "McLean, VA" }, { "@type": "City", name: "Tysons, VA" }],
        url: URL_,
      },
      { "@type": "ImageObject", inLanguage: "en-US", "@id": `${URL_}#primaryimage`, url: OG, contentUrl: OG, width: 1200, height: 630 },
      {
        "@type": "BreadcrumbList",
        "@id": `${URL_}#breadcrumb`,
        itemListElement: CRUMBS.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, ...(href ? { item: `${SITE}${href}` } : {}) })),
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
      // Replaced by the business details from Site settings when rendered (lib/render/seo.ts).
      { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Ideal Dental Solutions", url: `${SITE}/` },
    ],
  });
}

async function ogImage() {
  const out = join(ROOT, "public/og", `${ogSlug}.jpg`);
  await sharp(join(ROOT, "public", HERO_PHOTO)).rotate().flatten({ background: "#ffffff" }).resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(`${out}.tmp`);
  const fresh = readFileSync(`${out}.tmp`);
  if (!existsSync(out) || !fresh.equals(readFileSync(out))) writeFileSync(out, fresh);
  unlinkSync(`${out}.tmp`);
}

/* ---------------- page ---------------- */

const existing = docs.find((d) => d._id === ID);
const published = ((existing?.published as string) || `${DATE}T12:00:00Z`).slice(0, 10);
await ogImage();
const doc: Doc = {
  seo: {
    title: PAGE.title,
    description: PAGE.description,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    canonical: URL_,
    ogLocale: "en_US",
    ogType: "article",
    ogTitle: PAGE.title,
    ogDescription: PAGE.description,
    ogUrl: URL_,
    ogSiteName: "Ideal Dental Solutions",
    modifiedTime: `${DATE}T12:00:00+00:00`,
    ogImage: OG,
    ogImageWidth: "1200",
    ogImageHeight: "630",
    ogImageType: "image/jpeg",
    twitterCard: "summary_large_image",
    schema: schema(`${published}T12:00:00+00:00`, `${DATE}T12:00:00+00:00`),
  },
  bodyClass: `wp-singular page-template-default page page-id-${WP_ID} page-child parent-pageid-413 wp-custom-logo wp-embed-responsive wp-theme-blocksy elementor-default elementor-kit-5 elementor-page elementor-page-${WP_ID} ct-elementor-default-template`,
  content: sections(),
  frameTpl: String(source.frameTpl).replace(new RegExp(`<article id="post-${SOURCE_ID}" class="post-${SOURCE_ID} `), `<article id="post-${WP_ID}" class="post-${WP_ID} `),
  shell: source.shell,
  _id: ID,
  _type: "page",
  title: "Dental Crowns",
  path: PATH,
  wpId: WP_ID,
  parent: { _type: "reference", _ref: PARENT, _weak: true },
  ancestorPaths: ["/services/restorative-dentistry/", "/services/"],
  wpTemplate: "default",
  published: existing?.published || `${DATE}T12:00:00Z`,
  excerpt: PAGE.description,
  authorName: "admin",
  authorSlug: "admin",
};

const at = docs.findIndex((d) => d._id === ID);
if (at >= 0) docs[at] = doc;
else docs.splice(docs.findIndex((d) => d.path === "/services/restorative-dentistry/dental-bridges/") + 1, 0, doc);
writeFileSync(file, JSON.stringify(docs, null, 1));
console.log(`Dental crowns page: ${PATH}`);
