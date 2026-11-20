/**
 * Service pages for McLean and Tysons (TTR-2492): one page per service and
 * area, built by scripts/locations.ts in the same design as the town pages.
 * Topics are the questions where ChatGPT did not name the practice (TTR
 * portal, AI rate, week of Nov 16, 2026). Every fact comes from the live site
 * (the service pages, the Patient Guides and Dr. Adili's profile) or the
 * client brain.
 *
 * Rules (same as the town pages): one office only, in McLean (Tysons); no
 * prices, offers, statistics, promised results or fixed timelines; no em
 * dashes; no patient details; the practice's own photos only.
 */
import { ADDRESS, HOURS, METRO, PHONE, type Page } from "./locations-content.ts";

export type ServicePage = Page & {
  /** URL path, e.g. /locations/tysons/invisalign/ */
  path: string;
  /** The area the page is about: "mclean" (parent /locations/mclean/) or a town slug. */
  area: "mclean" | "tysons";
  /** Short service name, used in breadcrumbs and the CMS title. */
  name: string;
  /** Photos: hero, the photo beside the accordion and the call to action band (keys of PHOTOS in scripts/locations.ts). */
  look: { hero: string; panel: string; cta: string };
};

const DATE = "2026-11-20";
const link = (href: string, label: string) => `<a href="${href}">${label}</a>`;
const BOOK = link("/appointment/", "request an appointment online");
const TEAM_LINK = `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/about-us/">Meet our team</a></p>`;
const BEFORE_AFTER = link("/before-after/", "before and after photos");

const S = {
  cosmetic: link("/services/cosmetic-dentistry/", "cosmetic dentistry"),
  whitening: link("/services/cosmetic-dentistry/teeth-whitening/", "teeth whitening"),
  bonding: link("/services/cosmetic-dentistry/dental-bonding/", "dental bonding"),
  veneers: link("/services/cosmetic-dentistry/porcelain-veneers/", "porcelain veneers"),
  invisalign: link("/services/cosmetic-dentistry/invisalign/", "Invisalign"),
  implants: link("/services/dental-implants-dentistry/", "dental implants"),
  cleaning: link("/services/preventive-dentistry/teeth-cleaning/", "teeth cleaning"),
  checkups: link("/services/preventive-dentistry/checkups-exams/", "checkups and exams"),
  bridges: link("/services/restorative-dentistry/dental-bridges/", "dental bridges"),
  fillingsMclean: link("/dental-fillings-in-mclean-va/", "dental fillings in McLean"),
  invisalignMclean: link("/locations/mclean/invisalign/", "Invisalign in McLean"),
  veneersMclean: link("/locations/mclean/porcelain-dental-veneers/", "porcelain veneers in McLean"),
  whiteningMclean: link("/locations/mclean/teeth-whitening/", "teeth whitening in McLean"),
  invisalignTime: link("/blog/how-long-does-invisalign-take/", "How long does Invisalign take?"),
  cosmeticQuestions: link("/blog/cosmetic-dentistry-questions-answered/", "Cosmetic dentistry questions, answered"),
  tysons: link("/locations/tysons/", "our Tysons page"),
  all: link("/services/", "all of our services"),
};

const cta = (heading: string, what: string) => ({
  heading,
  html: `<p>Call ${PHONE} or ${BOOK} to schedule ${what}. Our office is at ${ADDRESS}. Hours: ${HOURS}.</p>`,
  photo: "",
});

/* ---------------- batch A ---------------- */

