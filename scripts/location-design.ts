/**
 * The card sections of the location pages (TTR-970): short blocks of the practice's own words, built as plain HTML with the site's
 * colours. The hero, the photo with accordion, the FAQ and the call to action are the site's own blocks (scripts/locations.ts).
 * Nothing here adds a fact: every sentence comes from scripts/locations-content.ts.
 */
import { ADDRESS, HOURS, MAP, METRO, PHONE } from "./locations-content.ts";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plain = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** The text inside each <li>. */
export const listItems = (html: string): string[] => [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1].trim());
/** Top-level <p> and <ul> blocks in order. */
export const blocks = (html: string): string[] => [...html.matchAll(/<p>[\s\S]*?<\/p>|<ul>[\s\S]*?<\/ul>/g)].map((m) => m[0]);

const upFirst = (h: string) => h.replace(/^(\s*)([a-z])/, (_m, sp, c) => sp + c.toUpperCase());

/** "Label: rest" where the label is plain text or a link. */
export function labelled(li: string): { label: string; href?: string; rest: string } {
  const a = /^<a href="([^"]+)">([^<]+)<\/a>:\s*([\s\S]*)$/.exec(li);
  if (a) return { label: a[2], href: a[1], rest: upFirst(a[3]) };
  const t = /^([^:<]{2,70}):\s*([\s\S]*)$/.exec(li);
  if (t) return { label: t[1], rest: upFirst(t[2]) };
  return { label: "", rest: li };
}

export const STYLE = `<style>
.idl{font-family:inherit;color:#1f2430;line-height:1.55}
.idl *{box-sizing:border-box}
.idl-band{padding:72px 24px}
.idl-light{background:#faf9f4}
.idl-dark{background:#1b1b1b;color:#fff}
.idl-in{max-width:1296px;margin:0 auto}
.idl h2{font-size:clamp(1.5rem,2.6vw,2.125rem);line-height:1.2;font-weight:500;margin:0 0 14px;color:inherit}
.idl-dark h2{text-transform:uppercase;letter-spacing:.02em}
.idl-lead{font-size:1.0625rem;max-width:820px;margin:0 0 30px;color:inherit;opacity:.88}
.idl-grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.idl-grid-4{grid-template-columns:repeat(4,1fr)}
.idl-grid-3{grid-template-columns:repeat(3,1fr)}
.idl-flex{display:flex;flex-wrap:wrap;justify-content:center;gap:20px}
.idl-flex .idl-card{flex:1 1 280px;max-width:420px}
.idl-card{background:#fff;border:1px solid #e8e4da;border-radius:12px;padding:24px 24px 26px;color:#1f2430}
.idl-card::before{content:"";display:block;width:34px;height:3px;background:#fb7f2a;margin-bottom:16px;border-radius:2px}
.idl-card h3{font-size:1.125rem;line-height:1.3;font-weight:600;margin:0 0 8px;color:#111518}
.idl-card p{margin:0;font-size:1rem}
.idl-card p+p{margin-top:8px}
.idl-card a{color:#c2570a;text-decoration:underline}
.idl-dark .idl-card{background:#262626;border-color:#383838;color:#e9e6df}
.idl-dark .idl-card h3{color:#fff}
.idl-dark .idl-card a{color:#ff9a4d}
.idl-note{font-size:.9375rem;margin:22px 0 0;opacity:.8}
.idl-chips{display:flex;flex-wrap:wrap;gap:10px;margin:0;padding:0;list-style:none}
.idl-chips a{display:inline-block;background:#fff;border:1px solid #e0dccf;border-radius:999px;padding:9px 16px;font-size:.9375rem;color:#111518;text-decoration:none}
.idl-chips span{display:inline-block;background:#fff;border:1px solid #e0dccf;border-radius:999px;padding:9px 16px;font-size:.9375rem;color:#111518}
.idl-chips a:hover{border-color:#fb7f2a;color:#c2570a}
.idl-acc details{background:#fff;border:1px solid #e8e4da;border-radius:12px;margin:0 0 12px}
.idl-acc summary{cursor:pointer;list-style:none;padding:18px 22px;font-size:1.0625rem;font-weight:600;color:#111518;display:flex;justify-content:space-between;gap:16px}
.idl-acc summary::-webkit-details-marker{display:none}
.idl-acc summary::after{content:"+";font-size:1.4rem;line-height:1;color:#fb7f2a}
.idl-acc details[open] summary::after{content:"\\2212"}
.idl-acc .idl-body{padding:0 22px 20px}
.idl-acc .idl-body p{margin:0 0 10px}
.idl-acc .idl-body ul{margin:0;padding-left:1.2em}
.idl-acc .idl-body li{margin-bottom:8px}
.idl-acc a{color:#c2570a;text-decoration:underline}
@media (max-width:1000px){.idl-grid-4{grid-template-columns:repeat(2,1fr)}.idl-grid-3{grid-template-columns:repeat(2,1fr)}}
@media (max-width:640px){.idl-band{padding:52px 20px}.idl-grid-4,.idl-grid-3{grid-template-columns:1fr}.idl-card{padding:20px 20px 22px}}
</style>`;

