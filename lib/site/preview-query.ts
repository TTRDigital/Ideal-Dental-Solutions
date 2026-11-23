import { POST_FIELDS } from "./blog.ts";

/**
 * GROQ for the private draft preview (app/api/preview). Kept here so tests can check it without Next.js.
 *
 * Sanity's query parser needs `in` wrapped in parentheses inside order(): `order(_id in path("drafts.**") desc)`
 * is a parse error (HTTP 400, "unexpected postfix operator desc"), which made every preview fail (TTR-2814).
 */
export const DRAFT_FIRST = `order((_id in path("drafts.**")) desc)`;

export const PAGE_QUERY = `*[_type in ["page", "archivePage"] && path == $path] | ${DRAFT_FIRST}[0]`;
// TTR OS saves blog drafts as Sanity "post" documents; they carry a slug and may also carry a path.
export const POST_QUERY = `*[_type == "post" && (path == $path || slug.current == $slug)] | ${DRAFT_FIRST}[0]${POST_FIELDS}`;

/**
 * What to answer when no token found a draft. `statuses` holds Sanity's HTTP answer per token (0: network error).
 * 404: a token could read the dataset and nothing is there. 500: Sanity rejected the query itself (a bug here,
 * not a token problem). 502: every token was refused, or Sanity could not be reached.
 */
export function previewMiss(statuses: number[]): { status: 404 | 500 | 502; reason: "not_found" | "bad_query" | "token_refused" | "unreachable" } {
  if (statuses.some((s) => s === 200)) return { status: 404, reason: "not_found" };
  if (statuses.some((s) => s === 400)) return { status: 500, reason: "bad_query" };
  if (statuses.length && statuses.every((s) => s === 401 || s === 403)) return { status: 502, reason: "token_refused" };
  return { status: 502, reason: "unreachable" };
}
