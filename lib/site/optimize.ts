import imagesJson from "../generated/images.json" with { type: "json" };
import inlineJson from "../generated/inline-images.json" with { type: "json" };
import pageCssJson from "../generated/page-css.json" with { type: "json" };
import { INLINE_IMAGE, inlineHash } from "./inline-images.ts";

/**
 * Speed pass over a rendered page (the HTML WordPress printed,
 * see render.ts). It runs on the finished HTML, so the CMS content and the
 * migration check (scripts/verify.ts) are unchanged:
 *
 * - no sideways scrolling: html clips horizontal overflow
 * - the first section's background image is preloaded (phone copy on phones)
 * - stylesheets: the page's theme and Elementor stylesheets are replaced by
 *   one stylesheet holding only the rules the page uses (npm run optimize,
 *   lib/generated/page-css.json). Fail-safe: when the page uses a class or id
 *   whose rules were left out (new content in the CMS), the original
 *   stylesheets are printed instead.
 * - fonts: Urbanist (variable) from this site, preloaded, instead of two
 *   Google Fonts stylesheets
 * - images: WebP copies (npm run images), a 768px copy for phones, the
 *   original width and height (no layout shift) and lazy loading below the
 *   first section
 * - scripts run exactly in WordPress' order, never deferred (deferring them let
 *   Elementor start before Elementor Pro's form and carousel handlers on fast
 *   connections, #4, #7); only jQuery moves from the head to the footer
 *   scripts (jqueryToFooter)
 * - images uploaded as WebP get a 768px phone copy too (npm run images)
 * - base64 images pasted into the content are served as files (inlineImages)
 */

/** [width, height, WebP width or 0, phone copy width or 0] by original path. */
const images = imagesJson as unknown as Record<string, [number, number, number, number]>;

/** heroes: first-section background by Elementor element id: [image, phone copy or null]. */
type CssBundle = { file: string; dropped: string; heroes?: Record<string, [string, string | null]> };
const pageCss = pageCssJson as unknown as { dictionary: string[]; bundles: Record<string, CssBundle> };

/**
 * Nothing may widen the page sideways (the hero's video frame is wider than a phone). `clip` keeps the sticky header working.
 * The footer logo (666x375) is drawn in a 144x75 box: `contain` shows it at its own proportions in that same box instead of squeezed.
 */
const GUARD =
  "<style id=\"overflow-guard\">html{overflow-x:clip}img[src*=\"/ChatGPT_Image_Jul_30__2026__01_30_28_AM-removebg-preview\"]{object-fit:contain}</style>";

/** Urbanist (variable, latin and latin-ext) from this site instead of Google Fonts: no extra connections before the first paint. */
const LATIN = "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF";
const face = (style: string, file: string, range: string) =>
  `@font-face{font-family:'Urbanist';font-style:${style};font-weight:100 900;font-display:swap;src:url(/assets/fonts/urbanist-${file}.woff2) format('woff2');unicode-range:${range}}`;
const FONTS = [
  '<link rel="preload" href="/assets/fonts/urbanist-L0x-DF02iFML4hGCyMqlbS0.woff2" as="font" type="font/woff2" crossorigin>',
  `<style id="urbanist-css">${[
    face("italic", "L0x4DF02iFML4hGCyMqgXSFsjkK3", LATIN_EXT),
    face("italic", "L0x4DF02iFML4hGCyMqgXS9sjg", LATIN),
    face("normal", "L0x-DF02iFML4hGCyMqrbS10ig", LATIN_EXT),
    face("normal", "L0x-DF02iFML4hGCyMqlbS0", LATIN),
  ].join("")}</style>`,
].join("\n");

/* ---------------- shared with scripts/optimize.ts ---------------- */

const STYLESHEET = /<link rel="stylesheet"[^>]*>\s*/g;

/** Local stylesheets of the head, in order: [tag, href, media]. */
export function headStylesheets(html: string) {
  const head = html.slice(0, html.indexOf("</head>"));
  const out: { tag: string; href: string; media: string }[] = [];
  for (const m of head.matchAll(STYLESHEET)) {
    const href = /\shref="([^"]+)"/.exec(m[0])?.[1] || "";
    if (!href.startsWith("/")) continue;
    out.push({ tag: m[0], href: href.replace(/&amp;/g, "&"), media: /\smedia="([^"]*)"/.exec(m[0])?.[1] || "all" });
  }
  return out;
}

