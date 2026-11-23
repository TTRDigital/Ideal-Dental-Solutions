import test from "node:test";
import assert from "node:assert/strict";
import { PAGE_QUERY, POST_QUERY, previewMiss } from "../lib/site/preview-query.ts";

/** The terms inside every order(...) of a GROQ query, split on top-level commas. */
function orderTerms(query: string): string[] {
  const terms: string[] = [];
  for (let i = query.indexOf("order("); i !== -1; i = query.indexOf("order(", i + 1)) {
    let depth = 0;
    let term = "";
    for (let j = i + "order(".length; j < query.length; j++) {
      const c = query[j];
      if (c === "(") depth++;
      if (c === ")" && depth-- === 0) break;
      if (c === "," && depth === 0) {
        terms.push(term.trim());
        term = "";
      } else term += c;
    }
    terms.push(term.trim());
  }
  return terms;
}

// Sanity answers 400 "unexpected postfix operator desc" to `order(_id in path("drafts.**") desc)` (TTR-2814).
// groq-js parses it anyway, so this checks the rule directly: an `in` before asc/desc must sit in parentheses.
for (const [name, query] of [["page", PAGE_QUERY], ["post", POST_QUERY]] as const) {
  test(`the ${name} preview query wraps "in" in parentheses before asc/desc`, () => {
    const terms = orderTerms(query);
    assert.ok(terms.length > 0, "expected an order() clause");
    for (const term of terms) {
      const m = /^(.*)\s+(asc|desc)$/.exec(term);
      const expr = (m ? m[1] : term).trim();
      if (/\sin\s/.test(expr)) assert.ok(expr.startsWith("(") && expr.endsWith(")"), `order term not parenthesized: ${term}`);
    }
  });
}

test("the old unparenthesized form is caught by the check", () => {
  const [term] = orderTerms(`*[a] | order(_id in path("drafts.**") desc)[0]`);
  assert.equal(term, `_id in path("drafts.**") desc`);
});

test("the post query looks a draft up by path or slug and keeps the post fields", () => {
  assert.match(POST_QUERY, /path == \$path \|\| slug\.current == \$slug/);
  assert.match(POST_QUERY, /"slug": slug\.current/);
});

test("a token that could read but found nothing is a 404", () => assert.deepEqual(previewMiss([200, 401]), { status: 404, reason: "not_found" }));
test("a query Sanity rejects is a 500, not a token problem", () => assert.deepEqual(previewMiss([400, 400, 400]), { status: 500, reason: "bad_query" }));
test("every token refused is a 502", () => assert.deepEqual(previewMiss([401, 403]), { status: 502, reason: "token_refused" }));
test("Sanity unreachable is a 502", () => assert.deepEqual(previewMiss([0, 503]), { status: 502, reason: "unreachable" }));
