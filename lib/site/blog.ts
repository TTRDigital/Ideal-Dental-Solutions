import { posts, type BlogPost } from "../../content/blog/posts.ts";
import { escapeAttr, escapeHtml } from "../render/html.ts";
import type { Seo } from "../render/seo.ts";
import type { PageDoc, Resolved } from "./render.ts";

/**
 * Patient Guides blog (/blog/ and /blog/<slug>/), laid out like the TTR
 * blog design (Beverly Hills Dental Arts Studio: components/blog/*) in
 * Ideal's orange and charcoal. The posts live in the repo
 * (content/blog/posts.ts), not in the CMS. Pages are printed in the same
 * shell as the Dr. Adili profile, so the site's header, footer and Urbanist
 * font stay; everything between them is plain HTML and the CSS below (no
 * JavaScript). Photos are the practice's own (public/images/blog/).
 */

export type { BlogPost };

const SITE = "https://idealdentalsolutions.com";
const SHELL = "6c7da4a2d3";
const BLOG_PATH = "/blog/";
const PHONE = "(703) 442-0442";
const PHONE_HREF = "tel:+17034420442";

const AUTHOR = {
  name: "Dr. Mehdi S. Adili, DDS",
  short: "Dr. Mehdi Adili",
  path: "/dr-mehdi-adili/",
  jobTitle: "Prosthodontist",
  photo: "/images/blog/dr-adili-112.webp",
  photoLarge: "/images/blog/dr-adili-240.webp",
  bio: "Dr. Mehdi S. Adili, DDS, is a prosthodontist at Ideal Dental Solutions in McLean. He earned his Doctor of Dental Surgery degree from Georgetown University and completed specialty training in prosthodontics at Virginia Commonwealth University. His work focuses on dental implants, crowns, bridges, dentures and full-mouth restoration.",
};

/** The practice's own photos, resized to WebP at 640 and 1040 px wide (4:3). */
const PHOTOS = {
  model: { alt: "Dental model of the upper and lower teeth" },
  scan: { alt: "Ideal Dental Solutions team member reviewing a 3D scan of a patient's teeth" },
  "team-kaveh": { alt: "Kaveh Sanatjou, RDH, dental hygienist at Ideal Dental Solutions" },
  "team-fozia": { alt: "Fozia Mohamed, RDH, dental hygienist at Ideal Dental Solutions" },
} as const;
export type PhotoKey = keyof typeof PHOTOS;

/** Categories in list order: each one supports a service page. */
const CATEGORIES = [
  { key: "implants", name: "Dental implants", path: "/services/dental-implants-dentistry/", blurb: "Single tooth and full arch implants, planned with 3D imaging.", photo: "scan" },
  { key: "cosmetic", name: "Cosmetic dentistry", path: "/services/cosmetic-dentistry/", blurb: "Whitening, bonding, porcelain veneers and Invisalign clear aligners.", photo: "model" },
  { key: "gums", name: "Gum health", path: "/services/periodontic-dentistry/", blurb: "Gum disease treatment, gum grafts and crown lengthening.", photo: "team-fozia" },
  { key: "restorative", name: "Restorative dentistry", path: "/services/restorative-dentistry/", blurb: "Fillings, bridges, dentures, root canals, extractions and TMJ care.", photo: "team-kaveh" },
] as const satisfies readonly { key: string; name: string; path: string; blurb: string; photo: PhotoKey }[];
export type CategoryKey = (typeof CATEGORIES)[number]["key"];

const BODY_CLASS = "wp-singular post-template-default single single-post single-format-standard wp-custom-logo wp-embed-responsive wp-theme-blocksy elementor-default elementor-kit-5 ct-elementor-default-template";
const LIST_BODY_CLASS = "blog wp-custom-logo wp-embed-responsive wp-theme-blocksy elementor-default elementor-kit-5 ct-elementor-default-template";

export const postPath = (p: BlogPost) => `${BLOG_PATH}${p.slug}/`;

const sorted = () => [...posts].sort((a, b) => b.published.localeCompare(a.published));
const categoryOf = (p: BlogPost) => CATEGORIES.find((c) => c.key === p.category) || CATEGORIES[0];

/** Blog URLs for allPaths(): the list is a page, each post a post (post-sitemap.xml). */
export function blogPaths(): { path: string; type: string; modified?: string }[] {
  const list = sorted();
  return [
    { path: BLOG_PATH, type: "page", modified: list[0]?.modified || list[0]?.published },
    ...list.map((p) => ({ path: postPath(p), type: "post", modified: p.modified || p.published })),
  ];
}

/** The blog page for a path, or null when the path is not part of the blog. */
export function resolveBlog(path: string): Resolved | null {
  if (path === BLOG_PATH) return { kind: "page", doc: listDoc(), ancestors: [] };
  const post = posts.find((p) => postPath(p) === path);
  return post ? { kind: "page", doc: postDoc(post), ancestors: [BLOG_PATH] } : null;
}

/* ---------------- helpers ---------------- */

const strip = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const iso = (date: string) => `${date}T09:00:00+00:00`;
const longDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

function words(p: BlogPost) {
  const text = [p.answer, ...p.sections.map((s) => `${s.heading} ${s.html}`), ...p.faq.map((f) => `${f.q} ${f.a}`)].join(" ");
  return strip(text).split(" ").length;
}

const minutes = (p: BlogPost) => Math.max(1, Math.round(words(p) / 230));

