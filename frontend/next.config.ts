import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Use webpack for production build to avoid Turbopack SSR/prerender module errors (e.g. lucide-react).
  // Dev can still use Turbopack via `next dev`.
  turbopack: {
    // When running in a monorepo, set root to this app so Next.js doesn't warn about multiple lockfiles.
    root: path.join(__dirname),
  },
};

export default nextConfig;
