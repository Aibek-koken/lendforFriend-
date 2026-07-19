import { describe, expect, it } from "vitest";
import {
  API_DOWNLOAD_URLS,
  DOWNLOADS_REPO,
  DOWNLOAD_ASSET_FILES,
  DOWNLOAD_SHA256,
  DOWNLOAD_URLS,
  detectOs,
  isApiDownloadPlatform,
} from "@/lib/downloads";

const ALL_URLS = [
  ...Object.values(DOWNLOAD_URLS),
  ...Object.values(API_DOWNLOAD_URLS),
];

describe("download URLs", () => {
  it("all point at the PUBLIC downloads repository", () => {
    for (const url of ALL_URLS) {
      expect(url.startsWith(`https://github.com/${DOWNLOADS_REPO}/`)).toBe(true);
    }
  });

  it("never reference the private product repository (Friend)", () => {
    const serialized = JSON.stringify({ DOWNLOAD_URLS, API_DOWNLOAD_URLS });
    expect(serialized.toLowerCase()).not.toContain("/friend");
    expect(serialized).not.toContain("Aibek-koken/Friend");
  });

  it("installer URLs use the stable releases/latest/download path", () => {
    const installers = [
      DOWNLOAD_URLS.macArm64,
      DOWNLOAD_URLS.windows,
      DOWNLOAD_URLS.linuxAppImage,
      DOWNLOAD_URLS.linuxDeb,
      DOWNLOAD_URLS.checksums,
    ];
    for (const url of installers) {
      expect(url).toContain("/releases/latest/download/");
    }
  });

  it("uses the exact published stable asset filenames", () => {
    expect(DOWNLOAD_URLS.macArm64.endsWith(DOWNLOAD_ASSET_FILES.macArm64)).toBe(true);
    expect(DOWNLOAD_URLS.windows.endsWith(DOWNLOAD_ASSET_FILES.windows)).toBe(true);
    expect(DOWNLOAD_URLS.linuxAppImage.endsWith(DOWNLOAD_ASSET_FILES.linuxAppImage)).toBe(true);
    expect(DOWNLOAD_URLS.linuxDeb.endsWith(DOWNLOAD_ASSET_FILES.linuxDeb)).toBe(true);
    expect(DOWNLOAD_ASSET_FILES.checksums).toBe("SHA256SUMS.txt");
  });

  it("publishes a sha256 for every installer", () => {
    for (const hash of Object.values(DOWNLOAD_SHA256)) {
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});

describe("legacy /api/download platform map", () => {
  it("keeps the mac-arm64 / windows / linux keys the landing section uses", () => {
    expect(isApiDownloadPlatform("mac-arm64")).toBe(true);
    expect(isApiDownloadPlatform("windows")).toBe(true);
    expect(isApiDownloadPlatform("linux")).toBe(true);
    expect(isApiDownloadPlatform("unknown")).toBe(false);
  });

  it("resolves linux to the AppImage", () => {
    expect(API_DOWNLOAD_URLS.linux).toBe(DOWNLOAD_URLS.linuxAppImage);
  });
});

describe("detectOs", () => {
  it("detects macOS", () => {
    expect(
      detectOs(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        "MacIntel"
      )
    ).toBe("mac");
  });

  it("detects Windows (and is not fooled by 'darwin' containing 'win')", () => {
    expect(
      detectOs("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Win32")
    ).toBe("windows");
    // 'darwin' contains the substring 'win' — must still resolve to mac.
    expect(detectOs("something darwin kernel", "MacIntel")).toBe("mac");
  });

  it("detects Linux", () => {
    expect(
      detectOs("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36", "Linux x86_64")
    ).toBe("linux");
  });

  it("returns unknown for mobile and empty input", () => {
    expect(detectOs("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("unknown");
    expect(detectOs("Mozilla/5.0 (Linux; Android 14; Pixel)")).toBe("unknown");
    expect(detectOs("", "")).toBe("unknown");
    expect(detectOs(null)).toBe("unknown");
  });
});