const slugId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** A responsive <img> for one of the practice photos. */
function photo(key: PhotoKey, sizes: string, opts: { eager?: boolean; alt?: string } = {}) {
  const base = `/images/blog/${key}`;
  const load = opts.eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  return `<img src="${base}-1040.webp" srcset="${base}-640.webp 640w, ${base}-1040.webp 1040w" sizes="${sizes}" width="1040" height="780" alt="${escapeAttr(opts.alt ?? PHOTOS[key].alt)}" ${load} decoding="async">`;
}

/* Line icons (24px grid, stroke follows the text color), as in the TTR blog design. */
const ICONS: Record<string, string> = {
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  shield: '<path d="M12 3.5 18.5 6v5.2c0 4.6-2.8 7.7-6.5 9.3-3.7-1.6-6.5-4.7-6.5-9.3V6L12 3.5z"/><path d="m9.2 12.2 2 2 3.8-4"/>',
  scan: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  layers: '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
  tooth: '<path d="M7.5 3.5c-2.4 0-4 1.9-4 4.6 0 2.3.9 3.7 1.5 5.4.7 2 .9 6.9 2.6 6.9 1.6 0 1.5-4.6 2.4-5.9.4-.6 1.6-.6 2 0 .9 1.3.8 5.9 2.4 5.9 1.7 0 1.9-4.9 2.6-6.9.6-1.7 1.5-3.1 1.5-5.4 0-2.7-1.6-4.6-4-4.6-1.8 0-2.6.9-4.5.9s-2.7-.9-4.5-.9z"/>',
  implant: '<path d="M8 3.5h8l1 4.5H7l1-4.5z"/><path d="M9.5 8v8.5L12 21l2.5-4.5V8"/><path d="M9.5 11h5M9.5 14h5"/>',
  smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8 13.5c1 1.8 2.3 2.7 4 2.7s3-.9 4-2.7M9 9.5h.01M15 9.5h.01"/>',
  phone: '<path d="M6.6 3.5h2.6l1.4 4-2 1.4a12 12 0 0 0 6.5 6.5l1.4-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
};
const icon = (name: string | undefined, cls = "ib-icon") =>
  name && ICONS[name] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>` : "";

const authorCard = (meta = "") => `<div class="ib-author">
\t<img src="${AUTHOR.photo}" width="56" height="56" alt="${escapeAttr(AUTHOR.name)}" decoding="async">
\t<div>
\t\t<div class="ib-author-name">${meta ? "By " : ""}<a href="${AUTHOR.path}">${escapeHtml(AUTHOR.name)}</a></div>
\t\t<div class="ib-muted">${AUTHOR.jobTitle}</div>${meta ? `\n\t\t<div class="ib-muted ib-author-meta">${meta}</div>` : ""}
\t</div>
</div>`;

function breadcrumbSchema(url: string, items: { name: string; path?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.path ? { item: SITE + it.path } : {}) })),
  };
}

/** WebSite and Organization nodes as on every other page (the Organization becomes the Dentist from Site settings). */
const siteNodes = [
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
  {
    "@type": "Organization",
    "@id": `${SITE}/#organization`,
    name: "Ideal Dental Solutions",
    url: `${SITE}/`,
    logo: {
      "@type": "ImageObject",
      inLanguage: "en-US",
      "@id": `${SITE}/#/schema/logo/image/`,
      url: `${SITE}/wp-content/uploads/2026/07/image__4_-removebg-preview.png`,
      contentUrl: `${SITE}/wp-content/uploads/2026/07/image__4_-removebg-preview.png`,
      width: 831,
      height: 300,
      caption: "idealdental",
    },
    image: { "@id": `${SITE}/#/schema/logo/image/` },
  },
];

function seoFor(opts: { title: string; description: string; path: string; type: "article" | "website"; image?: string; published?: string; modified?: string; readTime?: string; graph: object[] }): Seo {
  const url = SITE + opts.path;
  const image = opts.image || "/og/home.jpg";
  return {
    title: opts.title,
    description: opts.description,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    canonical: url,
    ogLocale: "en_US",
    ogType: opts.type,
    ogTitle: opts.title,
    ogDescription: opts.description,
    ogUrl: url,
    ogSiteName: "Ideal Dental Solutions",
    publishedTime: opts.published ? iso(opts.published) : undefined,
    modifiedTime: opts.modified ? iso(opts.modified) : undefined,
    ogImage: SITE + image,
    ogImageWidth: opts.image ? "1040" : "1200",
    ogImageHeight: opts.image ? "780" : "630",
    ogImageType: opts.image ? "image/webp" : "image/jpeg",
    author: opts.type === "article" ? AUTHOR.name : undefined,
    twitterCard: "summary_large_image",
    twitterMisc: opts.readTime
      ? [
          { _key: "t1", label: "Written by", data: AUTHOR.name },
          { _key: "t2", label: "Est. reading time", data: opts.readTime },
        ]
      : undefined,
    schema: JSON.stringify({ "@context": "https://schema.org", "@graph": [...opts.graph, ...siteNodes] }),
  };
}

function pageDoc(id: string, title: string, path: string, seo: Seo, bodyClass: string, html: string, extra: Partial<PageDoc> = {}): PageDoc {
  return {
    _id: id,
    _type: "page",
    title,
    path,
    seo,
    bodyClass,
    shell: SHELL,
    frameTpl: `<main id="main" class="site-main hfeed" tabindex="-1">${STYLE}[[@html:blogHtml]]</main>`,
    blogHtml: html,
    ...extra,
  };
}

