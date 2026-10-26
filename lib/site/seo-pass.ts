/**
 * On-page additions to a rendered page (after lib/site/optimize.ts), computed
 * from the page itself so they follow CMS edits:
 *
 * - FAQ structured data: accordion items whose title is a question (ends with
 *   "?") and that have an answer become a FAQPage in the page's JSON-LD graph.
 * - default alt text for images printed with an empty one (icons next to their
 *   title, section dividers): the heading that follows the image, else the H1.
 */

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const text = (html: string) => decode(html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

export function faqs(html: string) {
  const out: { q: string; a: string }[] = [];
  for (const m of html.matchAll(/<details[^>]*class="e-n-accordion-item"[^>]*>([\s\S]*?)<\/details>/g)) {
    const q = text(/class="e-n-accordion-item-title-text">([\s\S]*?)<\/div>/.exec(m[1])?.[1] || "");
    const a = text(m[1].slice(m[1].indexOf("</summary>") + 10));
    if (q.endsWith("?") && a && !out.some((f) => f.q === q)) out.push({ q, a });
  }
  return out;
}

function faqSchema(html: string) {
  const list = faqs(html);
  if (list.length < 2) return html;
  return html.replace(/(<script type="application\/ld\+json" class="yoast-schema-graph">)([\s\S]*?)(<\/script>)/, (all, open: string, json: string, close: string) => {
    try {
      const data = JSON.parse(json.replace(/<\\\/script/gi, "</script")) as { "@graph"?: Record<string, unknown>[] };
      const graph = data["@graph"] || [];
      if (graph.some((n) => n["@type"] === "FAQPage")) return all;
      const page = graph.find((n) => /WebPage/.test(String(n["@type"])));
      const url = String(page?.url || page?.["@id"] || "").split("#")[0];
      graph.push({
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        ...(page ? { isPartOf: { "@id": page["@id"] } } : {}),
        mainEntity: list.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      });
      data["@graph"] = graph;
      return `${open}${JSON.stringify(data).replace(/<\/script/gi, "<\\/script")}${close}`;
    } catch {
      return all;
    }
  });
}

function defaultAlt(html: string) {
  const h1 = text(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] || "") || "Ideal Dental Solutions";
  return html.replace(/<img\s[^>]*>/g, (tag, offset: number) => {
    if (/\salt="[^"]+"/.test(tag)) return tag;
    let alt: string;
    if (/separated-(top|bottom)/.test(attr(tag, "src") || "")) alt = `${h1} section divider`;
    else {
      const next = /<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/.exec(html.slice(offset + tag.length, offset + tag.length + 1500));
      const title = next ? text(next[1]) : "";
      alt = title ? `${title} icon` : h1;
    }
    alt = alt.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return /\salt=""/.test(tag) ? tag.replace(/\salt=""/, ` alt="${alt}"`) : tag.replace(/^<img/, `<img alt="${alt}"`);
  });
}

export function seoPass(html: string) {
  return faqSchema(defaultAlt(html));
}
