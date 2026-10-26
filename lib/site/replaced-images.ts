/**
 * Images taken off the site (TTR-900, Oct 26, 2026): a stock-style photo whose
 * dentist's coat reads "Mahesh Patel, D.D.S.", who is not at the practice. It was
 * uploaded twice (two file names). Replaced everywhere by a photo of the
 * practice's own team in the office.
 *
 * - Elementor stylesheets (public/wp-content/uploads/elementor/css) and
 *   content/seed.json are edited directly (scripts/fixes.ts uses REPLACED).
 * - replaceImages() applies the same swap to every rendered page, so content
 *   still in the CMS is right before the CMS is seeded. TEMPORARY: a no-op once
 *   the seed has run.
 * - The old addresses (and their WebP copies) 301 to the new image
 *   (content/redirects-search-console.json); the old files are deleted.
 */
export const NEW_IMAGE = "/wp-content/uploads/2026/07/Edited385-web-1.jpg";

export const REPLACED: string[] = [
  "/wp-content/uploads/2026/05/f27652e6-1b34-4494-a431-a20933a947bc-scaled.png",
  "/wp-content/uploads/2026/05/8dc0a8ce-a9b3-4e4a-bd09-18ca643740b6-scaled.png",
];

export function replaceImages(html: string) {
  if (!/f27652e6-1b34|8dc0a8ce-a9b3/.test(html)) return html;
  let out = html;
  for (const old of REPLACED) {
    out = out.split(old).join(NEW_IMAGE);
    // The same paths with escaped slashes (Elementor settings JSON).
    out = out.split(old.replace(/\//g, "\\/")).join(NEW_IMAGE.replace(/\//g, "\\/"));
  }
  return out;
}
