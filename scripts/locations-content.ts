/**
 * Text of the location pages (built by scripts/locations.ts). Every local fact
 * has its source in docs/locations/sources.md. Rules: the only office is in
 * McLean (never "our Vienna office"), no em dashes, no promises of results,
 * drive times are approximate and off-peak.
 */

export type Faq = { q: string; a: string };

type Photo = { src: string; width: string; height: string; alt: string };

/** A light section with a heading and text, or a dark one with a team photo and an accordion. */
export type Section =
  | { kind: "text"; heading: string; html: string }
  | { kind: "accordion"; heading: string; intro: string; photo: Photo; items: { title: string; text: string }[]; link: string };

export type Page = {
  /** Title tag (60 characters or less) and meta description. */
  title: string;
  description: string;
  h1: string;
  subtitle: string;
  /** The short answer at the top of the page. */
  answer: string;
  sections: Section[];
  faqHeading: string;
  faqIntro: string;
  faqs: Faq[];
  cta: { heading: string; html: string; photo: string };
  ogPhoto: string;
  /** Last edit (YYYY-MM-DD). */
  date: string;
};

export type Town = Page & { slug: string; name: string; place: Record<string, unknown> };

const DATE = "2026-10-26";

/* ---------------- shared facts (the practice) ---------------- */

export const ADDRESS = "8280 Greensboro Drive, Unit 105, McLean, VA 22102";
export const PHONE = '<a href="tel:+17034420442">(703) 442-0442</a>';
const BOOK = '<a href="/appointment/">request an appointment online</a>';
export const HOURS = "Monday to Thursday 9am to 5pm, Friday 8:30am to 3pm, every other Saturday 8am to 2pm, closed Sunday";
export const METRO = "Greensboro station on the Metro Silver Line is about an 8 minute walk from the office";
const DRIVE_NOTE = "Drive times are approximate and assume light traffic; allow more time at rush hour.";

const FAIRFAX_COUNTY = { "@type": "AdministrativeArea", name: "Fairfax County, VA" };

const photos = {
  adili: { src: "/wp-content/uploads/2026/05/img-2364234.png", width: "710", height: "791", alt: "Dr. Mehdi S. Adili, DDS, prosthodontist at Ideal Dental Solutions" },
  sepahi: { src: "/wp-content/uploads/2026/05/Frame-1984079077.png", width: "690", height: "800", alt: "Dr. Saman Sepahi, DDS, at Ideal Dental Solutions" },
  hojaeva: { src: "/wp-content/uploads/2026/05/dr-hojaeva-1.png", width: "690", height: "800", alt: "Dr. Dilnoza Hojaeva, DDS, at Ideal Dental Solutions" },
  fozia: { src: "/wp-content/uploads/2026/07/Fosia-1024x768.jpg", width: "1024", height: "768", alt: "Fozia Mohamed, RDH, dental hygienist at Ideal Dental Solutions" },
  tiana: { src: "/wp-content/uploads/2026/08/IMG_1980-1-1024x768.jpeg", width: "1024", height: "768", alt: "Tiana Norris, RDH, dental hygienist at Ideal Dental Solutions" },
};
/** Wide team photos for the call to action backgrounds and social images. */
const wide = {
  kaveh: "/wp-content/uploads/2026/07/IMG_6255-1024x801.jpeg",
  tiana: "/wp-content/uploads/2026/08/IMG_1980-1-1024x768.jpeg",
  fozia: "/wp-content/uploads/2026/08/Fosia-2-1024x768.jpg",
  fozia2: "/wp-content/uploads/2026/07/Fosia-1024x768.jpg",
};

const link = (href: string, label: string) => `<a href="${href}">${label}</a>`;
const S = {
  checkups: link("/services/preventive-dentistry/checkups-exams/", "checkups and exams"),
  cleaning: link("/services/preventive-dentistry/teeth-cleaning/", "teeth cleaning"),
  sealants: link("/services/preventive-dentistry/dental-sealants/", "dental sealants"),
  fillings: link("/services/restorative-dentistry/dental-fillings/", "dental fillings"),
  whitening: link("/services/cosmetic-dentistry/teeth-whitening/", "teeth whitening"),
  bonding: link("/services/cosmetic-dentistry/dental-bonding/", "dental bonding"),
  tmj: link("/services/restorative-dentistry/tmj-tmd-treatments/", "TMJ/TMD treatment"),
  gumDisease: link("/services/periodontic-dentistry/gum-disease-treatment/", "gum disease treatment"),
  gumGraft: link("/services/periodontic-dentistry/gum-graft-surgery/", "gum graft surgery"),
  implants: link("/services/dental-implants-dentistry/", "dental implants"),
  fullArch: link("/services/dental-implants-dentistry/full-arch-implants/", "full arch implants"),
  dentures: link("/services/restorative-dentistry/dentures/", "dentures"),
  bridges: link("/services/restorative-dentistry/dental-bridges/", "dental bridges"),
  invisalign: link("/services/cosmetic-dentistry/invisalign/", "Invisalign"),
  veneers: link("/services/cosmetic-dentistry/porcelain-veneers/", "porcelain veneers"),
  nightGuards: link("/locations/night-guards/", "night guards"),
  rootCanal: link("/services/restorative-dentistry/root-canal-therapy/", "root canal therapy"),
  all: link("/services/", "all of our services"),
};

