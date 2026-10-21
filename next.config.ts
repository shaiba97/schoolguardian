import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // NOTE: cacheComponents intentionally off (see DECISIONS.md): the portal
  // layout reads the locale cookie, which forbids static prerendering under
  // the cache-components paradigm. partialPrefetching requires it, so both
  // stay off. Matches the student/teacher apps.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
