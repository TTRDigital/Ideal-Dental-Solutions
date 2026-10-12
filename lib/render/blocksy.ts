import { escapeAttr, escapeHtml } from "./html.ts";

/**
 * Search results markup printed by the Blocksy theme (cards and pagination),
 * rebuilt from page data so results look exactly like the WordPress ones.
 */

export type SearchCard = {
  wpId?: number;
  title: string;
  path: string;
  /** Publish time, ISO (UTC). */
  published?: string;
  excerpt?: string;
  authorName?: string;
  authorSlug?: string;
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

/** "2026-06-01T17:21:14+00:00", like WordPress' get_the_date('c'). */
function isoC(iso: string) {
  return new Date(iso).toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

/** Blocksy cards show the first 40 words of the excerpt. */
function cardExcerpt(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length > 40 ? `${words.slice(0, 40).join(" ")}…` : words.join(" ");
}

export function searchCard(card: SearchCard) {
  const excerpt = card.excerpt?.trim() ? `<div class="entry-excerpt"><p>${escapeHtml(cardExcerpt(card.excerpt))}</p>\n</div>` : "";
  const author = card.authorSlug
    ? `<li class="meta-author" itemprop="author" itemscope="" itemtype="https://schema.org/Person"><a class="ct-meta-element-author" href="/author/${escapeAttr(card.authorSlug)}/" title="Posts by ${escapeAttr(card.authorName || card.authorSlug)}" rel="author" itemprop="url"><span itemprop="name">${escapeHtml(card.authorName || card.authorSlug)}</span></a></li>`
    : "";
  const date = card.published
    ? `<li class="meta-date" itemprop="datePublished"><time class="ct-meta-element-date" datetime="${isoC(card.published)}">${escapeHtml(formatDate(card.published))}</time></li>`
    : "";
  return (
    `<article class="entry-card card-content post-${card.wpId ?? ""} page type-page status-publish hentry" >` +
    `<h2 class="entry-title"><a href="${escapeAttr(card.path)}" rel="bookmark">${escapeHtml(card.title)}</a></h2>` +
    excerpt +
    `<ul class="entry-meta" data-type="simple:slash" data-id="meta_2" >${author}${date}</ul></article>`
  );
}

/** WordPress search URLs: /?s=term, /page/2/?s=term. */
export function searchUrl(query: string, page: number) {
  const q = encodeURIComponent(query).replace(/%20/g, "+");
  // add_query_arg() drops the "=" of an empty value.
  return `${page > 1 ? `/page/${page}/` : "/"}?s${q ? `=${q}` : ""}`;
}

/** paginate_links() as Blocksy calls it (end_size 1, mid_size 3) inside its "simple" pagination. */
export function searchPagination(query: string, page: number, pages: number, icons: { prev?: string; next?: string }) {
  if (pages <= 1) return "";
  const END = 1;
  const MID = 3;
  const items: string[] = [];
  let dots = false;
  for (let n = 1; n <= pages; n++) {
    if (n === page) {
      items.push(`<span aria-current="page" class="page-numbers current">${n}</span>`);
      dots = true;
    } else if (n <= END || (n >= page - MID && n <= page + MID) || n > pages - END) {
      items.push(`<a class="page-numbers" href="${escapeAttr(searchUrl(query, n))}">${n}</a>`);
      dots = true;
    } else if (dots) {
      items.push(`<span class="page-numbers dots">&hellip;</span>`);
      dots = false;
    }
  }
  const prev = page > 1 ? `<a class="prev page-numbers" rel="prev" href="${escapeAttr(searchUrl(query, page - 1))}">${icons.prev || ""}Prev</a>` : "";
  const next = page < pages ? `<a class="next page-numbers" rel="next" href="${escapeAttr(searchUrl(query, page + 1))}">Next ${icons.next || ""}</a>` : "";
  return `<nav class="ct-pagination" aria-label="Search results pagination" data-pagination="simple"  >\n\t\t\t${prev}<div class="ct-hidden-sm">${items.join("\n")}</div>${next}\n\t\t\t\n\t\t</nav>`;
}
