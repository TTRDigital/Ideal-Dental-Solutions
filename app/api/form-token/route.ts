import { issueToken } from "@/lib/form-guard";

/**
 * Hands the page a signed, short-lived form token (see lib/form-guard.ts). The page asks for it after it
 * loads, so the token's time is the time the page was opened, whatever the page cache holds.
 * Without a configured secret there is no token and the form checks are off.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ token: issueToken() }, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}
