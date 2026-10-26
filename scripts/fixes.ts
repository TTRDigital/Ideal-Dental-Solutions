/**
 * Launch-review fixes on top of the migrated content (content/seed.json).
 * Run after `npm run extract`, then `npm run seed -- --force` to publish.
 *
 *   npm run fixes
 *
 * Every fix is idempotent. Social images (public/og/*.jpg) are generated here.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { fixText } from "../lib/site/arlington.ts";
import { NEW_IMAGE, REPLACED } from "../lib/site/replaced-images.ts";

type Doc = Record<string, unknown> & { _id: string; _type: string; path?: string; title?: string; seo?: Record<string, unknown> };
type Node = Record<string, unknown>;

const ROOT = new URL("..", import.meta.url).pathname;
const SITE = "https://idealdentalsolutions.com";
const BRAND = "Ideal Dental Solutions";
const file = join(ROOT, "content/seed.json");
const docs: Doc[] = JSON.parse(readFileSync(file, "utf8"));
const byId = new Map(docs.map((d) => [d._id, d]));
const byPath = new Map(docs.filter((d) => d.path).map((d) => [d.path!, d]));
const log: string[] = [];

function walk(n: unknown, cb: (node: Node) => void) {
  if (Array.isArray(n)) n.forEach((v) => walk(v, cb));
  else if (n && typeof n === "object") {
    cb(n as Node);
    for (const v of Object.values(n as Node)) walk(v, cb);
  }
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#8217;|&rsquo;/g, "’").replace(/&nbsp;/g, " ");
const strip = (html: string) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const firstTag = (tpl: unknown) => /^\s*<[^>]+>/.exec(String(tpl || ""))?.[0] || "";
const page = (path: string) => {
  const d = byPath.get(path);
  if (!d) throw new Error(`No document for ${path}`);
  return d;
};
const headingText = (n: Node) => (typeof n.title === "string" ? n.title : strip(String(n.titleHtml || "")));

/* 1. Elements hidden on desktop, tablet and mobile: invisible leftovers, removed. */
function removeHiddenEverywhere(n: unknown) {
  if (Array.isArray(n)) {
    for (let i = n.length - 1; i >= 0; i--) {
      const x = n[i] as Node;
      const tag = firstTag(x?.tpl);
      if (x?._type && String(x._type).startsWith("el") && ["desktop", "tablet", "mobile"].every((d) => tag.includes(`elementor-hidden-${d}`))) {
        n.splice(i, 1);
        log.push(`removed hidden ${x._type} ${x.elId}`);
      } else removeHiddenEverywhere(x);
    }
  } else if (n && typeof n === "object") for (const v of Object.values(n)) removeHiddenEverywhere(v);
}
for (const d of docs) removeHiddenEverywhere(d);

/* 2. Copy-pasted heading: the McLean TMJ page said "Northern VA". */
walk(page("/locations/mclean/tmj-tmd-treatments/"), (n) => {
  if (n._type === "elHeading" && headingText(n) === "Your Trusted Partner for TMJ Care in Northern VA") {
    if (n.title) n.title = "Your Trusted Partner for TMJ Care in McLean, VA";
    if (n.titleHtml) n.titleHtml = String(n.titleHtml).replace("Northern VA", "McLean, VA");
    log.push("McLean TMJ heading");
  }
});
// "Mclean" -> "McLean" in headings.
for (const d of docs) {
  walk(d, (n) => {
    if (n._type !== "elHeading") return;
    for (const k of ["title", "titleHtml"]) if (typeof n[k] === "string" && /\bMclean\b/.test(n[k] as string)) n[k] = (n[k] as string).replace(/\bMclean\b/g, "McLean");
  });
}

/* 2b. Saturday hours: the Appointment page said "Sat: 8:00 – 2:00", the footer "Every Other Saturday: 8am – 2pm". */
{
  const d = page("/appointment/");
  const SAT = /(Sat:(?:\s|&nbsp;)*8:00 – 2:00)(?! \(every other week\))/;
  walk(d, (n) => {
    for (const k of ["html", "text"]) {
      if (typeof n[k] === "string" && SAT.test(n[k] as string)) {
        n[k] = (n[k] as string).replace(SAT, "$1 (every other week)");
        log.push(`appointment Saturday hours (${k})`);
      }
    }
  });
  if (typeof d.excerpt === "string") d.excerpt = d.excerpt.replace(SAT, "$1 (every other week)");
}

/* 2c. About Us: the mobile versions of three team bios (and Fozia's mobile photo) were only hidden on
 * desktop, so tablets (768-1024px) showed each of them twice. They are hidden on tablets too now;
 * tablets keep the desktop version, which was already shown there. */
for (const elId of ["cdae318", "2040cf0", "488a0ff", "2257ed0"]) {
  let found = false;
  walk(page("/about-us/"), (n) => {
    if (n.elId !== elId) return;
    found = true;
    const tag = firstTag(n.tpl);
    if (tag.includes("elementor-hidden-tablet")) return;
    n.tpl = String(n.tpl).replace(tag, tag.replace("elementor-hidden-desktop", "elementor-hidden-desktop elementor-hidden-tablet"));
    log.push(`about-us: ${elId} hidden on tablets`);
  });
  if (!found) throw new Error(`No element ${elId} on /about-us/`);
}

