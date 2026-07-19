import type { Metadata } from "next";
import DownloadClient from "./DownloadClient";

export const metadata: Metadata = {
  title: "Download LiveAssist AI — Mac, Windows & Linux",
  description:
    "Download the LiveAssist AI desktop app for macOS (Apple Silicon), Windows (x64), and Linux (AppImage or .deb). Free to try.",
  alternates: { canonical: "https://liveassist.tech/download" },
  openGraph: {
    title: "Download LiveAssist AI",
    description:
      "Get the LiveAssist AI desktop app for macOS, Windows, and Linux.",
    url: "https://liveassist.tech/download",
    type: "website",
  },
};

export default function DownloadPage() {
  return <DownloadClient />;
}