/** A post as a card: photo, category pill, title, excerpt, author, date and reading time. */
function postCard(p: BlogPost) {
  const c = categoryOf(p);
  const href = postPath(p);
  return `<li><article class="ib-card ib-lift">
\t<a href="${href}" class="ib-card-photo" tabindex="-1" aria-hidden="true">${photo(p.photo, "(min-width: 1024px) 360px, (min-width: 640px) 45vw, 88vw", { alt: "" })}</a>
\t<div class="ib-card-text">
\t\t<span class="ib-pill">${escapeHtml(c.name)}</span>
\t\t<h3><a href="${href}">${escapeHtml(p.title)}</a></h3>
\t\t<p>${escapeHtml(p.description)}</p>
\t\t<div class="ib-card-meta"><img src="${AUTHOR.photo}" width="32" height="32" alt="" loading="lazy" decoding="async"><span class="ib-strong">${AUTHOR.short}</span><span aria-hidden="true">·</span><time datetime="${iso(p.published)}">${longDate(p.published)}</time><span aria-hidden="true">·</span><span>${minutes(p)} min read</span></div>
\t</div>
</article></li>`;
}

const ctaButtons = () => `<div class="ib-cta-buttons">
\t<a class="ib-btn ib-btn-bright" href="/appointment/">Request an appointment</a>
\t<a class="ib-phone" href="${PHONE_HREF}">${icon("phone", "ib-icon-sm")}${PHONE}</a>
</div>`;

/* ---------------- post page ---------------- */

function postDoc(p: BlogPost): PageDoc {
  const path = postPath(p);
  const url = SITE + path;
  const c = categoryOf(p);
  const crumbs = [{ name: "Home", path: "/" }, { name: "Blog", path: BLOG_PATH }, { name: p.title }];
  const modified = p.modified || p.published;
  const mins = minutes(p);

  const toc = [...p.sections.map((s) => ({ id: slugId(s.heading), label: s.heading })), { id: "faq", label: "Frequently asked questions" }];
  const tocList = `<ol class="ib-toc-list">${toc.map((t, i) => `<li><a href="#${t.id}"><span aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(t.label)}</a></li>`).join("")}</ol>`;

  // The call-to-action band sits after the third section (the fourth in long posts), as in the TTR design.
  const ctaAfter = Math.min(p.sections.length, p.sections.length >= 6 ? 4 : 3) - 1;
  const sections = p.sections
    .map(
      (s, i) => `<section aria-labelledby="${slugId(s.heading)}">
\t<h2 id="${slugId(s.heading)}" class="ib-h2">${escapeHtml(s.heading)}</h2>
\t${s.html}
</section>${
        i === ctaAfter
          ? `\n<aside class="ib-band" aria-label="Request an appointment">
\t<p>${escapeHtml(p.cta.heading)}</p>
\t${ctaButtons()}
</aside>`
          : ""
      }`,
    )
    .join("\n");

  const facts = p.facts?.length
    ? `<aside class="ib-facts ib-cardbox" aria-label="At a glance">
\t<div class="ib-eyebrow">At a glance</div>
\t<ul>${p.facts.map((f) => `<li><span class="ib-facts-icon">${icon(f.icon)}</span><span><span class="ib-muted">${escapeHtml(f.label)}</span><span class="ib-strong">${escapeHtml(f.value)}</span></span></li>`).join("")}</ul>
</aside>`
    : "";

  const faq = p.faq
    .map(
      (f, i) => `<details class="ib-faq ib-cardbox"${i === 0 ? " open" : ""}>
\t<summary><h3>${escapeHtml(f.q)}</h3><span class="ib-toggle" aria-hidden="true"></span></summary>
\t<div class="ib-faq-answer">${f.a}</div>
</details>`,
    )
    .join("\n");

  const others = sorted()
    .filter((o) => o.slug !== p.slug)
    .slice(0, 3);
  const sources = p.sources.map((s) => `<li><a href="${escapeAttr(s.url)}" rel="noopener" target="_blank">${escapeHtml(s.title)}</a></li>`).join("");

  const html = `
<article class="ib ib-post" id="post-${escapeAttr(p.slug)}">
<header class="ib-hero">
\t<div class="ib-box ib-hero-grid">
\t\t<div>
\t\t\t<nav class="ib-crumbs ib-rise" aria-label="Breadcrumb"><a href="${BLOG_PATH}">Blog</a><span aria-hidden="true">/</span><a class="ib-pill" href="${BLOG_PATH}#cat-${c.key}">${escapeHtml(c.name)}</a></nav>
\t\t\t<h1 class="ib-title ib-rise" style="--i:1">${escapeHtml(p.title)}</h1>
\t\t\t<div class="ib-rise" style="--i:2">${authorCard(`<time datetime="${iso(p.published)}">${longDate(p.published)}</time><span aria-hidden="true"> · </span>${mins} min read`)}</div>
\t\t</div>
\t\t<div class="ib-hero-photo">
\t\t\t<span class="ib-hero-frame" aria-hidden="true"></span>
\t\t\t<div class="ib-hero-img">${photo(p.photo, "(min-width: 1024px) 520px, 88vw", { eager: true })}</div>
\t\t</div>
\t</div>
</header>
<div class="ib-paper">
\t<div class="ib-box ib-layout">
\t\t<div class="ib-main">
\t\t\t<div class="ib-inshort ib-cardbox"><div class="ib-eyebrow">In short</div>${p.answer}</div>
\t\t\t<details class="ib-toc ib-toc-mobile ib-cardbox"><summary><span class="ib-eyebrow">In this article</span><span class="ib-toggle" aria-hidden="true"></span></summary><nav aria-label="In this article">${tocList}</nav></details>
\t\t\t${facts}
\t\t\t<div class="ib-body">
${sections}
\t\t\t\t<section aria-labelledby="faq">
\t\t\t\t\t<h2 id="faq" class="ib-h2">Frequently asked questions</h2>
\t\t\t\t\t<div class="ib-faqs">${faq}</div>
\t\t\t\t</section>
\t\t\t</div>
\t\t\t<aside class="ib-related" aria-labelledby="related-title">
\t\t\t\t<h2 id="related-title" class="ib-eyebrow">Related service</h2>
\t\t\t\t<div class="ib-related-card ib-cardbox ib-lift">
\t\t\t\t\t<a href="${escapeAttr(p.service.path)}" class="ib-related-photo" tabindex="-1" aria-hidden="true">${photo(c.photo, "(min-width: 640px) 240px, 88vw", { alt: "" })}</a>
\t\t\t\t\t<div>
\t\t\t\t\t\t<h3><a href="${escapeAttr(p.service.path)}">${escapeHtml(p.service.label)}</a></h3>
\t\t\t\t\t\t<p>${escapeHtml(p.cta.text)}</p>
\t\t\t\t\t\t<a class="ib-btn ib-btn-primary" href="${escapeAttr(p.service.path)}">Learn more<span class="ib-sr"> about ${escapeHtml(p.service.label.toLowerCase())}</span></a>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</aside>
\t\t\t<footer class="ib-bio ib-cardbox" aria-labelledby="author-title">
\t\t\t\t<h2 id="author-title" class="ib-eyebrow">About the author</h2>
\t\t\t\t<div class="ib-bio-row">
\t\t\t\t\t<img src="${AUTHOR.photoLarge}" width="120" height="120" alt="${escapeAttr(AUTHOR.name)}" loading="lazy" decoding="async">
\t\t\t\t\t<div>
\t\t\t\t\t\t<h3>${escapeHtml(AUTHOR.name)}</h3>
\t\t\t\t\t\t<div class="ib-muted">${AUTHOR.jobTitle}</div>
\t\t\t\t\t\t<p>${escapeHtml(AUTHOR.bio)}</p>
\t\t\t\t\t\t<a class="ib-btn ib-btn-outline" href="${AUTHOR.path}">More about ${AUTHOR.short}</a>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</footer>
\t\t\t<div class="ib-sources">
\t\t\t\t<p class="ib-muted">This guide is general information, not a diagnosis or treatment plan. Every mouth is different, so the right option for you depends on an exam with your dentist.</p>
\t\t\t\t<h2 class="ib-eyebrow">Sources</h2>
\t\t\t\t<ul>${sources}</ul>
\t\t\t</div>
\t\t</div>
\t\t<aside class="ib-side" aria-label="In this article">
\t\t\t<div class="ib-sticky">
\t\t\t\t<nav class="ib-toc ib-cardbox" aria-labelledby="toc-title"><div id="toc-title" class="ib-eyebrow">In this article</div>${tocList}</nav>
\t\t\t\t<div class="ib-sidecta">
\t\t\t\t\t<p class="ib-strong">Want to talk it through?</p>
\t\t\t\t\t<p>The first visit is an exam and a conversation about your options.</p>
\t\t\t\t\t<a class="ib-btn ib-btn-bright" href="/appointment/">Request an appointment</a>
\t\t\t\t\t<a class="ib-phone" href="${PHONE_HREF}">${icon("phone", "ib-icon-sm")}${PHONE}</a>
\t\t\t\t</div>
\t\t\t</div>
\t\t</aside>
\t</div>
</div>
</article>${
    others.length
      ? `
