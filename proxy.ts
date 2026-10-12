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

export function proxy(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  for (const key of ["p", "page_id", "author", "cat"]) {
    const value = searchParams.get(key);
    const destination = value != null ? shortlinks.get(`${key}=${value}`) : undefined;
    if (destination) return NextResponse.redirect(new URL(destination, req.url), 301);
  }
  return NextResponse.next();
}

export const config = { matcher: "/" };
