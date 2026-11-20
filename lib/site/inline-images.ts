import { createHash } from "node:crypto";

/** A base64 image of 2 KB or more pasted into the content (smaller ones stay inline). */
export const INLINE_IMAGE = /data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/]{2048,}={0,2})/g;

/** File name of an inline image: the first 12 hex characters of the SHA-1 of its base64 text. */
export function inlineHash(base64: string) {
  return createHash("sha1").update(base64).digest("hex").slice(0, 12);
}