<section class="ib ib-more" aria-labelledby="more-posts">
\t<div class="ib-box">
\t\t<div class="ib-more-head"><h2 id="more-posts" class="ib-h2">More from the blog</h2><a class="ib-textlink" href="${BLOG_PATH}">All articles</a></div>
\t\t<ul class="ib-grid">${others.map(postCard).join("")}</ul>
\t</div>
</section>`
      : ""
  }`;

  const imagePath = `/images/blog/${p.photo}-1040.webp`;
  const graph = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      isPartOf: { "@id": url },
      headline: p.title,
      description: p.description,
      datePublished: iso(p.published),
      dateModified: iso(modified),
      author: { "@type": "Person", "@id": `${SITE}${AUTHOR.path}#person`, name: AUTHOR.name, jobTitle: AUTHOR.jobTitle, url: SITE + AUTHOR.path },
      publisher: { "@id": `${SITE}/#organization` },
      mainEntityOfPage: { "@id": url },
      image: SITE + imagePath,
      wordCount: words(p),
      articleSection: c.name,
      inLanguage: "en-US",
    },
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name: p.seoTitle,
      isPartOf: { "@id": `${SITE}/#website` },
      datePublished: iso(p.published),
      dateModified: iso(modified),
      description: p.description,
      breadcrumb: { "@id": `${url}#breadcrumb` },
      inLanguage: "en-US",
      potentialAction: [{ "@type": "ReadAction", target: [url] }],
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      isPartOf: { "@id": url },
      mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: strip(f.a) } })),
    },
    breadcrumbSchema(url, crumbs),
  ];

  const seo = seoFor({ title: p.seoTitle, description: p.description, path, type: "article", image: imagePath, published: p.published, modified, readTime: `${mins} minutes`, graph });
  return pageDoc(`blog-${p.slug}`, p.seoTitle, path, seo, BODY_CLASS, html, {
    published: iso(p.published),
    excerpt: p.description,
    authorName: AUTHOR.name,
  });
}

/* ---------------- list page ---------------- */