/* 3. One H1 per page. Extra H1s (team names, "Our Mission") become H2s with the same look. */
for (const d of docs.filter((x) => x._type === "page")) {
  let seen = 0;
  walk(d.content, (n) => {
    if (n._type !== "elHeading" || !/<h1\b/.test(String(n.tpl))) return;
    if (seen++ === 0) return;
    n.tpl = String(n.tpl).replace(/<h1\b/g, "<h2").replace(/<\/h1>/g, "</h2>");
    log.push(`H1 -> H2 on ${d.path}: ${headingText(n)}`);
  });
}
// The Dr. Adili profile (block editor page) had no heading at all.
{
  const d = page("/dr-mehdi-adili/");
  const body = d.body as Node[];
  if (!body.some((b) => b.style === "wp-h1")) {
    body.unshift({ _type: "block", _key: "h1adili", style: "wp-h1", markDefs: [], children: [{ _type: "span", _key: "h1adilis", text: "Dr. Mehdi S. Adili, DDS, Prosthodontist", marks: [] }] });
    log.push("H1 on /dr-mehdi-adili/");
  }
}

function h1Of(d: Doc): string {
  let h1 = "";
  walk(d.content, (n) => {
    if (!h1 && n._type === "elHeading" && /<h1\b/.test(String(n.tpl))) h1 = headingText(n);
  });
  if (!h1) for (const b of (d.body as Node[]) || []) if (!h1 && /h1$/.test(String(b.style))) h1 = ((b.children as Node[]) || []).map((c) => c.text).join("");
  return h1.replace(/​/g, "").trim();
}

/* 4. Page titles that were slugs or lower case. */
const TITLES: Record<string, string> = {
  "/locations/mclean/tmj-tmd-treatments/": "TMJ/TMD Treatments",
  "/locations/": "Locations",
  "/locations/mclean/": "McLean",
  "/before-after/": "Before & After",
};
for (const [path, title] of Object.entries(TITLES)) page(path).title = title;

/* 5. Not for search engines: a published draft, a duplicate, two empty pages, the thank-you page, empty archives. */
const NOINDEX: Record<string, string | null> = {
  "/about-us-client-draft-2/": "/about-us/",
  "/dental-fillings-in-mclean-va-2/": "/dental-fillings-in-mclean-va/",
  "/locations/": null,
  "/locations/mclean/": null,
  "/thank-you/": null,
  "/category/patient-guides/": null,
  "/category/uncategorized/": null,
};
// TTR-895: a second "Preventive Dentistry Services in Northern Virginia" page (same title and H1,
// about half the same text) competes with /services/preventive-dentistry/ in search. It stays online
// and indexable, with a canonical to the services page (merging or removing it is the client's call).
{
  const seo = (page("/preventive-dentistry-in-northern-virginia/").seo ||= {});
  seo.canonical = `${SITE}/services/preventive-dentistry/`;
  seo.ogUrl = `${SITE}/services/preventive-dentistry/`;
}
for (const [path, canonical] of Object.entries(NOINDEX)) {
  const seo = (page(path).seo ||= {});
  seo.robots = "noindex, follow";
  if (canonical) seo.canonical = `${SITE}${canonical}`;
}