/** Key of a set of stylesheets (the same set shares one bundle). */
export function bundleKey(sheets: { href: string; media: string }[]) {
  let h = 0x811c9dc5;
  for (const c of sheets.map((s) => `${s.href}|${s.media}`).join("\n")) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Class names and ids the page's markup uses. */
export function markupTokens(html: string) {
  const tokens = new Set<string>();
  for (const m of html.matchAll(/\s(?:class|id)="([^"]*)"/g)) for (const t of m[1].split(/\s+/)) if (t) tokens.add(t);
  return tokens;
}

/** WebP copy of an uploaded image, or the original path. */
export function webp(url: string) {
  const path = url.split(/[?#]/)[0];
  const img = images[path];
  return img?.[2] ? `${path}.webp` : url;
}

/** 768px copy for phones, or null. */
export function phoneCopy(url: string) {
  const path = url.split(/[?#]/)[0];
  return images[path]?.[3] ? `${path}-${images[path][3]}w.webp` : null;
}

/* ---------------- passes ---------------- */

function stylesheets(html: string) {
  const sheets = headStylesheets(html);
  if (!sheets.length) return html;
  const bundle = pageCss.bundles[bundleKey(sheets)];
  if (!bundle) return html;
  const dropped = new Set(bundle.dropped ? bundle.dropped.split(",").map((i) => pageCss.dictionary[parseInt(i, 36)]) : []);
  for (const t of markupTokens(html)) if (dropped.has(t)) return html; // fail-safe: keep the original stylesheets
  let first = true;
  const main = html.indexOf('<main id="main"');
  const heroTag = main >= 0 ? /<div class="[^"]*\be-parent\b[^"]*"[^>]*data-id="([0-9a-f]+)"[^>]*>/.exec(html.slice(main)) : null;
  const heroId = heroTag?.[1];
  // A first section with its own photo in an inline style (location pages) preloads that photo instead.
  const own = heroTag ? /\sstyle="[^"]*background-image:\s*url\(['"]?(\/wp-content\/uploads\/[^'")]+?\.(?:png|jpe?g|webp))/i.exec(heroTag[0])?.[1] : undefined;
  const hero: [string, string | null] | undefined = own ? [webp(own), phoneCopy(own)] : heroId ? bundle.heroes?.[heroId] : undefined;
  const preload = hero
    ? hero[1]
      ? `<link rel="preload" as="image" href="${hero[1]}" media="(max-width: 767px)" fetchpriority="high">\n<link rel="preload" as="image" href="${hero[0]}" media="(min-width: 768px)" fetchpriority="high">\n`
      : `<link rel="preload" as="image" href="${hero[0]}" fetchpriority="high">\n`
    : "";
  return html.replace(STYLESHEET, (tag) => {
    if (!sheets.some((s) => s.tag === tag)) return tag;
    if (!first) return "";
    first = false;
    return `${preload}<link rel="stylesheet" id="page-css" href="${bundle.file}" media="all">\n`;
  });
}

function fonts(html: string) {
  let done = false;
  return html.replace(/<link rel="stylesheet" id="[^"]*" href="https:\/\/fonts\.googleapis\.com\/css2?\?family=Urbanist[^"]*" media="all">\n?/g, () => {
    if (done) return "";
    done = true;
    return `${FONTS}\n`;
  });
}

const UPLOAD = /\/wp-content\/uploads\/[^"'\s,)]+?\.(?:png|jpe?g)/gi;

function attr(tag: string, name: string) {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

function imageTag(tag: string, lazy: boolean) {
  const src = attr(tag, "src");
  if (!src || !src.startsWith("/wp-content/uploads/")) return tag;
  const path = src.split(/[?#]/)[0];
  const info = images[path];
  let out = tag;
  const srcset = attr(tag, "srcset");
  if (srcset) {
    out = out.replace(/\ssrcset="[^"]*"/, ` srcset="${srcset.replace(UPLOAD, (u) => webp(u))}"`);
  } else if (info?.[3]) {
    const full = webp(src);
    out = out.replace(/\ssrc="/, ` srcset="${phoneCopy(src)} ${info[3]}w, ${full} ${info[2] || info[0]}w" src="`);
    if (!attr(tag, "sizes")) out = out.replace(/\ssrc="/, ` sizes="(max-width: 767px) 100vw, ${attr(tag, "width") || info[0]}px" src="`);
  }
  out = out.replace(/\ssrc="[^"]*"/, ` src="${webp(src)}"`);
  if (info && !attr(tag, "width") && !attr(tag, "height")) out = out.replace(/^<img/, `<img width="${info[0]}" height="${info[1]}"`);
  if (lazy && !/\sloading=|\sfetchpriority="high"/.test(tag)) out = out.replace(/^<img/, '<img loading="lazy"');
  return out;
}

function imagesPass(html: string) {
  const main = html.indexOf('<main id="main"');
  // Images in the first section of the page are shown at once; the rest load as they come into view.
  let firstSectionEnd = -1;
  if (main >= 0) {
    const parents = [...html.slice(main).matchAll(/class="[^"]*\be-parent\b[^"]*"/g)];
    firstSectionEnd = parents[1] ? main + (parents[1].index ?? 0) : -1;
  }
  let out = html.replace(/<img\s[^>]*>/g, (tag, offset: number) => imageTag(tag, main >= 0 && offset > main && (firstSectionEnd < 0 || offset > firstSectionEnd)));
  // Background images in inline styles and Elementor settings.
  out = out.replace(/(url\(\s*(?:&quot;|['"])?)(\/wp-content\/uploads\/[^"')&]+?\.(?:png|jpe?g))/gi, (_m, pre: string, url: string) => `${pre}${webp(url)}`);
  // Background slideshows: image URLs in Elementor's settings JSON (escaped slashes).
  const phones: Record<string, string> = {};
  out = out.replace(/\\\/wp-content\\\/uploads\\\/[^"&]+?\.(?:png|jpe?g)(?=&quot;)/gi, (url) => {
    const path = url.replace(/\\\//g, "/");
    const full = webp(path).replace(/\//g, "\\/");
    const phone = phoneCopy(path);
    if (phone) phones[full] = phone.replace(/\//g, "\\/");
    return full;
  });
  // A slideshow at the top of the page is drawn by script: fetch its first image right away.
  const mainAt = out.indexOf('<main id="main"');
  const hero = mainAt >= 0 ? /<div class="[^"]*\be-parent\b[^"]*"[^>]*data-id="([0-9a-f]+)"[^>]*data-settings="([^"]*)"/.exec(out.slice(mainAt)) : null;
  const slide = hero && /background_slideshow_gallery&quot;:\[\{[^\]]*?&quot;url&quot;:&quot;([^&]+)&quot;/.exec(hero[2]);
  if (slide) {
    const first = slide[1].replace(/\\\//g, "/");
    const phone = phones[slide[1]]?.replace(/\\\//g, "/");
    // Paint that image as the section's own background until the slideshow script draws over it (the phone copy on phones).
    const el = `.elementor-element.elementor-element-${hero![1]}.e-parent`;
    const css = `${el}{background:url(${first}) center/cover no-repeat}${phone ? `@media (max-width: 767px){${el}{background-image:url(${phone})}}` : ""}`;
    const preload = phone
      ? `<link rel="preload" as="image" href="${phone}" media="(max-width: 767px)" fetchpriority="high">\n<link rel="preload" as="image" href="${first}" media="(min-width: 768px)" fetchpriority="high">`
      : `<link rel="preload" as="image" href="${first}" fetchpriority="high">`;
    out = out.replace("</head>", `${preload}\n<style id="hero-slide">${css}</style>\n</head>`);
  }
  // On phones every slideshow uses the 768px copies. Elementor reads the slide list from data-settings when its
  // footer scripts start, so this swaps it first. It only edits attributes: no script is moved, deferred or added before jQuery.
  if (Object.keys(phones).length && out.includes("</main>")) {
    const swap = `<script id="slideshow-phone">(function(m){if(!matchMedia("(max-width: 767px)").matches)return;document.querySelectorAll("[data-settings*=background_slideshow_gallery]").forEach(function(e){var s=e.getAttribute("data-settings");for(var k in m)s=s.split(k).join(m[k]);e.setAttribute("data-settings",s)})})(${JSON.stringify(phones)})</script>`;
    out = out.replace("</main>", `${swap}\n</main>`);
  }
  return out;
}

/** A first section with its own photo in an inline style (location pages) shows the phone copy on phones. */
function heroPhone(html: string) {
  const main = html.indexOf('<main id="main"');
  const tag = main >= 0 ? /<div class="[^"]*\be-parent\b[^"]*"[^>]*data-id="([0-9a-f]+)"[^>]*>/.exec(html.slice(main)) : null;
  const own = tag ? /\sstyle="[^"]*background-image:\s*url\(['"]?(\/wp-content\/uploads\/[^'")]+?\.(?:png|jpe?g|webp))(?:\.webp)?['"]?\)/i.exec(tag[0])?.[1] : undefined;
  const phone = own ? phoneCopy(own) : null;
  if (!tag || !phone) return html;
  return html.replace("</head>", `<style id="hero-phone">@media (max-width: 767px){.elementor-element-${tag[1]}[style]{background-image:url(${phone})!important}}</style>\n</head>`);
}

/**
 * jQuery and jQuery Migrate move from the head to just before the first footer
 * script that loads a file or uses jQuery (nothing above that point needs them),
 * so they no longer hold up the first paint. They and every other script still
 * load and run in the original order, without defer or async: deferring them
 * let Elementor start before Elementor Pro's form handler (#4, #9). Same change
 * as #17, which was reverted after Vercel answered 502 for two static files
 * during the production check (TTR-2515 brings it back).
 */
function jqueryToFooter(html: string) {
  const headEnd = html.indexOf("</head>");
  if (headEnd < 0) return html;
  const tags: string[] = [];
  const head = html.slice(0, headEnd).replace(/<script id="jquery-(?:core|migrate)-js" src="[^"]*"><\/script>\n?/g, (t) => {
    tags.push(t.trim());
    return "";
  });
  if (tags.length !== 2) return html;
  const body = html.slice(headEnd);
  const at = [...body.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find((m) => /\ssrc=/.test(m[0].slice(0, m[0].indexOf(">"))) || /jQuery|\$\(/.test(m[1]));
  if (!at || at.index == null) return html;
  return `${head}${body.slice(0, at.index)}${tags.join("\n")}\n${body.slice(at.index)}`;
}

/** Script types that are JavaScript (the rest, like JSON-LD and speculation rules, are left alone). */
const JS_TYPE = /^(?:|text\/javascript|application\/javascript|module)$/i;
/** The placeholder type: the browser neither downloads nor runs it. */
export const AFTER_PAINT_TYPE = "text/x-after-paint";

/**
 * The loader for afterPaint. After the first paint (DOMContentLoaded, then two animation frames) it runs the
 * placeholders one by one in the page's order, exactly as the browser would have: a file waits for the one
 * before it, inline code runs once everything above it has run. Every file is fetched in parallel first
 * (preload), so only the running is in order. While they run, the page says it is still loading
 * (document.readyState), and every "DOMContentLoaded" or "load" listener they add after that event is held and
 * called once all of them have run, DOMContentLoaded first: the same order as when the scripts ran during
 * parsing. Without this, Elementor started on jQuery's "ready" before Elementor Pro's form and carousel
 * handlers had loaded (the #4 and #7 breakage).
 */
const AFTER_PAINT_LOADER = `<script id="after-paint">(function(){
var T=${JSON.stringify(AFTER_PAINT_TYPE)},d=document,w=window,dcl=false,loaded=false,running=false,held=[];
function call(t,type,fn){var f=typeof fn==="function"?fn:fn&&fn.handleEvent&&function(e){fn.handleEvent(e)};if(f)f.call(t,new Event(type))}
var add=EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener=function(type,fn,o){var t=this;
if(fn&&(t===d&&type==="DOMContentLoaded"&&dcl||t===w&&type==="load"&&loaded||t===w&&type==="DOMContentLoaded"&&dcl)){
if(running)held.push([t,type,fn]);else setTimeout(function(){call(t,type,fn)},0);return}
return add.call(this,type,fn,o)};
add.call(w,"load",function(){loaded=true});
function finish(){running=false;delete d.readyState;
var q=held.filter(function(h){return h[1]==="DOMContentLoaded"}).concat(held.filter(function(h){return h[1]==="load"}));held=[];
q.forEach(function(h){if(h[1]==="load"&&!loaded){add.call(w,"load",h[2]);return}call(h[0],h[1],h[2])})}
function run(){var list=[].slice.call(d.querySelectorAll('script[type="'+T+'"]'));
list.forEach(function(s){var u=s.getAttribute("data-src");if(u){var l=d.createElement("link");l.rel="preload";l.as="script";l.href=u;d.head.appendChild(l)}});
running=true;Object.defineProperty(d,"readyState",{configurable:true,get:function(){return "loading"}});
var i=0;(function next(){if(i>=list.length)return finish();var o=list[i++],n=d.createElement("script");
for(var a=0;a<o.attributes.length;a++){var at=o.attributes[a];if(at.name==="type"||at.name==="data-src"||at.name==="data-type")continue;n.setAttribute(at.name,at.value)}
var ty=o.getAttribute("data-type");if(ty)n.type=ty;var u=o.getAttribute("data-src");
if(u){n.async=false;n.onload=n.onerror=next;n.src=u;o.parentNode.replaceChild(n,o)}else{n.text=o.text;o.parentNode.replaceChild(n,o);next()}})()}
add.call(d,"DOMContentLoaded",function(){dcl=true;requestAnimationFrame(function(){requestAnimationFrame(run)})});
})();</script>`;

/**
 * Phone speed (TTR-3001). The WordPress footer scripts (jQuery, Elementor, Elementor Pro, Swiper, Blocksy: about
 * 260 KB) ran during parsing, so PageSpeed's lab estimate counted all of them before the first paint (LCP about
 * 2.6 to 3.1 s estimated, while the page really painted at 0.2 s). This runs the same scripts, in the same order,
 * right after the first paint (AFTER_PAINT_LOADER). Only the trailing run of script tags before </body> is
 * changed; a page whose end looks different is left as it was. `keep` lists script ids that stay as they were.
 */
export function afterPaint(html: string, keep: string[] = []) {
  const end = html.lastIndexOf("</body>");
  if (end < 0 || html.includes('id="after-paint"')) return html;
  const before = html.slice(0, end);
  // One script tag: its body never runs past its own </script> (else one match could swallow the markup between scripts).
  const run = /(?:\s*<script\b[^>]*>(?:(?!<\/script>)[\s\S])*<\/script>)+\s*$/.exec(before);
  if (!run) return html;
  let changed = 0;
  const block = run[0].replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (tag, attrs: string, body: string) => {
    const type = /\stype="([^"]*)"/.exec(attrs)?.[1] ?? "";
    const id = /\sid="([^"]*)"/.exec(attrs)?.[1] ?? "";
    if (!JS_TYPE.test(type) || /\s(?:async|defer|nomodule)\b/.test(attrs) || (id && keep.includes(id))) return tag;
    changed++;
    const rest = attrs.replace(/\stype="[^"]*"/, "").replace(/\ssrc="([^"]*)"/, ' data-src="$1"');
    return `<script type="${AFTER_PAINT_TYPE}"${type ? ` data-type="${type}"` : ""}${rest}>${body}</script>`;
  });
  if (!changed) return html;
  return `${before.slice(0, run.index)}${block}\n${AFTER_PAINT_LOADER}\n${html.slice(end)}`;
}

/** Files of the base64 images pasted into the content, by hash (npm run images). */
const inlineFiles = inlineJson as Record<string, string>;

/**
 * Base64 images in the content (PNG photos inside inline SVG icons) point at the same bytes saved as a
 * file in public/assets/inline: about 94 KB less HTML on each service page, and the file is cached.
 * One the file list does not know (new content in the CMS) stays inline.
 */
function inlineImages(html: string) {
  if (!html.includes(";base64,")) return html;
  return html.replace(INLINE_IMAGE, (uri, _ext: string, data: string) => inlineFiles[inlineHash(data)] || uri);
}

function guard(html: string) {
  return html.includes('id="overflow-guard"') ? html : html.replace("</head>", `${GUARD}\n</head>`);
}

export function optimizeHtml(html: string) {
  return guard(afterPaint(jqueryToFooter(inlineImages(heroPhone(imagesPass(fonts(stylesheets(html))))))));
}
