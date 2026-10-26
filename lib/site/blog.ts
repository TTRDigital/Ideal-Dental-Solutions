import { posts, type BlogPost } from "../../content/blog/posts.ts";
import { escapeAttr, escapeHtml } from "../render/html.ts";
import type { Seo } from "../render/seo.ts";
import type { PageDoc, Resolved } from "./render.ts";

/**
 * Patient Guides blog (/blog/ and /blog/<slug>/). The posts live in the repo
 * (content/blog/posts.ts), not in the CMS, and are printed in the same page
 * shell as the Dr. Adili profile (Blocksy + block editor styles), so header,
 * footer, fonts and colours are the site's own.
 */

export type { BlogPost };

const SITE = "https://idealdentalsolutions.com";
const SHELL = "6c7da4a2d3";
const BLOG_PATH = "/blog/";
const BLOG_NAME = "Patient Guides";
const AUTHOR = {
  name: "Dr. Mehdi S. Adili, DDS",
  path: "/dr-mehdi-adili/",
  jobTitle: "Prosthodontist",
  photo: "/wp-content/uploads/2026/05/img-2364234-269x300.png",
  bio: "Dr. Mehdi S. Adili, DDS, is a prosthodontist at Ideal Dental Solutions in McLean. He earned his Doctor of Dental Surgery degree from Georgetown University and completed specialty training in prosthodontics at Virginia Commonwealth University. His work focuses on dental implants, crowns, bridges, dentures and full-mouth restoration.",
};
const BODY_CLASS = "wp-singular post-template-default single single-post single-format-standard wp-custom-logo wp-embed-responsive wp-theme-blocksy elementor-default elementor-kit-5 ct-elementor-default-template";
const LIST_BODY_CLASS = "blog wp-custom-logo wp-embed-responsive wp-theme-blocksy elementor-default elementor-kit-5 ct-elementor-default-template";

export const postPath = (p: BlogPost) => `${BLOG_PATH}${p.slug}/`;

const sorted = () => [...posts].sort((a, b) => b.published.localeCompare(a.published));

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

const readingTime = (p: BlogPost) => `${Math.max(1, Math.round(words(p) / 230))} minute read`;

function slugId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function breadcrumbs(items: { name: string; path?: string }[]) {
  const li = items
    .map((it, i) => {
      const sep = i ? '<span class="ids-sep" aria-hidden="true">/</span>' : "";
      return it.path ? `${sep}<a href="${escapeAttr(it.path)}">${escapeHtml(it.name)}</a>` : `${sep}<span aria-current="page">${escapeHtml(it.name)}</span>`;
    })
    .join("");
  return `<nav class="ids-breadcrumbs" aria-label="Breadcrumb">${li}</nav>`;
}

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
    ogImageWidth: opts.image ? undefined : "1200",
    ogImageHeight: opts.image ? undefined : "630",
    ogImageType: opts.image ? undefined : "image/jpeg",
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

/* ---------------- post page ---------------- */

