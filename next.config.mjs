/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Search engines must never index the auth portal or its technical
    // routes. Headers only — nothing here blocks or redirects a request, so
    // OAuth callbacks and the desktop API keep working exactly as before.
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/signup/:path*", headers: noindex },
      { source: "/account/:path*", headers: noindex },
      { source: "/auth/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
};

export default nextConfig;
