/**
 * Tracking on every page: the TTR tracker and Google Analytics 4. The GA4
 * config is queued at once; Google's script (the heaviest on the page; with
 * Google Ads linked it also brings the Ads tag and its third-party cookies)
 * loads on the visitor's first scroll, tap, click or key press, so it does not
 * slow the page down or set cookies on page open. Page views are sent then. Visitors
 * who leave without any interaction are not counted in GA4 (the TTR tracker
 * still counts them). Conversions always follow an interaction (a form
 * submit, a tap on the phone number), so they still fire.
 */
export const GA4_ID = "G-55S3P7PW3V";
export const TTR_SITE_ID = "H1QeRbEKxfQo2axph4VByw";

const TAGS = [
  // Versioned address, cached for a year (TTR-2524); page views go to the same host.
  `<script async src="https://portal.ttrdigitalmarketing.com/api/site/script/5a23a7758595" data-site="${TTR_SITE_ID}"></script>`,
  `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","${GA4_ID}");` +
    `(function(){var d=0;function l(){if(d)return;d=1;var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}";document.head.appendChild(s)}` +
    `["pointerdown","keydown","scroll","touchstart"].forEach(function(e){addEventListener(e,l,{once:true,passive:true})})})();</script>`,
].join("\n");

export function withTracking(html: string) {
  if (html.includes(TTR_SITE_ID)) return html;
  return html.replace("</head>", `${TAGS}\n</head>`);
}