/* 6. Title tags: the page's H1 (or topic) and the practice name, not "- idealdental". */
const SEO_TITLES: Record<string, string> = {
  "/about-us-client-draft-2/": "About Us (draft) | Ideal Dental Solutions",
  "/appointment/": "Call to Schedule an Appointment | Ideal Dental Solutions",
  "/locations/": "Locations | Ideal Dental Solutions",
  "/locations/mclean/": "McLean, VA | Ideal Dental Solutions",
  "/thank-you/": "Thank You | Ideal Dental Solutions",
  "/category/patient-guides/": "Patient Guides | Ideal Dental Solutions",
  "/category/uncategorized/": "Uncategorized | Ideal Dental Solutions",
  // TTR-895: every title 60 characters or less (Google cuts longer ones) and unique.
  "/": "Ideal Dental Solutions | Dentist in McLean & Tysons, VA",
  "/about-us/": "About Dr. Saman Sepahi & Our Team | Ideal Dental Solutions",
  "/before-after/": "Before & After Smile Gallery | Ideal Dental Solutions",
  "/dr-mehdi-adili/": "Dr. Mehdi Adili, DDS, Prosthodontist | Ideal Dental",
  "/services/": "Our Dental Services | Ideal Dental Solutions, McLean VA",
  "/services/restorative-dentistry/": "Restorative Dentistry, Northern VA | Ideal Dental Solutions",
  "/services/restorative-dentistry/tooth-extractions/": "Tooth Extractions in Northern VA | Ideal Dental Solutions",
  "/services/restorative-dentistry/tmj-tmd-treatments/": "TMJ & TMD Treatment in Northern VA | Ideal Dental Solutions",
  "/services/restorative-dentistry/root-canal-therapy/": "Root Canal Therapy in Northern VA | Ideal Dental Solutions",
  "/services/restorative-dentistry/dentures/": "Dentures in Northern VA | Ideal Dental Solutions",
  "/services/restorative-dentistry/dental-fillings/": "Dental Fillings in Northern VA | Ideal Dental Solutions",
  "/services/restorative-dentistry/dental-bridges/": "Dental Bridges in Northern VA | Ideal Dental Solutions",
  "/services/preventive-dentistry/": "Preventive Dentistry in Northern VA | Ideal Dental Solutions",
  "/preventive-dentistry-in-northern-virginia/": "Preventive Dental Care in Northern Virginia | Ideal Dental",
  "/services/preventive-dentistry/teeth-cleaning/": "Teeth Cleaning in Northern VA | Ideal Dental Solutions",
  "/services/preventive-dentistry/dental-sealants/": "Dental Sealants in Northern VA | Ideal Dental Solutions",
  "/services/preventive-dentistry/checkups-exams/": "Checkups & Exams in Northern VA | Ideal Dental Solutions",
  "/services/periodontic-dentistry/": "Periodontics in Northern VA | Ideal Dental Solutions",
  "/services/periodontic-dentistry/gum-graft-surgery/": "Gum Graft Surgery in Northern VA | Ideal Dental Solutions",
  "/services/periodontic-dentistry/gum-disease-treatment/": "Gum Disease Treatment, Northern VA | Ideal Dental Solutions",
  "/services/periodontic-dentistry/crown-lengthening/": "Crown Lengthening in Northern VA | Ideal Dental Solutions",
  "/services/dental-implants-dentistry/": "Dental Implants in Northern VA | Ideal Dental Solutions",
  "/services/dental-implants-dentistry/full-arch-implants/": "Full Arch Implants in Northern VA | Ideal Dental Solutions",
  "/services/dental-implants-dentistry/single-tooth-implants/": "Single Tooth Implants, Northern VA | Ideal Dental Solutions",
  "/services/cosmetic-dentistry/": "Cosmetic Dentistry in Northern VA | Ideal Dental Solutions",
  "/services/cosmetic-dentistry/porcelain-veneers/": "Porcelain Veneers in Northern VA | Ideal Dental Solutions",
  "/locations/night-guards/": "Custom Night Guards in Northern VA | Ideal Dental Solutions",
  "/locations/mclean/tmj-tmd-treatments/": "TMJ & TMD Treatment in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/single-tooth-implants/": "Single Tooth Implants in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/root-canal-therapy/": "Root Canal Therapy in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/preventive-dentistry/": "Preventive Dentistry in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/porcelain-dental-veneers/": "Porcelain Veneers in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/periodontal-dentistry/": "Periodontics in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/gum-graft-surgery/": "Gum Graft Surgery in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/gum-disease-treatment/": "Gum Disease Treatment in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/full-arch-implants/": "Full Arch Implants in McLean, VA | Ideal Dental Solutions",
  "/locations/mclean/dental-implant-dentistry/": "Dental Implants in McLean, VA | Ideal Dental Solutions",
  "/dental-fillings-in-mclean-va/": "Dental Fillings in McLean, VA | Ideal Dental Solutions",
  "/dental-bridges-in-mclean-va/": "Dental Bridges in McLean, VA | Ideal Dental Solutions",
};
for (const d of docs.filter((x) => ["page", "archivePage", "notFoundPage"].includes(x._type))) {
  const seo = (d.seo ||= {});
  let title = d.path ? SEO_TITLES[d.path] : undefined;
  if (!title && d._type === "page") {
    const h1 = h1Of(d);
    if (!h1) throw new Error(`No H1 and no title for ${d.path}`);
    title = `${h1} | ${BRAND}`.length <= 72 ? `${h1} | ${BRAND}` : h1;
  }
  if (!title) title = String(seo.title || "").replace(/ - idealdental$/, ` | ${BRAND}`);
  seo.title = title;
  seo.ogTitle = title;
  if (seo.twitterTitle) seo.twitterTitle = title;
  seo.ogSiteName = BRAND;
}
{
  const indexable = docs.filter((d) => d.path && d._type === "page" && !/noindex/.test(String(d.seo?.robots)));
  const seen = new Map<string, string>();
  for (const d of indexable) {
    const t = String(d.seo!.title);
    if (t.length > 60) throw new Error(`Title over 60 characters on ${d.path}: ${t}`);
    if (seen.has(t)) throw new Error(`Same title on ${seen.get(t)} and ${d.path}`);
    seen.set(t, d.path!);
  }
}
// Search results: "You searched for {q} | Ideal Dental Solutions".
{
  const seo = byId.get("searchPage")?.seo;
  if (seo) {
    for (const k of ["title", "ogTitle", "twitterTitle"]) if (typeof seo[k] === "string") seo[k] = (seo[k] as string).replace(/ - idealdental$/, ` | ${BRAND}`);
    seo.ogSiteName = BRAND;
  }
}
// Author archives keep their (noindex) titles, with the practice name.
for (const d of docs.filter((x) => x._type === "archivePage" && x.kind === "author")) {
  const seo = d.seo!;
  seo.title = seo.ogTitle = String(seo.title).replace(/ at idealdental$/, ` at ${BRAND}`);
}

