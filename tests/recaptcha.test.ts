import test from "node:test";
import assert from "node:assert/strict";
import { judgeRecaptcha, recaptchaSecret, recaptchaSiteKey, RECAPTCHA_ACTION } from "../lib/recaptcha.ts";

const ok = { success: true, score: 0.9, action: RECAPTCHA_ACTION, hostname: "idealdentalsolutions.com" };

test("a ticked checkbox on the live site goes through", () =>
  assert.equal(judgeRecaptcha({ success: true, hostname: "idealdentalsolutions.com", challenge_ts: "2026-11-19T18:00:00Z" } as never), null));
test("a checkbox ticked on another site is refused", () => assert.equal(judgeRecaptcha({ success: true, hostname: "evil.example" }), "wrong_host:evil.example"));
test("a human score on the live site goes through", () => assert.equal(judgeRecaptcha(ok), null));
test("www goes through", () => assert.equal(judgeRecaptcha({ ...ok, hostname: "www.idealdentalsolutions.com" }), null));
test("exactly 0.5 goes through", () => assert.equal(judgeRecaptcha({ ...ok, score: 0.5 }), null));
test("a bot score is refused", () => assert.equal(judgeRecaptcha({ ...ok, score: 0.1 }), "low_score:0.1"));
test("a token Google rejects is refused", () => assert.equal(judgeRecaptcha({ success: false, "error-codes": ["timeout-or-duplicate"] }), "failed:timeout-or-duplicate"));
test("a token made on another site is refused", () => assert.equal(judgeRecaptcha({ ...ok, hostname: "evil.example" }), "wrong_host:evil.example"));
test("a token made for another action is refused", () => assert.equal(judgeRecaptcha({ ...ok, action: "login" }), "wrong_action:login"));

test("the site key is built in; the secret only comes from the setting", () => {
  assert.match(recaptchaSiteKey({}), /^6L/);
  assert.equal(recaptchaSecret({}), "");
});
test("settings override the built-in keys", () => {
  assert.equal(recaptchaSiteKey({ RECAPTCHA_SITE_KEY: "site-x" }), "site-x");
  assert.equal(recaptchaSecret({ RECAPTCHA_SECRET_KEY: "secret-x" }), "secret-x");
});
test("RECAPTCHA_SITE_KEY=off turns it off on the page and on the server", () => {
  assert.equal(recaptchaSiteKey({ RECAPTCHA_SITE_KEY: "off" }), "");
  assert.equal(recaptchaSecret({ RECAPTCHA_SITE_KEY: "off", RECAPTCHA_SECRET_KEY: "secret-x" }), "");
});

import { renderDocument } from "../lib/site/render.ts";
test("the appointment form shows the visible checkbox with the site key", () => {
  const field = '<div class="elementor-field-type-recaptcha elementor-field-group elementor-column elementor-col-100"> <div class="elementor-field" id="form-field-x"><div class="elementor-g-recaptcha" data-sitekey="old" data-type="v2_checkbox" data-theme="light" data-size="normal"></div></div> </div>';
  const doc = { _id: "p", _type: "page", frameTpl: field, shell: "none" };
  const html = (key?: string) => renderDocument({ kind: "page", doc, ancestors: [] }, { settings: {} }, "/appointment/", { projectId: "x", dataset: "y", recaptchaSiteKey: key });
  assert.match(html("site-key-1"), /data-sitekey="site-key-1" data-type="v2_checkbox" data-theme="light" data-size="normal"/);
  assert.doesNotMatch(html("site-key-1"), /data-size="invisible"|grecaptcha-badge/);
  assert.doesNotMatch(html(""), /recaptcha/i);
  assert.match(html(undefined), /data-sitekey="old"/);
});