function postDoc(p: BlogPost): PageDoc {
  const path = postPath(p);
  const url = SITE + path;
  const crumbs = [{ name: "Home", path: "/" }, { name: BLOG_NAME, path: BLOG_PATH }, { name: p.title }];
  const modified = p.modified || p.published;
  const readTime = readingTime(p);

  const toc = p.sections.map((s) => `<li><a href="#${slugId(s.heading)}">${escapeHtml(s.heading)}</a></li>`).join("");
  const sections = p.sections.map((s) => `<h2 id="${slugId(s.heading)}" class="wp-block-heading">${escapeHtml(s.heading)}</h2>\n${s.html}`).join("\n");
  const faq = p.faq.map((f) => `<details class="ids-faq-item"><summary><h3>${escapeHtml(f.q)}</h3></summary><div class="ids-faq-answer">${f.a}</div></details>`).join("\n");
  const sources = p.sources.map((s) => `<li><a href="${escapeAttr(s.url)}" rel="noopener" target="_blank">${escapeHtml(s.title)}</a></li>`).join("");
  const figure = p.image
    ? `<figure class="wp-block-image size-large ids-figure"><img src="${escapeAttr(p.image.src)}" width="${p.image.width}" height="${p.image.height}" alt="${escapeAttr(p.image.alt)}" loading="lazy" decoding="async">${p.image.caption ? `<figcaption>${escapeHtml(p.image.caption)}</figcaption>` : ""}</figure>`
    : "";

  const html = `
<article id="post-${escapeAttr(p.slug)}" class="ids-blog ids-post post type-post status-publish format-standard hentry category-patient-guides">
\t<header class="ids-hero">
\t\t<div class="ids-wrap">
\t\t\t${breadcrumbs(crumbs)}
\t\t\t<h1 class="page-title">${escapeHtml(p.title)}</h1>
\t\t\t<div class="ids-byline">
\t\t\t\t<img src="${AUTHOR.photo}" width="54" height="60" alt="${escapeAttr(AUTHOR.name)}" decoding="async">
\t\t\t\t<div>
\t\t\t\t\t<span class="ids-author">By <a href="${AUTHOR.path}" rel="author">${escapeHtml(AUTHOR.name)}</a>, ${AUTHOR.jobTitle}</span>
\t\t\t\t\t<span class="ids-meta"><time datetime="${iso(p.published)}">${longDate(p.published)}</time>${p.modified && p.modified !== p.published ? ` · Updated <time datetime="${iso(p.modified)}">${longDate(p.modified)}</time>` : ""} · ${readTime}</span>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</header>
\t<div class="entry-content ids-wrap">
\t\t<div class="ids-answer"><p class="ids-answer-label">The short answer</p>${p.answer}</div>
\t\t<nav class="ids-toc" aria-label="In this guide"><p>In this guide</p><ol>${toc}<li><a href="#faq">Frequently asked questions</a></li></ol></nav>
\t\t${figure}
${sections}
\t\t<div class="ids-cta">
\t\t\t<h2 class="wp-block-heading">${escapeHtml(p.cta.heading)}</h2>
\t\t\t<p>${p.cta.text}</p>
\t\t\t<div class="ids-cta-buttons">
\t\t\t\t<a class="wp-element-button ids-btn" href="/appointment/">Request an appointment</a>
\t\t\t\t<a class="ids-btn-outline" href="${escapeAttr(p.service.path)}">${escapeHtml(p.service.label)}</a>
\t\t\t\t<a class="ids-btn-outline" href="tel:+17034420442">Call (703) 442-0442</a>
\t\t\t</div>
\t\t</div>
\t\t<h2 id="faq" class="wp-block-heading">Frequently asked questions</h2>
\t\t<div class="ids-faq">${faq}</div>
\t\t<aside class="ids-bio" aria-label="About the author">
\t\t\t<img src="${AUTHOR.photo}" width="108" height="120" alt="${escapeAttr(AUTHOR.name)}" loading="lazy" decoding="async">
\t\t\t<div><p class="ids-bio-name"><a href="${AUTHOR.path}">${escapeHtml(AUTHOR.name)}</a></p><p>${escapeHtml(AUTHOR.bio)}</p><p><a href="${AUTHOR.path}">Read Dr. Adili's profile</a></p></div>
\t\t</aside>
\t\t<p class="ids-disclaimer">This guide is general information, not a diagnosis or treatment plan. Every mouth is different, so the right option for you depends on an exam with your dentist.</p>
\t\t<div class="ids-sources"><h2 class="wp-block-heading">Sources</h2><ul>${sources}</ul></div>
\t\t${related(p)}
\t</div>
</article>`;

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
      image: SITE + (p.image?.src || "/og/home.jpg"),
      wordCount: words(p),
      articleSection: BLOG_NAME,
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

  const seo = seoFor({ title: p.seoTitle, description: p.description, path, type: "article", image: p.image?.src, published: p.published, modified, readTime, graph });
  return pageDoc(`blog-${p.slug}`, p.seoTitle, path, seo, BODY_CLASS, html, {
    published: iso(p.published),
    excerpt: p.description,
    authorName: AUTHOR.name,
  });
}

function related(p: BlogPost) {
  const others = sorted().filter((o) => o.slug !== p.slug).slice(0, 3);
  if (!others.length) return "";
  return `<nav class="ids-related" aria-label="More patient guides"><h2 class="wp-block-heading">More patient guides</h2><ul>${others
    .map((o) => `<li><a href="${postPath(o)}">${escapeHtml(o.title)}</a></li>`)
    .join("")}</ul><p><a href="${BLOG_PATH}">All patient guides</a></p></nav>`;
}

