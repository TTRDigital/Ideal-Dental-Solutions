import { allPaths, getSite, resolveSearchPage } from "@/lib/site/data";
import { renderDocument, type PageDoc, type Resolved } from "@/lib/site/render";
import { contentText, type SearchDoc } from "@/lib/site/search";
import { searchCard, searchPagination } from "@/lib/render/blocksy";
import { dataset, projectId } from "@/sanity/env";

/**
 * Used only by scripts/siteground/export-static.mjs (SiteGround deploy): the
 * routed paths, the form settings and what _sg/search.php needs to answer
 * ?s= searches without a Node server (search index with each result card,
 * and the results / no-results pages with placeholders). Not part of the
 * exported site.
 */
export const dynamic = "force-dynamic";

const TOKEN = "sgqtokenq";

export async function GET() {
  const site = await getSite();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || site.settings.siteUrl || "https://idealdentalsolutions.com").replace(/\/$/, "");
  const opts = { projectId, dataset, origin, recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY?.trim() || "" };

  let search: Record<string, unknown> | null = null;
  const all = await resolveSearchPage("", 1, site.fromCms);
  if (all?.kind === "search") {
    const doc = all.doc;
    const perPage = doc.perPage || 10;
    const card = (p: PageDoc) =>
      searchCard({ wpId: p.wpId, title: p.title || "", path: p.path || "/", published: p.published, excerpt: p.excerpt, authorName: p.authorName, authorSlug: p.authorSlug });
    const stub = { _id: "sg-stub", _type: "page", title: "SGCARDSTUB", path: "/sg-card-stub/" } as unknown as PageDoc;
    const withResults: Resolved = { kind: "search", doc, query: TOKEN, page: 1, results: Array(perPage + 1).fill(stub) };
    const empty: Resolved = { kind: "search", doc, query: TOKEN, page: 1, results: [] };
    search = {
      token: TOKEN,
      perPage,
      cardsBlock: card(stub).repeat(perPage),
      paginationBlock: searchPagination(TOKEN, 1, 2, { prev: doc.prevIcon, next: doc.nextIcon }),
      paginationCss: doc.paginationCss || "",
      prevIcon: doc.prevIcon || "",
      nextIcon: doc.nextIcon || "",
      results: renderDocument(withResults, site.data, "/", opts),
      empty: renderDocument(empty, site.data, "/", opts),
      index: all.results.map((p) => ({
        path: p.path,
        title: p.title || "",
        excerpt: p.excerpt || "",
        published: p.published || "",
        wpId: p.wpId || 0,
        text: contentText(p as unknown as SearchDoc),
        card: card(p),
      })),
    };
  }

  return Response.json(
    { fromCms: site.fromCms, paths: await allPaths(site.fromCms), forms: site.settings.forms || [], search },
    { headers: { "X-Robots-Tag": "noindex" } },
  );
}