/** One section: a band with a heading, an optional lead and the body. */
export const band = (o: { tone: "light" | "dark"; heading: string; lead?: string; body: string; note?: string; id?: string }) =>
  `<div class="idl idl-band idl-${o.tone}"${o.id ? ` id="${o.id}"` : ""}><div class="idl-in"><h2>${esc(o.heading)}</h2>${o.lead ? `<p class="idl-lead">${o.lead}</p>` : ""}${o.body}${o.note ? `<p class="idl-note">${o.note}</p>` : ""}</div></div>`;

export const card = (title: string, html: string) => `<div class="idl-card"><h3>${title}</h3><p>${html}</p></div>`;

/** The office at a glance: address, phone, hours, Metro. The same four facts on every page. */
export function glance() {
  const cards = [
    card("Our office", `${esc(ADDRESS)}. <a href="${MAP}">Open in Google Maps</a>`),
    card("Call us", PHONE),
    card("Hours", esc(HOURS) + "."),
    card("By Metro", esc(METRO) + "."),
  ];
  return band({ tone: "light", heading: "Visit us", body: `<div class="idl-grid idl-grid-4">${cards.join("")}</div>` });
}

/** "Getting here": each list item becomes a card (label before the colon is the title). */
export function directions(heading: string, html: string) {
  const items = listItems(html);
  const note = blocks(html).filter((b) => b.startsWith("<p>")).map((b) => plain(b)).join(" ");
  const cards = items.map((li) => {
    const l = labelled(li);
    return card(esc(l.label || "Directions"), l.rest);
  });
  const cls = cards.length === 3 ? "idl-grid idl-grid-3" : cards.length === 4 ? "idl-grid idl-grid-4" : "idl-grid";
  return band({ tone: "light", heading, body: `<div class="${cls}">${cards.join("")}</div>`, note: note ? esc(note) : undefined });
}

/** Local facts: grouped into a few short, closed items. */
export function facts(heading: string, html: string, town: string, tone: "light" | "dark" = "light") {
  const groups: string[][] = [];
  for (const b of blocks(html)) {
    if (b.startsWith("<ul>") && groups.length) groups[groups.length - 1].push(b);
    else groups.push([b]);
  }
  const items = groups.map((g, i) => {
    const text = plain(g.join(" "));
    const title = /^Low-cost/i.test(text) ? "Low-cost and public dental care" : /fluorid|water/i.test(text) ? "Drinking water and fluoride" : /^(Patients also come|Our office:)/i.test(text) ? "Nearby towns we serve" : i === 0 ? `About ${town}` : "More";
    return `<details${i === 0 ? " open" : ""}><summary>${esc(title)}</summary><div class="idl-body">${g.join("")}</div></details>`;
  });
  return band({ tone, heading, lead: "Short facts for people who live or work nearby, with their sources linked.", body: `<div class="idl-acc">${items.join("")}</div>` });
}

/** Services patients ask about: one card per list item, the rest as small links. */
export function serviceCards(heading: string, html: string) {
  const bs = blocks(html);
  const lead = bs.find((b) => b.startsWith("<p>") && /services|search/i.test(b));
  const items = listItems(bs.find((b) => b.startsWith("<ul>")) || "");
  const extra = bs.filter((b) => b.startsWith("<p>") && b !== lead);
  const cards = items.map((li) => {
    return `<div class="idl-card"><p style="font-size:1.0625rem">${li.replace(/^(<a [^>]+>[^<]+<\/a>)/, "$1").replace(/^./, (c) => c)}</p></div>`;
  });
  return band({
    tone: "dark",
    heading,
    lead: lead ? plain(lead).replace(/ Each link has the details:?/, "") : undefined,
    body: `<div class="idl-flex">${cards.join("")}</div>${extra.map((e) => `<div class="idl-note">${e.replace(/^<p>|<\/p>$/g, "")}</div>`).join("")}`,
  });
}

/** The hub's town list: a card per town, linked. */
export function townCards(heading: string, html: string, lead?: string) {
  const cards = listItems(html).map((li) => {
    const l = labelled(li);
    const title = l.href ? `<a href="${l.href}" style="text-decoration:none;color:inherit">${esc(l.label)}</a>` : esc(l.label);
    return card(title, `${l.rest}${l.href ? ` <a href="${l.href}">See the ${esc(l.label)} page</a>` : ""}`);
  });
  const note = blocks(html).filter((b) => b.startsWith("<p>")).map((b) => b.replace(/^<p>|<\/p>$/g, "")).join(" ");
  return band({ tone: "light", heading, lead, body: `<div class="idl-grid idl-grid-3">${cards.join("")}</div>`, note: note || undefined });
}

/** The McLean page's care list as a row of links. */
export function careChips(heading: string, html: string) {
  const bs = blocks(html);
  const list = listItems(bs.find((b) => b.startsWith("<ul>")) || "");
  const rest = bs.filter((b) => b.startsWith("<p>")).map((b) => b.replace(/^<p>|<\/p>$/g, "")).join(" ");
  return band({ tone: "dark", heading, body: `<ul class="idl-chips">${list.map((li) => `<li>${li}</li>`).join("")}</ul>`, note: rest || undefined });
}
