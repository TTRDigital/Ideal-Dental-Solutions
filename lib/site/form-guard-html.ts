/**
 * Adds the invisible parts of the form protection (lib/form-guard.ts) to every Elementor form:
 * a honeypot input people never see and a token input filled by a small script after the page loads.
 */
const FORM = /(<form class="elementor-form"[^>]*>)/g;
const FIELDS =
  '<input type="hidden" name="ttr_ft" value="">' +
  '<div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">' +
  '<input type="text" name="website_url" value="" tabindex="-1" autocomplete="off"></div>';

const SCRIPT =
  "<script>(function(){var t=0;function f(){fetch('/api/form-token/',{cache:'no-store',credentials:'same-origin'})" +
  ".then(function(r){return r.json()}).then(function(j){if(!j||!j.token)return;" +
  "document.querySelectorAll('input[name=ttr_ft]').forEach(function(i){i.value=j.token})})" +
  ".catch(function(){if(t++<4)setTimeout(f,2000*t)})}" +
  "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f();" +
  "setInterval(f,5400000)})()</script>";

export function withFormGuard(html: string) {
  if (!FORM.test(html)) return html;
  FORM.lastIndex = 0;
  return html.replace(FORM, `$1${FIELDS}`).replace("</body>", `${SCRIPT}</body>`);
}
