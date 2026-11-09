import { getSite, pageSummaries, REVALIDATE_SECONDS } from "@/lib/site/data";

/**
 * /llms.txt (llmstxt.org): what the practice is and its main pages, for AI
 * assistants. Built from the CMS (titles and meta descriptions), so new and
 * renamed pages show up after publishing.
 */
export const revalidate = 300;

const GROUPS: [string, (p: string) => boolean][] = [
  ["Practice", (p) => ["/", "/about-us/", "/dr-mehdi-adili/", "/appointment/", "/before-after/", "/services/"].includes(p)],
  ["Dental services in Northern Virginia", (p) => p.startsWith("/services/") || p.startsWith("/locations/night-guards/")],
  ["Dental services in McLean, VA", (p) => p.startsWith("/locations/mclean/") || /-in-mclean-va\/$/.test(p)],
];

export async function GET() {
  const site = await getSite();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || site.settings.siteUrl || "https://idealdentalsolutions.com").replace(/\/$/, "");
  const pages = await pageSummaries(site.fromCms);
  const line = (p: { path: string; title: string; description: string }) =>
    `- [${p.title.replace(/\s*\|\s*Ideal Dental Solutions.*$|\s*\|\s*Ideal Dental$/, "")}](${origin}${p.path})${p.description ? `: ${p.description}` : ""}`;
  const used = new Set<string>();
  const sections = GROUPS.map(([name, match]) => {
    const list = pages.filter((p) => !used.has(p.path) && match(p.path));
    list.forEach((p) => used.add(p.path));
    return list.length ? `## ${name}\n\n${list.map(line).join("\n")}` : "";
  });
  const rest = pages.filter((p) => !used.has(p.path));
  if (rest.length) sections.push(`## Other pages\n\n${rest.map(line).join("\n")}`);
  const body = [
    "# Ideal Dental Solutions",
    "",
    "> Dental practice at 8280 Greensboro Drive, Unit 105, McLean, VA 22102 (Tysons), serving McLean and Northern Virginia: cosmetic, implant, periodontal, preventive and restorative dentistry. Phone (703) 442-0442.",
    "",
    "Appointments can be requested online or by phone. Hours and the full list of services are on the pages below.",
    "",
    ...sections.filter(Boolean).flatMap((s) => [s, ""]),
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=UTF-8", "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=86400` },
  });
}
