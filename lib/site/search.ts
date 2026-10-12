/**
 * Site search as WordPress did it (WP_Query "s"): every word must appear in
 * the title, excerpt or content; results are ordered by relevance (title
 * matches first), then newest first, 10 per page. WordPress searched the
 * page's saved markup (text, links, image names), without script blocks, so
 * the page content is rendered from the CMS and matched the same way.
 */
import { LEGACY_ORIGIN } from "../render/html.ts";
import { renderPortableText, type PtBlock } from "../render/portableText.ts";
import { renderNodes, type Fields, type RenderContext } from "../render/template.ts";

export type SearchDoc = Record<string, unknown> & {
  _id: string;
  wpId?: number;
  title?: string;
  path?: string;
  published?: string;
  excerpt?: string;
};

/** Lower-case page content (Elementor markup or block editor text) as WordPress stored it, without scripts. */
export function contentText(doc: SearchDoc): string {
  const ctx: RenderContext = { path: doc.path || "/", values: {}, image: { projectId: "", dataset: "" } };
  const html = renderNodes(doc.content as Fields[] | undefined, ctx) + renderPortableText(doc.body as PtBlock[] | undefined);
  return (
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      // WordPress stored absolute URLs (and the host name contains "dental").
      .replace(/(=["']|,\s*|url\()\/(?!\/)/g, `$1${LEGACY_ORIGIN}/`)
      .replace(/&amp;/g, "&")
      .toLowerCase()
  );
}

/** Search words, like WordPress: quoted phrases kept together, empty ones dropped. */
export function searchTerms(q: string): string[] {
  const terms: string[] = [];
  for (const m of q.matchAll(/"([^"]+)"|(\S+)/g)) {
    const t = (m[1] ?? m[2]).trim().toLowerCase();
    if (t && !/^-/.test(t)) terms.push(t);
  }
  return terms;
}

export function search(docs: SearchDoc[], q: string): SearchDoc[] {
  const terms = searchTerms(q);
  const phrase = q.trim().toLowerCase();
  const rows: { doc: SearchDoc; order: number; date: string; id: number }[] = [];
  for (const doc of docs) {
    if (!doc.path) continue;
    const title = String(doc.title || "").toLowerCase();
    const excerpt = String(doc.excerpt || "").toLowerCase();
    const text = terms.length ? contentText(doc) : "";
    if (!terms.every((t) => title.includes(t) || excerpt.includes(t) || text.includes(t))) continue;
    let order = 0;
    if (terms.length === 1) order = title.includes(terms[0]) ? 0 : 1;
    else if (terms.length > 1) {
      order = title.includes(phrase) ? 1 : terms.every((t) => title.includes(t)) ? 2 : terms.some((t) => title.includes(t)) ? 3 : excerpt.includes(phrase) ? 4 : text.includes(phrase) ? 5 : 6;
    }
    rows.push({ doc, order, date: String(doc.published || ""), id: doc.wpId || 0 });
  }
  // Same publish time: MySQL returned the higher ID first.
  rows.sort((a, b) => a.order - b.order || b.date.localeCompare(a.date) || b.id - a.id);
  return rows.map((r) => r.doc);
}

export const SEARCH_PER_PAGE = 10;
