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
  // /services/periodontic-dentistry/ and /locations/mclean/periodontal-dentistry/
  ["Experienced Periodontists", "Experienced Care for Your Gums"],
  [
    "Our highly qualified periodontists bring years of specialized training and hands-on experience to every patient case.",
    "Our dental team brings years of hands-on experience to caring for your gums.",
  ],
  [
    "Our team includes some of the most experienced and qualified periodontists, adept at diagnosing and treating all forms of gum disease.",
    "Our dental team diagnoses and treats gum disease at every stage.",
  ],
  ["Our team of experienced periodontists uses", "Our dental team uses"],
  ["Book your appointment with our periodontists today", "Book your appointment with our dental team today"],
];

export function fixText(text: string) {
  return FIXES.reduce((t, [from, to]) => t.split(from).join(to), text);
}

/** The business schema's areaServed entry, as printed in the page's JSON-LD. */
const AREA = /,?\{"@type":"City","name":"Arlington, VA"\}/g;

export function withoutArlington(html: string) {
  if (!/Arlington|528-0800|[Pp]eriodontists/.test(html)) return html;
  return fixText(html).replace(AREA, "").replace(/\[,/g, "[");
}
