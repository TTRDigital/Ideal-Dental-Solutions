import { createHmac, timingSafeEqual } from "node:crypto";
import { getSite } from "@/lib/site/data";
import { normalizePath } from "@/lib/site/local";
import { renderDocument, type ArchiveDoc, type PageDoc, type Resolved } from "@/lib/site/render";
import { optimizeHtml } from "@/lib/site/optimize";
import { seoPass } from "@/lib/site/seo-pass";
import { withoutArlington } from "@/lib/site/arlington";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/**
 * Private preview of a draft (TTR OS staging, TTR-2053).
 * GET /api/preview?path=/some-page/&exp=<unix seconds>&sig=<hex>
 * sig = HMAC-SHA256(PREVIEW_SECRET, "<path>\n<exp>"), exp at most 30 days away. TTR OS makes the link
 * (lib/connectors/sanity.ts previewUrl). A good link shows the page with its unpublished draft, read with
 * SANITY_PREVIEW_TOKEN (a Viewer token; SANITY_WRITE_TOKEN also works). Nothing is saved, nothing is cached,
 * search engines are told not to index it, and the TTR tracker is not added.
 */
export const dynamic = "force-dynamic";

const MAX_SECONDS = 30 * 86_400;
const HEADERS = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };

function text(status: number, body: string) {
  return new Response(body, { status, headers: { ...HEADERS, "Content-Type": "text/plain; charset=UTF-8" } });
}

function signedOk(secret: string, path: string, exp: string, sig: string) {
  const want = createHmac("sha256", secret).update(`${path}\n${exp}`).digest();
  const got = Buffer.from(sig, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}

type Found<T> = { doc: T | null; tokenStatus: number | null };

/** One query against Sanity. perspective "raw" returns the draft (id drafts.<id>) and the published copy side by side, so the
 *  draft is picked here with order(); this does not depend on how a perspective hides drafts. Without a token it reads the
 *  published copy from the public CDN, exactly as the live site does. */
async function lookup<T>(path: string, token: string | null): Promise<{ doc: T | null; status: number }> {
  const query = `*[_type in ["page", "archivePage"] && path == $path] | order(_id in path("drafts.**") desc)[0]`;
  const search = new URLSearchParams({ query, perspective: token ? "raw" : "published", $path: JSON.stringify(path) });
  const host = token ? "api.sanity.io" : "apicdn.sanity.io";
  const res = await fetch(`https://${projectId}.${host}/v${apiVersion}/data/query/${dataset}?${search}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(`[preview] sanity answered ${res.status} (${token ? "with token" : "published"})`);
    return { doc: null, status: res.status };
  }
  return { doc: ((await res.json()) as { result?: T }).result ?? null, status: res.status };
}

/** The draft if there is one, else the published page. A refused token is reported, never shown as "not found". */
async function findDoc<T>(token: string, path: string): Promise<Found<T>> {
  let tokenStatus: number | null = null;
  try {
    const r = await lookup<T>(path, token);
    if (r.doc) return { doc: r.doc, tokenStatus: null };
    if (r.status !== 200) tokenStatus = r.status;
  } catch (err) {
    console.warn("[preview] sanity fetch failed", err);
    tokenStatus = 0;
  }
  try {
    const r = await lookup<T>(path, null);
    return { doc: r.doc, tokenStatus };
  } catch {
    return { doc: null, tokenStatus };
  }
}

export async function GET(req: Request) {
  const secret = process.env.PREVIEW_SECRET?.trim();
  if (!secret) return text(503, "Preview is not set up on this site (PREVIEW_SECRET is missing).");
  const token = (process.env.SANITY_PREVIEW_TOKEN || process.env.SANITY_WRITE_TOKEN || "").trim();
  if (!token) return text(503, "Preview is not set up on this site (SANITY_PREVIEW_TOKEN is missing).");

  const q = new URL(req.url).searchParams;
  const path = q.get("path") || "";
  const exp = q.get("exp") || "";
  const sig = q.get("sig") || "";
  if (!path.startsWith("/") || path.startsWith("//") || !/^\d{1,12}$/.test(exp) || !/^[0-9a-f]{64}$/i.test(sig)) return text(400, "This preview link is not complete.");
  if (!signedOk(secret, path, exp, sig)) return text(403, "This preview link is not valid.");
  const left = Number(exp) - Math.floor(Date.now() / 1000);
  if (left <= 0) return text(410, "This preview link has expired. Ask TTR for a new one.");
  if (left > MAX_SECONDS + 3600) return text(403, "This preview link is not valid.");

  const clean = normalizePath(path);
  const { doc, tokenStatus } = await findDoc<PageDoc | ArchiveDoc>(token, clean);
  if (!doc && tokenStatus !== null) return text(502, `Sanity did not accept the preview token (answer ${tokenStatus}). Check SANITY_PREVIEW_TOKEN on this project.`);
  if (!doc) return text(404, "No draft or page was found at this address.");
  const site = await getSite();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || site.settings.siteUrl || "https://idealdentalsolutions.com").replace(/\/$/, "");
  const resolved: Resolved =
    doc._type === "archivePage"
      ? { kind: "archive", doc: doc as ArchiveDoc }
      : { kind: "page", doc: doc as PageDoc, ancestors: ((doc as PageDoc & { ancestorPaths?: string[] }).ancestorPaths as string[]) || [] };
  let html = withoutArlington(seoPass(optimizeHtml(renderDocument(resolved, site.data, clean, { projectId, dataset, origin, recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY?.trim() || "" }))));
  html = html.replace("</head>", `<meta name="robots" content="noindex, nofollow"></head>`);
  return new Response(html, { status: 200, headers: { ...HEADERS, "Content-Type": "text/html; charset=UTF-8" } });
}