/* 7. Meta descriptions for every indexable page. */
const DESCRIPTIONS: Record<string, string> = {
  "/": "Ideal Dental Solutions in McLean, VA: cosmetic, implant, restorative and preventive dentistry for Northern Virginia families. Call (703) 442-0442.",
  "/about-us/": "Meet the dentists and hygienists of Ideal Dental Solutions in McLean, VA, with 50+ years of combined experience in cosmetic, implant and family dentistry.",
  "/appointment/": "Request a dental appointment at Ideal Dental Solutions, 8280 Greensboro Drive, McLean, VA. Call (703) 442-0442 or send the form and we will call you back.",
  "/before-after/": "Before and after photos of real smiles treated at Ideal Dental Solutions in McLean, VA, from whitening and bonding to veneers and implants.",
  "/dental-bridges-in-mclean-va/": "Custom dental bridges in McLean, VA to replace missing teeth and restore your bite, with natural-looking results from Ideal Dental Solutions.",
  "/dental-fillings-in-mclean-va/": "Tooth-colored dental fillings in McLean, VA. Ideal Dental Solutions repairs cavities and chipped teeth with durable, natural-looking materials.",
  "/dr-mehdi-adili/": "Dr. Mehdi S. Adili, DDS, prosthodontist at Ideal Dental Solutions in McLean, VA: implants, crowns, bridges and dentures. Speaks English and Farsi.",
  "/locations/mclean/dental-implant-dentistry/": "Dental implants in McLean, VA: single-tooth and full-arch implant solutions planned and restored by the team at Ideal Dental Solutions.",
  "/locations/mclean/full-arch-implants/": "Full arch dental implants in McLean, VA: a fixed, permanent alternative to dentures from Ideal Dental Solutions. Book your consultation.",
  "/locations/mclean/gum-disease-treatment/": "Gum disease treatment in McLean, VA, from deep cleanings to advanced periodontal care, to stop bleeding gums and protect your teeth.",
  "/locations/mclean/gum-graft-surgery/": "Gum graft surgery in McLean, VA to cover exposed roots, reduce sensitivity and restore your gum line, at Ideal Dental Solutions.",
  "/locations/mclean/invisalign/": "Invisalign clear aligners in McLean, VA: straighten your teeth discreetly with a custom treatment plan from Ideal Dental Solutions.",
  "/locations/mclean/periodontal-dentistry/": "Periodontal dentistry in McLean, VA: gum disease treatment, gum grafts and crown lengthening to keep your gums and teeth healthy.",
  "/locations/mclean/porcelain-dental-veneers/": "Porcelain veneers in McLean, VA to fix chips, stains, gaps and uneven teeth. Custom, natural-looking smiles from Ideal Dental Solutions.",
  "/locations/mclean/preventive-dentistry/": "Preventive dentistry in McLean, VA: checkups, exams, professional cleanings and sealants to keep your smile healthy for life.",
  "/locations/mclean/restorative-dentistry/": "Restorative dentistry in McLean, VA: fillings, bridges, dentures, root canals and extractions to repair damaged or missing teeth.",
  "/locations/mclean/root-canal-therapy/": "Gentle, pain-free root canal treatment in McLean, VA to save infected teeth and relieve tooth pain. Call Ideal Dental Solutions today.",
  "/locations/mclean/single-tooth-implants/": "Single tooth implants in McLean, VA: replace one missing tooth with a permanent, natural-looking implant and crown.",
  "/locations/mclean/teeth-whitening/": "Professional teeth whitening in McLean, VA for a brighter smile, safely and quickly, at Ideal Dental Solutions.",
  "/locations/mclean/tmj-tmd-treatments/": "TMJ and TMD treatment in McLean, VA to relieve jaw pain, clicking and tension headaches, with personalized care at Ideal Dental Solutions.",
  "/locations/night-guards/": "Custom night guards in Northern Virginia protect your teeth from grinding and clenching. Comfortable fit from Ideal Dental Solutions in McLean.",
  "/preventive-dentistry-in-northern-virginia/": "Preventive dentistry in Northern Virginia: exams, cleanings and sealants at Ideal Dental Solutions in McLean to stop problems before they start.",
  "/services/": "Dental services at Ideal Dental Solutions in McLean, VA: cosmetic, implant, periodontal, preventive and restorative dentistry for the whole family.",
  "/services/cosmetic-dentistry/": "Cosmetic dentistry in Northern Virginia: veneers, teeth whitening, bonding and Invisalign at Ideal Dental Solutions in McLean, VA.",
  "/services/cosmetic-dentistry/dental-bonding/": "Dental bonding in Northern Virginia repairs chipped, cracked or discolored teeth, often in a single visit, at Ideal Dental Solutions in McLean.",
  "/services/cosmetic-dentistry/invisalign/": "Invisalign clear aligners in Northern Virginia: straighten teeth without metal braces, with custom treatment at Ideal Dental Solutions.",
  "/services/cosmetic-dentistry/porcelain-veneers/": "Porcelain veneers in Northern Virginia for a brighter, even smile. Custom-made veneers from Ideal Dental Solutions in McLean, VA.",
  "/services/cosmetic-dentistry/teeth-whitening/": "Professional teeth whitening in Northern Virginia for a noticeably whiter smile, done safely at Ideal Dental Solutions in McLean, VA.",
  "/services/dental-implants-dentistry/": "Dental implants in Northern Virginia: single-tooth and full-arch implants that look and feel like natural teeth. Ideal Dental Solutions, McLean.",
  "/services/dental-implants-dentistry/full-arch-implants/": "Full arch dental implants in Northern Virginia: a permanent, fixed alternative to dentures. Consult the implant team at Ideal Dental Solutions.",
  "/services/dental-implants-dentistry/single-tooth-implants/": "Single tooth implants in Northern Virginia replace a missing tooth permanently, with a natural-looking crown. Ideal Dental Solutions, McLean.",
  "/services/periodontic-dentistry/": "Periodontic dentistry in Northern Virginia: gum disease treatment, gum grafts and crown lengthening at Ideal Dental Solutions in McLean.",
  "/services/periodontic-dentistry/crown-lengthening/": "Crown lengthening in Northern Virginia to correct a gummy smile or prepare a tooth for a crown, with precise periodontal care.",
  "/services/periodontic-dentistry/gum-disease-treatment/": "Gum disease treatment in Northern Virginia: periodontal therapy to stop infection, heal your gums and save your teeth. Ideal Dental Solutions.",
  "/services/periodontic-dentistry/gum-graft-surgery/": "Gum graft surgery in Northern Virginia treats gum recession, protects exposed roots and restores your smile. Ideal Dental Solutions, McLean.",
  "/services/preventive-dentistry/": "Preventive dentistry in Northern Virginia: checkups, exams, cleanings and sealants for the whole family at Ideal Dental Solutions in McLean.",
  "/services/preventive-dentistry/checkups-exams/": "Comprehensive dental checkups and exams in Northern Virginia to catch cavities, gum disease and other problems early. Ideal Dental Solutions.",
  "/services/preventive-dentistry/dental-sealants/": "Dental sealants in Northern Virginia protect the chewing surfaces of back teeth from cavities, for children and adults. Ideal Dental Solutions.",
  "/services/preventive-dentistry/teeth-cleaning/": "Professional teeth cleaning in Northern Virginia removes plaque and tartar to prevent cavities and gum disease. Book at Ideal Dental Solutions.",
  "/services/restorative-dentistry/": "Restorative dentistry in Northern Virginia: fillings, bridges, dentures, root canals, TMJ care and extractions at Ideal Dental Solutions.",
  "/services/restorative-dentistry/dental-bridges/": "Dental bridges in Northern Virginia replace missing teeth and restore chewing and speech, with natural-looking results from Ideal Dental Solutions.",
  "/services/restorative-dentistry/dental-fillings/": "Tooth-colored dental fillings in Northern Virginia that repair cavities and blend with your smile. Ideal Dental Solutions in McLean, VA.",
  "/services/restorative-dentistry/dentures/": "Comfortable, natural-looking full and partial dentures in Northern Virginia, custom fitted at Ideal Dental Solutions in McLean, VA.",
  "/services/restorative-dentistry/root-canal-therapy/": "Pain-free root canal treatment in Northern Virginia to save an infected tooth and stop tooth pain. Ideal Dental Solutions in McLean, VA.",
  "/services/restorative-dentistry/tmj-tmd-treatments/": "TMJ and TMD treatment in Northern Virginia to ease jaw pain, clicking and tension headaches. Ideal Dental Solutions in McLean, VA.",
  "/services/restorative-dentistry/tooth-extractions/": "Gentle, painless tooth extractions in Northern Virginia when a tooth cannot be saved, at Ideal Dental Solutions in McLean, VA.",
};
for (const [path, desc] of Object.entries(DESCRIPTIONS)) {
  if (desc.length > 160) throw new Error(`Description too long for ${path} (${desc.length})`);
  const seo = (page(path).seo ||= {});
  seo.description = desc;
  seo.ogDescription = desc;
}
for (const d of docs.filter((x) => ["page", "archivePage"].includes(x._type))) {
  if (!/noindex/.test(String(d.seo?.robots)) && !d.seo?.description) throw new Error(`Indexable page without a description: ${d.path}`);
}

