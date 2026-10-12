import { itemTypes, nodeTypes, richText, wpImage } from "./content";
import { archivePage, elementorTemplate, formSetting, notFoundPage, page, seo, siteHeader, siteSettings } from "./documents";

export const schemaTypes = [
  siteSettings,
  page,
  archivePage,
  notFoundPage,
  siteHeader,
  elementorTemplate,
  seo,
  formSetting,
  wpImage,
  richText,
  ...nodeTypes,
  ...itemTypes,
];

/** Documents that exist once and cannot be created, duplicated or deleted. */
export const singletonTypes = new Set(["siteSettings", "notFoundPage", "siteHeader"]);
