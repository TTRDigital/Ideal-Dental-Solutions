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

export function withTracking(html: string) {
  if (html.includes(TTR_SITE_ID)) return html;
  return html.replace("</head>", `${TAGS}\n</head>`);
}
