import shellsJson from "../generated/shells.json" with { type: "json" };
import { searchCard, searchPagination } from "../render/blocksy.ts";
import { escapeHtml } from "../render/html.ts";
import { renderSeo, type Seo } from "../render/seo.ts";
import { renderTpl, type Fields, type RenderContext } from "../render/template.ts";

/**
 * Turns CMS documents into the full HTML document for a URL. Used by the
 * site route and by the migration check (scripts/verify.ts).
 */

const shells = shellsJson as Record<string, string>;

export type TemplateDoc = Fields & { _id: string; wpId?: number; kind?: string };
/** Blocksy header: desktop header (tpl) and the mobile offcanvas panel (drawerTpl) share the logo and menu. */
export type HeaderDoc = Fields & { _id: string; drawerTpl?: string };
export type BaseDoc = Fields & {
  _id: string;
  _type: string;
  title?: string;
  path?: string;
  wpId?: number;
  seo?: Seo;
  bodyClass?: string;
  frameTpl?: string;
  shell?: string;
};
export type PageDoc = BaseDoc & { ancestorPaths?: string[]; published?: string; excerpt?: string; authorName?: string; authorSlug?: string };
/** Search results (Blocksy): results and no-results frames, SEO with {q} for the search words. */
export type SearchPageDoc = BaseDoc & {
  headingPrefix?: string;
  perPage?: number;
  emptyFrameTpl?: string;
  emptyShell?: string;
  /** Results skeleton when a block-editor page is among the results (adds the block library CSS). */
  blocksShell?: string;
  emptyBodyClass?: string;
  prevIcon?: string;
  nextIcon?: string;
  /** <link> of Blocksy's pagination stylesheet, printed when there is more than one page. */
  paginationCss?: string;
};
export type ArchiveDoc = BaseDoc & { kind: "category" | "author" };

export type SiteData = {
  settings: { siteUrl?: string; businessSchema?: string; header?: HeaderDoc | null; footer?: TemplateDoc | null };
};

export type Resolved =
  | { kind: "page"; doc: PageDoc; ancestors: string[] }
  | { kind: "archive"; doc: ArchiveDoc }
  | { kind: "notFound"; doc: BaseDoc }
  | { kind: "search"; doc: SearchPageDoc; query: string; page: number; results: PageDoc[] };

export type RenderOptions = {
  projectId: string;
  dataset: string;
  /** Public origin, e.g. https://idealdentalsolutions.com. Absolute SEO URLs use it. */
  origin?: string;
};

/** Elementor's frontend config describes the current document. */
function elementorPost(doc: BaseDoc, title: string) {
  return `{"id":${doc.wpId ?? 0},"title":"${encodeURIComponent(title).replace(/'/g, "%27")}","excerpt":"","featuredImage":false}`;
}

export function renderDocument(resolved: Resolved, data: SiteData, path: string, opts: RenderOptions): string {
  const { doc } = resolved;
  const values: Record<string, string> = {};
  const ctx: RenderContext = {
    // A search is not the page it was typed on: no menu item is current.
    path: resolved.kind === "search" ? "" : path,
    values,
    ancestorPaths: resolved.kind === "page" ? resolved.ancestors : [],
    image: { projectId: opts.projectId, dataset: opts.dataset },
  };
  let seo = doc.seo;
  let frameTpl = doc.frameTpl;
  let shellKey = doc.shell;
  let bodyClass = doc.bodyClass;
  if (resolved.kind === "search") {
    const s = searchValues(resolved);
    Object.assign(values, s.values);
    ({ seo, frameTpl, shellKey, bodyClass } = s);
  }
  const title = seo?.title || doc.title || "";
  const header = data.settings.header;
  values.seo = renderSeo(seo, opts.origin, data.settings.businessSchema);
  values.bodyClass = bodyClass ?? "";
  values.queriedId = String(doc.wpId ?? "");
  values.refererTitle = title;
  values.elementorPost = elementorPost(doc, title);
  values.header = header ? renderTpl(header.tpl, header, ctx) : "";
  values.drawer = header ? renderTpl(header.drawerTpl, header, ctx) : "";
  values.footer = data.settings.footer ? renderTpl(data.settings.footer.tpl, data.settings.footer, ctx) : "";
  values.content = renderTpl(frameTpl, doc, ctx);

  const shell = shells[shellKey || ""] || shells[Object.keys(shells)[0]] || "";
  return renderTpl(shell, {}, ctx);
}