function listDoc(): PageDoc {
  const url = SITE + BLOG_PATH;
  const crumbs = [{ name: "Home", path: "/" }, { name: "Blog" }];
  const list = sorted();
  const groups = CATEGORIES.map((c) => ({ ...c, posts: list.filter((p) => categoryOf(p).key === c.key) })).filter((g) => g.posts.length);
  const chips = `<nav class="ib-chips" aria-label="Categories">
\t<a href="#articles" class="ib-chip ib-chip-active">All articles <span>${list.length}</span></a>
\t${groups.map((g) => `<a href="#cat-${g.key}" class="ib-chip">${escapeHtml(g.name)} <span>${g.posts.length}</span></a>`).join("\n\t")}
</nav>`;
  const sections = groups
    .map(
      (g) => `<section id="cat-${g.key}" aria-labelledby="cat-${g.key}-title" class="ib-group">
\t<h2 id="cat-${g.key}-title" class="ib-h2">${escapeHtml(g.name)}</h2>
\t<p class="ib-group-blurb">${escapeHtml(g.blurb)} <a class="ib-textlink" href="${g.path}">See the service page<span class="ib-sr"> for ${escapeHtml(g.name.toLowerCase())}</span></a></p>
\t<ul class="ib-grid">${g.posts.map(postCard).join("")}</ul>
</section>`,
    )
    .join("\n");
  const html = `
<div class="ib ib-list">
<section class="ib-hero">
\t<div class="ib-box ib-hero-list">
\t\t<p class="ib-eyebrow ib-rise">Blog</p>
\t\t<h1 class="ib-title ib-rise" style="--i:1">Dental health, explained by Dr. Mehdi Adili</h1>
\t\t<p class="ib-lede ib-rise" style="--i:2">Plain answers to the questions patients ask us in McLean, from a prosthodontist who treats them.</p>
\t\t<div class="ib-rise" style="--i:3">${authorCard()}</div>
\t</div>
</section>
<div class="ib-paper">
\t<div class="ib-box">
\t\t${chips}
\t\t<div id="articles">
${sections}
\t\t</div>
\t</div>
</div>
<section class="ib-ask" aria-labelledby="ask-title">
\t<div class="ib-box ib-ask-row">
\t\t<div>
\t\t\t<h2 id="ask-title">Have a question about your teeth?</h2>
\t\t\t<p>Ask us at your next visit, or request an appointment and we will go through your options with you.</p>
\t\t</div>
\t\t${ctaButtons()}
\t</div>
</section>
</div>`;
  const description = "Patient guides from Ideal Dental Solutions in McLean, VA: plain answers about dental implants, Invisalign, gum disease, root canals and more.";
  const title = "Dental Health Blog: Patient Guides | Ideal Dental Solutions";
  const graph = [
    {
      "@type": "CollectionPage",
      "@id": url,
      url,
      name: title,
      description,
      isPartOf: { "@id": `${SITE}/#website` },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      inLanguage: "en-US",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: list.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + postPath(p), name: p.title })),
      },
    },
    breadcrumbSchema(url, crumbs),
  ];
  return pageDoc("blog", "Blog", BLOG_PATH, seoFor({ title, description, path: BLOG_PATH, type: "website", graph }), LIST_BODY_CLASS, html);
}

/* ---------------- styles ---------------- */

/*
 * Tokens: Ideal's orange (#ff6310, theme palette 1) for rules, borders and
 * the bright button on charcoal; a deeper orange (#c2410c) for links and
 * buttons on light backgrounds, so they pass WCAG AA; charcoal (#111518,
 * palette 4) for headings and dark bands. Motion is transform only (never
 * opacity), so it does not hold up the first paint. The fallback font face
 * is sized to Urbanist so text does not shift when the web font arrives.
 */
