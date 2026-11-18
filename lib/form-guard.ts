import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Invisible spam protection for the website forms (TTR-2337). Nothing here changes what a visitor
 * sees. Server side, in order: honeypot, signed form token (also gives the time from page load),
 * content checks, per-IP rate limit. A blocked submission is answered by the route exactly like a
 * good one, is not delivered, and is logged as one "[form-guard] blocked" line (no message text,
 * no email, no phone, no raw IP) so the blocked count can be read from the Vercel logs.
 */

type Env = Record<string, string | undefined>;

export const MIN_SECONDS = 3;
export const TOKEN_TTL_SECONDS = 3 * 3600;
export const RATE_LIMIT = 3;
export const RATE_WINDOW_MS = 24 * 3600 * 1000;

export type BlockReason =
  | "honeypot"
  | "no_token"
  | "bad_token"
  | "expired_token"
  | "too_fast"
  | "bad_name"
  | "bad_email"
  | "bad_phone"
  | "message_too_long"
  | "link_in_text"
  | "spam_words"
  | "bot_pattern"
  | "rate_limit";

/**
 * Key for the token signature. FORM_TOKEN_SECRET is the one meant for this; until it is set, a key is
 * derived (domain-separated) from a secret the site already has. With none, the token and time checks
 * are skipped (and said so in the log) rather than turning real patients away.
 */
function secret(env: Env = process.env) {
  const base = [env.FORM_TOKEN_SECRET, env.SANITY_REVALIDATE_SECRET, env.PREVIEW_SECRET, env.RECAPTCHA_SECRET_KEY].map((v) => v?.trim()).find(Boolean);
  return base ? createHmac("sha256", base).update("ttr-form-token-v1").digest() : null;
}

export function tokenConfigured(env: Env = process.env) {
  return secret(env) !== null;
}

const sign = (key: Buffer, body: string) => createHmac("sha256", key).update(body).digest("base64url");

/** "<issued-at seconds>.<random>.<signature>" */
export function issueToken(now = Date.now(), env: Env = process.env): string | null {
  const key = secret(env);
  if (!key) return null;
  const body = `${Math.floor(now / 1000)}.${randomBytes(9).toString("base64url")}`;
  return `${body}.${sign(key, body)}`;
}

export function checkToken(token: string, now = Date.now(), env: Env = process.env): "ok" | "bad_token" | "expired_token" | "too_fast" {
  const key = secret(env);
  const parts = token.split(".");
  if (!key || parts.length !== 3 || !/^\d{9,11}$/.test(parts[0])) return "bad_token";
  const want = Buffer.from(sign(key, `${parts[0]}.${parts[1]}`));
  const got = Buffer.from(parts[2]);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return "bad_token";
  const age = now / 1000 - Number(parts[0]);
  if (age < MIN_SECONDS) return "too_fast"; // includes a token dated in the future
  if (age > TOKEN_TTL_SECONDS) return "expired_token";
  return "ok";
}

// ---- Content checks -------------------------------------------------------------------------