/* 8. Alt text. Decorative graphics (icons next to their own title, dividers) keep alt="". */
const DECORATIVE = /\/(icon-\d+\.svg|separated-(top|bottom)\.png)$/;
const LOGO = /\/(image__4_-removebg-preview|ChatGPT_Image_Jul_30__2026__01_30_28_AM-removebg-preview|cropped-ids-logo-home|ids-logo-home)[^/]*$/;
const ALT_BY_FILE: [RegExp, string][] = [
  [/\/img-2364234\.png$/, "Dr. Mehdi Adili, DDS"],
  [/\/Frame-1984079077\.png$/, "Dr. Saman Sepahi, DDS"],
  [/\/dr-hojaeva-1\.png$/, "Dr. Dilnoza Hojaeva, DDS"],
  [/\/(Fosia(-2)?-\d+x\d+\.jpg|Rectangle-75-1-1-e1786545956358\.webp)$/, "Fozia Mohamed, RDH, dental hygienist"],
  [/\/IMG_6255-1024x801\.jpeg$/, "Kaveh Sanatjou, RDH, dental hygienist"],
  [/\/(Tiana-Norris\.webp|IMG_1980-1-768x576\.jpeg)$/, "Tiana Norris, RDH, dental hygienist"],
  [/\/(img-7234|img-96234|Rectangle-3149-1024x764-1)\.webp$/, "Smiling dentist and dental assistant in a treatment room"],
  [/\/(img-7868234|idealdentalsolutions-image-9-1024x682-1)\.webp$/, "Smiling senior patient in the dental chair"],
  [/\/(img-1236553|idealdentalsolutions-image-13-1024x682-1)\.webp$/, "Dentist talking with a patient before treatment"],
  [/\/img-6523432\.webp$/, "Dentist curing a tooth-colored filling with a curing light"],
  [/\/Gemini_Generated_Image_elznlyelznlyelzn\.png$/, "Dentist curing a tooth-colored filling with a curing light"],
  [/\/(img-712637|cosmetic-dentistry-image)\.webp$/, "Tooth shade guide held next to a patient's smile"],
  [/\/(img-76234|image-slider-small-2)\.webp$/, "Dentist examining a patient with a dental microscope"],
  [/\/(img-8982346|2-1-1024x1024-1)\.webp$/, "Dental model of the upper and lower teeth"],
  [/\/(img-83234|1-1-1024x1024-1)\.webp$/, "Man holding his jaw because of tooth pain"],
  [/\/img-238461\.webp$/, "Patient putting in a clear aligner"],
  [/\/dental-bonding-image\.webp$/, "Dentist shaping tooth bonding on a patient"],
  [/\/dental-image-1024x1024-1\.webp$/, "Close-up of a healthy, natural-looking smile"],
  [/\/dental-patient-image-863x1024-1\.webp$/, "Smiling dental patient"],
  [/\/smile-makeover-image\.webp$/, "Bright, even smile after a smile makeover"],
  [/\/11-1024x1024-1\.webp$/, "Smiling patient during a dental cleaning"],
  [/\/about-image-2\.webp$/, "Dentist treating a patient at Ideal Dental Solutions"],
  [/\/4-1-1024x1024-1\.webp$/, "Patient checking her smile in a mirror after treatment"],
  [/\/idealdentalsolutions-image-8-1024x682-1\.webp$/, "Senior patient checking his smile in a hand mirror"],
  [/\/tooth-extrach-image-1024x1024-1\.webp$/, "Dental forceps used for a tooth extraction"],
];
const looksLikeFilename = (alt: string) => !alt || /^(b&a|idealdental$)/i.test(alt) || (!/\s/.test(alt) && /[-_.]/.test(alt));

