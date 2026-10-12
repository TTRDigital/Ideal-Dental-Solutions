import { escapeAttr, escapeHtml } from "./html.ts";

/** Yoast-style head tags. Every field is optional; empty ones are skipped. */
export type Seo = {
  title?: string;
  description?: string;
  robots?: string;
  canonical?: string;
  ogLocale?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogSiteName?: string;
  articlePublisher?: string;
  articleAuthor?: string;
  publishedTime?: string;
  modifiedTime?: string;
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  ogImageType?: string;
  author?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterMisc?: { _key?: string; label?: string; data?: string }[];
  /** JSON-LD graph (Yoast schema), printed as is. */
  schema?: string;
};

const prop = (p: string, v?: string) => (v ? `<meta property="${p}" content="${escapeAttr(v)}" />` : "");
const name = (n: string, v?: string) => (v ? `<meta name="${n}" content="${escapeAttr(v)}" />` : "");

type Node = Record<string, unknown>;

/**
 * Yoast's graph, with the Organization replaced by the business details from
 * Site settings (Dentist: phone, address, hours, areas served...). The site
 * search action is removed from the stored graphs by scripts/fixes.ts.
 */
export function upgradeSchema(schema: string | undefined, business?: string): string | undefined {
  if (!schema || !business) return schema;
  try {
    const json = JSON.parse(schema) as { "@graph"?: Node[] };
    const biz = JSON.parse(business) as Node;
    const graph = (json["@graph"] || []).map((node) => (node["@type"] === "Organization" ? { ...node, ...biz, "@id": node["@id"] } : node));
    return JSON.stringify({ ...json, "@graph": graph });
  } catch {
    return schema;
  }
}

/** `origin` replaces the old WordPress host in absolute URLs (preview deployments). */
export function renderSeo(seo: Seo | undefined, origin?: string, business?: string): string {
  const s = { ...(seo || {}) };
  s.schema = upgradeSchema(s.schema, business);
  if (s.schema && origin) s.schema = s.schema.replace(/https?:(\\?\/){2}(www\.)?idealdentalsolutions\.com/gi, (m) => (m.includes("\\") ? origin.replace(/\//g, "\\/") : origin));
  const abs = (v?: string) => (v && origin ? v.replace(/^https?:\/\/(www\.)?idealdentalsolutions\.com/i, origin) : v);
  const out = [
    name("robots", s.robots),
    `<title>${escapeHtml(s.title || "")}</title>`,
    name("description", s.description),
    s.canonical ? `<link rel="canonical" href="${escapeAttr(abs(s.canonical))}" />` : "",
    prop("og:locale", s.ogLocale),
    prop("og:type", s.ogType),
    prop("og:title", s.ogTitle),
    prop("og:description", s.ogDescription),
    prop("og:url", abs(s.ogUrl)),
    prop("og:site_name", s.ogSiteName),
    prop("article:publisher", s.articlePublisher),
    prop("article:author", s.articleAuthor),
    prop("article:published_time", s.publishedTime),
    prop("article:modified_time", s.modifiedTime),
    prop("og:image", abs(s.ogImage)),
    prop("og:image:width", s.ogImageWidth),
    prop("og:image:height", s.ogImageHeight),
    prop("og:image:type", s.ogImageType),
    name("author", s.author),
    name("twitter:card", s.twitterCard),
    name("twitter:title", s.twitterTitle),
    ...(s.twitterMisc || []).flatMap((m, i) => [name(`twitter:label${i + 1}`, m.label), name(`twitter:data${i + 1}`, m.data)]),
    s.schema ? `<script type="application/ld+json" class="yoast-schema-graph">${s.schema.replace(/<\/script/gi, "<\\/script")}</script>` : "",
  ];
  return out.filter(Boolean).join("\n");
}
