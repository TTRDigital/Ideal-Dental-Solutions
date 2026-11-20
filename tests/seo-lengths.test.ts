import test from "node:test";
import assert from "node:assert/strict";
import { reviewedSeo } from "../lib/site/seo-lengths.ts";

const reviewed = {
  title: "Our Dental Services | Ideal Dental Solutions, McLean VA",
  description: "General, cosmetic, implant and gum care at Ideal Dental Solutions in McLean, VA: cleanings, fillings, veneers, Invisalign, implants and more for you.",
};
const longTitle = "Our Dental Services: General, Cosmetic and Implant Dentistry - idealdental";
const schema = JSON.stringify({ "@graph": [{ "@type": "WebPage", name: longTitle }] });

test("a CMS title over 60 characters gets the reviewed one, with og, twitter and schema", () => {
  const out = reviewedSeo({ title: longTitle, ogTitle: longTitle, twitterTitle: longTitle, schema, robots: "index, follow" }, reviewed)!;
  assert.equal(out.title, reviewed.title);
  assert.equal(out.ogTitle, reviewed.title);
  assert.equal(out.twitterTitle, reviewed.title);
  assert.ok(out.schema!.includes(`"name":"${reviewed.title}"`));
});

test("a CMS title in range is kept", () => {
  const title = "Dental Services in McLean, VA | Ideal Dental Solutions";
  assert.equal(reviewedSeo({ title }, reviewed)!.title, title);
});

test("a missing or short description gets the reviewed one; one in range is kept", () => {
  assert.equal(reviewedSeo({ title: reviewed.title }, reviewed)!.description, reviewed.description);
  assert.equal(reviewedSeo({ title: reviewed.title, description: "Short." }, reviewed)!.description, reviewed.description);
  const ok = "x".repeat(130);
  assert.equal(reviewedSeo({ title: reviewed.title, description: ok }, reviewed)!.description, ok);
});

test("noindex pages and pages without a reviewed version are left alone", () => {
  const seo = { title: longTitle, robots: "noindex, follow" };
  assert.deepEqual(reviewedSeo(seo, reviewed), seo);
  assert.deepEqual(reviewedSeo({ title: longTitle }, undefined), { title: longTitle });
});

test("a reviewed value out of range is never used", () => {
  assert.equal(reviewedSeo({ title: longTitle }, { title: longTitle + "!" })!.title, longTitle);
});