for (const d of docs) {
  walk(d, (n) => {
    if (n._type !== "wpImage") return;
    const src = decodeURIComponent(String(n.src || ""));
    const alt = String(n.alt ?? "").trim();
    let next: string | null = null;
    if (LOGO.test(src)) next = BRAND;
    else if (DECORATIVE.test(src)) next = "";
    else {
      const ba = /\/ba-(\d+)/.exec(src);
      if (ba) next = `Before and after smile treatment at Ideal Dental Solutions, case ${Number(ba[1])}`;
      else if (looksLikeFilename(alt)) next = ALT_BY_FILE.find(([re]) => re.test(src))?.[1] ?? null;
    }
    if (next == null) {
      if (looksLikeFilename(alt)) throw new Error(`No alt text for ${src} on ${d._id}`);
      return;
    }
    if (next !== alt) {
      n.alt = next;
      log.push(`alt ${d._id}: ${src.split("/").pop()} -> "${next}"`);
    }
  });
  // Call-to-action backgrounds are images too (role="img").
  walk(d, (n) => {
    if (n._type === "elCta" && /^[\w-]+$/.test(String(n.bgLabel || ""))) {
      n.bgLabel = /before-after/.test(String(n.bgImage)) ? "Before and after smile at Ideal Dental Solutions" : `${headingText(n) || "Dental care"} at Ideal Dental Solutions`;
      log.push(`cta label ${d._id}`);
    }
  });
}

/* 8b. Internal links (TTR-895): 20 pages had no link from any other page. */
// Each Northern Virginia service page and its McLean page link to each other, with the
// location in the link text, so search engines can tell which page answers which search.
const TWINS: [string, string, string][] = [
  ["/services/restorative-dentistry/", "/locations/mclean/restorative-dentistry/", "restorative dentistry"],
  ["/services/restorative-dentistry/root-canal-therapy/", "/locations/mclean/root-canal-therapy/", "root canal therapy"],
  ["/services/restorative-dentistry/tmj-tmd-treatments/", "/locations/mclean/tmj-tmd-treatments/", "TMJ and TMD treatment"],
  ["/services/restorative-dentistry/dental-fillings/", "/dental-fillings-in-mclean-va/", "dental fillings"],
  ["/services/restorative-dentistry/dental-bridges/", "/dental-bridges-in-mclean-va/", "dental bridges"],
  ["/services/preventive-dentistry/", "/locations/mclean/preventive-dentistry/", "preventive dentistry"],
  ["/services/periodontic-dentistry/", "/locations/mclean/periodontal-dentistry/", "periodontics"],
  ["/services/periodontic-dentistry/gum-graft-surgery/", "/locations/mclean/gum-graft-surgery/", "gum graft surgery"],
  ["/services/periodontic-dentistry/gum-disease-treatment/", "/locations/mclean/gum-disease-treatment/", "gum disease treatment"],
  ["/services/dental-implants-dentistry/", "/locations/mclean/dental-implant-dentistry/", "dental implants"],
  ["/services/dental-implants-dentistry/full-arch-implants/", "/locations/mclean/full-arch-implants/", "full arch implants"],
  ["/services/dental-implants-dentistry/single-tooth-implants/", "/locations/mclean/single-tooth-implants/", "single tooth implants"],
  ["/services/cosmetic-dentistry/teeth-whitening/", "/locations/mclean/teeth-whitening/", "teeth whitening"],
  ["/services/cosmetic-dentistry/invisalign/", "/locations/mclean/invisalign/", "Invisalign®"],
  ["/services/cosmetic-dentistry/porcelain-veneers/", "/locations/mclean/porcelain-dental-veneers/", "porcelain veneers"],
];
const LINK_STYLE = "color:#ffffff;text-decoration:underline;";
/** Adds a line with a link under the intro text at the top of the page (once). */
function heroLink(path: string, html: string) {
  let done = false;
  walk(page(path).content, (n) => {
    if (done || n._type !== "elText") return;
    const blocks = n.body as { _type: string; html?: string }[];
    const block = blocks?.find((b) => b._type === "htmlBlock" && /^<p style="color:\s*#ffffff;/.test(b.html || ""));
    if (!block) return;
    done = true;
    if (block.html!.includes('data-link="twin"')) block.html = block.html!.replace(/<p [^>]*data-link="twin"[^>]*>[\s\S]*?<\/p>$/, "");
    const style = /^<p style="([^"]*)"/.exec(block.html!)![1];
    block.html += `<p style="${style}margin-top:12px;" data-link="twin">${html}</p>`;
  });
  if (!done) throw new Error(`No intro text on ${path}`);
  log.push(`link ${path}`);
}
for (const [nova, mclean, topic] of TWINS) {
  heroLink(nova, `In McLean? See <a href="${mclean}" style="${LINK_STYLE}">${topic} in McLean, VA</a>.`);
  // The McLean implant pages compete with each other for "dental implants mclean va": point both at the McLean implants page.
  const hub = /implants\/$/.test(mclean) && !/dental-implant-dentistry/.test(mclean) ? ` See all <a href="/locations/mclean/dental-implant-dentistry/" style="${LINK_STYLE}">dental implants in McLean, VA</a>.` : "";
  heroLink(mclean, `Serving all of Northern Virginia: <a href="${nova}" style="${LINK_STYLE}">${topic} in Northern VA</a>.${hub}`);
}