/** Number of result pages; a page past the end is a 404, as on WordPress. */
export function searchPages(results: unknown[], perPage = 10) {
  return Math.max(1, Math.ceil(results.length / perPage));
}

function searchValues(r: Extract<Resolved, { kind: "search" }>) {
  const { doc, query, page, results } = r;
  const perPage = doc.perPage || 10;
  const pages = searchPages(results, perPage);
  const found = results.length > 0;
  const shown = results.slice((page - 1) * perPage, page * perPage);
  const values: Record<string, string> = {
    searchHeading: escapeHtml(`${doc.headingPrefix ?? "Search Results for "}${query}`),
    query,
    cards: shown
      .map((p) => searchCard({ wpId: p.wpId, title: p.title || "", path: p.path || "/", published: p.published, excerpt: p.excerpt, authorName: p.authorName, authorSlug: p.authorSlug }))
      .join(""),
    pagination: searchPagination(query, page, pages, { prev: doc.prevIcon, next: doc.nextIcon }),
    paginationCss: pages > 1 ? doc.paginationCss || "" : "",
  };
  // Yoast: "You searched for {q}" (+ " - Page 2 of 5" before the site name); og:url /search/{q}/
  // with the words as typed (none for an empty search); schema ids with the escaped words, URL-encoded.
  const pageSuffix = page > 1 ? ` - Page ${page} of ${pages}` : "";
  const encoded = encodeURIComponent(escapeHtml(query).replace(/"/g, "&quot;")).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const escaped = escapeHtml(query).replace(/"/g, "&quot;");
  const fill = (v: string | undefined, json = false) => {
    if (!v) return v;
    // The schema carries the escaped words.
    const q = json ? JSON.stringify(escaped).slice(1, -1) : query;
    let out = v.replace(/(You searched for \{q\})( [-|] )/g, `$1${pageSuffix}$2`);
    if (!query) {
      // Yoast trims the gap an empty search leaves (except in the page 1 title tags), and its page id ends in "?s".
      out = out.replace(/You searched for \{q\} - Page/g, "You searched for - Page");
      if (json) out = out.replace(/("@id":"[^"]*\?s)=\{q\}"/g, '$1"').replace(/You searched for \{q\} /g, "You searched for ").replace(/You searched for \{q\}"/g, 'You searched for"');
    }
    return out.replace(/\?s=\{q\}/g, `?s=${encoded}`).replace(/\{q\}/g, q);
  };
  const s = doc.seo || {};
  const seo = {
    ...s,
    title: fill(s.title),
    ogTitle: fill(s.ogTitle),
    ogUrl: query ? fill(s.ogUrl) : undefined,
    canonical: fill(s.canonical),
    twitterTitle: fill(s.twitterTitle),
    schema: fill(s.schema, true),
  };
  const cls = (found ? doc.bodyClass : doc.emptyBodyClass) || "";
  let bodyClass = cls;
  if (found && page > 1) {
    // WordPress: "paged" after the first two classes, "paged-N search-paged-N" after wp-embed-responsive.
    const list = cls.split(/\s+/);
    list.splice(2, 0, "paged");
    const at = list.indexOf("wp-embed-responsive") + 1 || list.length;
    list.splice(at, 0, `paged-${page}`, `search-paged-${page}`);
    bodyClass = list.join(" ");
  }
  return {
    values,
    seo,
    frameTpl: found ? doc.frameTpl : doc.emptyFrameTpl,
    shellKey: !found ? doc.emptyShell : shown[0]?.body && doc.blocksShell ? doc.blocksShell : doc.shell,
    bodyClass,
  };
}

export function notFoundHtml() {
  return `<!doctype html><title>${escapeHtml("Page not found")}</title>`;
}
