import type { NextConfig } from "next";
import { redirects } from "./redirects";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // WordPress URLs end with a slash; keep them identical.
  trailingSlash: true,
  // content/seed.json is the built-in copy used until the CMS has content.
  outputFileTracingIncludes: { "/*": ["./content/seed.json"], "/api/admin/seed": ["./content/seed.json", "./content/seed-base.json"] },
  async headers() {
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    const week = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    // Previews only (never the live site): keep staging copies out of search results.
    const previewOnly = process.env.VERCEL_ENV === "preview" ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }] : [];
    return [
      ...previewOnly,
      { source: "/assets/:path*", headers: immutable },
      { source: "/wp-content/:path*", headers: week },
      { source: "/wp-includes/:path*", headers: week },
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
