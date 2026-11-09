// Vercel Function: POST /api/lead
// Sends each lead to TTR OS (/api/site/form) and to the GoHighLevel inbound webhook.
// Env (set in Vercel, never in code):
//   GHL_WEBHOOK_URL   GoHighLevel inbound webhook URL (secret)
//   TTR_SITE_KEY      optional override; the public tracker key is the default
//   TTR_FORM_URL      optional override of the TTR OS endpoint
const TTR_FORM_URL = process.env.TTR_FORM_URL || 'https://ttr-portal.vercel.app/api/site/form';
const SITE_KEY = process.env.TTR_SITE_KEY || 'H1QeRbEKxfQo2axph4VByw'; // public key for ideal-dental-solutions

const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const post = async (url, body) => {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`${new URL(url).host} ${r.status}`);
};

export default async function handler(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (b.company) return res.status(200).json({ ok: true }); // honeypot: pretend success
  const lead = {
    name: clip(b.name, 120), phone: clip(b.phone, 40), email: clip(b.email, 160), message: clip(b.message, 1500),
    page: clip(b.page, 500), referrer: clip(b.referrer, 500), gclid: clip(b.gclid, 200),
    utm_source: clip(b.utm_source, 100), utm_medium: clip(b.utm_medium, 100), utm_campaign: clip(b.utm_campaign, 200),
    utm_term: clip(b.utm_term, 200), utm_content: clip(b.utm_content, 200), adgroup: clip(b.utm_adgroup || b.adgroup, 200),
  };
  if (!lead.name || lead.phone.replace(/\D/g, '').length < 7) return res.status(400).json({ ok: false, error: 'invalid' });

  const jobs = [post(TTR_FORM_URL, { k: SITE_KEY, ...lead, source: 'ideal-dental-solutions/start' })];
  if (process.env.GHL_WEBHOOK_URL) jobs.push(post(process.env.GHL_WEBHOOK_URL, { ...lead, source: 'start.idealdentalsolutions.com' }));
  const results = await Promise.allSettled(jobs);
  results.forEach((r) => r.status === 'rejected' && console.error('lead delivery failed:', r.reason?.message));
  // Succeed if at least one destination accepted the lead, so a visitor is never told "error" for a lead we kept.
  return results.some((r) => r.status === 'fulfilled') ? res.status(200).json({ ok: true }) : res.status(502).json({ ok: false });
}
