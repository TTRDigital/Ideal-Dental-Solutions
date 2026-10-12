import shellsJson from "../generated/shells.json" with { type: "json" };
import { escapeHtml } from "../render/html.ts";
import { renderSeo, type Seo } from "../render/seo.ts";
import { renderTpl, type Fields, type RenderContext } from "../render/template.ts";

/**
 * Turns CMS documents into the full HTML document for a URL. Used by the
 * site route and by the migration check (scripts/verify.ts).
 */

const shells = shellsJson as Record<string, string>;

export type TemplateDoc = Fields & { _id: string; wpId?: number; kind?: string };
/** Blocksy header: desktop header (tpl) and the mobile offcanvas panel (drawerTpl) share the logo and menu. */
export type HeaderDoc = Fields & { _id: string; drawerTpl?: string };
export type BaseDoc = Fields & {
  _id: string;
  _type: string;
  title?: string;
  path?: string;
  wpId?: number;
  seo?: Seo;
  bodyClass?: string;
  frameTpl?: string;
  shell?: string;
};
export type PageDoc = BaseDoc & { ancestorPaths?: string[] };
export type ArchiveDoc = BaseDoc & { kind: "category" | "author" };

export type SiteData = {
  settings: { siteUrl?: string; businessSchema?: string; header?: HeaderDoc | null; footer?: TemplateDoc | null };
};

export type Resolved =
  | { kind: "page"; doc: PageDoc; ancestors: string[] }
  | { kind: "archive"; doc: ArchiveDoc }
  | { kind: "notFound"; doc: BaseDoc };

export type RenderOptions = {
  projectId: string;
  dataset: string;
  /** Public origin, e.g. https://idealdentalsolutions.com. Absolute SEO URLs use it. */
  origin?: string;
};

/** Elementor's frontend config describes the current document. */
function elementorPost(doc: BaseDoc, title: string) {
  return `{"id":${doc.wpId ?? 0},"title":"${encodeURIComponent(title).replace(/'/g, "%27")}","excerpt":"","featuredImage":false}`;
}

export function renderDocument(resolved: Resolved, data: SiteData, path: string, opts: RenderOptions): string {
  const { doc } = resolved;
  const values: Record<string, string> = {};
  const ctx: RenderContext = {
    path,
    values,
    ancestorPaths: resolved.kind === "page" ? resolved.ancestors : [],
    image: { projectId: opts.projectId, dataset: opts.dataset },
  };
  const seo = doc.seo;
  const title = seo?.title || doc.title || "";
  const header = data.settings.header;
  values.seo = renderSeo(seo, opts.origin, data.settings.businessSchema);
  values.bodyClass = doc.bodyClass ?? "";
  values.queriedId = String(doc.wpId ?? "");
  values.refererTitle = title;
  values.elementorPost = elementorPost(doc, title);
  values.header = header ? renderTpl(header.tpl, header, ctx) : "";
  values.drawer = header ? renderTpl(header.drawerTpl, header, ctx) : "";
  values.footer = data.settings.footer ? renderTpl(data.settings.footer.tpl, data.settings.footer, ctx) : "";
  values.content = renderTpl(doc.frameTpl, doc, ctx);

  const shell = shells[doc.shell || ""] || shells[Object.keys(shells)[0]] || "";
  return renderTpl(shell, {}, ctx);
}

export function notFoundHtml() {
  return `<!doctype html><title>${escapeHtml("Page not found")}</title>`;
}