/* ---------------- list page ---------------- */

function listDoc(): PageDoc {
  const url = SITE + BLOG_PATH;
  const crumbs = [{ name: "Home", path: "/" }, { name: BLOG_NAME }];
  const list = sorted();
  const cards = list
    .map(
      (p) => `<li class="ids-card">
\t<a class="ids-card-link" href="${postPath(p)}"><h2>${escapeHtml(p.title)}</h2></a>
\t<p class="ids-meta"><time datetime="${iso(p.published)}">${longDate(p.published)}</time> · ${readingTime(p)}</p>
\t<p>${escapeHtml(p.description)}</p>
\t<a class="ids-more" href="${postPath(p)}" aria-label="Read: ${escapeAttr(p.title)}">Read the guide</a>
</li>`,
    )
    .join("\n");
  const html = `
<div class="ids-blog ids-list">
\t<header class="ids-hero">
\t\t<div class="ids-wrap">
\t\t\t${breadcrumbs(crumbs)}
\t\t\t<h1 class="page-title">${BLOG_NAME}</h1>
\t\t\t<p class="ids-intro">Plain answers to common questions about dental implants, Invisalign, gum health, root canals and more, from the team at Ideal Dental Solutions in McLean, VA.</p>
\t\t</div>
\t</header>
\t<div class="ids-wrap ids-wide">
\t\t<ul class="ids-cards">${cards}</ul>
\t</div>
</div>`;
  const description = "Patient guides from Ideal Dental Solutions in McLean, VA: plain answers about dental implants, Invisalign, gum disease, root canals and more.";
  const title = `${BLOG_NAME}: Dental Questions Answered | Ideal Dental Solutions`;
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
  return pageDoc("blog", BLOG_NAME, BLOG_PATH, seoFor({ title, description, path: BLOG_PATH, type: "website", graph }), LIST_BODY_CLASS, html);
}

/* ---------------- styles ---------------- */

