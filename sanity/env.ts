/**
 * Ideal Dental Solutions Sanity project. The project ID is public (it is in
 * every image URL). It is pinned on purpose: a shared NEXT_PUBLIC_SANITY_PROJECT_ID
 * from another site must never point this site at the wrong project.
 * Set NEXT_PUBLIC_IDS_SANITY_DATASET to use another dataset (e.g. staging).
 */
export const projectId = "ncba5cqx";
export const dataset = process.env.NEXT_PUBLIC_IDS_SANITY_DATASET || "production";
export const apiVersion = "2025-02-19";
