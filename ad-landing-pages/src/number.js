/*!
 * Call-tracking number swap. A visitor who arrives with ?gclid (remembered for
 * the session) asks TTR OS for a tracking number and every tel: link and every
 * element marked data-call-number (and any visible text equal to the default
 * number) is swapped. Any failure leaves the default number untouched.
 *
 * Config (all optional) on the script tag: data-key, data-default, data-endpoint.
 */
(function () {
  var s = document.currentScript || {};
  var KEY = (s.dataset && s.dataset.key) || window.TTR_SITE_KEY;
  var ENDPOINT = (s.dataset && s.dataset.endpoint) || 'https://ttr-portal.vercel.app/api/site/number';
  var DEFAULT = (s.dataset && s.dataset.default) || '5715685848';
  var digits = function (x) { return String(x || '').replace(/\D/g, '').slice(-10); };
  if (!KEY) return;
  var q = new URLSearchParams(location.search), store = {};
  try { store = window.sessionStorage; } catch (e) {}
  var gclid = q.get('gclid'); try { if (gclid) store.setItem('ttr_gclid', gclid); else gclid = store.getItem('ttr_gclid'); } catch (e) {}
  if (!gclid) return;
  var fmt = function (n) { var d = digits(n); return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6); };
  var swap = function (n) {
    var d = digits(n); if (d.length !== 10) return;
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      if (digits(a.getAttribute('href')) !== DEFAULT) return;
      a.setAttribute('href', 'tel:+1' + d);
      a.querySelectorAll('[data-call-number]').forEach(function (e) { e.textContent = fmt(d); });
    });
    document.querySelectorAll('[data-call-number]').forEach(function (e) { e.textContent = fmt(d); });
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'tracking_number_swapped', tracking_number: d }); } catch (e) {}
  };
  var body = { k: KEY, gclid: gclid, campaign: q.get('utm_campaign') || '', adgroup: q.get('utm_adgroup') || q.get('adgroup') || '', page: location.href, referrer: document.referrer };
  var run = function () {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { ctl && ctl.abort(); }, 3000);
    fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl && ctl.signal })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j) swap(j.number || j.phone || j.tracking_number); })
      .catch(function () {})
      .then(function () { clearTimeout(timer); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
