/**
 * Tracking on every page: the TTR tracker and Google Analytics 4. The GA4
 * config is queued at once; Google's script (the heaviest on the page) loads
 * on the visitor's first scroll, tap or key press, or 10 seconds after the
 * page has loaded, so it does not slow the page down. Page views are sent then.
 */
export const GA4_ID = "G-55S3P7PW3V";
export const TTR_SITE_ID = "H1QeRbEKxfQo2axph4VByw";

const TAGS = [
  `<script async src="https://ttr-portal.vercel.app/api/site/script" data-site="${TTR_SITE_ID}"></script>`,
  `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${GA4_ID}");` +
    `(function(){var d=0;function l(){if(d)return;d=1;var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}";document.head.appendChild(s)}` +
    `["pointerdown","keydown","scroll","touchstart"].forEach(function(e){addEventListener(e,l,{once:true,passive:true})});addEventListener("load",function(){setTimeout(l,10000)})})();</script>`,
].join("\n");

// TTR OS's "Suggest a change" bar (TTR-585): on Vercel previews only, never on the live site, so it is never in a production page. It does
// nothing unless the page was opened from the client's private review link (a review token after #).
const REVIEW_BAR = "https://ttr-portal.vercel.app/api/site/notes/bar";

export function withTracking(html: string) {
  const bar = process.env.VERCEL_ENV === "preview" && !html.includes(REVIEW_BAR) ? `<script defer src="${REVIEW_BAR}"></script>\n` : "";
  if (html.includes(TTR_SITE_ID)) return bar ? html.replace("</head>", `${bar}</head>`) : html;
  return html.replace("</head>", `${TAGS}\n${bar}</head>`);
}
