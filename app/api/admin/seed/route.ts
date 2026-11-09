import { readFileSync } from "node:fs";
import { join } from "node:path";
import { revalidatePath, revalidateTag } from "next/cache";
import { plan, type Doc } from "@/lib/site/seed-sync";
import { dataset, projectId } from "@/sanity/env";

/**
 * One-time, server-side seed: writes content/seed.json to the CMS with the
 * Editor token kept in Vercel (SANITY_WRITE_TOKEN), so the token never leaves
 * the server.
 *
 *   POST /api/admin/seed            dry run: what would be created/updated
 *   POST /api/admin/seed?apply=1    writes the changed documents
 *
 * Authorization: "Bearer ttr_ak_..." (a TTR portal key). The key is checked
 * with https://ttr-portal.vercel.app/api/v1/me; only an owner or a build lead
 * may run it. It refuses (409) when a document was edited in /cms since the
 * last seed (content/seed-base.json) or has an unpublished draft, so an
 * editor's work is never overwritten. After applying, run `npm run seed-base`
 * and commit content/seed-base.json.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PORTAL_ME = "https://ttr-portal.vercel.app/api/v1/me";
const API = `https://${projectId}.api.sanity.io/v2024-01-01`;

const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function authorize(header: string | null) {
  if (!header || !/^Bearer ttr_ak_[\w-]+$/.test(header)) return { ok: false as const, status: 401, message: "Send Authorization: Bearer ttr_ak_..." };
  try {
    const res = await fetch(PORTAL_ME, { headers: { Authorization: header }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (res.status !== 200) return { ok: false as const, status: 403, message: `Key not accepted by the TTR portal (${res.status})` };
    const me = (await res.json()) as { kind?: string; role?: string; name?: string; id?: string };
    if (me.kind !== "owner" && me.role !== "build_lead") return { ok: false as const, status: 403, message: "Only an owner or a build lead may run the seed" };
    return { ok: true as const, who: me.name || me.id || me.kind || me.role || "unknown" };
  } catch {
    return { ok: false as const, status: 503, message: "Could not reach the TTR portal to check the key" };
  }
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), file), "utf8")) as T;
}

export async function POST(req: Request) {
  const auth = await authorize(req.headers.get("authorization"));
  if (!auth.ok) return reply({ ok: false, message: auth.message }, auth.status);

  const token = process.env.SANITY_WRITE_TOKEN?.trim();
  if (!token) return reply({ ok: false, message: "SANITY_WRITE_TOKEN is not set in this deployment" }, 503);
  const sanity = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const seed = readJson<Doc[]>("content/seed.json");
  const base = readJson<{ documents: Record<string, string> }>("content/seed-base.json").documents;
  const ids = seed.map((d) => d._id);

  // Published documents and any drafts of them (raw perspective shows both).
  const query = new URLSearchParams({ query: "*[_id in $ids || _id in $drafts]", $ids: JSON.stringify(ids), $drafts: JSON.stringify(ids.map((id) => `drafts.${id}`)), perspective: "raw" });
  const res = await fetch(`${API}/data/query/${dataset}?${query}`, { headers: sanity, cache: "no-store" });
  if (!res.ok) return reply({ ok: false, message: `Sanity answered ${res.status} when reading the CMS` }, 502);
  const all = ((await res.json()) as { result: Doc[] }).result;
  const cms = all.filter((d) => !d._id.startsWith("drafts."));
  const drafts = all.filter((d) => d._id.startsWith("drafts.")).map((d) => d._id);

  const p = plan(seed, cms, drafts, base);
  const apply = new URL(req.url).searchParams.get("apply") === "1";
  const summary = { create: p.create.length, update: p.update.length, unchanged: p.unchanged, created: p.create, updated: p.update, editedInCms: p.editedInCms };
  console.log(`[seed] ${apply ? "apply" : "dry run"} by ${auth.who}: ${JSON.stringify({ ...summary, created: undefined, updated: undefined })}`);

  if (p.editedInCms.length) {
    return reply({ ok: false, mode: apply ? "refused" : "dry-run", message: "These documents were edited in /cms since the last seed (or have an unpublished draft). Nothing was written.", ...summary }, 409);
  }
  if (!apply || !(p.create.length + p.update.length)) return reply({ ok: true, mode: apply ? "nothing-to-do" : "dry-run", ...summary });

  const byId = new Map(seed.map((d) => [d._id, d]));
  const mutations = [...p.create, ...p.update].map((id) => ({ createOrReplace: byId.get(id) }));
  let written = 0;
  for (let i = 0; i < mutations.length; i += 10) {
    const batch = mutations.slice(i, i + 10);
    const w = await fetch(`${API}/data/mutate/${dataset}`, { method: "POST", headers: sanity, body: JSON.stringify({ mutations: batch }), cache: "no-store" });
    if (!w.ok) return reply({ ok: false, mode: "partial", written, message: `Sanity answered ${w.status}: ${(await w.text()).slice(0, 300)}` }, 502);
    written += batch.length;
  }
  revalidateTag("sanity", { expire: 0 });
  revalidatePath("/", "layout");
  return reply({ ok: true, mode: "applied", written, ...summary });
}

export function GET() {
  return reply({ ok: false, message: "Use POST" }, 405);
}
