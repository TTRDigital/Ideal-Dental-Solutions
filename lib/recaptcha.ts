/**
 * Google reCAPTCHA v2, the visible "I'm not a robot" checkbox, on the appointment form. Elementor's form
 * script draws it; the visitor ticks it (Google may ask for an image challenge) and the token is sent with
 * the form as g-recaptcha-response. The server checks the token with Google and only delivers the lead if
 * Google confirms it for this site (see judgeRecaptcha).
 *
 * Keys: Ideal Dental Solutions' checkbox site key is built in (it is public by design); the secret is
 * never in the code: the server check runs once RECAPTCHA_SECRET_KEY is set in Vercel. The key is
 * registered for idealdentalsolutions.com and www.idealdentalsolutions.com only (on the Vercel preview or
 * localhost Google shows "Invalid domain"). RECAPTCHA_SITE_KEY overrides the site key; "off" removes
 * reCAPTCHA from the page and turns the server check off.
 */

const DEFAULT_SITE_KEY = "6Le8tSguAAAAAEPtlyu5mntgQIQD43g-H92mgeZW";

/** A score-based (v3) token made for another action is refused; checkbox tokens carry no action. */
export const RECAPTCHA_ACTION = "appointment";
/** Score threshold for score-based (v3) tokens; checkbox tokens carry no score. */
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
