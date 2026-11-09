const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// **text** = orange accent in headings
const accent = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const digits = (p) => String(p).replace(/\D/g, '');

export function renderPage(d) {
  const tel = `tel:+1${digits(d.phone)}`;
  const call = (cls = '', label = d.callLabel) =>
    `<a class="btn ${cls}" href="${tel}">${esc(label)} <span data-call-number>${esc(d.phoneDisplay)}</span>${cls.includes('lg') ? '<span class="ph" aria-hidden="true">&#9742;</span>' : ''}</a>`;
  const ba = (n, label, ext = 'webp') => `<div class="ba" role="group" aria-label="${esc(label)}"><img src="/assets/ba${n}-after.${ext}" alt="After porcelain veneers" loading="lazy" width="780" height="585"><img class="b" src="/assets/ba${n}-before.${ext}" alt="Before porcelain veneers" loading="lazy" width="780" height="585"><input type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after"></div>`;
  const t = d.tracking || {};
  const gtmHead = t.gtm ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${esc(t.gtm)}');</script>` : '';
  const gtmBody = t.gtm ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${esc(t.gtm)}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : '';
  const l = d.location, f = d.footer;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.title)}</title>
<meta name="robots" content="noindex, nofollow, noarchive">
${gtmHead}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/page.css">
</head><body>
${gtmBody}
<header class="hero">
 <div class="wrap top"><img class="logo" src="/assets/logo.svg" alt="Ideal Dental Solutions" width="130" height="40">${call('sm')}</div>
 <div class="wrap"><h1>${accent(d.headline)}</h1>${call('lg')}</div>
</header>

<section class="sec"><div class="wrap">
 <p class="eyebrow">${esc(d.gallery.eyebrow)}</p><h2 class="center">${esc(d.gallery.title)}</h2>
 <div class="car"><div class="track">${[1, 2, 3, 4].map((n) => ba(n, 'Before and after smile ' + n)).join('')}</div>
 <div class="arrows"><button type="button" data-dir="-1" aria-label="Previous">&larr;</button><button type="button" data-dir="1" aria-label="Next">&rarr;</button></div></div>
</div></section>

<section class="sec"><div class="wrap">
 <p class="eyebrow">${esc(d.process.eyebrow)}</p><h2 class="center">${esc(d.process.title)}</h2><p class="center"><strong>${esc(d.process.subtitle)}</strong></p>
 <div class="steps">${d.process.steps.map((s, i) => `<div class="step"><span class="n">0${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>
</div></section>

<section class="sec"><div class="wrap craft">
 ${ba(5, 'Before and after veneers')}
 <div><h2>${esc(d.craft.title)}</h2>${d.craft.items.map((i) => `<div class="it"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`).join('')}<p>${call('', d.callLabel)}</p></div>
</div></section>

<section class="sec"><div class="wrap"><div class="why">
 <p class="eyebrow" style="text-align:left">${esc(d.why.eyebrow)}</p><h2>${esc(d.why.title)}</h2><p class="sub">${esc(d.why.subtitle)}</p>
 <div class="cards">${d.why.cards.map((c) => `<div class="card"><img src="/assets/${esc(c.icon || 'ic-office.png')}" alt="" width="44" height="44"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div>`).join('')}</div>
</div></div></section>

<section class="sec"><div class="wrap vn">
 <div><p class="eyebrow eb" style="text-align:left">${esc(d.veneers.eyebrow)}</p><h2>${esc(d.veneers.title)}</h2>
 <p>${esc(d.veneers.intro)}</p><p class="lead">${esc(d.veneers.lead)}</p>
 ${d.veneers.items.map((i) => `<div class="vi"><img src="/assets/check.svg" alt="" width="34" height="34"><div><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div></div>`).join('')}</div>
 <div class="pic"><img src="/assets/smile-woman.png" alt="" width="439" height="568" loading="lazy"></div>
</div></section>

<section class="sec"><div class="wrap">
 <h2 class="center">${esc(d.reviews.title)}</h2>
 <div class="rev"><script src="https://static.elfsight.com/platform/platform.js" async></script><div class="elfsight-app-${esc(d.reviews.elfsightId)}" data-elfsight-app-lazy></div></div>
</div></section>

<section class="loc"><div class="wrap">
 <h2 class="center">${esc(l.title)}</h2><p class="t">${esc(l.text)}</p>
 <div class="locbox"><a class="map" href="${esc(l.mapsUrl)}" aria-label="Map of ${esc(l.name)}"></a>
  <div class="locrow"><div><h3>${esc(l.name)}</h3><ul><li><img src="/assets/ic-pin.png" alt="">${esc(l.address)}</li><li><img src="/assets/ic-phone.png" alt=""><a href="${tel}" data-call-number>${esc(d.phoneDisplay)}</a></li></ul></div>
  <div class="hrs"><span class="open">&#9679; Open</span><br><h4>Office Hours</h4><p>${l.hours.map(esc).join('<br>')}</p></div></div></div>
</div></section>

<section class="sec"><div class="wrap"><div class="faq">
 <p class="eyebrow">${esc(d.faq.eyebrow)}</p><h2 class="center">${esc(d.faq.title)}</h2>
 ${d.faq.items.map((x, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}
</div></div></section>

<section class="formsec" id="request"><div class="wrap center"><h2>${esc(d.form.title)}</h2>
 <form id="lead-form" class="form" data-ok="${esc(d.form.success)}" data-err="${esc(d.form.error)}">
  <input name="name" placeholder="Name" autocomplete="name" required maxlength="120">
  <input name="phone" type="tel" placeholder="Phone" autocomplete="tel" required maxlength="40">
  <input name="email" type="email" placeholder="Email" autocomplete="email" maxlength="160">
  <textarea name="message" rows="3" placeholder="Message" maxlength="1500"></textarea>
  <input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">
  <button class="btn" type="submit">${esc(d.form.button)}</button><p class="msg" role="status"></p>
 </form></div></section>

<footer><div class="wrap"><div class="fg">
 <div><img src="/assets/logo-footer.png" alt="Ideal Dental Solutions" width="163" height="54"><div class="fad"><span class="pin"><img src="/assets/ic-footer-pin.png" alt=""></span><div><strong>${esc(l.name.replace(/ VA$/, ''))}</strong><br>${esc(l.address)}<br><a href="${tel}" data-call-number>${esc(d.phoneDisplay)}</a></div></div></div>
 <div><h4>${esc(f.linksTitle)}</h4><ul>${f.links.map((x) => `<li><a href="${esc(x.href)}">${esc(x.label)}</a></li>`).join('')}</ul></div>
 <div><h4>${esc(f.connectTitle)}</h4><a class="btn sm" href="#request" style="border-radius:6px;background:var(--o2)">${esc(d.form.button)}</a></div>
 <div class="badges">${['gu', 'nvds', 'vcu', 'vda', 'ada', 'invisalign'].map((b) => `<img src="/assets/badge-${b}.png" alt="">`).join('')}</div>
</div><div class="copy">${esc(f.copyright).replace('Ideal Dental Solutions.', '<a href="https://idealdentalsolutions.com/">Ideal Dental Solutions</a>.')}</div></div></footer>
<script>window.TTR_SITE_KEY=${JSON.stringify(t.siteKey || '')};</script>
<script src="/number.js" data-default="${digits(d.phone)}" defer></script>
<script src="/assets/page.js" defer></script>
</body></html>`;
}
