import type { Seo } from "../render/seo.ts";

/**
 * Title and description lengths (TTR-2515, SOP technical SEO: titles 50 to 60
 * characters, descriptions 120 to 160).
 *
 * The reviewed titles and descriptions are in content/seed.json (scripts/fixes.ts,
 * scripts/locations-content.ts), but the CMS has not been seeded since PR #4, so
 * the live pages still print the old WordPress titles (29 over 65 characters in
 * the Nov 20 sweep). reviewedSeo() uses the reviewed value for a page only where
 * the CMS value is out of range: a title over 60 characters, or a description
 * that is missing or outside 120 to 160. A CMS value in range always wins.
 * TEMPORARY, like lib/site/arlington.ts: once the seed has run
 * (POST /api/admin/seed/?apply=1) it changes nothing and can be removed.
 */
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 120;
export const DESCRIPTION_MAX = 160;

const titleOk = (t?: string) => Boolean(t) && t!.length <= TITLE_MAX;
const descriptionOk = (d?: string) => Boolean(d) && d!.length >= DESCRIPTION_MIN && d!.length <= DESCRIPTION_MAX;

/** The text as it appears inside a JSON string. */
const inJson = (s: string) => JSON.stringify(s).slice(1, -1);

export function reviewedSeo(current: Seo | undefined, reviewed: Seo | undefined): Seo | undefined {
  if (!current || !reviewed || /noindex/.test(current.robots || "")) return current;
  const out: Seo = { ...current };
  const oldTitle = current.title || "";
  if (oldTitle.length > TITLE_MAX && titleOk(reviewed.title)) {
    const title = reviewed.title!;
    out.title = title;
    if (!current.ogTitle || current.ogTitle === oldTitle || !titleOk(current.ogTitle)) out.ogTitle = title;
    if (current.twitterTitle && (current.twitterTitle === oldTitle || !titleOk(current.twitterTitle))) out.twitterTitle = title;
    if (out.schema) out.schema = out.schema.split(`"name":"${inJson(oldTitle)}"`).join(`"name":"${inJson(title)}"`);
  }
  const oldDescription = current.description || "";
  if (!descriptionOk(oldDescription) && descriptionOk(reviewed.description)) {
    const description = reviewed.description!;
    out.description = description;
    if (!current.ogDescription || current.ogDescription === oldDescription) out.ogDescription = description;
    if (out.schema && oldDescription) out.schema = out.schema.split(`"description":"${inJson(oldDescription)}"`).join(`"description":"${inJson(description)}"`);
  }
  return out;
}