const STYLE = `<style id="ids-blog-css">
@font-face{font-family:"Urbanist Fallback";src:local("Arial"),local("Liberation Sans"),local("Helvetica");size-adjust:97%;ascent-override:95%;descent-override:25%;line-gap-override:0%}
.ids-blog,.ids-blog h1,.ids-blog h2,.ids-blog h3{font-family:Urbanist,"Urbanist Fallback",sans-serif}
.ids-blog{--ids-accent:var(--theme-palette-color-1,#ff6310);--ids-text:var(--theme-palette-color-4,#111518);--ids-muted:#5a636a;--ids-soft:var(--theme-palette-color-6,#f4f5f6);--ids-link:#c2410c;color:var(--ids-text);font-size:17px;line-height:1.7}
.ids-wrap{max-width:760px;margin:0 auto;padding:0 16px}
.ids-wide{max-width:1120px}
.ids-hero{background:var(--ids-soft);padding:28px 0 26px;margin-bottom:32px}
.ids-breadcrumbs{font-size:14px;color:#5a636a;margin-bottom:12px}
.ids-breadcrumbs a{color:#5a636a;text-decoration:underline}
.ids-sep{margin:0 8px}
.ids-blog h1.page-title{font-size:clamp(30px,6vw,44px);line-height:1.2;margin:0 0 16px}
.ids-byline{display:flex;gap:12px;align-items:center}
.ids-byline img{width:54px;height:60px;border-radius:50%;object-fit:cover;object-position:top}
.ids-byline>div{display:flex;flex-direction:column;line-height:1.4}
.ids-author{font-weight:600;font-size:16px}
.ids-author a,.ids-bio a,.ids-blog .entry-content a,.ids-related a{color:var(--ids-link)}
.ids-meta{font-size:14px;color:var(--ids-muted)}
.ids-intro{margin:0;font-size:18px;color:var(--ids-muted)}
.ids-blog .entry-content{padding-bottom:56px}
.ids-blog .entry-content>*{margin-top:0;margin-bottom:1.1em}
.ids-blog h2.wp-block-heading{font-size:clamp(24px,4.6vw,30px);line-height:1.3;margin:1.8em 0 .6em;scroll-margin-top:110px}
.ids-blog h3{font-size:20px;line-height:1.35;margin:1.4em 0 .4em}
.ids-blog ul,.ids-blog ol{padding-left:1.3em}
.ids-blog li{margin-bottom:.4em}
.ids-answer{border-left:4px solid var(--ids-accent);background:var(--ids-soft);padding:18px 20px;border-radius:6px}
.ids-answer p{margin:0}
.ids-answer p+p{margin-top:.7em}
.ids-blog .ids-answer-label,.ids-toc p{font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:13px;color:var(--ids-link);margin:0 0 6px}
.ids-toc{border:1px solid #e3e5e8;border-radius:6px;padding:16px 20px}
.ids-toc ol{margin:0}
.ids-toc a{text-decoration:none}
.ids-figure img{width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:8px}
.ids-figure figcaption{font-size:14px;color:var(--ids-muted);margin-top:6px}
.ids-table{width:100%;border-collapse:collapse;font-size:15px}
.ids-table-wrap{overflow-x:auto}
.ids-table th,.ids-table td{border:1px solid #e3e5e8;padding:10px;text-align:left;vertical-align:top}
.ids-table th{background:var(--ids-soft)}
.ids-cta{background:var(--ids-text);color:#fff;border-radius:8px;padding:24px 20px;margin:2.2em 0}
.ids-cta h2.wp-block-heading{color:#fff;margin-top:0}
.ids-cta p{color:#e9ecef}
.ids-cta-buttons{display:flex;flex-wrap:wrap;gap:10px}
.ids-blog .ids-btn,.ids-blog .ids-btn-outline{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:10px 20px;border-radius:6px;font-weight:600;text-decoration:none;font-size:16px}
.ids-blog .entry-content .ids-btn{background:var(--ids-link);color:#fff}
.ids-blog .entry-content .ids-btn-outline{border:1px solid rgba(255,255,255,.6);color:#fff}
.ids-faq-item{border-bottom:1px solid #e3e5e8;padding:4px 0}
.ids-faq-item summary{cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:12px;align-items:center;min-height:48px}
.ids-faq-item summary::-webkit-details-marker{display:none}
.ids-faq-item summary::after{content:"+";font-size:24px;color:var(--ids-accent);flex:none}
.ids-faq-item[open] summary::after{content:"\\2212"}
.ids-faq-item summary h3{margin:8px 0;font-size:18px}
.ids-faq-answer p{margin:0 0 .8em}
.ids-bio{display:flex;gap:16px;align-items:flex-start;background:var(--ids-soft);border-radius:8px;padding:20px;margin-top:2.2em}
.ids-bio img{width:84px;height:auto;border-radius:6px;flex:none}
.ids-bio p{margin:0 0 .5em;font-size:16px}
.ids-blog .ids-bio-name{font-weight:700;font-size:18px}
.ids-disclaimer{font-size:14px;color:var(--ids-muted)}
.ids-sources h2.wp-block-heading{font-size:20px}
.ids-sources li{font-size:15px;word-break:break-word}
.ids-related{border-top:1px solid #e3e5e8;margin-top:2em}
.ids-cards{list-style:none;padding:0!important;display:grid;gap:20px;margin:0 0 64px}
.ids-card{border:1px solid #e3e5e8;border-radius:8px;padding:22px;margin:0!important;display:flex;flex-direction:column}
.ids-card h2{font-size:22px;line-height:1.3;margin:0 0 6px;color:var(--ids-text)}
.ids-card-link{text-decoration:none}
.ids-card-link:hover h2{color:var(--ids-link)}
.ids-card p{margin:0 0 12px}
.ids-more{margin-top:auto;font-weight:600;color:var(--ids-link);min-height:44px;display:inline-flex;align-items:center}
@media (min-width:768px){.ids-hero{padding:44px 0 40px}.ids-cards{grid-template-columns:repeat(2,1fr)}.ids-cta{padding:32px}.ids-bio img{width:108px}}
@media (min-width:1100px){.ids-cards{grid-template-columns:repeat(3,1fr)}}
</style>`;
