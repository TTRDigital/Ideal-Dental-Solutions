import { createHash } from "node:crypto";

/**
 * Comparing content/seed.json with the CMS (app/api/admin/seed/route.ts).
 * A document's fingerprint ignores Sanity's bookkeeping fields and key order,
 * so the same content always gives the same hash.
 */

export type Doc = Record<string, unknown> & { _id: string; _type: string };

const SYSTEM = new Set(["_rev", "_createdAt", "_updatedAt", "_system", "_originalId"]);

function canonical(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) if (!SYSTEM.has(k)) out[k] = canonical((v as Record<string, unknown>)[k]);
    return out;
  }
  return v;
}

export function fingerprint(doc: unknown) {
  return createHash("sha256").update(JSON.stringify(canonical(doc))).digest("hex").slice(0, 32);
}

export type SeedPlan = {
  create: string[];
  update: string[];
  unchanged: number;
  /** In the CMS, changed since the last seed (or holding an unpublished draft): applying would overwrite an editor's work. */
  editedInCms: string[];
};

/**
 * base: fingerprints of the content last written to the CMS (content/seed-base.json).
 * A CMS document that matches neither that version nor the new seed was edited in the CMS.
 */
export function plan(seed: Doc[], cms: Doc[], drafts: string[], base: Record<string, string>): SeedPlan {
  const byId = new Map(cms.map((d) => [d._id, d]));
  const draftSet = new Set(drafts.map((id) => id.replace(/^drafts\./, "")));
  const out: SeedPlan = { create: [], update: [], unchanged: 0, editedInCms: [] };
  for (const doc of seed) {
    const current = byId.get(doc._id);
    if (!current) {
      out.create.push(doc._id);
      continue;
    }
    const now = fingerprint(current);
    const next = fingerprint(doc);
    if (now === next) out.unchanged++;
    else {
      out.update.push(doc._id);
      if (base[doc._id] !== now) out.editedInCms.push(doc._id);
    }
    if (draftSet.has(doc._id) && !out.editedInCms.includes(doc._id)) out.editedInCms.push(doc._id);
  }
  return out;
}
