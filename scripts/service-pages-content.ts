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
    { q: "How do I look after dental bonding?", a: `Brushing, flossing, not biting hard objects and regular checkups help your bonding last.` },
    { q: "Does dental bonding hurt?", a: `Most patients feel little or nothing. Bonding removes little to no enamel and usually needs no anesthesia.` },
    { q: "How long does the appointment take?", a: `Bonding is often completed in a single visit. We tell you what to expect for your tooth at your exam.` },
    { q: "Can bonding close a gap between my teeth?", a: `Often, if the gap is small. For larger gaps or crowding, we can talk about ${S.veneers} or ${S.invisalign}.` },
    { q: "Where is your office?", a: `At ${ADDRESS}, in Tysons. ${METRO}. It is our only office.` },
  ],
  cta: cta("Book Dental Bonding in McLean", "a bonding visit"),
  ogPhoto: "",
  date: DATE,
};

/* ---------------- batch B ---------------- */

const ADILI = link("/dr-mehdi-adili/", "Dr. Mehdi S. Adili, DDS");

const PROSTHODONTIST_MCLEAN: ServicePage = {
  path: "/locations/mclean/prosthodontist/",
  area: "mclean",
  name: "Prosthodontist",
  look: { hero: "exterior", panel: "lab", cta: "hall" },
  title: "Prosthodontist in McLean, VA | Ideal Dental Solutions",
  description: "Dr. Mehdi S. Adili, DDS, a prosthodontist in McLean, VA: dentures, dental bridges, crowns and implant restorations at 8280 Greensboro Drive.",
  h1: "Prosthodontist in McLean, VA",
  subtitle: "Dentures, bridges and crowns with Dr. Mehdi S. Adili, DDS",
  answer: `<p>Yes, there is a prosthodontist in McLean: ${ADILI}, our principal dentist at Ideal Dental Solutions, ${ADDRESS}. A prosthodontist is a dentist with extra specialty training in replacing missing teeth with crowns, bridges, implants and dentures. Dr. Adili earned his DDS at Georgetown University and completed his specialty training in prosthodontics at Virginia Commonwealth University. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "What Dr. Adili Focuses On",
      look: "cards",
      html: `<ul>
<li>${S.bridges}: fixed replacement teeth that fill a gap, held by the teeth or implants beside it.</li>
<li>${link("/services/restorative-dentistry/dentures/", "Dentures")}: full or partial dentures, implant-supported dentures, immediate dentures and denture repair.</li>
<li>Crowns: porcelain or zirconia caps that restore the strength and look of a damaged tooth. See ${link("/locations/mclean/dental-crowns/", "dental crowns in McLean")}.</li>
<li>${S.implants}: the crown, bridge or denture that sits on an implant, planned with 3D imaging.</li>
<li>Full-mouth restoration: a plan that rebuilds many teeth at once.</li>
</ul>
<p>Dr. Adili speaks English and Farsi.</p>`,
    },
    {
      kind: "accordion",
      heading: "Dentures and Bridges, Explained",
      intro: "The main ways to replace missing teeth that Dr. Adili talks through with patients.",
      photo: { src: "", width: "", height: "", alt: "" },
      items: [
        { title: "Traditional bridge", text: "One or more replacement teeth held by crowns on the natural teeth on both sides of the gap. It usually takes two visits a few weeks apart." },
        { title: "Cantilever and Maryland bridges", text: "A cantilever bridge is held on one side only. A Maryland bridge is bonded to the backs of the neighboring teeth instead of crowning them." },
        { title: "Implant-supported bridge", text: "A bridge held by implants instead of natural teeth, often used when several teeth in a row are missing." },
        { title: "Full and partial dentures", text: "A full denture replaces all the teeth in an arch. A partial denture fills gaps when you still have some healthy natural teeth." },
        { title: "Implant-supported and immediate dentures", text: "Implant-supported dentures attach to implants for more stability. Immediate dentures are placed the same day teeth are removed." },
      ],
      link: `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/dr-mehdi-adili/">About Dr. Adili</a></p>`,
    },
    {
      kind: "text",
      heading: "Guides and Related Services",
      html: `<p>Our Patient Guides and services pages for people weighing their options:</p>
<ul>
<li>${link("/blog/dental-implant-vs-bridge/", "Dental implant or bridge? How to choose")}</li>
<li>${link("/blog/full-arch-implants-vs-dentures/", "Full-arch implants vs. dentures")}</li>
<li>${link("/dental-bridges-in-mclean-va/", "Dental bridges in McLean")}</li>
<li>${link("/locations/mclean/full-arch-implants/", "Full arch implants in McLean")}</li>
</ul>
<p>See ${S.all}.</p>`,
    },
  ],
  faqHeading: "Questions About Seeing a Prosthodontist in McLean",
  faqIntro: "Quick answers about dentures, bridges and Dr. Adili.",
  faqs: [
    { q: "Is there a prosthodontist in McLean, VA for dentures or bridges?", a: `Yes. ${ADILI}, a prosthodontist, sees patients at Ideal Dental Solutions, ${ADDRESS}.` },
    { q: "What is a prosthodontist?", a: `A dentist with extra specialty training in replacing missing teeth with crowns, bridges, implants and dentures. Dr. Adili completed his prosthodontics training at Virginia Commonwealth University.` },
    { q: "Should I get a bridge, dentures or an implant?", a: `It depends on how many teeth are missing, the health of the teeth and gums around them and the bone in your jaw. An exam and imaging show which options fit. Our guide ${link("/blog/dental-implant-vs-bridge/", "Dental implant or bridge?")} explains the trade-offs.` },
    { q: "What types of dentures do you offer?", a: `Full dentures, partial dentures, implant-supported dentures, immediate dentures, and denture repair.` },
    { q: "Do I need a referral to see Dr. Adili?", a: `Call ${PHONE} and our team will help you book a consultation.` },
  ],
  cta: cta("Book a Consultation With Dr. Adili", "a consultation with Dr. Adili"),
  ogPhoto: "",
  date: DATE,
};