const INVISALIGN_TYSONS: ServicePage = {
  path: "/locations/tysons/invisalign/",
  area: "tysons",
  name: "Invisalign",
  look: { hero: "room2", panel: "scanner", cta: "lobby" },
  title: "Invisalign in Tysons, VA | Ideal Dental Solutions",
  description: "Invisalign clear aligners in Tysons at 8280 Greensboro Drive, near Greensboro Metro. How aligners work, your visits, wear time and what comes after.",
  h1: "Invisalign in Tysons, VA",
  subtitle: "Clear aligners at our office near Greensboro Metro",
  answer: `<p>Ideal Dental Solutions offers Invisalign clear aligners at our only office, ${ADDRESS}, in Tysons. The aligners are custom made from smooth, clear plastic, planned with 3D imaging, and removable for eating, brushing and flossing. A consultation shows whether aligners suit your teeth. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "How Invisalign Works",
      look: "cards",
      html: `<ul>
<li>Custom aligners: each set is made from smooth, clear plastic and shaped to your teeth with 3D imaging, with no metal wires or brackets.</li>
<li>Small steps: you switch to a new set on the schedule your dentist sets, usually every one to two weeks, and each set moves your teeth a small amount.</li>
<li>Wear time: aligners work when you wear them, 20 to 22 hours a day. Take them out to eat, to drink anything other than water, and to brush and floss.</li>
<li>Retainer: after your last aligner, a retainer holds your teeth in their new position.</li>
</ul>
<p>How long treatment takes depends on how far your teeth need to move. Before you start, your dentist can show you a digital preview of the planned tooth movement. Read our guide: ${S.invisalignTime}</p>`,
    },
    {
      kind: "accordion",
      heading: "Your Invisalign Visits",
      intro: "What happens at our office, from the first visit to your retainer.",
      photo: { src: "", width: "", height: "", alt: "" },
      items: [
        { title: "Consultation", text: "Our team examines your teeth, takes 3D images and talks with you about what you want to change, to see whether Invisalign is the right fit." },
        { title: "Treatment plan", text: "We plan your tooth movement digitally, so you can see the planned steps and the expected end position before you decide." },
        { title: "Your first aligners", text: "You receive your first sets and learn how to wear, clean and store them. Small tooth-colored bumps called attachments may be bonded to some teeth to help the aligners grip." },
        { title: "Check-ins", text: "Regular visits let your dentist confirm your teeth are moving as planned. If some teeth need more time, a few extra aligners can be made near the end." },
        { title: "Retainer", text: "Once your teeth are where they should be, a retainer keeps them there. Your dentist tells you how often to wear it." },
      ],
      link: TEAM_LINK,
    },
    {
      kind: "text",
      heading: "Caring for Your Aligners",
      look: "cards",
      html: `<ul>
<li>Cleaning: clean your aligners every day with a soft toothbrush and mild clear soap, or the cleaning kit you are given.</li>
<li>Eating and drinking: take the aligners out to eat or to drink anything other than water, so they stay clear and are not damaged.</li>
<li>Storing: keep them in their case when they are out. A napkin is the easiest way to lose them.</li>
<li>Comfort: mild pressure for a day or two after switching to a new set is normal and usually passes as your teeth settle.</li>
</ul>`,
    },
    {
      kind: "text",
      heading: "Other Care Tysons Patients Ask About",
      html: `<p>Other services patients often ask about along with Invisalign:</p>
<ul>
<li>${S.whitening}, in the office or at home</li>
<li>${S.bonding} to repair a small chip or reshape a worn edge</li>
<li>${S.veneers} to change the shape or color of several teeth</li>
<li>${S.cleaning} and ${S.checkups}, to start treatment with healthy teeth and gums</li>
</ul>
<p>More: our ${link("/services/cosmetic-dentistry/invisalign/", "Invisalign page")}, ${S.invisalignMclean}, ${link("/locations/tysons/cosmetic-dentistry/", "cosmetic dentistry in Tysons")} and ${S.tysons}.</p>`,
    },
  ],
  faqHeading: "Invisalign Questions From Tysons Patients",
  faqIntro: "Quick answers before your consultation.",
  faqs: [
    { q: "Where is your office in Tysons?", a: `At ${ADDRESS}. The address is in McLean and the building is in Tysons. ${METRO}. It is our only office.` },
    { q: "Am I a good candidate for Invisalign?", a: `Aligners can straighten many crooked, crowded or gapped teeth. Some larger bite corrections are better suited to other treatment. An exam and 3D images at your consultation answer the question for your teeth.` },
    { q: "How many hours a day do I wear the aligners?", a: `20 to 22 hours a day. Take them out only to eat, to drink anything other than water, and to brush and floss.` },
    { q: "Does Invisalign hurt?", a: `Many people feel mild pressure for a day or two after switching to a new set of aligners. The smooth plastic is gentle on the cheeks and lips.` },
    { q: "How long does treatment take?", a: `It depends on how far your teeth need to move. Your dentist gives you an estimate for your case after your consultation and 3D imaging. Our guide ${S.invisalignTime} explains what affects it.` },
    { q: "Do I need a retainer afterward?", a: `Yes. Without one, teeth tend to drift back. Your dentist tells you how often to wear it.` },
  ],
  cta: cta("Book Your Invisalign Consultation in Tysons", "an Invisalign consultation"),
  ogPhoto: "",
  date: DATE,
};

const COSMETIC_MCLEAN: ServicePage = {
  path: "/locations/mclean/cosmetic-dentistry/",
  area: "mclean",
  name: "Cosmetic Dentistry",
  look: { hero: "lab", panel: "team", cta: "room2" },
  title: "Cosmetic Dentistry in McLean, VA | Ideal Dental Solutions",
  description: "Cosmetic dentistry in McLean, VA: teeth whitening, dental bonding, porcelain veneers, Invisalign and smile makeovers at 8280 Greensboro Drive.",
  h1: "Cosmetic Dentistry in McLean, VA",
  subtitle: "Whitening, bonding, veneers and Invisalign on Greensboro Drive",
  answer: `<p>At our McLean office, ${ADDRESS}, cosmetic care includes professional teeth whitening, dental bonding, porcelain veneers, Invisalign clear aligners and tooth-colored crowns, on their own or combined in a smile makeover. Every plan starts with an exam and a conversation about what you want to change. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "Cosmetic Treatments at Our McLean Office",
      look: "cards",
      html: `<ul>
<li>${S.whitening}: professional whitening in the office or with a take-home kit, for teeth that look stained or dull.</li>
<li>${S.bonding}: tooth-colored resin that repairs a chip, crack or worn edge, often in one visit with little to no enamel removed.</li>
<li>${S.veneers}: thin, custom porcelain shells over the front of the teeth that cover chips, cracks, discoloration and gaps.</li>
<li>${S.invisalign}: clear, removable aligners that gradually move teeth into place without braces.</li>
<li>Smile makeovers: two or more of these treatments, planned together around your goals.</li>
</ul>
<p>See our ${BEFORE_AFTER} of real patients' smiles.</p>`,
    },
    {
      kind: "accordion",
      heading: "How We Plan Your Smile",
      intro: "Cosmetic care at Ideal Dental Solutions is planned around your teeth, your gums and what you want to change.",
      photo: { src: "", width: "", height: "", alt: "" },
      items: [
        { title: "Smile consultation", text: "We examine your teeth and gums, listen to what you would like to change, and go through the options with you." },
        { title: "Your plan", text: "We design a plan around your goals, your facial features and the health of your teeth, and explain each step before anything starts." },
        { title: "Treatment", text: "We use local anesthesia when it is needed. Whitening and bonding usually need none." },
        { title: "Technology", text: "Digital X-rays, intraoral scanners and CAD/CAM design help us plan restorations precisely and match them to your teeth." },
        { title: "Aftercare", text: "You get clear care instructions and follow-up visits to keep your results looking their best." },
      ],
      link: TEAM_LINK,
    },
    {
      kind: "text",
      heading: "Which Treatment Fits What You Want to Change?",
      html: `<p>A quick guide to which of our services patients usually ask about for each concern. Your exam decides what suits your teeth.</p>
<ul>
<li>Teeth that look yellow or dull: ${S.whitening}.</li>
<li>One small chip, crack or worn edge: ${S.bonding}.</li>
<li>Shape, color and small gaps across several front teeth: ${S.veneers}.</li>
<li>Crooked, crowded or gapped teeth: ${S.invisalign}.</li>
<li>A missing tooth: ${S.implants} or ${S.bridges}.</li>
</ul>
<p>More: ${S.veneersMclean}, ${S.whiteningMclean}, ${S.invisalignMclean}, ${link("/locations/mclean/dental-bonding/", "dental bonding in McLean")} and our guide ${S.cosmeticQuestions}.</p>`,
    },
  ],
  faqHeading: "Cosmetic Dentistry Questions From McLean Patients",
  faqIntro: "Quick answers before your smile consultation.",
  faqs: [
    { q: "What cosmetic treatments do you offer in McLean?", a: `Professional teeth whitening, dental bonding, porcelain veneers, Invisalign clear aligners, tooth-colored crowns and smile makeovers that combine them. See ${S.cosmetic}.` },
    { q: "How do I know which treatment is right for me?", a: `Start with a consultation. We examine your teeth and gums, ask what you want to change, and explain the options that fit.` },
    { q: "Are cosmetic treatments painful?", a: `Most are comfortable. We use local anesthesia when it is needed, and treatments such as whitening and bonding usually need none.` },
    { q: "Who does cosmetic work at your office?", a: `Our dentists, led by Dr. Mehdi S. Adili, DDS, our principal dentist. He earned his DDS at Georgetown University and is a prosthodontist. See ${link("/about-us/", "our team")}.` },
    { q: "Can I see results from your patients?", a: `Yes. Our ${BEFORE_AFTER} show real patients of our practice.` },
  ],
  cta: cta("Book a Smile Consultation in McLean", "a smile consultation"),
  ogPhoto: "",
  date: DATE,
};

