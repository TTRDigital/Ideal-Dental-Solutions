# Ideal Dental: thin pages and page merges (for Kia)

Prepared by Rhys for TTR-900, Oct 26, 2026. Nothing below has been built. Each item needs Kia's yes or no; items marked "from the practice" need text or photos from the client.

## 1. Pages with too little text

Google treats pages under about 300 words as thin. Three pages are:

| Page | Words now | What it needs (from the practice) |
|---|---|---|
| /appointment/ | 61 | A short "Your first visit" section: what happens at the first appointment, how long it takes, what to bring (ID, insurance card, medication list), insurance and payment options they accept, parking at 8280 Greensboro Drive, and the office hours. About 250 to 350 words. |
| /before-after/ | 62 | One line per case: the treatment done (for example "porcelain veneers on 8 upper teeth") and, if they like, how long it took. Plus a short intro on their approach. The patients' consent to show the photos should be on file. |
| /dr-mehdi-adili/ | 116 | A fuller bio: years in practice, what he treats most (implants, crowns, bridges, dentures, full-mouth restoration), memberships (for example the American College of Prosthodontists), a sentence on how he works with patients, and a professional photo. |

## 2. Pages that compete with each other in Google

From Search Console (Jul 26 to Oct 25, 2026). The full list is in `docs/ttr-900/competing-searches.md`. Small fixes (titles, links, a canonical) are already live or waiting for the CMS update. These need a decision:

| Pages | What happens now | Proposal |
|---|---|---|
| /locations/mclean/single-tooth-implants/ and /locations/mclean/dental-implant-dentistry/ | 19 searches such as "dental implants mclean va" show both. The single-tooth page wins most, the main implants page ranks lower. | Keep both, but make /locations/mclean/dental-implant-dentistry/ the main McLean implants page: it links to single-tooth and full-arch, and the single-tooth page focuses on single teeth only. Needs a few sentences of new text on each. Or merge the two into one page (we redirect the other). |
| /preventive-dentistry-in-northern-virginia/ and /services/preventive-dentistry/ | Same title and heading, about half the same text. We already told Google the services page is the main one (canonical). | Merge: move anything unique into /services/preventive-dentistry/ and redirect the other address there. |
| /locations/mclean/gum-graft-surgery/ and /services/periodontic-dentistry/gum-graft-surgery/ | 16 searches such as "gum grafting fairfax va" show both, both rank low. Same office, very similar text. | Keep both (one for McLean searches, one for Northern Virginia) but rewrite one so they are clearly different, or merge them. Same question applies to the other McLean / Northern VA pairs (fillings, bridges, root canal, TMJ and others): one page per treatment would be simpler to keep strong. |
| /locations/ (blank page) | Still gets searches for "ideal dental solutions" and competes with the home page, although it is empty and hidden from Google. | Redirect /locations/ to the home page. The pages below it keep working. |
| /locations/mclean/ (blank page) | Empty, hidden from Google. | Either a real "Dentist in McLean, VA" page (address, map, hours, parking, services, team), which would be the natural home for McLean searches, or a redirect to the home page. |
| /about-us-client-draft-2/ and /dental-fillings-in-mclean-va-2/ | Leftover draft and duplicate, hidden from Google. | Remove both and redirect them to /about-us/ and /dental-fillings-in-mclean-va/. |

## 3. Other open items

- The home page hero is a YouTube video with white text on top. On phones the text is white on white until the video starts, and the video adds about 1 MB. Proposal (design choice, not built): show a still frame from their own video with a play button, and only load the video when tapped.
- There is no privacy policy or terms page any more (Google still shows the old addresses; they forward to the home page for now). A dental practice should have both; the practice or their compliance provider would need to supply the text.
- The /services/ page's top text only talks about preventive dentistry. Proposal: one or two sentences covering all their services.