// Menu: "Services" opens the services page (it was "#"), and the two service pages that were in no menu.
{
  const header = docs.find((d) => d._type === "siteHeader") as Doc & { items: Node[] };
  const services = header.items.find((i) => i.label === "Services")!;
  services.link = "/services/";
  services.classes = String(services.classes).replace("menu-item-type-custom menu-item-object-custom", "menu-item-type-post_type menu-item-object-page");
  services.pageId = page("/services/").wpId;
  const groups = services.children as Node[];
  const add = (group: string, after: string | null, label: string, path: string, id: number) => {
    const list = groups.find((g) => g.label === group)!.children as Node[];
    if (list.some((i) => i.link === path)) return;
    const like = list[0];
    const item = {
      ...like,
      _key: `ttr${id}`,
      wpId: id,
      label,
      link: path,
      pageId: page(path).wpId,
      classes: String(like.classes).replace(/menu-item-\d+$/, `menu-item-${id}`),
      tpl: String(like.tpl).replace(/menu-item-\d+"/, `menu-item-${id}"`),
    };
    const at = after ? list.findIndex((i) => i.link === after) + 1 : list.length;
    list.splice(at || list.length, 0, item);
    log.push(`menu ${group} > ${label}`);
  };
  add("Restorative Dentistry", "/services/restorative-dentistry/tmj-tmd-treatments/", "Root Canal Therapy", "/services/restorative-dentistry/root-canal-therapy/", 9001);
  add("Preventive Dentistry", null, "Night Guards", "/locations/night-guards/", 9002);
}

// About Us: Dr. Adili's name opens his profile.
walk(page("/about-us/").content, (n) => {
  if (n._type !== "block" || !Array.isArray(n.children)) return;
  const spans = n.children as { _type: string; _key?: string; text?: string; marks?: string[] }[];
  const first = spans[0];
  if (!first?.text?.startsWith("Dr. Adili, our principal dentist") || first.marks?.includes("ttrAdili")) return;
  const defs = (n.markDefs ||= []) as Node[];
  defs.push({ _type: "link", _key: "ttrAdili", href: "/dr-mehdi-adili/" });
  spans.splice(0, 1, { ...first, _key: `${first._key}a`, text: "Dr. Adili", marks: ["ttrAdili"] }, { ...first, text: first.text.slice("Dr. Adili".length) });
  log.push("link /about-us/ > /dr-mehdi-adili/");
});

/* 8c. The Arlington office was sold and is closed (Kia, Oct 26): McLean is the only office (lib/site/arlington.ts). */
{
  const adili = page("/dr-mehdi-adili/");
  const fix = fixText;
  walk(adili, (n) => {
    if (n._type === "span" && typeof n.text === "string") n.text = fix(n.text as string);
  });
  if (typeof adili.excerpt === "string") adili.excerpt = fix(adili.excerpt as string);
}

/* 8d. A photo of a dentist who is not at the practice (coat: "Mahesh Patel, D.D.S.") is replaced by the team photo (lib/site/replaced-images.ts). */
for (const d of docs) {
  walk(d, (n) => {
    if (n._type === "elCta" && REPLACED.includes(String(n.bgImage))) {
      n.bgImage = NEW_IMAGE;
      n.bgLabel = "The Ideal Dental Solutions team at the McLean office";
    }
  });
}

/* 9. Structured data: Yoast's graph kept; Organization -> Dentist (Site settings > Business schema); no site search action. */
const SERVICES: [string, string][] = [
  ["Restorative Dentistry", "/services/restorative-dentistry/"],
  ["Tooth Extractions", "/services/restorative-dentistry/tooth-extractions/"],
  ["TMJ/TMD Treatments", "/services/restorative-dentistry/tmj-tmd-treatments/"],
  ["Root Canal Therapy", "/services/restorative-dentistry/root-canal-therapy/"],
  ["Dentures", "/services/restorative-dentistry/dentures/"],
  ["Dental Fillings", "/services/restorative-dentistry/dental-fillings/"],
  ["Dental Bridges", "/services/restorative-dentistry/dental-bridges/"],
  ["Preventive Dentistry", "/services/preventive-dentistry/"],
  ["Teeth Cleaning", "/services/preventive-dentistry/teeth-cleaning/"],
  ["Dental Sealants", "/services/preventive-dentistry/dental-sealants/"],
  ["Dental Checkups & Exams", "/services/preventive-dentistry/checkups-exams/"],
  ["Periodontic Dentistry", "/services/periodontic-dentistry/"],
  ["Gum Graft Surgery", "/services/periodontic-dentistry/gum-graft-surgery/"],
  ["Gum Disease Treatment", "/services/periodontic-dentistry/gum-disease-treatment/"],
  ["Crown Lengthening", "/services/periodontic-dentistry/crown-lengthening/"],
  ["Dental Implants", "/services/dental-implants-dentistry/"],
  ["Single Tooth Implants", "/services/dental-implants-dentistry/single-tooth-implants/"],
  ["Full Arch Implants", "/services/dental-implants-dentistry/full-arch-implants/"],
  ["Cosmetic Dentistry", "/services/cosmetic-dentistry/"],
  ["Teeth Whitening", "/services/cosmetic-dentistry/teeth-whitening/"],
  ["Porcelain Veneers", "/services/cosmetic-dentistry/porcelain-veneers/"],
  ["Invisalign", "/services/cosmetic-dentistry/invisalign/"],
  ["Dental Bonding", "/services/cosmetic-dentistry/dental-bonding/"],
  ["Night Guards", "/locations/night-guards/"],
];
const business = {
  "@type": ["Dentist", "LocalBusiness", "Organization"],
  name: BRAND,
  url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/wp-content/uploads/2026/07/image__4_-removebg-preview.png`, contentUrl: `${SITE}/wp-content/uploads/2026/07/image__4_-removebg-preview.png`, width: 831, height: 300, caption: BRAND },
  image: `${SITE}/og/home.jpg`,
  telephone: "+1-703-442-0442",
  description: "Dental practice in McLean, VA offering cosmetic, implant, periodontal, preventive and restorative dentistry for Northern Virginia.",
  address: { "@type": "PostalAddress", streetAddress: "8280 Greensboro Drive, Unit 105", addressLocality: "McLean", addressRegion: "VA", postalCode: "22102", addressCountry: "US" },
  geo: { "@type": "GeoCoordinates", latitude: 38.9239, longitude: -77.2311 },
  hasMap: "https://www.google.com/maps/search/?api=1&query=8280+Greensboro+Drive+Unit+105+McLean+VA+22102",
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "09:00", closes: "17:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "08:30", closes: "15:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "14:00", description: "Every other Saturday" },
  ],
  areaServed: [
    { "@type": "AdministrativeArea", name: "Northern Virginia" },
    ...["McLean", "Tysons Corner", "Vienna", "Falls Church", "Fairfax", "Alexandria"].map((name) => ({ "@type": "City", name: `${name}, VA` })),
  ],
  sameAs: ["https://www.facebook.com/IdealDentalSolutions/", "https://www.instagram.com/idealdentalsmiles/"],
  medicalSpecialty: ["Dentistry", "Periodontics", "Prosthodontics"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Dental Services",
    itemListElement: SERVICES.map(([name, path]) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, url: `${SITE}${path}` } })),
  },
};
byId.get("siteSettings")!.businessSchema = JSON.stringify(business, null, 2);

