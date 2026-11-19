/**
 * Google reCAPTCHA v3 on the appointment form (invisible: no checkbox, Google scores each submission
 * from 0 = bot to 1 = human). The form's own Elementor script runs it: when the visitor presses Submit it
 * asks Google for a token (action "appointment") and sends it as g-recaptcha-response; the server checks
 * the token with Google and only delivers the lead if Google confirms it (see judgeRecaptcha).
 *
 * Keys: Ideal Dental Solutions' v3 site key is built in (it is public by design); the secret is never in
 * the code: the server check runs once RECAPTCHA_SECRET_KEY is set in Vercel. Both keys are registered for
 * idealdentalsolutions.com and www.idealdentalsolutions.com only (tokens from other hosts, e.g. the Vercel
 * preview or localhost, are refused by Google). RECAPTCHA_SITE_KEY overrides the site key; "off" removes
 * reCAPTCHA from the page and turns the server check off.
 */

const DEFAULT_SITE_KEY = "6LfDryguAAAAAPBSmvVjYxJvkkOCDU4yabsC-en4";

/** The action name the page sends with every token; a token made for another action is refused. */
export const RECAPTCHA_ACTION = "appointment";
/** Google's recommended threshold: below 0.5 is treated as a bot. */
export const RECAPTCHA_MIN_SCORE = 0.5;
/** Hosts the key is registered for. A token issued on any other host is refused. */
export const RECAPTCHA_HOSTNAMES = ["idealdentalsolutions.com", "www.idealdentalsolutions.com"];

type Env = Record<string, string | undefined>;

const off = (v?: string) => /^(off|false|0|none)$/i.test(v?.trim() || "");

/** Site key printed in the page, or "" when reCAPTCHA is turned off. */
export function recaptchaSiteKey(env: Env = process.env): string {
  if (off(env.RECAPTCHA_SITE_KEY)) return "";
  return env.RECAPTCHA_SITE_KEY?.trim() || DEFAULT_SITE_KEY;
}

/** Secret for the server check (RECAPTCHA_SECRET_KEY), or "" when not set or reCAPTCHA is off. */
export function recaptchaSecret(env: Env = process.env): string {
  if (off(env.RECAPTCHA_SITE_KEY) || off(env.RECAPTCHA_SECRET_KEY)) return "";
  return env.RECAPTCHA_SECRET_KEY?.trim() || "";
}

export type SiteVerify = { success?: boolean; score?: number; action?: string; hostname?: string; "error-codes"?: string[] };

/** Why Google's answer is not good enough, or null when the submission passes. */
export function judgeRecaptcha(r: SiteVerify): string | null {
  if (!r.success) return `failed:${(r["error-codes"] || []).join(",") || "unknown"}`;
  if (r.action && r.action !== RECAPTCHA_ACTION) return `wrong_action:${r.action}`;
  if (r.hostname && !RECAPTCHA_HOSTNAMES.includes(r.hostname)) return `wrong_host:${r.hostname}`;
  if (typeof r.score === "number" && r.score < RECAPTCHA_MIN_SCORE) return `low_score:${r.score}`;
  return null;
}

/**
 * Checks a token with Google. Returns null when the submission may go through, or the reason it may
 * not. Google unreachable: the lead is let through (a lost patient costs more than one spam lead).
 */
export async function checkRecaptcha(token: string | null, ip?: string | null, env: Env = process.env): Promise<string | null> {
  const secret = recaptchaSecret(env);
  if (!secret) return null;
  if (!token) return "missing_token";
  const body = new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) });
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", { method: "POST", body, signal: AbortSignal.timeout(6000) });
    return judgeRecaptcha((await res.json()) as SiteVerify);
  } catch {
    return null;
  }
}