const STYLE = `<style id="ib-blog-css">
@font-face{font-family:"Urbanist Fallback";src:local("Arial"),local("Liberation Sans"),local("Helvetica");size-adjust:97%;ascent-override:95%;descent-override:25%;line-gap-override:0%}
.ib{--o:#ff6310;--od:#c2410c;--od2:#9a3412;--ink:#111518;--body:#2f3539;--muted:#5a636a;--paper:#fbf8f5;--hero:#fdf1e8;--tint:#ffe6d5;--line:#ece6e0;--shadow:0 1px 2px rgb(17 21 24/.04),0 6px 20px rgb(17 21 24/.06);font-family:Urbanist,"Urbanist Fallback",sans-serif;color:var(--body);font-size:17px;line-height:1.7}
.ib *,.ib *::before,.ib *::after{box-sizing:border-box}
.ib h1,.ib h2,.ib h3,.ib p,.ib ul,.ib ol{margin:0}
.ib h1,.ib h2,.ib h3{font-family:inherit;color:var(--ink);letter-spacing:0}
.ib a{color:var(--od)}
.ib img{max-width:100%;display:block}
.ib-box{width:min(88vw,1140px);margin-inline:auto}
@media (min-width:690px){.ib-box{width:min(90vw,1140px)}}
.ib-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ib-muted{color:var(--muted)}
.ib-strong{font-weight:600;color:var(--ink)}
.ib .ib-eyebrow{font-size:12px;font-weight:700;line-height:1.5;text-transform:uppercase;letter-spacing:.12em;color:var(--od)}
.ib-pill{display:inline-flex;align-items:center;border-radius:999px;background:var(--tint);padding:4px 12px;font-size:12px;font-weight:700;line-height:1.4;text-transform:uppercase;letter-spacing:.04em;color:var(--od2);text-decoration:none}
.ib a.ib-pill{color:var(--od2)}
.ib a.ib-pill:hover{background:var(--od);color:#fff}
.ib-cardbox{border-radius:10px;background:#fff;box-shadow:var(--shadow)}
.ib-lift{transition:translate .3s,box-shadow .3s}
.ib-lift:hover{translate:0 -4px;box-shadow:0 18px 40px rgb(17 21 24/.12)}
.ib-icon{width:20px;height:20px}
.ib-icon-sm{width:16px;height:16px}
.ib .ib-textlink{font-weight:600;color:var(--od);text-decoration:underline;text-underline-offset:3px}
.ib .ib-textlink:hover{color:var(--od2)}
.ib-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border-radius:6px;padding:12px 24px;font-size:15px;font-weight:600;line-height:1.2;text-decoration:none;transition:background-color .3s,color .3s,translate .3s,box-shadow .3s}
.ib-btn:hover{translate:0 -2px}
.ib .ib-btn-primary{background:var(--od);color:#fff}
.ib .ib-btn-primary:hover{background:var(--od2);box-shadow:0 12px 24px rgb(194 65 12/.25)}
.ib .ib-btn-bright{background:var(--o);color:var(--ink)}
.ib .ib-btn-bright:hover{background:#fff;box-shadow:0 12px 24px rgb(0 0 0/.25)}
.ib .ib-btn-outline{border:1px solid var(--ink);color:var(--ink)}
.ib .ib-btn-outline:hover{background:var(--ink);color:#fff}
.ib .ib-phone{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-weight:600;color:#fff;text-decoration:none}
.ib .ib-phone:hover{text-decoration:underline}
.ib-cta-buttons{display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;margin-top:20px}
@keyframes ib-rise{from{transform:translateY(14px)}to{transform:none}}
@keyframes ib-settle{from{transform:scale(1.05)}to{transform:none}}
@media (prefers-reduced-motion:no-preference){.ib-rise{animation:ib-rise .8s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(var(--i,0)*110ms)}.ib-hero-img img{animation:ib-settle 1.4s cubic-bezier(.16,1,.3,1) both}}
/* hero */
.ib-hero{position:relative;overflow:hidden;background:var(--hero)}
.ib-hero::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 90% at 85% 10%,rgb(255 214 186/.9),transparent 70%)}
.ib-hero-grid{position:relative;display:grid;gap:40px;padding:40px 0 48px}
.ib-hero-list{position:relative;padding:56px 0}
.ib-crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:12px;font-size:14px;line-height:1.4}
.ib .ib-crumbs>a:first-child{font-weight:600;color:#4a5157;text-decoration:none}
.ib .ib-crumbs>a:first-child:hover{color:var(--od)}
.ib-crumbs>span{color:#9aa0a4}
.ib .ib-title{margin-top:20px;font-size:2rem;font-weight:600;line-height:1.1}
.ib-hero-list .ib-title{margin-top:12px;max-width:760px}
.ib .ib-lede{margin-top:20px;max-width:620px;font-size:18px;line-height:1.6}
.ib-author{display:inline-flex;max-width:100%;align-items:center;gap:16px;margin-top:32px;border-radius:10px;background:rgb(255 255 255/.9);padding:12px 20px 12px 12px;box-shadow:var(--shadow),0 0 0 1px rgb(0 0 0/.05);font-size:14px;line-height:1.4}
.ib-author img{width:56px;height:56px;flex:none;border-radius:50%;object-fit:cover}
.ib-author-name{font-weight:600;color:var(--ink)}
.ib .ib-author-name a{color:var(--ink);text-decoration:underline;text-decoration-color:rgb(194 65 12/.45);text-underline-offset:4px}
.ib .ib-author-name a:hover{color:var(--od)}
.ib-author-meta{margin-top:4px}
.ib-hero-photo{position:relative}
.ib-hero-frame{position:absolute;inset:0;translate:12px 12px;border:1px solid rgb(255 99 16/.35);border-radius:14px}
.ib-hero-img{position:relative;aspect-ratio:4/3;overflow:hidden;border-radius:14px;background:var(--tint);box-shadow:0 24px 60px rgb(17 21 24/.18)}
.ib-hero-img img{width:100%;height:100%;object-fit:cover}
/* page body */
.ib-paper{background:var(--paper);padding:40px 0 56px}
.ib-layout{display:grid;gap:40px}
.ib-main{min-width:0}
.ib-inshort{border-left:4px solid var(--o);padding:24px}
.ib .ib-inshort p{margin-top:8px;font-size:18px;line-height:1.65;color:var(--ink)}
.ib .ib-inshort p+p{margin-top:12px}
.ib-toc{padding:20px}
.ib-toc-mobile{margin-top:20px;padding:0}
.ib-toc-mobile summary,.ib-faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;cursor:pointer;list-style:none}
.ib-toc-mobile summary{min-height:56px;padding:12px 16px}
.ib-toc-mobile summary::-webkit-details-marker,.ib-faq summary::-webkit-details-marker{display:none}
.ib-toc-mobile nav{padding:0 12px 12px}
.ib .ib-toc-list{list-style:none;padding:0;margin-top:12px}
.ib .ib-toc-mobile .ib-toc-list{margin-top:0}
.ib .ib-toc-list li{margin:0}
.ib .ib-toc-list a{display:flex;gap:12px;border-radius:6px;padding:7px 8px;font-size:15px;line-height:1.4;color:var(--body);text-decoration:none}
.ib .ib-toc-list a:hover{background:var(--paper);color:var(--od)}
.ib-toc-list span{width:20px;flex:none;font-size:12px;font-weight:700;line-height:1.75;color:var(--od)}
.ib-toggle{position:relative;display:flex;width:32px;height:32px;flex:none;align-items:center;justify-content:center;border-radius:50%;background:var(--tint)}
.ib-toggle::before,.ib-toggle::after{content:"";position:absolute;width:12px;height:2px;border-radius:1px;background:var(--od)}
.ib-toggle::after{transform:rotate(90deg);transition:transform .2s}
details[open]>summary .ib-toggle::after{transform:none}
.ib-facts{margin-top:24px;padding:24px}
.ib .ib-facts ul{list-style:none;padding:0;margin-top:16px;display:grid;gap:16px}
.ib .ib-facts li{display:flex;gap:12px;align-items:flex-start;margin:0;line-height:1.4}
.ib-facts li>span:last-child{display:flex;flex-direction:column;gap:2px}
.ib-facts .ib-muted{font-size:14px}
.ib-facts-icon{display:flex;width:36px;height:36px;flex:none;align-items:center;justify-content:center;border-radius:50%;background:var(--paper);color:var(--od)}
/* article text */
.ib-body section{margin-top:48px}
.ib .ib-h2{position:relative;padding-top:16px;font-size:1.625rem;font-weight:600;line-height:1.25;scroll-margin-top:110px}
.ib .ib-h2::before{content:"";position:absolute;top:0;left:0;width:40px;height:3px;border-radius:2px;background:var(--o)}
.ib .ib-body p{margin-top:20px}
.ib .ib-body h2+p,.ib .ib-body h3+p{margin-top:16px}
.ib .ib-body section>h3{margin-top:32px;font-size:1.25rem;font-weight:600;line-height:1.35}
.ib .ib-body section>ul,.ib .ib-body section>ol{margin-top:20px;padding-left:1.3em}
.ib .ib-body section>ul>li,.ib .ib-body section>ol>li{margin-top:8px}
.ib-body li::marker{color:var(--od)}
.ib .ib-body a{text-decoration:underline;text-decoration-color:rgb(194 65 12/.4);text-underline-offset:3px}
.ib .ib-body .ib-btn,.ib .ib-body .ib-phone{text-decoration:none}
.ib .ib-body .ib-phone:hover{text-decoration:underline}
.ib-body strong{color:var(--ink)}
/* numbered steps (ordered lists marked ib-steps) */
.ib .ib-body ol.ib-steps{position:relative;list-style:none;margin-top:28px;padding:24px 24px 24px 68px;border-radius:10px;background:#fff;box-shadow:var(--shadow);counter-reset:step}
.ib .ib-body ol.ib-steps::before{content:"";position:absolute;left:43px;top:40px;bottom:40px;width:2px;background:rgb(255 99 16/.25)}
.ib .ib-body ol.ib-steps>li{position:relative;margin-top:20px;counter-increment:step}
.ib .ib-body ol.ib-steps>li:first-child{margin-top:0}
.ib .ib-body ol.ib-steps>li::before{content:counter(step);position:absolute;left:-41px;top:0;display:flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:50%;background:var(--o);box-shadow:0 0 0 4px #fff;font-size:14px;font-weight:700;line-height:1;color:var(--ink)}
/* comparison tables */
.ids-table-wrap{margin-top:24px;overflow-x:auto;border-radius:10px;background:#fff;box-shadow:var(--shadow)}
.ids-table{width:100%;border-collapse:collapse;font-size:15px;line-height:1.5}
.ids-table th,.ids-table td{padding:12px 14px;text-align:left;vertical-align:top;border:0;border-bottom:1px solid var(--line)}
.ids-table tr:last-child>*{border-bottom:0}
.ids-table thead th{background:var(--ink);color:#fff;font-weight:600}
.ids-table tbody th{font-weight:600;color:var(--ink);background:#fdf6f0}
.ib .ib-body .ids-table-wrap+p{margin-top:12px;font-size:15px;color:var(--muted)}
/* call-to-action band */
.ib-band{position:relative;overflow:hidden;margin-top:48px;border-radius:10px;background:var(--ink);padding:28px;color:#fff}
.ib-band::before,.ib-band::after{content:"";position:absolute;border-radius:50%;pointer-events:none}
.ib-band::before{right:-48px;top:-64px;width:192px;height:192px;background:rgb(255 99 16/.14)}
.ib-band::after{right:64px;bottom:-80px;width:160px;height:160px;background:rgb(255 255 255/.05)}
.ib .ib-band>p{position:relative;margin:0;max-width:32ch;font-size:20px;font-weight:600;line-height:1.35;color:#fff}
.ib-band .ib-cta-buttons{position:relative}
/* FAQ */
.ib-faqs{display:grid;gap:12px;margin-top:24px}
.ib-faq{transition:box-shadow .3s}
.ib-faq:hover{box-shadow:0 12px 32px rgb(17 21 24/.1)}
.ib-faq summary{padding:18px 20px}
.ib .ib-faq h3{margin:0;font-size:17px;font-weight:600;line-height:1.4}
.ib-faq-answer{padding:0 20px 20px;font-size:16px}
.ib .ib-faq-answer p{margin:0}
.ib .ib-faq-answer p+p{margin-top:12px}
/* related service, author, sources */
.ib-related{margin-top:56px}
.ib-related-card{margin-top:12px;overflow:hidden}
.ib-related-photo{display:block;aspect-ratio:16/10;background:var(--tint)}
.ib-related-photo img{width:100%;height:100%;object-fit:cover}
.ib-related-card>div{padding:24px}
.ib .ib-related-card h3{font-size:20px;font-weight:600;line-height:1.35}
.ib .ib-related-card h3 a{color:var(--ink);text-decoration:none}
.ib .ib-related-card h3 a:hover{color:var(--od)}
.ib .ib-related-card p{margin:8px 0 20px;font-size:15px;line-height:1.6}
.ib-bio{margin-top:48px;padding:24px}
.ib-bio-row{display:flex;flex-direction:column;gap:20px;margin-top:16px}
.ib-bio-row img{width:120px;height:120px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 4px var(--paper)}
.ib .ib-bio h3{font-size:20px;font-weight:600;line-height:1.35}
.ib .ib-bio p{margin:12px 0 20px;font-size:16px}
.ib-sources{margin-top:40px;font-size:15px}
.ib .ib-sources>p{font-size:14px}
.ib .ib-sources h2{margin-top:24px}
.ib .ib-sources ul{margin-top:8px;padding-left:1.2em}
.ib .ib-sources li{margin-top:6px;word-break:break-word}
/* sidebar (desktop) */
.ib-side{display:none}
.ib-sticky{position:sticky;top:110px;display:grid;gap:20px}
.ib-sidecta{border-radius:10px;background:var(--ink);padding:20px;color:#fff}
.ib .ib-sidecta p{font-size:14px;line-height:1.5;color:rgb(255 255 255/.8)}
.ib .ib-sidecta p+p{margin-top:4px}
.ib .ib-sidecta .ib-strong{font-size:16px;color:#fff}
.ib-sidecta .ib-btn{width:100%;margin-top:16px}
.ib .ib-sidecta .ib-phone{width:100%;justify-content:center;margin-top:8px;font-size:14px}
/* cards and grids */
.ib .ib-grid{list-style:none;padding:0;margin-top:24px;display:grid;gap:24px}
.ib .ib-grid>li{margin:0}
.ib-card{display:flex;height:100%;flex-direction:column;overflow:hidden;border-radius:10px;background:#fff;box-shadow:var(--shadow)}
.ib-card-photo{display:block;aspect-ratio:16/9;overflow:hidden;background:var(--tint)}
.ib-card-photo img{width:100%;height:100%;object-fit:cover;transition:transform .7s}
.ib-card:hover .ib-card-photo img{transform:scale(1.04)}
.ib-card-text{display:flex;flex:1;flex-direction:column;align-items:flex-start;padding:20px}
.ib .ib-card h3{margin-top:12px;font-size:20px;font-weight:600;line-height:1.35}
.ib .ib-card h3 a{color:var(--ink);text-decoration:none}
.ib .ib-card h3 a:hover{color:var(--od)}
.ib .ib-card p{margin-top:8px;font-size:15px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ib-card-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-top:auto;padding-top:20px;font-size:14px;line-height:1.4;color:var(--muted)}
.ib-card-meta img{width:32px;height:32px;border-radius:50%;object-fit:cover}
.ib-more{background:#fff;padding:56px 0 64px}
.ib-more-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px}
/* list page */
.ib-chips{display:flex;flex-wrap:wrap;gap:8px}
.ib .ib-chip{display:inline-flex;align-items:center;gap:8px;min-height:44px;border:1px solid rgb(17 21 24/.12);border-radius:999px;background:#fff;padding:8px 16px;font-size:14px;font-weight:600;line-height:1.2;color:var(--ink);text-decoration:none;transition:border-color .3s,color .3s,translate .3s,box-shadow .3s}
.ib .ib-chip:hover{translate:0 -2px;border-color:var(--od);color:var(--od);box-shadow:0 8px 20px rgb(17 21 24/.08)}
.ib-chip span{border-radius:999px;background:var(--paper);padding:0 8px;font-size:12px;color:var(--muted)}
.ib .ib-chip-active,.ib .ib-chip-active:hover{border-color:var(--ink);background:var(--ink);color:#fff}
.ib-chip-active span{background:rgb(255 255 255/.18);color:#fff}
.ib-group{margin-top:48px;scroll-margin-top:110px}
.ib .ib-group-blurb{margin-top:8px;max-width:620px;font-size:15px;color:var(--muted)}
#articles{scroll-margin-top:110px}
.ib-ask{background:var(--ink);padding:56px 0;color:#fff}
.ib-ask-row{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
.ib .ib-ask h2{font-size:24px;font-weight:600;line-height:1.3;color:#fff}
.ib .ib-ask p{margin-top:8px;max-width:560px;color:rgb(255 255 255/.8)}
@media (min-width:640px){.ib .ib-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ib-related-card{display:grid;grid-template-columns:240px minmax(0,1fr)}.ib-related-photo{aspect-ratio:auto;height:100%;min-height:220px}.ib-bio-row{flex-direction:row;align-items:flex-start}.ib-bio-row img{flex:none}.ib .ib-facts ul{grid-template-columns:1fr 1fr}.ib .ib-title{font-size:2.5rem}}
@media (min-width:768px){.ib{font-size:18px}.ib .ib-h2{font-size:1.875rem}.ib-inshort{padding:28px}.ib .ib-inshort p{font-size:20px}.ib-band{padding:36px}.ib .ib-band>p{font-size:24px}.ib-bio{padding:32px}}
@media (min-width:1024px){.ib-hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,520px);align-items:center;gap:64px;padding:64px 0}.ib-hero-list{padding:80px 0}.ib .ib-title{font-size:2.875rem}.ib-hero-img{aspect-ratio:5/4}.ib-paper{padding:64px 0 80px}.ib-layout{grid-template-columns:minmax(0,1fr) 280px;gap:64px}.ib-main{max-width:720px}.ib-side{display:block}.ib-toc-mobile{display:none}.ib .ib-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.ib-ask-row{flex-direction:row;align-items:center;justify-content:space-between;gap:32px}.ib-ask .ib-cta-buttons{margin-top:0;flex:none}}
</style>`;
