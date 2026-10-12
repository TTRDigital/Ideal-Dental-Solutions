import wordpress from "./content/redirects.json" with { type: "json" };

/**
 * 301 redirects carried over from WordPress: the redirects the live site
 * answered for old/alternative URLs (collected by probing it), so old
 * backlinks and indexed URLs keep landing on the right page. Unknown URLs
 * whose last part matches a page are also redirected at request time
 * (lib/site/guess.ts), like WordPress did. Shortlinks: proxy.ts.
 */
type Row = { source: string; destination: string; query?: Record<string, string> };

// Shortlinks (/?p=, /?page_id=, /?author=, /?cat=) are handled in proxy.ts.
export const redirects = (wordpress as Row[])
  .filter((r) => !r.query)
  .map((r) => ({ source: r.source, destination: r.destination, statusCode: 301 as const }));
