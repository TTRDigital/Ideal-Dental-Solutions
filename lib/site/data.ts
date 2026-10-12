import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { buildSiteData, normalizePath, resolvePath, resolveSearch, resolveSearchFrom, type SeedDoc } from "./local";
import type { ArchiveDoc, PageDoc, Resolved, SearchPageDoc, SiteData } from "./render";

/** ISR window for CMS content, in seconds. Publishing also refreshes via /api/revalidate. */
export const REVALIDATE_SECONDS = 300;

async function sanity<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  const search = new URLSearchParams({ query, perspective: "published" });
  for (const [k, v] of Object.entries(params)) search.set(`$${k}`, JSON.stringify(v));
  const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?${search}`;
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS, tags: ["sanity"] } });
    if (!res.ok) {
      console.warn(`[sanity] ${res.status} for ${query.slice(0, 60)}`);
      return null;
    }
    return ((await res.json()) as { result?: T }).result ?? null;
  } catch (err) {
    console.warn("[sanity] fetch failed", err);
    return null;
  }
}

/* ---------------- local fallback (content/seed.json) ---------------- */

let seedCache: SeedDoc[] | null = null;
function seed(): SeedDoc[] {
  if (!seedCache) seedCache = JSON.parse(readFileSync(join(process.cwd(), "content/seed.json"), "utf8")) as SeedDoc[];
  return seedCache;
}

/* ---------------- queries ---------------- */

const SETTINGS = `*[_id == "siteSettings"][0]{..., header->, footer->}`;
const BY_PATH = `*[_type in ["page", "archivePage"] && path == $path][0]`;

type Settings = { siteUrl?: string; forms?: FormSetting[] } & SiteData["settings"];
export type FormSetting = { name?: string; formKey?: string; redirect?: string; message?: string; tag?: string };

/** True once the CMS has been loaded (npm run seed). Until then the built-in copy is used. */
async function cmsSettings(): Promise<Settings | null> {
  return sanity<Settings>(SETTINGS);
}

export async function getSite(): Promise<{ data: SiteData; settings: Settings; fromCms: boolean }> {
  // SITE_CONTENT=local forces the built-in copy (e.g. to compare with the CMS).
  const settings = process.env.SITE_CONTENT === "local" ? null : await cmsSettings();
  // Only trust settings that point at this site's header.
  if (settings?.header?.tpl) return { data: { settings }, settings, fromCms: true };
  const docs = seed();
  const data = buildSiteData(docs);
  const raw = docs.find((d) => d._id === "siteSettings") as Settings | undefined;
  return { data, settings: { ...data.settings, forms: raw?.forms }, fromCms: false };
}

export async function resolve(rawPath: string, fromCms: boolean): Promise<Resolved | null> {
  if (!fromCms) return resolvePath(seed(), rawPath);
  const path = normalizePath(rawPath);
  const doc = await sanity<SeedDoc>(BY_PATH, { path });
  if (doc?._type === "archivePage") return { kind: "archive", doc: doc as unknown as ArchiveDoc };
  if (doc?._type === "page") return { kind: "page", doc: doc as PageDoc, ancestors: (doc.ancestorPaths as string[]) || [] };
  const nf = await sanity<SeedDoc>(`*[_id == "notFound"][0]`);
  return nf ? { kind: "notFound", doc: nf as never } : null;
}

/** Every routed path, for static generation and the sitemaps. */
export async function allPaths(fromCms: boolean): Promise<{ path: string; type: string; modified?: string; noindex?: boolean }[]> {
  const q = `*[_type in ["page", "archivePage"] && defined(path)]{path, _type, "modified": coalesce(modified, seo.modifiedTime, _updatedAt), "robots": seo.robots}`;
  const rows = fromCms
    ? (await sanity<{ path: string; _type: string; modified?: string; robots?: string }[]>(q)) || []
    : seed()
        .filter((d) => ["page", "archivePage"].includes(d._type) && d.path)
        .map((d) => ({ path: d.path as string, _type: d._type, modified: (d.modified as string) || (d.seo as { modifiedTime?: string })?.modifiedTime, robots: (d.seo as { robots?: string })?.robots }));
  return rows.map((r) => ({ path: r.path, type: r._type, modified: r.modified, noindex: /noindex/.test(r.robots || "") }));
}

/** Site search (?s=): the results page, or null when `page` is past the last one. */
export async function resolveSearchPage(query: string, page: number, fromCms: boolean): Promise<Resolved | null> {
  if (!fromCms) return resolveSearch(seed(), query, page);
  const [searchPage, pages] = await Promise.all([
    sanity<SearchPageDoc>(`*[_id == "searchPage"][0]`),
    // Whole pages: WordPress searched the page content (see lib/site/search.ts).
    sanity<SeedDoc[]>(`*[_type == "page" && defined(path)]`),
  ]);
  return resolveSearchFrom(searchPage || undefined, pages || [], query, page);
}

/** The 404 page document, for search pages past the end. */
export async function notFoundDoc(fromCms: boolean): Promise<Resolved | null> {
  if (!fromCms) return resolvePath(seed(), "/this-page-does-not-exist/");
  const nf = await sanity<SeedDoc>(`*[_id == "notFound"][0]`);
  return nf ? { kind: "notFound", doc: nf as never } : null;
}
