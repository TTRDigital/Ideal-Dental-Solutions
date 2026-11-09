/**
 * Writes content/seed-base.json: the fingerprint of every document as it was
 * last written to the CMS, so /api/admin/seed can tell an editor's change from
 * a change in content/seed.json. Run after each seed, from the seed that was
 * written:
 *
 *   npm run seed-base                 # from content/seed.json
 *   npm run seed-base -- <git-ref>    # from content/seed.json at that commit
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fingerprint, type Doc } from "../lib/site/seed-sync.ts";

const ROOT = join(import.meta.dirname, "..");
const ref = process.argv[2];
const raw = ref ? execFileSync("git", ["show", `${ref}:content/seed.json`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString() : readFileSync(join(ROOT, "content/seed.json"), "utf8");
const docs = JSON.parse(raw) as Doc[];
const out = Object.fromEntries(docs.map((d) => [d._id, fingerprint(d)]));
writeFileSync(join(ROOT, "content/seed-base.json"), `${JSON.stringify({ from: ref || "content/seed.json", documents: out }, null, 1)}\n`);
console.log(`${docs.length} fingerprints from ${ref || "content/seed.json"}`);