const TOWN_LINKS: [string, string][] = [
  ["tysons", "Tysons"],
  ["vienna", "Vienna"],
  ["falls-church", "Falls Church"],
  ["great-falls", "Great Falls"],
  ["potomac", "Potomac, MD"],
];
const others = (slug: string) =>
  `<p>Our office: ${link("/locations/mclean/", "Ideal Dental Solutions in McLean")}. Also served from it: ${TOWN_LINKS.filter(([s]) => s !== slug)
    .map(([s, n]) => link(`/locations/${s}/`, n))
    .join(", ")}. See ${link("/locations/", "all areas we serve")}.</p>`;

const FAIRFAX_RESOURCES = `<ul>
<li>Fairfax County's own dental program moved to the community health centers serving the county on January 1, 2023. The county's ${link("https://www.fairfaxcounty.gov/health/dental", "dental services page")} lists where to go now.</li>
<li>The ${link("https://www.novadentalclinic.org/", "Northern Virginia Dental Clinic")}, a nonprofit founded in 1994, provides volunteer dental care to low-income adults referred by local agencies.</li>
<li>The county's ${link("https://www.fairfaxcounty.gov/familyservices/public-assistance-employment-services/medical-care-for-children", "Medical Care for Children Partnership")} helps children from low-income families who do not qualify for Medicaid or FAMIS get medical and dental care.</li>
<li>Virginia Medicaid and FAMIS dental coverage is called ${link("https://www.dmas.virginia.gov/for-members/benefits-and-services/dental/", "Cardinal Care Smiles")}.</li>
</ul>`;

const FAIRFAX_WATER_FLUORIDE =
  "Fairfax Water adds fluoride, targeting 0.7 mg/L, the level the CDC recommends for community water; its treatment plants measured about 0.6 to 0.7 mg/L in 2025.";

const cta = (town: string, photo: string) => ({
  heading: `Book Your Visit From ${town}`,
  html: `<p>Call ${PHONE} or ${BOOK}. Our office is at ${ADDRESS}. Hours: ${HOURS}.</p>`,
  photo,
});

/* ---------------- hub ---------------- */

export const MCLEAN = { "@type": "City", name: "McLean, VA", containedInPlace: FAIRFAX_COUNTY };

