import imagesJson from "../generated/images.json" with { type: "json" };
import pageCssJson from "../generated/page-css.json" with { type: "json" };

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
 * - scripts: jQuery moves from the head to the footer scripts (nothing above
 *   them uses it), and the footer scripts are deferred (same order), so they
 *   no longer hold up the first paint
 */

/** [width, height, WebP width or 0, phone copy width or 0] by original path. */
const images = imagesJson as unknown as Record<string, [number, number, number, number]>;

/** heroes: first-section background by Elementor element id: [image, phone copy or null]. */
type CssBundle = { file: string; dropped: string; heroes?: Record<string, [string, string | null]> };
const pageCss = pageCssJson as unknown as { dictionary: string[]; bundles: Record<string, CssBundle> };

/** Nothing may widen the page sideways (the hero's video frame is wider than a phone). `clip` keeps the sticky header working. */
const GUARD = "<style id=\"overflow-guard\">html{overflow-x:clip}</style>";

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
  const heroId = main >= 0 ? /class="[^"]*\be-parent\b[^"]*"[^>]*data-id="([0-9a-f]+)"/.exec(html.slice(main))?.[1] : undefined;
  const hero = heroId ? bundle.heroes?.[heroId] : undefined;
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
  out = out.replace(/\\\/wp-content\\\/uploads\\\/[^"&]+?\.(?:png|jpe?g)(?=&quot;)/gi, (url) => webp(url.replace(/\\\//g, "/")).replace(/\//g, "\\/"));
  // A slideshow at the top of the page is drawn by script: fetch its first image right away.
  const mainAt = out.indexOf('<main id="main"');
  const hero = mainAt >= 0 ? /<div class="[^"]*\be-parent\b[^"]*"[^>]*data-settings="([^"]*)"/.exec(out.slice(mainAt)) : null;
  const slide = hero && /background_slideshow_gallery&quot;:\[\{[^\]]*?&quot;url&quot;:&quot;([^&]+)&quot;/.exec(hero[1]);
  if (slide) {
    const first = slide[1].replace(/\\\//g, "/");
    // Paint that image as the section's own background until the slideshow script draws over it.
    const at = mainAt + (hero!.index ?? 0);
    const tag = /^<div [^>]*>/.exec(out.slice(at))?.[0];
    if (tag && !/\sstyle="/.test(tag)) out = `${out.slice(0, at)}${tag.replace(/^<div /, `<div style="background:url(${first}) center/cover no-repeat" `)}${out.slice(at + tag.length)}`;
    out = out.replace("</head>", `<link rel="preload" as="image" href="${first}" fetchpriority="high">\n</head>`);
  }
  return out;
}

function scripts(html: string) {
  const headEnd = html.indexOf("</head>");
  const tags: string[] = [];
  let out = html.slice(0, headEnd).replace(/<script id="jquery-(?:core|migrate)-js" src="[^"]*"><\/script>\n?/g, (t) => {
    tags.push(t.trim());
    return "";
  });
  if (tags.length !== 2) return html;
  const body = html.slice(headEnd);
  // Before the first footer script that loads a file or uses jQuery.
  const at = [...body.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find((m) => /\ssrc=/.test(m[0].slice(0, m[0].indexOf(">"))) || /jQuery|\$\(/.test(m[1]));
  if (!at || at.index == null) return html;
  // From there on, every script runs in order once the page has been read (defer): inline ones as
  // deferred data: scripts, so they still run between the files they depend on.
  const footer = body.slice(at.index).replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/g, (tag, attrs: string, code: string) => {
    if (/\stype="(?!text\/javascript)/.test(attrs) || /\s(async|defer)\b/.test(attrs)) return tag;
    if (/\ssrc=/.test(attrs)) return `<script defer${attrs}></script>`;
    if (!code.trim()) return tag;
    return `<script defer${attrs} src="data:text/javascript;base64,${Buffer.from(code).toString("base64")}"></script>`;
  });
  out += `${body.slice(0, at.index)}${tags.map((t) => t.replace("<script ", "<script defer ")).join("\n")}\n${footer}`;
  return out;
}

function guard(html: string) {
  return html.includes('id="overflow-guard"') ? html : html.replace("</head>", `${GUARD}\n</head>`);
}

export function optimizeHtml(html: string) {
  return guard(scripts(imagesPass(fonts(stylesheets(html)))));
}
