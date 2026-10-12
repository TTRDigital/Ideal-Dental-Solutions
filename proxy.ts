import { NextResponse, type NextRequest } from "next/server";
import wordpress from "./content/redirects.json" with { type: "json" };

/**
 * WordPress shortlinks (/?p=123, /?page_id=123, /?author=1, /?cat=1) answered by the old site with
 * a 301 to the page. They are handled here rather than in next.config.ts,
 * because config redirects carry the query string over to the destination
 * (/?p=38 would redirect to itself).
 */
type Row = { source: string; destination: string; query?: Record<string, string> };

const shortlinks = new Map<string, string>();
for (const r of wordpress as Row[]) {
  if (r.source !== "/" || !r.query) continue;
  const [[key, value]] = Object.entries(r.query);
  shortlinks.set(`${key}=${value}`, r.destination);
}

/** Site search: /?s=term, /page/2/?s=term and /search/term/(page/2/) are answered by /search-results/. */
function searchRewrite(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  let query: string | null = null;
  let page = "1";
  const paged = /^\/page\/(\d+)\/?$/.exec(pathname);
  const pretty = /^\/search\/([^/]+)\/?(?:page\/(\d+)\/?)?$/.exec(pathname);
  if ((pathname === "/" || paged) && searchParams.has("s")) {
    query = searchParams.get("s") || "";
    page = paged?.[1] || "1";
  } else if (pretty) {
    query = decodeURIComponent(pretty[1].replace(/\+/g, " "));
    page = pretty[2] || "1";
  }
  if (query == null) return null;
  // Page and words go in the path: a rewrite keeps the visitor's query string.
  const url = new URL(`/search-results/${page}/${query ? `${encodeURIComponent(query)}/` : ""}`, req.url);
  return NextResponse.rewrite(url);
}

export function proxy(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl;
  if (pathname === "/") {
    for (const key of ["p", "page_id", "author", "cat"]) {
      const value = searchParams.get(key);
      const destination = value != null ? shortlinks.get(`${key}=${value}`) : undefined;
      if (destination) return NextResponse.redirect(new URL(destination, req.url), 301);
    }
  }
  return searchRewrite(req) || NextResponse.next();
}

export const config = { matcher: ["/", "/page/:path*", "/search/:path*"] };