const VENEERS_TYSONS: ServicePage = {
  path: "/locations/tysons/porcelain-veneers/",
  area: "tysons",
  name: "Porcelain Veneers",
  look: { hero: "lobby", panel: "lab", cta: "room" },
  title: "Porcelain Veneers in Tysons, VA | Ideal Dental Solutions",
  description: "Porcelain veneers in Tysons at 8280 Greensboro Drive: thin, custom ceramic shells for chips, stains, gaps and worn edges. What to expect and how to care for them.",
  h1: "Porcelain Veneers in Tysons, VA",
  subtitle: "Custom porcelain shells, planned at our office near Greensboro Metro",
  answer: `<p>Porcelain veneers are thin, custom ceramic shells bonded to the front of the teeth to change their shape and color and cover chips, cracks, stains, gaps and worn edges. We provide them at our only office, ${ADDRESS}, in Tysons. ${METRO}. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "What Porcelain Veneers Can Change",
      look: "cards",
      html: `<ul>
<li>Color: teeth that stay stained or discolored can be covered with a shade you choose with your dentist.</li>
<li>Chips and worn edges: veneers restore the shape and length of front teeth.</li>
<li>Gaps and minor misalignment: veneers can close small gaps and even out how the front teeth line up.</li>
<li>Shape and size: each veneer is designed to suit your smile and facial features.</li>
</ul>`,
    },
    {
      kind: "accordion",
      heading: "Your Veneer Visits",
      intro: "Veneers are planned over a few visits. Here is how it goes.",
      photo: { src: "", width: "", height: "", alt: "" },
      items: [
        { title: "Consultation and planning", text: "We examine your teeth and gums, talk through your goals and use imaging to plan the shape and shade of your veneers." },
        { title: "Preparing the teeth", text: "A thin layer of enamel is removed from the front of each tooth and impressions or digital scans are taken. We use local anesthesia when it is needed." },
        { title: "Making the veneers", text: "Your veneers are made to your plan, matched to the shade and shape you chose." },
        { title: "Bonding", text: "The veneers are bonded to your teeth and checked for fit and bite." },
        { title: "Care", text: "Brush, floss and keep up with checkups as you would for natural teeth. Porcelain resists stains from coffee, tea and wine." },
      ],
      link: TEAM_LINK,
    },
    {
      kind: "text",
      heading: "Other Cosmetic Services Tysons Patients Compare",
      html: `<p>Other services patients often compare with veneers:</p>
<ul>
<li>${S.bonding} for a single small chip, often in one visit</li>
<li>${S.whitening} to brighten natural teeth</li>
<li>${link("/locations/tysons/invisalign/", "Invisalign in Tysons")} to straighten teeth</li>
</ul>
<p>More: ${S.veneersMclean}, ${link("/locations/tysons/cosmetic-dentistry/", "cosmetic dentistry in Tysons")}, our ${BEFORE_AFTER} and ${S.tysons}.</p>`,
    },
  ],
  faqHeading: "Porcelain Veneer Questions From Tysons Patients",
  faqIntro: "Quick answers before your consultation.",
  faqs: [
    { q: "Where can I get porcelain veneers in Tysons?", a: `At Ideal Dental Solutions, ${ADDRESS}. The building is in Tysons, about an 8 minute walk from Greensboro station. It is our only office.` },
    { q: "Do veneers hurt?", a: `Most patients feel little discomfort. Only a thin layer of enamel is removed, and we use local anesthesia when it is needed.` },
    { q: "Will my veneers look natural?", a: `Each veneer is designed for the shape, size and shade you choose with your dentist, and porcelain reflects light much like natural enamel.` },
    { q: "Veneers or bonding?", a: `Bonding suits a small repair on one tooth. Veneers suit larger changes to the shape and color of several teeth. Your exam shows which fits.` },
    { q: "How do I care for veneers?", a: `Brush twice a day, floss and keep up with regular checkups, just as for natural teeth.` },
  ],
  cta: cta("Book a Veneer Consultation in Tysons", "a veneer consultation"),
  ogPhoto: "",
  date: DATE,
};

const IMPLANTS_TYSONS: ServicePage = {
  path: "/locations/tysons/single-tooth-implants/",
  area: "tysons",
  name: "Single Tooth Implants",
  look: { hero: "team", panel: "scanner", cta: "hall2" },
  title: "Single Tooth Implants in Tysons, VA | Ideal Dental Solutions",
  description: "Single tooth implants in Tysons at 8280 Greensboro Drive: planned with 3D imaging and guided placement, restored by a prosthodontist. How it works.",
  h1: "Single Tooth Implants in Tysons, VA",
  subtitle: "Planned with 3D imaging, restored by a prosthodontist",
  answer: `<p>A single tooth implant replaces one missing tooth with a titanium post in the jawbone, a connector called an abutment and a custom crown. At our only office, ${ADDRESS}, in Tysons, implants are planned with 3D imaging and computer-guided placement, and ${ADILI}, a prosthodontist, plans and restores them. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "How a Single Tooth Implant Works",
      look: "cards",
      html: `<ul>
<li>The post: a titanium post is placed in the jawbone where the root used to be. Over the following months the bone grows around it.</li>
<li>The abutment: a small connector that joins the post to the new tooth.</li>
<li>The crown: a custom porcelain crown, shade-matched to your teeth from digital scans.</li>
<li>Neighbors left alone: unlike a bridge, an implant does not need the teeth beside the gap to be reshaped.</li>
</ul>`,
    },
    {
      kind: "accordion",
      heading: "Your Implant Treatment, Step by Step",
      intro: "What happens at our office from the first visit to the final crown.",
      photo: { src: "", width: "", height: "", alt: "" },
      items: [
        { title: "Consultation and 3D imaging", text: "An exam, digital X-rays and 3D imaging show the bone and gums so the implant can be planned precisely." },
        { title: "Bone and gum health", text: "Healthy gums and enough bone are needed. If the bone has thinned, a bone graft may be done first." },
        { title: "Placement", text: "The post is placed under local anesthesia, with computer-guided planning for its position." },
        { title: "Healing", text: "The bone grows around the post over a healing period of a few months. Your dentist tells you what to expect for your case." },
        { title: "Your crown", text: "A custom crown is attached to the abutment, then regular checkups follow." },
      ],
      link: TEAM_LINK,
    },
    {
      kind: "text",
      heading: "Implant Guides and Related Services",
      html: `<p>Our Patient Guides and services pages for people missing a tooth:</p>
<ul>
<li>${link("/blog/dental-implant-vs-bridge/", "Dental implant or bridge? How to choose")}</li>
<li>${link("/blog/care-for-your-dental-implants/", "How to care for your dental implants")}</li>
<li>${link("/services/dental-implants-dentistry/single-tooth-implants/", "Single tooth implants")} and ${link("/locations/mclean/single-tooth-implants/", "single tooth implants in McLean")}</li>
<li>${link("/locations/mclean/prosthodontist/", "Prosthodontist in McLean")}</li>
</ul>
<p>See also ${S.tysons}.</p>`,
    },
  ],
  faqHeading: "Implant Questions From Tysons Patients",
  faqIntro: "Quick answers before your consultation.",
  faqs: [
    { q: "Where can I get a single tooth implant in Tysons?", a: `At Ideal Dental Solutions, ${ADDRESS}, in Tysons. It is our only office. ${METRO}.` },
    { q: "Who plans and restores the implant?", a: `${ADILI}, a prosthodontist. He earned his DDS at Georgetown University and trained in prosthodontics at Virginia Commonwealth University.` },
    { q: "Am I a candidate for an implant?", a: `You need healthy gums and enough bone to hold the post. A bone graft can often build bone back up. Your exam and 3D imaging answer the question for you.` },
    { q: "Does getting an implant hurt?", a: `The area is numbed with local anesthesia. Your dentist will explain what to expect after the visit.` },
    { q: "How long does the process take?", a: `Usually a few months, mostly so the bone can heal around the post. A bone graft adds time. We give you a plan for your case after your consultation.` },
  ],
  cta: cta("Book an Implant Consultation in Tysons", "an implant consultation"),
  ogPhoto: "",
  date: DATE,
};

