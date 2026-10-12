import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Ideal Dental Solutions")
    .items([
      S.listItem().title("Pages").schemaType("page").child(S.documentTypeList("page").title("Pages").defaultOrdering([{ field: "path", direction: "asc" }])),
      S.divider(),
      S.listItem().title("Header & menu").id("siteHeader").child(S.document().schemaType("siteHeader").documentId("siteHeader")),
      S.listItem().title("Footer & shared sections").schemaType("elementorTemplate").child(S.documentTypeList("elementorTemplate").title("Footer & shared sections")),
      S.listItem().title("Archive pages").schemaType("archivePage").child(S.documentTypeList("archivePage").title("Archive pages")),
      S.divider(),
      S.listItem().title("Site settings").id("siteSettings").child(S.document().schemaType("siteSettings").documentId("siteSettings")),
      S.listItem().title("404 page").id("notFound").child(S.document().schemaType("notFoundPage").documentId("notFound")),
    ]);
