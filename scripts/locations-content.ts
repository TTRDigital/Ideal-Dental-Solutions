/**
 * Text of the location pages (built by scripts/locations.ts). Every local fact
 * has its source in docs/locations/sources.md. Rules: the only office is in
 * McLean (never "our Vienna office"), no em dashes, no promises of results.
 */

export type Faq = { q: string; a: string };

/** A light section with a heading and text, or a dark one with a team photo and an accordion. */
export type Section =
  | { kind: "text"; heading: string; html: string }
  | { kind: "accordion"; heading: string; intro: string; photo: { src: string; width: string; height: string; alt: string }; items: { title: string; text: string }[]; link: string };

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

/** The office's own town, named in the hub's areaServed. */
export const MCLEAN = { "@type": "City", name: "McLean, VA", containedInPlace: { "@type": "AdministrativeArea", name: "Fairfax County, VA" } };

export const HUB = {} as Page;
export const TOWNS: Town[] = [];