export const HUB: Page = {
  title: "Areas We Serve | Ideal Dental Solutions",
  description: "Ideal Dental Solutions has one office, in McLean at 8280 Greensboro Drive, and sees patients from Tysons, Vienna, Falls Church, Great Falls and Potomac, MD.",
  h1: "Areas We Serve From Our McLean Office",
  subtitle: "One office in Tysons, a short drive from nearby towns",
  answer: `<p>Ideal Dental Solutions has one office: ${ADDRESS}, in Tysons. Patients come to us from Tysons, Vienna, Falls Church, Great Falls and Potomac, Maryland. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "Our Office",
      html: `<p>${ADDRESS}. The address is in McLean, and the building is in Tysons, Fairfax County. ${METRO}.</p>
<p>Hours: ${HOURS}.</p>
<p>Phone: ${PHONE}.</p>`,
    },
    {
      kind: "text",
      heading: "Our Office and the Towns Our Patients Come From",
      html: `<ul>
<li>${link("/locations/mclean/", "McLean")}: our office, with its hours, team and services.</li>
<li>${link("/locations/tysons/", "Tysons")}: our office is in Tysons, about a mile from Tysons Corner Center.</li>
<li>${link("/locations/vienna/", "Vienna")}: about 2.8 miles from the Town of Vienna's center, usually 7 to 12 minutes by car on Maple Avenue and Chain Bridge Road (Route 123).</li>
<li>${link("/locations/falls-church/", "Falls Church")}: about 4.6 miles from Falls Church City Hall, usually 12 to 18 minutes on Broad Street and Leesburg Pike (Route 7).</li>
<li>${link("/locations/great-falls/", "Great Falls")}: about 7 miles from Great Falls village, usually 14 to 22 minutes on Walker Road, Colvin Run Road and Leesburg Pike, or on Georgetown Pike and Spring Hill Road.</li>
<li>${link("/locations/potomac/", "Potomac, MD")}: about 12 miles from Potomac Village, usually 20 to 30 minutes across the American Legion Bridge on I-495.</li>
</ul>
<p>${DRIVE_NOTE} For the care we provide, see ${S.all}.</p>`,
    },
  ],
  faqHeading: "Questions About Visiting Us",
  faqIntro: "Answers to what patients from nearby towns ask before their first visit.",
  faqs: [
    { q: "How many offices does Ideal Dental Solutions have?", a: `One. Every patient is seen at ${ADDRESS}.` },
    { q: "Can I get to the office by Metro?", a: `Yes. ${METRO}.` },
    { q: "Do you see patients from Maryland?", a: `Yes. Patients from Potomac, Maryland reach us across the American Legion Bridge on I-495, usually in 20 to 30 minutes outside rush hour. See our ${link("/locations/potomac/", "Potomac page")}.` },
    { q: "How do I book a visit?", a: `Call ${PHONE} or ${BOOK}.` },
  ],
  cta: { heading: "Book Your Visit", html: `<p>Call ${PHONE} or ${BOOK}. Hours: ${HOURS}.</p>`, photo: wide.tiana },
  ogPhoto: wide.kaveh,
  date: DATE,
};

/* ---------------- McLean (the office) ---------------- */

const MCLEAN_SERVICES = [
  ["/locations/mclean/preventive-dentistry/", "Preventive dentistry"],
  ["/locations/mclean/restorative-dentistry/", "Restorative dentistry"],
  ["/dental-fillings-in-mclean-va/", "Dental fillings"],
  ["/dental-bridges-in-mclean-va/", "Dental bridges"],
  ["/locations/mclean/root-canal-therapy/", "Root canal therapy"],
  ["/locations/mclean/periodontal-dentistry/", "Periodontal dentistry"],
  ["/locations/mclean/gum-disease-treatment/", "Gum disease treatment"],
  ["/locations/mclean/gum-graft-surgery/", "Gum graft surgery"],
  ["/locations/mclean/dental-implant-dentistry/", "Dental implants"],
  ["/locations/mclean/single-tooth-implants/", "Single tooth implants"],
  ["/locations/mclean/full-arch-implants/", "Full arch implants"],
  ["/locations/mclean/invisalign/", "Invisalign"],
  ["/locations/mclean/porcelain-dental-veneers/", "Porcelain veneers"],
  ["/locations/mclean/teeth-whitening/", "Teeth whitening"],
  ["/locations/mclean/tmj-tmd-treatments/", "TMJ/TMD treatment"],
];

export const MAP = "https://www.google.com/maps/search/?api=1&query=8280+Greensboro+Drive+Unit+105+McLean+VA+22102";

export const MCLEAN_PAGE: Page = {
  title: "Dentist in McLean, VA | Ideal Dental Solutions",
  description: "Ideal Dental Solutions, 8280 Greensboro Drive, Unit 105, McLean, VA 22102: hours, directions, our dentists and hygienists, and the dental care we provide.",
  h1: "Your Dentist in McLean, VA",
  subtitle: "8280 Greensboro Drive, Unit 105, near Greensboro Metro",
  answer: `<p>Ideal Dental Solutions is at ${ADDRESS}, our only office. Hours: ${HOURS}. ${METRO}. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "Visit Our Office",
      html: `<ul>
<li>Address: ${ADDRESS} (${link(MAP, "open in Google Maps")}). The address is in McLean, and the building is in Tysons, Fairfax County.</li>
<li>By Metro: ${METRO}.</li>
<li>By car: from the Capital Beltway (I-495), take the Chain Bridge Road (Route 123) or Leesburg Pike (Route 7) exits into Tysons, then International Drive or Westpark Drive to Greensboro Drive.</li>
<li>Hours: ${HOURS}.</li>
<li>Phone: ${PHONE}. Call us if you need directions on the day of your visit.</li>
</ul>`,
    },
    {
      kind: "accordion",
      heading: "Meet Our McLean Team",
      intro: "Our three dentists and three dental hygienists all work at this office.",
      photo: photos.adili,
      items: [
        { title: "Dr. Mehdi S. Adili, DDS", text: "Our principal dentist and a prosthodontist. He earned his DDS at Georgetown University. His focus includes dental implants, bridges, dentures, crowns and full-mouth restoration." },
        { title: "Dr. Saman Sepahi, DDS", text: "He received his DDS in 2008 from the Karolinska Institute in Stockholm, Sweden, and helped start the organization Dentists Without Borders." },
        { title: "Dr. Dilnoza Hojaeva, DDS", text: "She earned her DDS through the Advanced Standing Program for Internationally Trained Dentists at the Virginia Commonwealth University School of Dentistry." },
        { title: "Fozia Mohamed, RDH", text: "Dental hygienist. She graduated from Pacific University Oregon in 2012 with a bachelor's degree in Dental Health Science." },
        { title: "Kaveh Sanatjou, RDH", text: "Dental hygienist. He graduated from Northern Virginia Community College in 2000 with an AAS in Dental Hygiene." },
        { title: "Tiana Norris, RDH", text: "Dental hygienist. She graduated from Northern Virginia Community College with an AAS in Dental Hygiene." },
      ],
      link: `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/about-us/">More about our team</a></p>`,
    },
    {
      kind: "text",
      heading: "Dental Care at Our McLean Office",
      html: `<ul>
${MCLEAN_SERVICES.map(([href, label]) => `<li>${link(href, label)}</li>`).join("\n")}
</ul>
<p>We also provide ${S.checkups}, ${S.cleaning}, ${S.sealants}, ${S.bonding}, ${S.dentures}, ${S.nightGuards} and ${link("/services/restorative-dentistry/tooth-extractions/", "tooth extractions")}. See ${S.all} and our ${link("/before-after/", "before and after photos")}.</p>`,
    },
    {
      kind: "text",
      heading: "Local Dental Health Facts for McLean",
      html: `<p>McLean is an unincorporated community in Fairfax County with 50,773 residents in the 2020 Census.</p>
<p>Public water in McLean comes from Fairfax Water, which in 2014 also took over the City of Falls Church's water system and its customers in the McLean area. ${FAIRFAX_WATER_FLUORIDE} Part of the area also receives Washington Aqueduct water, which is fluoridated too. Homes on private wells should have their water tested.</p>
<p>Low-cost and public dental care in Fairfax County:</p>
${FAIRFAX_RESOURCES}
<p>Patients also come to us from ${TOWN_LINKS.map(([s, n]) => link(`/locations/${s}/`, n)).join(", ")}. See ${link("/locations/", "all areas we serve")}.</p>`,
    },
  ],
  faqHeading: "Frequently Asked Questions About Our McLean Office",
  faqIntro: "Quick answers before your visit.",
  faqs: [
    { q: "Where is Ideal Dental Solutions?", a: `At ${ADDRESS}, in Tysons. It is our only office.` },
    { q: "What are your hours?", a: `${HOURS}.` },
    { q: "Can I get there by Metro?", a: `Yes. ${METRO}.` },
    { q: "Which insurance plans do you work with?", a: `Plans we work with include Aetna, Ameritas, Anthem, CareFirst, Cigna, Delta Dental, GEHA, Guardian, Humana, Lincoln, MetLife, Principal, United Concordia and UnitedHealthcare. Call ${PHONE} to confirm your plan before your visit. See also ${link("/insurance-and-payment/", "Insurance and Payment")}.` },
    { q: "How do I book an appointment?", a: `Call ${PHONE} or ${BOOK}.` },
  ],
  cta: cta("McLean", wide.tiana),
  ogPhoto: wide.kaveh,
  date: DATE,
};

