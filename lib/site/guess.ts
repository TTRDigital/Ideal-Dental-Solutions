/**
 * WordPress' "redirect_guess_404_permalink": an unknown URL whose last part
 * matches the start of a page or post slug is sent there with a 301. Old
 * links (moved categories, renamed parents, shortened slugs) keep working.
 */
export function guessRedirect(path: string, paths: { path: string; type: string }[]): string | null {
  const parts = path.split("/").filter(Boolean);
  const seg = parts[parts.length - 1]?.toLowerCase();
  if (!seg || seg.length < 3 || /\.\w+$/.test(seg)) return null;
  // A child of an existing page is looked up as that page's child, without guessing (404).
  const parent = `/${parts.slice(0, -1).join("/")}/`;
  if (parts.length > 1 && paths.some((p) => p.path === parent)) return null;
  const last = (p: string) => p.split("/").filter(Boolean).pop() || "";
  // Pages before posts, shorter paths first, like WordPress' lookup.
  const order = [...paths].filter((p) => p.path !== path && p.path !== "/").sort((a, b) => (a.type === b.type ? a.path.length - b.path.length : a.type === "page" ? -1 : 1));
  const exact = order.find((p) => last(p.path) === seg);
  if (exact) return exact.path;
  const prefix = order.find((p) => last(p.path).startsWith(seg));
  return prefix ? prefix.path : null;
}