const CROWNS_MCLEAN: ServicePage = {
  path: "/locations/mclean/dental-crowns/",
  area: "mclean",
  name: "Dental Crowns",
  look: { hero: "room", panel: "lab", cta: "hall3" },
  title: "Dental Crowns in McLean, VA | Ideal Dental Solutions",
  description: "Dental crowns in McLean, VA: porcelain or zirconia crowns for damaged teeth, after a root canal and on implants, designed with CAD/CAM. 8280 Greensboro Drive.",
  h1: "Dental Crowns in McLean, VA",
  subtitle: "Porcelain and zirconia crowns, designed in our office",
  answer: `<p>A dental crown covers a damaged tooth to restore its strength and appearance. At our McLean office, ${ADDRESS}, crowns are made from porcelain or zirconia, and with CAD/CAM technology Dr. Adili can design and create custom crowns in our office. Dr. Adili is a prosthodontist, and crowns are one of his areas of focus. Call ${PHONE} or ${BOOK}.</p>`,
  sections: [
    {
      kind: "text",
      heading: "When a Crown Can Help",
      look: "cards",
      html: `<ul>
<li>A damaged tooth: a crown restores the strength and look of a tooth weakened by a break or a large repair.</li>
<li>After a root canal: a crown often covers and protects the tooth, especially a back tooth.</li>
<li>On an implant: a custom crown is the visible tooth on top of a ${link("/services/dental-implants-dentistry/single-tooth-implants/", "single tooth implant")}.</li>
<li>Holding a bridge: crowns on the teeth beside a gap hold a traditional ${link("/dental-bridges-in-mclean-va/", "dental bridge")}.</li>
<li>Appearance: tooth-colored crowns are part of our ${link("/locations/mclean/cosmetic-dentistry/", "cosmetic dentistry in McLean")}.</li>
</ul>`,
    },
    {
      kind: "accordion",
      heading: "Getting a Crown at Our Office",
      intro: "What to expect, from the exam to your new crown.",
      photo: { src: "", width: "", height: "", alt: "" },
      items: [
        { title: "Exam", text: "We check the tooth and take digital X-rays to see whether a crown is the right repair, or whether a filling or another treatment fits better." },
        { title: "Preparing the tooth", text: "The tooth is shaped so the crown can fit over it." },
        { title: "Digital scan", text: "An intraoral scanner records the tooth instead of a traditional impression." },
        { title: "Design", text: "With CAD/CAM technology, the crown is designed and made to fit your tooth and match the shade of your other teeth." },
        { title: "Fitting and care", text: "The crown is checked for fit and bite and placed. Brush, floss and keep up with checkups to look after it." },
      ],
      link: `<p style="color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: underline;"><a href="/dr-mehdi-adili/">About Dr. Adili</a></p>`,
    },
    {
      kind: "text",
      heading: "Related Services and Guides",
      html: `<p>Other services and guides patients read about crowns:</p>
<ul>
<li>${link("/locations/mclean/root-canal-therapy/", "Root canal therapy in McLean")} and our guide ${link("/blog/what-to-expect-root-canal/", "What to expect from a root canal")}</li>
<li>${S.fillingsMclean}</li>
<li>${link("/locations/mclean/prosthodontist/", "Prosthodontist in McLean")}</li>
<li>${link("/locations/mclean/restorative-dentistry/", "Restorative dentistry in McLean")}</li>
</ul>`,
    },
  ],
  faqHeading: "Dental Crown Questions From McLean Patients",
  faqIntro: "Quick answers before your visit.",
  faqs: [
    { q: "What are your crowns made of?", a: `Porcelain or zirconia. Your dentist recommends the material for your tooth.` },
    { q: "Do I need a crown after a root canal?", a: `Often, especially for a back tooth, because the tooth may have lost a lot of structure. Some front teeth only need a filling. Your dentist tells you which applies.` },
    { q: "How do I care for a crown?", a: `Brush twice a day, floss and keep up with regular checkups and cleanings.` },
    { q: "Can you make crowns in your office?", a: `Yes. With CAD/CAM technology, Dr. Adili can design and create custom crowns in our office.` },
    { q: "Where is your office?", a: `At ${ADDRESS}, in Tysons. ${METRO}. It is our only office.` },
  ],
  cta: cta("Book a Crown Consultation in McLean", "a visit"),
  ogPhoto: "",
  date: DATE,
};

/** In build order. Batch A (TTR-2492, first four), then batch B. */
export const SERVICE_PAGES: ServicePage[] = [INVISALIGN_TYSONS, COSMETIC_MCLEAN, COSMETIC_TYSONS, BONDING_MCLEAN, PROSTHODONTIST_MCLEAN, VENEERS_TYSONS, IMPLANTS_TYSONS, CROWNS_MCLEAN];
