/**
 * The Arlington office (1920 Clarendon Boulevard, (703) 528-0800) was sold and
 * is closed (Kia, Oct 26, 2026): McLean is the only office.
 *
 * FIXES are applied to the content by scripts/fixes.ts (content/seed.json).
 * withoutArlington() applies the same fixes to the rendered page, so the live
 * site is right before the CMS is seeded. TEMPORARY: once the seed has run
 * (POST /api/admin/seed/?apply=1), it changes nothing and can be removed.
 */
export const FIXES: [string, string][] = [
  [
    "He cares for patients at Ideal Dental Solutions in Tysons Corner (8280 Greensboro Drive, Unit 105) and Arlington (1920 Clarendon Boulevard).",
    "He cares for patients at Ideal Dental Solutions, 8280 Greensboro Drive, Unit 105, McLean, VA 22102.",
  ],
  ["To book an appointment with Dr. Adili, call (703) 442-0442 (Tysons Corner) or (703) 528-0800 (Arlington).", "To book an appointment with Dr. Adili, call (703) 442-0442."],
  // The excerpt (search result cards) is cut off right before "Arlington".
  [
    "He cares for patients at Ideal Dental Solutions in Tysons Corner (8280 Greensboro Drive, Unit 105) and",
    "He cares for patients at Ideal Dental Solutions, 8280 Greensboro Drive, Unit 105, McLean, VA 22102.",
  ],
];

export function fixText(text: string) {
  return FIXES.reduce((t, [from, to]) => t.split(from).join(to), text);
}

/** The business schema's areaServed entry, as printed in the page's JSON-LD. */
const AREA = /,?\{"@type":"City","name":"Arlington, VA"\}/g;

export function withoutArlington(html: string) {
  if (!/Arlington|528-0800/.test(html)) return html;
  return fixText(html).replace(AREA, "").replace(/\[,/g, "[");
}