/* ---------------- towns ---------------- */

export const TOWNS: Town[] = [
  {
    slug: "tysons",
    name: "Tysons",
    place: { "@type": "City", name: "Tysons, VA", containedInPlace: FAIRFAX_COUNTY },
    title: "Dentist in Tysons, VA | Ideal Dental Solutions",
    description: "Ideal Dental Solutions is in Tysons at 8280 Greensboro Drive, about 8 minutes on foot from Greensboro Metro: checkups, gum care, fillings, whitening and more.",
    h1: "Your Dentist in Tysons, VA",
    subtitle: "Our McLean office is in Tysons, near Greensboro Metro",
    answer: `<p>Our office at ${ADDRESS} has a McLean mailing address and sits in Tysons, Fairfax County. It is about a mile from Tysons Corner Center, and ${METRO}. Call ${PHONE} or ${BOOK}.</p>`,
    sections: [
      {
        kind: "text",
        heading: "Getting Here Within Tysons",
        html: `<ul>
<li>By Metro: ${METRO}. Tysons station is about a 17 minute walk.</li>
<li>By car from Tysons Corner Center: about a mile, usually 3 to 8 minutes, using Leesburg Pike (Route 7) or Chain Bridge Road (Route 123), then Westpark Drive or International Drive to Greensboro Drive.</li>
<li>From the Capital Beltway (I-495): take the Route 123 or Route 7 exits into Tysons, then International Drive or Westpark Drive to Greensboro Drive.</li>
</ul>
<p>${DRIVE_NOTE}</p>`,
      },
      {
        kind: "accordion",
        heading: "Tysons Landmarks Near Our Office",
        intro: "Tysons is an unincorporated area of Fairfax County with four Silver Line stations. These are the places our patients pass on the way in.",
        photo: photos.adili,
        items: [
          { title: "Greensboro Station", text: "The Silver Line station at 8305 Leesburg Pike, the closest Metro stop to our office." },
          { title: "Tysons Corner Center", text: "The shopping center with its own Silver Line access, about a mile from our office." },
          { title: "Tysons Galleria", text: "The shopping center at 2001 International Drive, along Chain Bridge Road (Route 123), a short drive from Greensboro Drive." },
          { title: "Capital One Center", text: "Home of Capital One Hall and Capital One Park, next to the Beltway in Tysons." },
          { title: "McLean, Tysons and Spring Hill Stations", text: "The other three Silver Line stations in Tysons. All four opened in 2014." },
        ],
        link: `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/about-us/">Meet our team</a></p>`,
      },
      {
        kind: "text",
        heading: "Local Dental Health Facts for Tysons",
        html: `<p>Tysons is an unincorporated area of Fairfax County with 26,374 residents in the 2020 Census. The county's Tysons plan, adopted in 2010, plans for up to 100,000 residents by 2050.</p>
<p>Drinking water in Tysons comes from Fairfax Water. ${FAIRFAX_WATER_FLUORIDE}</p>
<p>Low-cost and public dental care in Fairfax County:</p>
${FAIRFAX_RESOURCES}`,
      },
      {
        kind: "text",
        heading: "Dental Care Tysons Patients Look For Most",
        html: `<p>These are the services people in Tysons search for most often. Each link has the details:</p>
<ul>
<li>${S.gumGraft} for receding gums, and ${S.gumDisease}</li>
<li>${S.fillings} and ${S.bonding}</li>
<li>${S.whitening}</li>
<li>${S.sealants} for children and teens</li>
<li>${S.tmj} for jaw pain and clicking</li>
</ul>
<p>We also provide ${S.checkups}, ${S.cleaning}, ${S.implants} and ${S.invisalign}. See ${S.all}.</p>
${others("tysons")}`,
      },
    ],
    faqHeading: "Frequently Asked Questions From Tysons Patients",
    faqIntro: "Quick answers for patients who live or work in Tysons.",
    faqs: [
      { q: "Is your McLean office in Tysons?", a: `Yes. ${ADDRESS} has a McLean mailing address, and the Census places it in Tysons, Fairfax County. It is our only office.` },
      { q: "What is the closest Metro station?", a: `Greensboro station on the Silver Line, at 8305 Leesburg Pike. The walk is about 8 minutes.` },
      { q: "Can I come in before or after work?", a: `Our hours are ${HOURS}. Call ${PHONE} to find a time that fits your day.` },
      { q: "Do you treat receding gums?", a: `Yes. We evaluate gum recession and provide ${S.gumGraft} and ${S.gumDisease} when they are needed.` },
      { q: "Is the water in Tysons fluoridated?", a: `Yes. Fairfax Water adds fluoride and targets 0.7 mg/L, the level the CDC recommends.` },
    ],
    cta: cta("Tysons", wide.fozia),
    ogPhoto: wide.kaveh,
    date: DATE,
  },
  {
    slug: "vienna",
    name: "Vienna",
    place: { "@type": "City", name: "Vienna, VA", containedInPlace: FAIRFAX_COUNTY },
    title: "Dentist Serving Vienna, VA | Ideal Dental Solutions",
    description: "Serving Vienna, VA from our McLean office in Tysons, about 2.8 miles from the town center on Route 123. Checkups, cleanings, implants, Invisalign and more.",
    h1: "Dentist Serving Vienna, VA",
    subtitle: "About 2.8 miles from the Town of Vienna on Route 123",
    answer: `<p>We serve Vienna from our only office, ${ADDRESS}, in Tysons. From the Town of Vienna's center it is about 2.8 miles, usually 7 to 12 minutes by car on Maple Avenue and Chain Bridge Road (Route 123). Call ${PHONE} or ${BOOK}.</p>`,
    sections: [
      {
        kind: "text",
        heading: "Getting Here From Vienna",
        html: `<ul>
<li>From Maple Avenue: drive northeast on Maple Avenue (Route 123), which becomes Chain Bridge Road, into Tysons, then take International Drive or Westpark Drive to Greensboro Drive. About 2.8 miles from Vienna Town Hall.</li>
<li>By Metro: there is no station inside the town; ${METRO}.</li>
</ul>
<p>${DRIVE_NOTE}</p>`,
      },
      {
        kind: "accordion",
        heading: "Vienna Neighborhoods and Landmarks We Serve",
        intro: "Our patients come from all over the Town of Vienna and the Vienna mailing area around it.",
        photo: photos.fozia,
        items: [
          { title: "Maple Avenue", text: "Route 123, the town's main street, and the direct road from Vienna to our office." },
          { title: "Church Street", text: "The historic street one block off Maple Avenue, home of the Freeman Store and Museum." },
          { title: "Freeman Store and Museum", text: "Built in 1859 and owned by the Town of Vienna, at 131 Church Street NE." },
          { title: "W&OD Trail", text: "The rail trail that runs through the center of Vienna." },
          { title: "Wolf Trap", text: "Wolf Trap National Park for the Performing Arts, just outside the town, with a Vienna address." },
        ],
        link: `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/about-us/">Meet our team</a></p>`,
      },
      {
        kind: "text",
        heading: "Local Dental Health Facts for Vienna",
        html: `<p>The Town of Vienna is an incorporated town in Fairfax County, incorporated in 1890, with 16,473 residents in the 2020 Census.</p>
<p>The town runs its own water utility. It buys its water from Fairfax Water, and in 2025 part of it also came from the Washington Aqueduct. The town's 2026 water quality report says fluoride is added; in 2025 it measured about 0.6 parts per million in Fairfax Water's supply and 0.7 in the Aqueduct's, in line with the CDC's recommended 0.7 mg/L. The town system also serves some homes outside town limits, so check your water bill to see your provider.</p>
<p>Low-cost and public dental care in Fairfax County:</p>
${FAIRFAX_RESOURCES}`,
      },
      {
        kind: "text",
        heading: "Dental Care for Vienna Patients",
        html: `<p>From one office, our dentists and hygienists provide:</p>
<ul>
<li>Preventive care: ${S.checkups}, ${S.cleaning} and ${S.sealants}</li>
<li>Repairs: ${S.fillings}, ${S.bridges} and ${S.rootCanal}</li>
<li>Replacing teeth: ${S.implants}, ${S.fullArch} and ${S.dentures}, with Dr. Mehdi S. Adili, a prosthodontist</li>
<li>Cosmetic care: ${S.invisalign}, ${S.whitening} and ${S.veneers}</li>
</ul>
<p>See ${S.all}.</p>
${others("vienna")}`,
      },
    ],
    faqHeading: "Frequently Asked Questions From Vienna Patients",
    faqIntro: "Quick answers for patients coming from Vienna.",
    faqs: [
      { q: "Do you have an office in Vienna?", a: `No. Our only office is ${ADDRESS}, in Tysons, about 2.8 miles from the center of Vienna.` },
      { q: "How long is the drive from Vienna?", a: `Usually 7 to 12 minutes from Vienna Town Hall on Maple Avenue and Chain Bridge Road (Route 123), longer at rush hour.` },
      { q: "Is Vienna's water fluoridated?", a: `Yes. The Town of Vienna's 2026 water quality report says fluoride is added to its supply.` },
      { q: "Can I bring my children?", a: `Yes. We see children and adults, and we place ${S.sealants} to help protect back teeth.` },
      { q: "Who handles dental implant treatment?", a: `Dr. Mehdi S. Adili, DDS, a prosthodontist, plans and restores ${S.implants} at our McLean office.` },
    ],
    cta: cta("Vienna", wide.tiana),
    ogPhoto: wide.fozia2,
    date: DATE,
  },
  {
    slug: "falls-church",
    name: "Falls Church",
    place: { "@type": "City", name: "Falls Church, VA", containedInPlace: { "@type": "State", name: "Virginia" } },
    title: "Dentist Serving Falls Church, VA | Ideal Dental Solutions",
    description: "Serving Falls Church, VA from our McLean office in Tysons, about 4.6 miles up Route 7. Gum graft surgery, gum disease treatment, checkups and more.",
    h1: "Dentist Serving Falls Church, VA",
    subtitle: "About 4.6 miles up Leesburg Pike (Route 7)",
    answer: `<p>We serve Falls Church from our only office, ${ADDRESS}, in Tysons. From Falls Church City Hall it is about 4.6 miles, usually 12 to 18 minutes by car on Broad Street and Leesburg Pike (Route 7). Call ${PHONE} or ${BOOK}.</p>`,
    sections: [
      {
        kind: "text",
        heading: "Getting Here From Falls Church",
        html: `<ul>
<li>By car: take West Broad Street, which becomes Leesburg Pike (Route 7), west into Tysons, then Westpark Drive to Greensboro Drive.</li>
<li>By Metro: from East Falls Church station, the Silver Line runs straight to Greensboro station with no transfer; ${METRO}. From West Falls Church station (Orange Line) you need to change trains.</li>
</ul>
<p>${DRIVE_NOTE}</p>`,
      },
      {
        kind: "accordion",
        heading: "Falls Church Neighborhoods and Landmarks We Serve",
        intro: "We see patients from the City of Falls Church and from the Falls Church mailing area in Fairfax County.",
        photo: photos.sepahi,
        items: [
          { title: "Broad Street", text: "The city's main street, which becomes Leesburg Pike (Route 7), the direct road to our office." },
          { title: "Eden Center", text: "The shopping center on Wilson Boulevard, inside the City of Falls Church." },
          { title: "Mary Riley Styles Public Library", text: "The city library at 120 North Virginia Avenue." },
          { title: "The Falls Church", text: "The historic Episcopal church on East Fairfax Street." },
          { title: "Seven Corners", text: "The crossroads area with a Falls Church address, in Fairfax County." },
          { title: "West Falls Church", text: "The area around West Falls Church station, in Fairfax County." },
        ],
        link: `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/about-us/">Meet our team</a></p>`,
      },
      {
        kind: "text",
        heading: "Local Dental Health Facts for Falls Church",
        html: `<p>The City of Falls Church is an independent city, not part of any county, with 14,658 residents in the 2020 Census. Many homes with a Falls Church address, such as those around Seven Corners and West Falls Church station, are in Fairfax County instead.</p>
<p>The city sold its water system to Fairfax Water in 2014, so homes in the city and the surrounding Fairfax County area get their water from Fairfax Water, which adds fluoride and targets 0.7 mg/L, the level the CDC recommends. Part of the area also receives fluoridated Washington Aqueduct water.</p>
<p>Low-cost and public dental care for Falls Church residents:</p>
${FAIRFAX_RESOURCES.replace(/<li>The county's (<a [^>]+>Medical Care for Children Partnership<\/a>) helps/, "<li>The $1, open to residents of Fairfax County and the City of Falls Church, helps")}`,
      },
      {
        kind: "text",
        heading: "Dental Care Falls Church Patients Look For",
        html: `<p>Gum graft surgery is one of the services people in Falls Church search for most often. We provide:</p>
<ul>
<li>${S.gumGraft} for receding gums and exposed roots</li>
<li>${S.gumDisease} and deep cleanings</li>
<li>${S.checkups}, ${S.cleaning} and ${S.fillings}</li>
<li>${S.implants} and ${S.dentures}, with Dr. Mehdi S. Adili, a prosthodontist</li>
</ul>
<p>See ${S.all}.</p>
${others("falls-church")}`,
      },
    ],
    faqHeading: "Frequently Asked Questions From Falls Church Patients",
    faqIntro: "Quick answers for patients coming from Falls Church.",
    faqs: [
      { q: "Do you have an office in Falls Church?", a: `No. Our only office is ${ADDRESS}, in Tysons, about 4.6 miles from Falls Church City Hall.` },
      { q: "Can I take Metro from Falls Church?", a: `Yes. From East Falls Church station, ride the Silver Line to Greensboro station; the office is about an 8 minute walk from there.` },
      { q: "Do you do gum graft surgery?", a: `Yes. We evaluate gum recession at a consultation and explain whether ${S.gumGraft} is needed or whether monitoring is enough for now.` },
      { q: "Is Falls Church water fluoridated?", a: `Yes. Fairfax Water, which has run the city's water system since 2014, adds fluoride.` },
      { q: "How do I book?", a: `Call ${PHONE} or ${BOOK}.` },
    ],
    cta: cta("Falls Church", wide.fozia),
    ogPhoto: wide.fozia,
    date: DATE,
  },
  {
    slug: "great-falls",
    name: "Great Falls",
    place: { "@type": "City", name: "Great Falls, VA", containedInPlace: FAIRFAX_COUNTY },
    title: "Dentist Serving Great Falls, VA | Ideal Dental Solutions",
    description: "Serving Great Falls, VA from our McLean office in Tysons, about 7 miles away. Well water and fluoride, checkups, implants and family dental care.",
    h1: "Dentist Serving Great Falls, VA",
    subtitle: "About 7 miles from Great Falls village",
    answer: `<p>We serve Great Falls from our only office, ${ADDRESS}, in Tysons. From the village center at Georgetown Pike and Walker Road it is about 7 miles, usually 14 to 22 minutes by car. Call ${PHONE} or ${BOOK}.</p>`,
    sections: [
      {
        kind: "text",
        heading: "Getting Here From Great Falls",
        html: `<ul>
<li>By Walker Road: take Walker Road to Colvin Run Road, then Leesburg Pike (Route 7) east into Tysons, then Westpark Drive to Greensboro Drive.</li>
<li>By Georgetown Pike: take Georgetown Pike (Route 193) east, then turn right on Spring Hill Road and follow it south into Tysons to Greensboro Drive.</li>
<li>Great Falls has no Metro station, so most patients drive.</li>
</ul>
<p>${DRIVE_NOTE}</p>`,
      },
      {
        kind: "accordion",
        heading: "Great Falls Landmarks We Serve",
        intro: "Great Falls is an unincorporated community in Fairfax County. Our patients come from across it.",
        photo: photos.tiana,
        items: [
          { title: "Great Falls Village Centre", text: "The shops at Georgetown Pike and Walker Road, the center of the community." },
          { title: "Georgetown Pike", text: "Route 193, the historic road between Great Falls and McLean." },
          { title: "Colvin Run Mill", text: "The historic mill on Colvin Run Road, on one of the routes to our office." },
          { title: "Great Falls Park", text: "The National Park Service park on the Potomac River. Its official address is on Old Dominion Drive in McLean." },
        ],
        link: `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/about-us/">Meet our team</a></p>`,
      },
      {
        kind: "text",
        heading: "Local Dental Health Facts for Great Falls",
        html: `<p>Great Falls is an unincorporated community in Fairfax County with 15,953 residents in the 2020 Census.</p>
<p>Some Great Falls homes get public water from Fairfax Water, which adds fluoride. Others use private wells. Well water is not fluoridated, and its natural fluoride depends on the ground it comes from. The Fairfax County Health Department advises well owners to test their water every year. If your home is on a well, tell us at your visit so we can talk about whether a fluoride treatment makes sense for you or your children.</p>
<p>Low-cost and public dental care in Fairfax County:</p>
${FAIRFAX_RESOURCES}`,
      },
      {
        kind: "text",
        heading: "Dental Care for Great Falls Patients",
        html: `<ul>
<li>Preventive care: ${S.checkups}, ${S.cleaning} and ${S.sealants}</li>
<li>Gum care: ${S.gumDisease} and ${S.gumGraft}</li>
<li>Replacing teeth: ${S.implants}, ${S.fullArch}, ${S.bridges} and ${S.dentures}, with Dr. Mehdi S. Adili, a prosthodontist</li>
<li>Cosmetic care: ${S.veneers}, ${S.whitening} and ${S.invisalign}</li>
</ul>
<p>See ${S.all}.</p>
${others("great-falls")}`,
      },
    ],
    faqHeading: "Frequently Asked Questions From Great Falls Patients",
    faqIntro: "Quick answers for patients coming from Great Falls.",
    faqs: [
      { q: "Do you have an office in Great Falls?", a: `No. Our only office is ${ADDRESS}, in Tysons, about 7 miles from Great Falls village.` },
      { q: "My home is on a well. Does that matter for my teeth?", a: `It can. Private well water is not fluoridated, and its natural fluoride varies. Tell us at your visit and we can discuss whether a fluoride treatment is a good idea. The county advises testing well water every year.` },
      { q: "Which way is quickest from Great Falls?", a: `Usually Walker Road, Colvin Run Road and Leesburg Pike (Route 7), or Georgetown Pike (Route 193) to Spring Hill Road. Both take about 14 to 22 minutes outside rush hour.` },
      { q: "Do you provide dental implants?", a: `Yes. We provide ${S.implants}, and Dr. Mehdi S. Adili, DDS, a prosthodontist, plans and restores them at our McLean office.` },
    ],
    cta: cta("Great Falls", wide.fozia2),
    ogPhoto: wide.tiana,
    date: DATE,
  },
  {
    slug: "potomac",
    name: "Potomac",
    place: { "@type": "City", name: "Potomac, MD", containedInPlace: { "@type": "AdministrativeArea", name: "Montgomery County, MD" } },
    title: "Dentist Serving Potomac, MD | Ideal Dental Solutions",
    description: "Serving Potomac, MD from our McLean, VA office in Tysons, about 12 miles across the American Legion Bridge. Implants, gum care, checkups and more.",
    h1: "Dentist Serving Potomac, MD",
    subtitle: "About 12 miles across the American Legion Bridge",
    answer: `<p>We serve Potomac, Maryland from our only office, ${ADDRESS}, in Tysons, Virginia. From Potomac Village it is about 12 miles, usually 20 to 30 minutes by car across the American Legion Bridge on I-495. Call ${PHONE} or ${BOOK}.</p>`,
    sections: [
      {
        kind: "text",
        heading: "Getting Here From Potomac",
        html: `<ul>
<li>By car: take River Road (Route 190) to I-495 (Capital Beltway) and cross the American Legion Bridge into Virginia. Take exit 46 to Chain Bridge Road (Route 123) or exit 47 to Leesburg Pike (Route 7) into Tysons, then International Drive or Westpark Drive to Greensboro Drive.</li>
<li>Potomac has no Metrorail station. In Tysons, ${METRO}.</li>
</ul>
<p>${DRIVE_NOTE} Traffic on the American Legion Bridge varies a lot by time of day.</p>`,
      },
      {
        kind: "accordion",
        heading: "Potomac Landmarks We Serve",
        intro: "Potomac is an unincorporated community in Montgomery County, Maryland, just across the river from Virginia.",
        photo: photos.hojaeva,
        items: [
          { title: "Potomac Village", text: "The shops at River Road and Falls Road, the center of Potomac." },
          { title: "River Road", text: "Route 190, the main road from Potomac to the Capital Beltway." },
          { title: "Great Falls Tavern Visitor Center", text: "The C&O Canal National Historical Park visitor center on MacArthur Boulevard in Potomac." },
          { title: "Avenel", text: "The community around TPC Potomac at Avenel Farm, on Oaklyn Drive." },
          { title: "American Legion Bridge", text: "The I-495 bridge over the Potomac River between Maryland and Virginia, on the way to our office." },
        ],
        link: `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/about-us/">Meet our team</a></p>`,
      },
      {
        kind: "text",
        heading: "Local Dental Health Facts for Potomac",
        html: `<p>Potomac is an unincorporated community in Montgomery County, Maryland, with 47,018 residents in the 2020 Census.</p>
<p>Public water in Potomac comes from WSSC Water, which adds fluoride. Because of a national supply shortage, WSSC Water lowered fluoride to about 0.4 mg/L on April 7, 2026, and returned it to about 0.7 mg/L on September 16, 2026. If you have questions about fluoride for your family, ask us at your visit; we offer fluoride treatments.</p>
<p>Low-cost and public dental care in Montgomery County and Maryland:</p>
<ul>
<li>Montgomery County's ${link("https://www.montgomerycountymd.gov/department-health-human-services/about-us/public-health-services-phs/dental-health-services-home", "Dental Health Services")} help uninsured county residents with incomes up to 250% of the federal poverty level.</li>
<li>The county's ${link("https://www.montgomerycountymd.gov/department-health-human-services/about-us/public-health-services-phs/dental-health-services-home/dental-health-services-dental-services-children", "school-based dental program")}, run with Montgomery County Public Schools, offers screenings, cleanings, fluoride and sealants at select schools.</li>
<li>Maryland Medicaid dental coverage is the ${link("https://health.maryland.gov/mmcp/Pages/maryland-healthy-smiles-dental-program.aspx", "Maryland Healthy Smiles Dental Program")}.</li>
<li>The Maryland Department of Health's ${link("https://health.maryland.gov/phpa/oralhealth/Pages/Home.aspx", "Office of Oral Health")} runs sealant and fluoride varnish programs.</li>
</ul>`,
      },
      {
        kind: "text",
        heading: "Dental Care for Potomac Patients",
        html: `<ul>
<li>Replacing teeth: ${S.implants}, ${S.fullArch}, ${S.bridges} and ${S.dentures}, with Dr. Mehdi S. Adili, a prosthodontist</li>
<li>Gum care: ${S.gumDisease} and ${S.gumGraft}</li>
<li>Preventive care: ${S.checkups}, ${S.cleaning} and ${S.sealants}</li>
<li>Cosmetic care: ${S.veneers}, ${S.whitening} and ${S.invisalign}</li>
</ul>
<p>See ${S.all}.</p>
${others("potomac")}`,
      },
    ],
    faqHeading: "Frequently Asked Questions From Potomac Patients",
    faqIntro: "Quick answers for patients coming from Potomac, Maryland.",
    faqs: [
      { q: "Do you have an office in Maryland?", a: `No. Our only office is ${ADDRESS}, in Tysons, Virginia, about 12 miles from Potomac Village.` },
      { q: "How long is the drive from Potomac?", a: `Usually 20 to 30 minutes outside rush hour, by River Road and I-495 across the American Legion Bridge. Bridge traffic can add a lot of time at peak hours.` },
      { q: "Is Potomac's water fluoridated?", a: `Yes. WSSC Water adds fluoride. It lowered the level to about 0.4 mg/L from April 7 to September 16, 2026 because of a supply shortage, and it is back to about 0.7 mg/L.` },
      { q: "Can I use my dental insurance from Maryland?", a: `Plans differ on where you can be seen. Call ${PHONE} with your plan details and we will check your coverage before your visit.` },
    ],
    cta: cta("Potomac", wide.fozia),
    ogPhoto: wide.fozia2,
    date: DATE,
  },
];