for (const d of docs) {
  const seo = d.seo;
  if (typeof seo?.schema !== "string") continue;
  const g = JSON.parse(seo.schema) as { "@graph": Node[] };
  for (const node of g["@graph"]) {
    if (node["@type"] === "WebSite") {
      delete node.potentialAction;
      node.name = BRAND;
      node.alternateName = "idealdental";
    }
    if (node["@type"] === "Organization") node.name = BRAND;
    // WebPage/CollectionPage name follows the title tag.
    if (/WebPage|CollectionPage|ProfilePage|SearchResultsPage/.test(String(node["@type"])) && seo.title && d._type !== "searchPage") {
      node.name = seo.title;
      if (seo.description) node.description = seo.description;
    }
  }
  seo.schema = JSON.stringify(g);
}

/* 10. Social images: 1200x630 photo per page. */
const OG_DIR = join(ROOT, "public/og");
mkdirSync(OG_DIR, { recursive: true });

function firstPhoto(d: Doc): string | null {
  let found: string | null = null;
  walk(d, (n) => {
    if (found) return;
    if (n._type === "elCta" && typeof n.bgImage === "string" && !/before-after/.test(n.bgImage)) found = n.bgImage;
    if (n._type !== "wpImage") return;
    const src = String(n.src || "");
    if (!src || DECORATIVE.test(src) || LOGO.test(src) || /\.svg$/i.test(src) || /\/ba-\d+/.test(src)) return;
    if (Number(n.width || 0) && Number(n.width) < 500) return;
    found = src;
  });
  return found;
}

async function ogFor(d: Doc, fallback: string): Promise<string | null> {
  const src = firstPhoto(d) || fallback;
  const local = join(ROOT, "public", decodeURIComponent(src.split("?")[0]));
  if (!existsSync(local)) return null;
  const slug = d.path === "/" ? "home" : d.path!.split("/").filter(Boolean).join("-");
  const out = join(OG_DIR, `${slug}.jpg`);
  if (!existsSync(out)) {
    await sharp(local).rotate().flatten({ background: "#ffffff" }).resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  }
  return `${SITE}/og/${slug}.jpg`;
}

const homeImg = firstPhoto(page("/"))!;
for (const d of docs.filter((x) => ["page", "archivePage"].includes(x._type) && x.path)) {
  const url = await ogFor(d, homeImg);
  if (!url) continue;
  const seo = (d.seo ||= {});
  const oldImg = seo.ogImage as string | undefined;
  Object.assign(seo, { ogImage: url, ogImageWidth: "1200", ogImageHeight: "630", ogImageType: "image/jpeg" });
  // Keep the schema's primary image in step with the social image.
  if (typeof seo.schema === "string") {
    const g = JSON.parse(seo.schema) as { "@graph": Node[] };
    for (const node of g["@graph"]) {
      if (node["@type"] === "ImageObject" && String(node["@id"]).endsWith("#primaryimage") && (!oldImg || node.url === oldImg)) Object.assign(node, { url, contentUrl: url, width: 1200, height: 630 });
      if (/WebPage/.test(String(node["@type"])) && node.thumbnailUrl) node.thumbnailUrl = url;
    }
    seo.schema = JSON.stringify(g);
  }
}

// No Arlington office any more, and no photo of a dentist who is not at the practice.
{
  const left = docs.filter((d) => /arlington|clarendon|528-0800|Tysons Corner \(8280|f27652e6-1b34|8dc0a8ce-a9b3/i.test(JSON.stringify(d)));
  if (left.length) throw new Error(`Arlington or a replaced photo still in ${left.map((d) => d._id).join(", ")}`);
}

writeFileSync(file, JSON.stringify(docs, null, 1));
console.log(log.filter((l) => !l.startsWith("alt ")).join("\n"));
console.log(`${log.filter((l) => l.startsWith("alt ")).length} alt texts written`);
