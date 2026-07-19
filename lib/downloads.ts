/**
 * Single source of truth for public desktop downloads.
 *
 * Every installer link on the site resolves to the PUBLIC, downloads-only
 * GitHub repository below. The private product repository is never referenced
 * here (or anywhere the browser can reach) — these are the only URLs the
 * website hands out.
 *
 * Links use the `/releases/latest/download/…` form on purpose: they always
 * point at the newest published release, so shipping a new version never
 * requires a website code change.
 */

/** Public downloads repository. NOT the private source repo. */
export const DOWNLOADS_REPO = "Aibek-koken/liveassist-downloads-";

/** The version currently published to the downloads repository. */
export const DOWNLOAD_VERSION = "0.1.4";

const REPO_BASE = `https://github.com/${DOWNLOADS_REPO}`;

/** Stable "latest release" asset base. Survives version bumps unchanged. */
const LATEST_ASSET_BASE = `${REPO_BASE}/releases/latest/download`;

/** Public, stable asset filenames (version-less on purpose). */
export const DOWNLOAD_ASSET_FILES = {
  macArm64: "LiveAssist-AI-macOS-arm64.dmg",
  windows: "LiveAssist-AI-Windows-x64-Setup.exe",
  linuxAppImage: "LiveAssist-AI-Linux-x86_64.AppImage",
  linuxDeb: "LiveAssist-AI-Linux-amd64.deb",
  checksums: "SHA256SUMS.txt",
} as const;

function latestAssetUrl(file: string): string {
  return `${LATEST_ASSET_BASE}/${file}`;
}

/** Direct, unauthenticated download URLs for each installer. */
export const DOWNLOAD_URLS = {
  macArm64: latestAssetUrl(DOWNLOAD_ASSET_FILES.macArm64),
  windows: latestAssetUrl(DOWNLOAD_ASSET_FILES.windows),
  linuxAppImage: latestAssetUrl(DOWNLOAD_ASSET_FILES.linuxAppImage),
  linuxDeb: latestAssetUrl(DOWNLOAD_ASSET_FILES.linuxDeb),
  checksums: latestAssetUrl(DOWNLOAD_ASSET_FILES.checksums),
  /** The GitHub Releases page for the latest build. */
  releasesLatest: `${REPO_BASE}/releases/latest`,
} as const;

/** Published SHA-256 checksums (also in SHA256SUMS.txt). For display/verify. */
export const DOWNLOAD_SHA256 = {
  macArm64: "464083666428d8bcab1092e9c30ffbce7469e88cc705a1ee6c7f8ce9287588e6",
  windows: "3bbeb0459801d5fcdf7875902738803e504a3afdf763038cd8f918d0bdb29d06",
  linuxAppImage: "088e73ec27b8045489cd3926847de5bd14a1b48f7a9951e17face8393219e037",
  linuxDeb: "6961aff484647c6c4027358d1178869f3ebc91ce55750e9eac2fcce28e3d99a7",
} as const;

/**
 * Legacy `/api/download/[platform]` targets. Kept so the existing on-page
 * download section (mac-arm64 / windows / linux) serves the current build.
 * Linux resolves to the portable AppImage.
 */
export const API_DOWNLOAD_URLS = {
  "mac-arm64": DOWNLOAD_URLS.macArm64,
  windows: DOWNLOAD_URLS.windows,
  linux: DOWNLOAD_URLS.linuxAppImage,
} as const;

export type ApiDownloadPlatform = keyof typeof API_DOWNLOAD_URLS;

export function isApiDownloadPlatform(value: string): value is ApiDownloadPlatform {
  return value in API_DOWNLOAD_URLS;
}

/** OS the visitor is browsing from, for the "recommended" download. */
export type DetectedOs = "mac" | "windows" | "linux" | "unknown";

/**
 * Pure OS detection from a user-agent (and optional platform) string. Mobile
 * OSes resolve to `unknown` because there is no mobile build to recommend.
 * Order matters: `darwin` contains the substring `win`, so macOS is matched
 * before Windows.
 */
export function detectOs(
  userAgent: string | null | undefined,
  platform?: string | null
): DetectedOs {
  const s = `${userAgent ?? ""} ${platform ?? ""}`.toLowerCase();
  if (!s.trim()) return "unknown";
  if (/android/.test(s)) return "unknown";
  if (/iphone|ipad|ipod|ios/.test(s)) return "unknown";
  if (/macintosh|mac os|macos|darwin|mac/.test(s)) return "mac";
  if (/windows|win32|win64|wow64|windows nt/.test(s)) return "windows";
  if (/linux|x11|ubuntu|fedora|debian|cros/.test(s)) return "linux";
  return "unknown";
}
