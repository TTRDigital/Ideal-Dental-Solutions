(function () {
  // Before/after sliders
  document.querySelectorAll('.ba').forEach(function (el) {
    var r = el.querySelector('input');
    var set = function () { el.style.setProperty('--pos', r.value + '%'); };
    r.addEventListener('input', set); set();
  });
  // Carousel arrows
  var t = document.querySelector('.track');
  if (t) document.querySelectorAll('[data-dir]').forEach(function (b) {
    b.addEventListener('click', function () {
      t.scrollBy({ left: Number(b.dataset.dir) * (t.firstElementChild.offsetWidth + 30), behavior: 'smooth' });
    });
  });
  // Lead form -> /api/lead
  var f = document.getElementById('lead-form');
  if (!f) return;
  var msg = f.querySelector('.msg');
  var q = new URLSearchParams(location.search);
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = f.querySelector('button'); btn.disabled = true; msg.textContent = '';
    var d = Object.fromEntries(new FormData(f).entries());
    ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_adgroup', 'adgroup'].forEach(function (k) { if (q.get(k)) d[k] = q.get(k); });
    d.page = location.href; d.referrer = document.referrer;
    fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { if (!r.ok) throw 0; return r; })
      .then(function () {
        f.reset(); msg.textContent = f.dataset.ok;
        (window.dataLayer = window.dataLayer || []).push({ event: 'lead_form_submit', form: 'ad_landing_page' });
      })
      .catch(function () { msg.textContent = f.dataset.err; })
      .then(function () { btn.disabled = false; });
  });
})();