const LINK = /(?:https?:|ftp:|www\.|\bt\.me\/|\bbit\.ly)/i;
/** A bare domain such as "example.com" (lower case, so "yesterday.Thanks" is not one). */
const DOMAIN = /\b[a-z0-9][a-z0-9-]{1,62}\.(?:com|net|org|info|biz|xyz|click|link|vip|ru|cn|io|cc|buzz|icu|club)\b/;
const SPAM_WORDS =
  /\b(?:seo|backlinks?|crypto(?:currency)?|bitcoin|btc|usdt|forex|casino|viagra|cialis|porn|escort|loans?\s+(?:offer|approved)|guest\s+post|web\s?(?:site)?\s?(?:design|development)|digital\s+marketing|increase\s+(?:your\s+)?(?:traffic|sales|rankings?)|rank(?:ing)?\s+(?:higher|#?1)|google\s+(?:rankings?|first\s+page)|lead\s+generation|link\s+building|whats\s?app|telegram|click\s+here|earn\s+\$?\d+|investment\s+opportunit\w*|make\s+money|work\s+from\s+home|free\s+(?:gift|money|trial)|adult\s+dating|payday|replica|pills|weight\s+loss\s+(?:pill|supplement)|business\s+proposal|cash\s+app|dear\s+(?:sir|madam|owner)|i\s+(?:can|will)\s+(?:help|offer)\s+you\s+(?:rank|grow|promote))\b/i;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

/** Share of letters that are not Latin (Cyrillic, CJK, Arabic ...): the practice's patients write in Latin script. */
function nonLatinShare(s: string) {
  const letters = s.match(/\p{L}/gu) || [];
  if (letters.length < 6) return 0;
  return letters.filter((c) => !/\p{Script=Latin}/u.test(c)).length / letters.length;
}

function botPattern(s: string) {
  return /(.)\1{9,}/.test(s) || /<\s*\/?\s*(?:a|script|iframe|img|html|body)\b/i.test(s) || /\[\s*\/?\s*(?:url|link)\b/i.test(s) || /\b(?:select\s.+\sfrom|union\s+select|\$\{|{{)/i.test(s);
}

type Fields = Record<string, string>;
const find = (f: Fields, re: RegExp, not?: RegExp) => Object.keys(f).find((k) => re.test(k) && !not?.test(k));

/** Content checks on the fields as the route labels them (Full Name, Email Address, Phone Number, Comments ...). */
export function checkContent(f: Fields): BlockReason | null {
  const entries = Object.entries(f);
  if (entries.length > 30) return "bot_pattern";
  const text = entries.map(([, v]) => v).join("\n");
  if (entries.some(([, v]) => v.length > 5000)) return "message_too_long";

  const nameKey = find(f, /^(full )?name$/i) ?? (f.name !== undefined ? "name" : undefined);
  const emailKey = find(f, /e-?mail/i);
  const phoneKey = find(f, /phone/i);
  const name = nameKey ? f[nameKey].trim() : undefined;
  if (name !== undefined) {
    if (name.length < 2 || name.length > 100) return "bad_name";
    if (/[\d@<>/\\{}[\]|=]|https?:|www\./i.test(name) || !/\p{L}/u.test(name)) return "bad_name";
  }
  const email = emailKey ? f[emailKey].trim() : undefined;
  if (email !== undefined && (email.length > 254 || !EMAIL.test(email))) return "bad_email";
  if (phoneKey) {
    const raw = f[phoneKey].trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15 || /[^\d\s()+\-.#*xX,ext]/i.test(raw) || /^(\d)\1+$/.test(digits)) return "bad_phone";
  }

  // Free text: every field that is not name, email, phone or a short choice (callback time).
  const free = entries.filter(([k]) => k !== nameKey && k !== emailKey && k !== phoneKey).map(([, v]) => v).join("\n");
  if (free.length > 2000) return "message_too_long";
  if (LINK.test(free) || DOMAIN.test(free) || LINK.test(name ?? "")) return "link_in_text";
  if (SPAM_WORDS.test(free) || SPAM_WORDS.test(name ?? "")) return "spam_words";
  if (botPattern(text) || nonLatinShare(text) > 0.3) return "bot_pattern";
  if (name && email && name.toLowerCase() === email.toLowerCase()) return "bot_pattern";
  return null;
}

// ---- Rate limit -----------------------------------------------------------------------------
// In memory: each Vercel instance counts for itself, so the real ceiling can be higher when traffic
// is spread over several instances. Good against a bot hammering the form; a shared store
// (Vercel KV / Upstash) would make it exact.

const hits = new Map<string, number[]>();

/** Records one submission for this key and says whether it is over the limit. */
export function rateLimited(key: string, now = Date.now(), limit = RATE_LIMIT) {
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(k);
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function resetRateLimit() {
  hits.clear();
}

export function clientIp(h: Headers) {
  return (h.get("x-vercel-forwarded-for") || h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "").trim();
}

const ipHash = (ip: string) => (ip ? createHash("sha256").update(`ttr-ip:${ip}`).digest("hex").slice(0, 10) : "none");

// ---- Entry point ----------------------------------------------------------------------------

export type GuardInput = {
  fields: Fields;
  honeypot: string;
  token: string;
  ip: string;
  form: string;
  now?: number;
  env?: Env;
};

let warnedNoSecret = false;

/** Returns the reason to block, or null to let the submission through. Logs every block. */
export function guardSubmission(i: GuardInput): BlockReason | null {
  const now = i.now ?? Date.now();
  const env = i.env ?? process.env;
  let reason: BlockReason | null = null;
  if (i.honeypot.trim()) reason = "honeypot";
  else if (tokenConfigured(env)) {
    if (!i.token) reason = "no_token";
    else {
      const t = checkToken(i.token, now, env);
      if (t !== "ok") reason = t;
    }
  } else if (!warnedNoSecret) {
    warnedNoSecret = true;
    console.warn("[form-guard] no FORM_TOKEN_SECRET (or other site secret) is set: token and minimum-time checks are off");
  }
  reason ??= checkContent(i.fields);
  reason ??= rateLimited(ipHash(i.ip), now) ? "rate_limit" : null;
  if (reason) console.warn(`[form-guard] blocked reason=${reason} form=${JSON.stringify(i.form)} ip=${ipHash(i.ip)}`);
  return reason;
}