const COSMETIC_TYSONS: ServicePage = {
  path: "/locations/tysons/cosmetic-dentistry/",
  area: "tysons",
  name: "Cosmetic Dentistry",
  look: { hero: "hall3", panel: "room", cta: "team" },
  title: "Cosmetic Dentist in Tysons, VA | Ideal Dental Solutions",
  description: "Cosmetic dentistry in Tysons near Greensboro Metro: whitening, bonding, veneers and Invisalign, planned around your goals at 8280 Greensboro Drive.",
  h1: "Cosmetic Dentistry in Tysons, VA",
  subtitle: "A short walk from Greensboro station on the Silver Line",
  answer: `<p>Our office at ${ADDRESS} is in Tysons, and it is where we provide all of our cosmetic care: teeth whitening, dental bonding, porcelain veneers and Invisalign clear aligners. ${METRO}. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "Cosmetic Care That Fits a Tysons Schedule",
      look: "cards",
      html: `<ul>
<li>Dental bonding: a chip, crack or worn edge can often be repaired in one visit.</li>
<li>Teeth whitening: in the office, or with a take-home kit you use on your own time.</li>
<li>Invisalign: removable aligners you take out to eat, brush and floss, with check-ins at our office.</li>
<li>Porcelain veneers: custom shells that change the shape and color of several teeth, planned over a few visits.</li>
</ul>
<p>Our hours are ${HOURS}. Call us to find a time that fits your day.</p>`,
    },
    {
      kind: "accordion",
      heading: "Your First Cosmetic Visit",
      intro: "What to expect when you come in to talk about your smile.",
      photo: { src: "", width: "", height: "", alt: "" },
      items: [
        { title: "Tell us your goals", text: "Whiter teeth, a repaired chip, straighter teeth or a bigger change: we start with what you would like to see." },
        { title: "Exam", text: "We look at your teeth and gums, because healthy teeth and gums come first for any cosmetic plan." },
        { title: "Options", text: "We explain the treatments that fit, how each one works and what it involves, with no pressure to decide that day." },
        { title: "Planning", text: "Digital X-rays and intraoral scans help us plan your treatment and match restorations to your natural teeth." },
      ],
      link: TEAM_LINK,
    },
    {
      kind: "text",
      heading: "Cosmetic Services Tysons Patients Ask About",
      html: `<p>Each of these services has its own page with the details:</p>
<ul>
<li>${link("/locations/tysons/invisalign/", "Invisalign in Tysons")}</li>
<li>${S.whitening}</li>
<li>${S.bonding}</li>
<li>${S.veneers}</li>
</ul>
<p>See also ${link("/locations/mclean/cosmetic-dentistry/", "cosmetic dentistry in McLean")}, our ${BEFORE_AFTER} and ${S.tysons}.</p>`,
    },
  ],
  faqHeading: "Cosmetic Dentistry Questions From Tysons Patients",
  faqIntro: "Quick answers for people who live or work in Tysons.",
  faqs: [
    { q: "Is your office in Tysons?", a: `Yes. ${ADDRESS} has a McLean mailing address, and the building is in Tysons, Fairfax County. It is our only office.` },
    { q: "How do I get there by Metro?", a: `Take the Silver Line to Greensboro station. The office is about an 8 minute walk from there.` },
    { q: "Which cosmetic treatment can be done in one visit?", a: `Dental bonding is often completed in a single visit. Your exam shows whether it suits your tooth.` },
    { q: "Should I whiten my teeth before other cosmetic work?", a: `Ask us at your consultation. If you plan bonding or veneers, we talk about tooth color early so the new work can be matched to your teeth.` },
    { q: "Can I see examples of your work?", a: `Yes. Our ${BEFORE_AFTER} show real patients of our practice.` },
  ],
  cta: cta("Book a Cosmetic Consultation in Tysons", "a cosmetic consultation"),
  ogPhoto: "",
  date: DATE,
};

const BONDING_MCLEAN: ServicePage = {
  path: "/locations/mclean/dental-bonding/",
  area: "mclean",
  name: "Dental Bonding",
  look: { hero: "scanner", panel: "hall2", cta: "interior" },
  title: "Dental Bonding in McLean, VA | Ideal Dental Solutions",
  description: "Dental bonding in McLean, VA: tooth-colored resin that repairs chips, cracks, worn edges and small gaps, often in one visit. 8280 Greensboro Drive.",
  h1: "Dental Bonding in McLean, VA",
  subtitle: "Repair chips, cracks and small gaps with tooth-colored resin",
  answer: `<p>Dental bonding repairs chipped, cracked, worn or discolored teeth with a tooth-colored composite resin matched to your natural teeth. It is often done in a single visit, with little to no enamel removed. We provide it at our McLean office, ${ADDRESS}. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "What Dental Bonding Can Fix",
      look: "cards",
      html: `<ul>
<li>Chips and cracks: the resin restores the tooth's shape.</li>
<li>Worn edges: uneven or worn edges can be built back up and smoothed.</li>
<li>Discoloration: a stained spot on a tooth can be covered.</li>
<li>Small gaps: bonding can close a small gap between teeth without braces or aligners.</li>
</ul>`,
    },
    {
      kind: "accordion",
      heading: "Your Bonding Visit, Step by Step",
      intro: "Bonding is usually quick and comfortable. Here is what happens.",
      photo: { src: "", width: "", height: "", alt: "" },
      items: [
        { title: "Exam", text: "We check the tooth to make sure bonding is the right repair. A tooth with a large break or decay may need a different treatment." },
        { title: "Shade matching", text: "We choose a resin shade that blends with the teeth around it." },
        { title: "Shaping", text: "The resin is applied and shaped to the tooth. Bonding usually needs no anesthesia." },
        { title: "Curing and polishing", text: "A special curing light hardens the resin, then the tooth is polished to match the texture and shine of your natural teeth." },
        { title: "Care at home", text: "Brush twice a day, floss, avoid biting hard objects and keep up with checkups to help your bonding last." },
      ],
      link: TEAM_LINK,
    },
    {
      kind: "text",
      heading: "Bonding or Another Treatment?",
      html: `<p>Bonding suits small repairs. For other goals, patients ask about these services:</p>
<ul>
<li>${S.veneers} for larger changes to the shape and color of several teeth</li>
<li>${S.whitening} to brighten natural teeth</li>
<li>${S.invisalign} for crooked or crowded teeth</li>
<li>${S.fillingsMclean} for a tooth with a cavity</li>
</ul>
<p>More: ${link("/locations/mclean/cosmetic-dentistry/", "cosmetic dentistry in McLean")} and our ${link("/services/cosmetic-dentistry/dental-bonding/", "dental bonding page")}.</p>`,
    },
  ],
  faqHeading: "Dental Bonding Questions From McLean Patients",
  faqIntro: "Quick answers before your visit.",
  faqs: [
    { q: "How long does dental bonding last?", a: `With good care, bonding typically lasts several years before it needs a touch-up. Brushing, flossing, not biting hard objects and regular checkups help.` },
    { q: "Does dental bonding hurt?", a: `Most patients feel little or nothing. Bonding removes little to no enamel and usually needs no anesthesia.` },
    { q: "How long does the appointment take?", a: `Bonding is often completed in a single visit. We tell you what to expect for your tooth at your exam.` },
    { q: "Can bonding close a gap between my teeth?", a: `Often, if the gap is small. For larger gaps or crowding, we can talk about ${S.veneers} or ${S.invisalign}.` },
    { q: "Where is your office?", a: `At ${ADDRESS}, in Tysons. ${METRO}. It is our only office.` },
  ],
  cta: cta("Book Dental Bonding in McLean", "a bonding visit"),
  ogPhoto: "",
  date: DATE,
};

/** In build order. Batch A (TTR-2492, first four). */
export const SERVICE_PAGES: ServicePage[] = [INVISALIGN_TYSONS, COSMETIC_MCLEAN, COSMETIC_TYSONS, BONDING_MCLEAN];
