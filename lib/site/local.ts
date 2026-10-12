import { search, type SearchDoc } from "./search.ts";
import { searchPages, type ArchiveDoc, type HeaderDoc, type PageDoc, type Resolved, type SearchPageDoc, type SiteData, type TemplateDoc } from "./render.ts";

/**
 * Resolves references in raw documents (content/seed.json, or the same
 * documents fetched from Sanity) into the shapes the renderer needs.
 */

export type SeedDoc = Record<string, unknown> & { _id: string; _type: string };
type Ref = { _ref: string } | undefined;

function byId(docs: SeedDoc[]) {
  return new Map(docs.map((d) => [d._id, d]));
}

function deref(map: Map<string, SeedDoc>, ref: Ref) {
  return ref?._ref ? map.get(ref._ref) || map.get(ref._ref.replace(/^drafts\./, "")) : undefined;
}

export function buildSiteData(docs: SeedDoc[]): SiteData {
  const map = byId(docs);
  const settings = map.get("siteSettings") || ({} as SeedDoc);
  return {
    settings: {
      businessSchema: settings.businessSchema as string,
      siteUrl: settings.siteUrl as string,
      header: (deref(map, settings.header as Ref) as HeaderDoc) || null,
      footer: (deref(map, settings.footer as Ref) as TemplateDoc) || null,
    },
  };
}

export function normalizePath(path: string) {
  let p = path.split(/[?#]/)[0] || "/";
  if (!p.startsWith("/")) p = `/${p}`;
  if (!p.endsWith("/")) p = `${p}/`;
  return p.replace(/\/{2,}/g, "/");
}

export function resolvePath(docs: SeedDoc[], rawPath: string): Resolved | null {
  const map = byId(docs);
  const path = normalizePath(rawPath);
  const doc = docs.find((d) => (d._type === "page" || d._type === "archivePage") && d.path === path);
  if (!doc) return notFound(map);
  if (doc._type === "archivePage") return { kind: "archive", doc: doc as unknown as ArchiveDoc };
  return { kind: "page", doc: doc as PageDoc, ancestors: (doc.ancestorPaths as string[]) || [] };
}

function notFound(map: Map<string, SeedDoc>): Resolved | null {
  const nf = map.get("notFound");
  return nf ? { kind: "notFound", doc: nf as never } : null;
}

/** Search results page `page` for `query`; null when the page is past the last one (404). */
export function resolveSearchFrom(searchPage: SearchPageDoc | undefined, pages: SeedDoc[], query: string, page: number): Resolved | null {
  if (!searchPage) return null;
  const results = search(pages.filter((d) => d._type === "page") as SearchDoc[], query) as PageDoc[];
  if (page > searchPages(results, searchPage.perPage || 10)) return null;
  return { kind: "search", doc: searchPage, query, page, results };
}

export function resolveSearch(docs: SeedDoc[], query: string, page: number): Resolved | null {
  return resolveSearchFrom(docs.find((d) => d._id === "searchPage") as SearchPageDoc | undefined, docs, query, page);
}
