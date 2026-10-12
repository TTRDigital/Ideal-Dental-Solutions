import { escapeHtml } from "../render/html.ts";

/** Yoast-compatible sitemaps (same URLs as WordPress, so Search Console keeps working) and the RSS feed. */

type Row = { path: string; type: string; modified?: string; noindex?: boolean };

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>';

function urlset(origin: string, rows: { path: string; modified?: string }[]) {
  const urls = rows
    .map((r) => `\t<url>\n\t\t<loc>${escapeHtml(origin + r.path)}</loc>${r.modified ? `\n\t\t<lastmod>${escapeHtml(new Date(r.modified).toISOString().replace(/\.\d{3}Z$/, "+00:00"))}</lastmod>` : ""}\n\t</url>`)
    .join("\n");
  return `${HEAD}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function rowsFor(name: string, rows: Row[]) {
  const indexable = rows.filter((r) => !r.noindex);
  switch (name) {
    case "page-sitemap.xml":
      return indexable.filter((r) => r.type === "page").sort((a, b) => (a.path === "/" ? -1 : b.path === "/" ? 1 : 0));
    default:
      return [];
  }
}

export function sitemapXml(name: string, origin: string, rows: Row[]) {
  return urlset(origin, rowsFor(name, rows));
}

export function sitemapIndex(origin: string, rows: Row[]) {
  const maps = ["page-sitemap.xml"].filter((n) => rowsFor(n, rows).length);
  const last = (n: string) =>
    rowsFor(n, rows)
      .map((r) => r.modified || "")
      .sort()
      .pop();
  const items = maps
    .map((n) => {
      const lm = last(n);
      return `\t<sitemap>\n\t\t<loc>${origin}/${n}</loc>${lm ? `\n\t\t<lastmod>${new Date(lm).toISOString().replace(/\.\d{3}Z$/, "+00:00")}</lastmod>` : ""}\n\t</sitemap>`;
    })
    .join("\n");
  return `${HEAD}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`;
}

/** The site has no posts; the feed stays valid and empty, like WordPress'. */
export function feedXml(origin: string) {
  return `${HEAD}\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n<title>idealdental</title>\n<atom:link href="${origin}/feed/" rel="self" type="application/rss+xml" />\n<link>${origin}/</link>\n<description></description>\n<language>en-US</language>\n</channel>\n</rss>`;
}
