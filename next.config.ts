import type { NextConfig } from "next";
import { securityHeaderEntries } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaderEntries() }];
  },
};

export default nextConfig;
