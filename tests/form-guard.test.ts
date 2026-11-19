import test from "node:test";
import assert from "node:assert/strict";
import { checkContent, checkToken, guardSubmission, issueToken, resetRateLimit, MIN_SECONDS, TOKEN_TTL_SECONDS } from "../lib/form-guard.ts";
type Env = Record<string, string | undefined>;
import { withFormGuard } from "../lib/site/form-guard-html.ts";

const env = { FORM_TOKEN_SECRET: "test-secret-not-real" } as Env;
const T0 = 1_800_000_000_000;
const patient = {
  "Full Name": "Maria Gonzalez",
  "Email Address": "maria.gonzalez@example.org",
  "Phone Number": "(703) 555-0142",
  "Preferred Callback Time": "Morning",
  Comments: "I'd like a cleaning and a check-up for my son, he is 8. Thank you!",
};
const submit = (over: Partial<Parameters<typeof guardSubmission>[0]> = {}) =>
  guardSubmission({ fields: patient, honeypot: "", token: issueToken(T0, env)!, ip: "203.0.113.7", form: "t", now: T0 + 10_000, env, ...over });

test.beforeEach(() => resetRateLimit());

test("a normal patient submission goes through", () => assert.equal(submit(), null));
test("a patient with no comments and a plain number goes through", () =>
  assert.equal(submit({ fields: { "Full Name": "Li Wei", "Email Address": "li@gmail.com", "Phone Number": "7035550142", "Preferred Callback Time": "Evening", Comments: "" } }), null));
test("accented and Spanish text goes through", () =>
  assert.equal(submit({ fields: { ...patient, "Full Name": "José Peña", Comments: "Necesito una cita para limpieza dental, gracias." } }), null));

test("patients writing in Persian, Arabic, Korean and Chinese go through", () => {
  const msgs: [string, string][] = [
    ["سارا احمدی", "سلام، برای تمیز کردن دندان و معاینه وقت می‌خواهم. ممنون"],
    ["محمد العلي", "مرحبا، أريد حجز موعد لفحص الأسنان وتنظيفها. شكرا"],
    ["김민준", "안녕하세요, 치아 검진과 스케일링 예약을 하고 싶습니다. 감사합니다"],
    ["李伟", "您好，我想预约洗牙和牙齿检查，谢谢。"],
  ];
  msgs.forEach(([name, text], n) => assert.equal(submit({ ip: `192.0.2.${n + 1}`, fields: { ...patient, "Full Name": name, Comments: text } }), null, name));
});

test("honeypot filled is blocked", () => assert.equal(submit({ honeypot: "http://x" }), "honeypot"));
test("missing token is blocked", () => assert.equal(submit({ token: "" }), "no_token"));
test("forged token is blocked", () => assert.equal(submit({ token: "1800000000.abc.forged" }), "bad_token"));
test("token signed with another secret is blocked", () => assert.equal(submit({ token: issueToken(T0, { FORM_TOKEN_SECRET: "other" } as Env)! }), "bad_token"));
test("submit under 3 seconds is blocked", () => assert.equal(submit({ now: T0 + (MIN_SECONDS - 1) * 1000 }), "too_fast"));
test("submit at 3 seconds is allowed", () => assert.equal(submit({ now: T0 + MIN_SECONDS * 1000 }), null));
test("an old token expires", () => assert.equal(checkToken(issueToken(T0, env)!, T0 + (TOKEN_TTL_SECONDS + 5) * 1000, env), "expired_token"));
test("without any secret the token checks are off but content checks still run", () => {
  const none = {} as Env;
  assert.equal(submit({ env: none, token: "" }), null);
  assert.equal(submit({ env: none, token: "", fields: { ...patient, Comments: "visit https://spam.example" } }), "link_in_text");
});

test("links in the message are blocked", () => {
  for (const c of ["see https://spam.example/x", "www.seo-deals.net", "buy now at cheap-pills.com", "<a href=x>hi</a>"]) {
    assert.ok(checkContent({ ...patient, Comments: c }), c);
  }
  assert.equal(checkContent({ ...patient, Comments: "Yesterday.Thanks, I can come in Monday." }), null);
});
test("spam words and non-English bot text are blocked", () => {
  assert.equal(checkContent({ ...patient, Comments: "We offer SEO and backlinks to rank higher" }), "spam_words");
  assert.equal(checkContent({ ...patient, Comments: "Привет, предлагаем SEO продвижение сайта" }), "spam_words");
  assert.equal(checkContent({ ...patient, Comments: "Привет, смотрите https://spam.example" }), "link_in_text");
  assert.equal(checkContent({ ...patient, Comments: "a".repeat(30) }), "bot_pattern");
});
test("bad name, email, phone and long messages are blocked", () => {
  assert.equal(checkContent({ ...patient, "Full Name": "A" }), "bad_name");
  assert.equal(checkContent({ ...patient, "Full Name": "Win $1000 now 123" }), "bad_name");
  assert.equal(checkContent({ ...patient, "Email Address": "not-an-email" }), "bad_email");
  assert.equal(checkContent({ ...patient, "Phone Number": "12" }), "bad_phone");
  assert.equal(checkContent({ ...patient, "Phone Number": "000000000000" }), "bad_phone");
  assert.equal(checkContent({ ...patient, Comments: "word ".repeat(500) }), "message_too_long");
});

test("per-IP limit: the 4th submission in a day is blocked, another IP is not", () => {
  for (let i = 0; i < 3; i++) assert.equal(submit(), null);
  assert.equal(submit(), "rate_limit");
  assert.equal(submit({ ip: "198.51.100.9" }), null);
  assert.equal(submit({ now: T0 + 25 * 3600 * 1000, token: issueToken(T0 + 24 * 3600 * 1000, env)! }), null);
});

test("blocked submissions are logged without personal details", () => {
  const lines: string[] = [];
  const orig = console.warn;
  console.warn = (m: string) => lines.push(m);
  try {
    submit({ honeypot: "x" });
  } finally {
    console.warn = orig;
  }
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^\[form-guard\] blocked reason=honeypot/);
  assert.ok(!lines[0].includes("203.0.113.7") && !lines[0].includes("maria"));
});

test("page markup gets the hidden fields and the token script, once per form", () => {
  const html = '<body><form class="elementor-form" method="post" name="Contact Form"><input name="post_id"></form></body>';
  const out = withFormGuard(html);
  assert.match(out, /name="ttr_ft"/);
  assert.match(out, /name="website_url"[^>]*tabindex="-1"/);
  assert.match(out, /\/api\/form-token\//);
  assert.equal(withFormGuard("<body>no form</body>"), "<body>no form</body>");
});
