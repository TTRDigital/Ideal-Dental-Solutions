import { getSite, notFoundDoc, resolveSearchPage } from "@/lib/site/data";
import { renderDocument } from "@/lib/site/render";
import { dataset, projectId } from "@/sanity/env";

/**
 * Site search, as WordPress answered /?s=term, /page/2/?s=term and
 * /search/term/ (proxy.ts rewrites those here, page and words in the path:
 * a rewrite keeps the visitor's own query string). Rendered per request.
 */
export const dynamic = "force-dynamic";

/** /search-results/<page>/<words>/ (the words URL-encoded; none for an empty search). */
export async function GET(_req: Request, ctx: { params: Promise<{ args?: string[] }> }) {
  const { args = [] } = await ctx.params;
  const page = Math.max(1, Number(args[0]) || 1);
  const query = args[1] != null ? decodeURIComponent(args[1]) : "";
  const site = await getSite();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || site.settings.siteUrl || "https://idealdentalsolutions.com").replace(/\/$/, "");
  const resolved = (await resolveSearchPage(query, page, site.fromCms)) || (await notFoundDoc(site.fromCms));
  if (!resolved) return new Response("Not found", { status: 404 });
  const path = page > 1 ? `/page/${page}/` : "/";
  const html = renderDocument(resolved, site.data, path, { projectId, dataset, origin, recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY?.trim() || "" });
  return new Response(html, {
    status: resolved.kind === "search" ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, follow" },
  });
}
