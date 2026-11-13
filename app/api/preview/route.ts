import { createHmac, timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/*
 * Signed draft preview for TTR OS's page fixer (production and previews).
 *
 *   GET /api/preview?path=/services/cosmetic-dentistry/invisalign/&exp=<unix seconds>&sig=<hex>
 *   sig = HMAC-SHA256(PREVIEW_SECRET, "<path>\n<exp>"), hex.
 *
 * exp must be in the future and at most 30 days away. On success this turns on
 * Next draft mode (a cookie) and redirects to the page, which then reads Sanity
 * drafts (lib/site/data.ts) with SANITY_READ_TOKEN; that token is used only while
 * draft mode is on. Anything else (bad or expired link, missing secret) answers 404.
 * Env var names (set in Vercel, never in code): PREVIEW_SECRET, SANITY_READ_TOKEN.
 */
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const secret = process.env.PREVIEW_SECRET?.trim();
  if (!secret) return notFound();

  const params = new URL(request.url).searchParams;
  const path = params.get("path") ?? "";
  const exp = params.get("exp") ?? "";
  const sig = params.get("sig") ?? "";

  // Only site-relative page paths such as /about-us/ (no protocol, host or "//": no open redirect).
  if (!/^\/([A-Za-z0-9._~-]+\/)*$/.test(path) || !/^\d{1,12}$/.test(exp) || !/^[0-9a-f]{64}$/.test(sig)) return notFound();
  const now = Math.floor(Date.now() / 1000);
  const expiry = Number(exp);
  if (expiry <= now || expiry > now + MAX_AGE_SECONDS) return notFound();

  const expected = createHmac("sha256", secret).update(`${path}\n${exp}`).digest();
  const given = Buffer.from(sig, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return notFound();

  (await draftMode()).enable();
  redirect(path);
}
