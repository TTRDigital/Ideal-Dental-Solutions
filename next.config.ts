import type { NextConfig } from "next";
import { redirects } from "./redirects";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // WordPress URLs end with a slash; keep them identical.
  trailingSlash: true,
  // proxy.ts adds the slash instead, after the redirect rules, so an old address without
  // the slash (/contact-us) reaches its page in one redirect, not two (TTR-2515).
  skipTrailingSlashRedirect: true,
  // content/seed.json is the built-in copy used until the CMS has content.
  outputFileTracingIncludes: { "/*": ["./content/seed.json"], "/api/admin/seed": ["./content/seed.json", "./content/seed-base.json"] },
  async headers() {
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    // Theme, plugin and WordPress files are fixed copies, loaded with ?ver= in the URL: a new version is a new URL.
    const year = [{ key: "Cache-Control", value: "public, max-age=31536000" }];
    // Uploads can be replaced under the same name (re-compressed, TTR-2515), so a month, not a year.
    const month = [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }];
    return [
      // Page stylesheets (file name = content hash), fonts, favicons.
      { source: "/assets/:path*", headers: immutable },
      { source: "/wp-content/uploads/:path*", headers: month },
      { source: "/wp-content/plugins/:path*", headers: year },
      { source: "/wp-content/themes/:path*", headers: year },
      { source: "/wp-includes/:path*", headers: year },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  async redirects() {
    return redirects;
  },
};

export default nextConfig;
