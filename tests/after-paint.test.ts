import test from "node:test";
import assert from "node:assert/strict";
import { afterPaint, AFTER_PAINT_TYPE } from "../lib/site/optimize.ts";

const page = (tail: string) => `<html><head></head><body><main><h1>Hi</h1></main><link rel="stylesheet" href="/x.css">\n${tail}\n</body></html>`;
const TAIL = [
  '<script id="a-extra">var a = 1;</script>',
  '<script id="jquery-core-js" src="/jq.js"></script>',
  '<script type="text/javascript" id="b-js" src="/b.js"></script>',
  '<script type="application/ld+json">{"@type":"Thing"}</script>',
].join("\n");

test("the trailing scripts become placeholders in the same order, with one loader after them", () => {
  const out = afterPaint(page(TAIL));
  const tags = [...out.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(tags.length, 5);
  assert.match(tags[0], new RegExp(`type="${AFTER_PAINT_TYPE}" id="a-extra"`));
  assert.match(tags[1], /type="text\/x-after-paint" id="jquery-core-js" data-src="\/jq.js"/);
  assert.match(tags[2], /type="text\/x-after-paint" data-type="text\/javascript" id="b-js" data-src="\/b.js"/);
  assert.equal(tags[3], '<script type="application/ld+json">', "JSON-LD is left alone");
  assert.equal(tags[4], '<script id="after-paint">');
  assert.ok(out.includes("var a = 1;"), "inline code is kept");
  assert.ok(!/<script[^>]*\ssrc=/.test(out.replace(/data-src=/g, "")), "no script file loads during parsing");
});

test("scripts above other markup, async scripts and kept ids are not touched", () => {
  const html = `<html><body><script id="early">x()</script><div>content</div>\n<script async src="/t.js"></script>\n<script id="keep-me" src="/k.js"></script>\n<script id="go" src="/g.js"></script>\n</body></html>`;
  const out = afterPaint(html, ["keep-me"]);
  assert.ok(out.includes('<script id="early">x()</script>'));
  assert.ok(out.includes('<script async src="/t.js"></script>'));
  assert.ok(out.includes('<script id="keep-me" src="/k.js"></script>'));
  assert.ok(out.includes(`<script type="${AFTER_PAINT_TYPE}" id="go" data-src="/g.js"></script>`));
});

test("runs once, and leaves a page with no trailing scripts as it was", () => {
  const once = afterPaint(page(TAIL));
  assert.equal(afterPaint(once), once);
  const plain = "<html><body><p>No scripts</p></body></html>";
  assert.equal(afterPaint(plain), plain);
});
