import { createHmac, timingSafeEqual } from "node:crypto";
import { getSite } from "@/lib/site/data";
import { normalizePath } from "@/lib/site/local";
import { renderDocument, type ArchiveDoc, type PageDoc, type Resolved } from "@/lib/site/render";
import { optimizeHtml } from "@/lib/site/optimize";
import { seoPass } from "@/lib/site/seo-pass";
import { withoutArlington } from "@/lib/site/arlington";
import { POST_FIELDS, resolvePostDraft, type PostDraft } from "@/lib/site/blog";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { recaptchaSiteKey } from "@/lib/recaptcha";

/**
 * Private preview of a draft (TTR OS staging, TTR-2053).
 * GET /api/preview?path=/some-page/&exp=<unix seconds>&sig=<hex>
 * sig = HMAC-SHA256(PREVIEW_SECRET, "<path>\n<exp>"), exp at most 30 days away. TTR OS makes the link
 * (lib/connectors/sanity.ts previewUrl). A good link shows the page with its unpublished draft, read with
 * SANITY_PREVIEW_TOKEN (a Viewer token; SANITY_WRITE_TOKEN and SANITY_READ_TOKEN are tried next if it is refused). Nothing is saved, nothing is cached,
 * search engines are told not to index it, and the TTR tracker is not added.
 * /blog/<slug>/ also finds a Sanity "post" draft by slug (TTR OS staging check), shown in the blog post layout.
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

const PAGE_QUERY = `*[_type in ["page", "archivePage"] && path == $path] | order(_id in path("drafts.**") desc)[0]`;
// TTR OS saves blog drafts as Sanity "post" documents; they carry a slug and may also carry a path.
const POST_QUERY = `*[_type == "post" && (path == $path || slug.current == $slug)] | order(_id in path("drafts.**") desc)[0]${POST_FIELDS}`;

type Lookup<T> = { doc: T | null; status: number };

/** One query with the drafts perspective, straight from the API (not the CDN), never cached. status 0: network error. */
async function draftDoc<T>(token: string, query: string, params: Record<string, string>): Promise<Lookup<T>> {
  const search = new URLSearchParams({ query, perspective: "drafts" });
  for (const [k, v] of Object.entries(params)) search.set(`$${k}`, JSON.stringify(v));
  try {
    const res = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${search}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { doc: null, status: res.status };
    return { doc: ((await res.json()) as { result?: T }).result ?? null, status: res.status };
  } catch (err) {
    console.warn("[preview] sanity fetch failed", err);
    return { doc: null, status: 0 };
  }
}

/** The page, archive or post draft at this path, read with one token. */
async function findDraft(token: string, path: string): Promise<{ resolved: Resolved | null; status: number }> {
  const page = await draftDoc<PageDoc | ArchiveDoc>(token, PAGE_QUERY, { path });
  if (page.status !== 200) return { resolved: null, status: page.status };
  const doc = page.doc;
  if (doc) {
    const resolved: Resolved =
      doc._type === "archivePage"
        ? { kind: "archive", doc: doc as ArchiveDoc }
        : { kind: "page", doc: doc as PageDoc, ancestors: ((doc as PageDoc & { ancestorPaths?: string[] }).ancestorPaths as string[]) || [] };
    return { resolved, status: 200 };
  }
  const slug = /^\/blog\/([a-z0-9-]+)\/$/.exec(path)?.[1] ?? "";
  const post = await draftDoc<PostDraft>(token, POST_QUERY, { path, slug });
  return { resolved: post.doc ? resolvePostDraft(post.doc) : null, status: post.status };
}

/** Every configured read token, preview token first. A refused or blind token falls through to the next one. */
function tokens() {
  const names = ["SANITY_PREVIEW_TOKEN", "SANITY_WRITE_TOKEN", "SANITY_READ_TOKEN"] as const;
  const out: { name: string; value: string }[] = [];
  for (const name of names) {
    const value = (process.env[name] || "").trim();
    if (value && !out.some((t) => t.value === value)) out.push({ name, value });
  }
  return out;
}

export async function GET(req: Request) {
  const secret = process.env.PREVIEW_SECRET?.trim();
  if (!secret) return text(503, "Preview is not set up on this site (PREVIEW_SECRET is missing).");
  const keys = tokens();
  if (!keys.length) return text(503, "Preview is not set up on this site (SANITY_PREVIEW_TOKEN is missing).");

  const q = new URL(req.url).searchParams;
  const path = q.get("path") || "";
  const exp = q.get("exp") || "";
  const sig = q.get("sig") || "";
  if (!path.startsWith("/") || path.startsWith("//") || !/^\d{1,12}$/.test(exp) || !/^[0-9a-f]{64}$/i.test(sig)) return text(400, "This preview link is not complete.");
  if (!signedOk(secret, path, exp, sig)) return text(401, "This preview link is not valid.");
  const left = Number(exp) - Math.floor(Date.now() / 1000);
  if (left <= 0) return text(410, "This preview link has expired. Ask TTR for a new one.");
  if (left > MAX_SECONDS + 3600) return text(401, "This preview link is not valid.");

  const clean = normalizePath(path);
  let resolved: Resolved | null = null;
  const tried: string[] = [];
  for (const key of keys) {
    const found = await findDraft(key.value, clean);
    tried.push(`${key.name} ${found.status || "network error"}`);
    if (found.resolved) {
      resolved = found.resolved;
      break;
    }
  }
  if (!resolved) {
    // Names and HTTP answers only, never token values. Shown only to holders of a valid signed link.
    const where = `Sanity project ${projectId}, dataset ${dataset}; tried ${tried.join(", ")}`;
    console.warn(`[preview] nothing at ${clean} (${where})`);
    const refused = tried.every((t) => !t.endsWith(" 200"));
    if (refused) return text(502, `Sanity did not accept the preview token (${where}). Check SANITY_PREVIEW_TOKEN on this project.`);
    return text(404, `No draft or page was found at this address (${where}).`);
  }
  const site = await getSite();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || site.settings.siteUrl || "https://idealdentalsolutions.com").replace(/\/$/, "");
  let html = withoutArlington(seoPass(optimizeHtml(renderDocument(resolved, site.data, clean, { projectId, dataset, origin, recaptchaSiteKey: recaptchaSiteKey() }))));
  html = html.replace("</head>", `<meta name="robots" content="noindex, nofollow"></head>`);
  return new Response(html, { status: 200, headers: { ...HEADERS, "Content-Type": "text/html; charset=UTF-8" } });
}
