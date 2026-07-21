/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // The public download page now lives on the apex landing
    // (liveassist.tech/download). Keep the old portal URL working by
    // forwarding it there — no duplicate download page to maintain.
    //
    // Exact `/download` only: the tracked installer routes (`/download/mac`,
    // `/download/windows`, `/download/linux/*`) and the auth flows are NOT
    // matched and keep working untouched. Temporary (307) on purpose, so the
    // move stays reversible without fighting hard browser caches.
    return [
      {
        source: "/download",
        destination: "https://liveassist.tech/download",
        permanent: false,
      },
    ];
  },
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
