import wordpress from "./content/redirects.json" with { type: "json" };
import searchConsole from "./content/redirects-search-console.json" with { type: "json" };

/**
 * 301 redirects carried over from WordPress: the redirects the live site
 * answered for old/alternative URLs (collected by probing it), so old
 * backlinks and indexed URLs keep landing on the right page. Unknown URLs
 * whose last part matches a page are also redirected at request time
 * (lib/site/guess.ts), like WordPress did. Shortlinks: proxy.ts.
 *
 * content/redirects-search-console.json: addresses Google showed in the 90
 * days to Oct 25, 2026 (Search Console) that answer 404 on the live
 * WordPress site (old blog posts, contact and legal pages, McLean service
 * URLs the copy did not carry over), each sent to its closest live page, and
 * old upload addresses Google has seen whose file is in the site under a newer
 * path. /sitemap.xml is served directly (app/[[...path]]/route.ts).
 */
type Row = { source: string; destination: string; query?: Record<string, string> };

// WordPress' "Patient Guides" category is now the blog (lib/site/blog.ts).
const blog: Row[] = [{ source: "/category/patient-guides/", destination: "/blog/" }];

// Shortlinks (/?p=, /?page_id=, /?author=, /?cat=) are handled in proxy.ts.
export const redirects = [...(wordpress as Row[]), ...(searchConsole as Row[]), ...blog]
  .filter((r) => !r.query)
  .map((r) => ({ source: r.source, destination: r.destination, statusCode: 301 as const }));
