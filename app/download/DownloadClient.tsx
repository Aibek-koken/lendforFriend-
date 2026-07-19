"use client";

import { useEffect, useMemo, useState } from "react";
import { OriginLink } from "@/components/ui/origin-button";
import { landingOrigin } from "@/lib/hosts";
import { getLandingVisitorId, trackLandingEvent } from "@/lib/clientAnalytics";
import {
  DOWNLOAD_URLS,
  DOWNLOAD_VERSION,
  detectOs,
  type DetectedOs,
} from "@/lib/downloads";

type Lang = "en" | "ru";
type PlatformKey = "mac" | "windows" | "linux-appimage" | "linux-deb";

/* Brand icons (currentColor). */
function AppleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 12.04c-.03-2.85 2.33-4.22 2.44-4.29-1.33-1.95-3.4-2.22-4.14-2.25-1.76-.18-3.44 1.04-4.33 1.04-.89 0-2.27-1.02-3.74-.99-1.92.03-3.7 1.12-4.69 2.84-2 3.47-.51 8.6 1.43 11.42.95 1.38 2.08 2.93 3.56 2.87 1.43-.06 1.97-.92 3.7-.92 1.72 0 2.21.92 3.72.89 1.54-.03 2.51-1.4 3.45-2.79 1.09-1.6 1.54-3.15 1.56-3.23-.03-.01-2.99-1.15-3.02-4.56zM14.2 3.78c.79-.96 1.32-2.29 1.18-3.62-1.14.05-2.52.76-3.33 1.71-.73.85-1.37 2.21-1.2 3.51 1.27.1 2.57-.65 3.35-1.6z" />
    </svg>
  );
}
function WindowsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 5.48l7.42-1.01v7.16H3V5.48zm0 13.04l7.42 1.01v-7.07H3v6.06zM11.27 4.35L21 3v8.63h-9.73V4.35zm0 15.3L21 21v-8.55h-9.73v7.2z" />
    </svg>
  );
}
function LinuxIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z" />
    </svg>
  );
}

const COPY = {
  en: {
    back: "LiveAssist AI",
    eyebrow: "Desktop app",
    title: "Download LiveAssist AI",
    sub: "Free to try. Ask a question with a global hotkey and get a concise, source-cited answer from your company documents — right in the middle of a call.",
    recommendedFor: "Recommended for",
    recommendedNote: "We detected your operating system. Not right? Pick another below.",
    download: "Download for",
    choose: "All platforms",
    chooseSub: "Pick the build for your operating system.",
    linux: "Linux",
    verifyTitle: "Verify your download",
    verifyBody: "Every release ships a SHA256SUMS.txt. On macOS or Linux, run:",
    checksums: "View SHA256SUMS.txt",
    macNoteLabel: "macOS",
    macNote: "If macOS blocks the app on first launch, run in Terminal:",
    version: "Latest build",
    osName: { mac: "macOS", windows: "Windows", linux: "Linux", unknown: "your device" } as Record<DetectedOs, string>,
    langToggle: "RU",
  },
  ru: {
    back: "LiveAssist AI",
    eyebrow: "Десктоп-приложение",
    title: "Скачать LiveAssist AI",
    sub: "Бесплатно попробовать. Задайте вопрос по глобальному хоткею и получите короткий ответ со ссылкой на источник из документов компании — прямо во время звонка.",
    recommendedFor: "Рекомендуем для",
    recommendedNote: "Мы определили вашу операционную систему. Не подходит? Выберите другую ниже.",
    download: "Скачать для",
    choose: "Все платформы",
    chooseSub: "Выберите сборку для вашей операционной системы.",
    linux: "Linux",
    verifyTitle: "Проверьте загрузку",
    verifyBody: "К каждому релизу прилагается SHA256SUMS.txt. На macOS или Linux выполните:",
    checksums: "Открыть SHA256SUMS.txt",
    macNoteLabel: "macOS",
    macNote: "Если macOS блокирует приложение при первом запуске, выполните в Terminal:",
    version: "Последняя сборка",
    osName: { mac: "macOS", windows: "Windows", linux: "Linux", unknown: "вашего устройства" } as Record<DetectedOs, string>,
    langToggle: "EN",
  },
} as const;

type PlatformDef = {
  key: PlatformKey;
  os: DetectedOs;
  url: string;
  icon: React.ReactNode;
  name: string;
  arch: { en: string; ru: string };
};

const PLATFORMS: PlatformDef[] = [
  {
    key: "mac",
    os: "mac",
    url: DOWNLOAD_URLS.macArm64,
    icon: <AppleIcon />,
    name: "macOS",
    arch: { en: "Apple Silicon · arm64", ru: "Apple Silicon · arm64" },
  },
  {
    key: "windows",
    os: "windows",
    url: DOWNLOAD_URLS.windows,
    icon: <WindowsIcon />,
    name: "Windows",
    arch: { en: "x64 · Windows 10/11", ru: "x64 · Windows 10/11" },
  },
  {
    key: "linux-appimage",
    os: "linux",
    url: DOWNLOAD_URLS.linuxAppImage,
    icon: <LinuxIcon />,
    name: "Linux · AppImage",
    arch: { en: "x86_64 · portable", ru: "x86_64 · портативный" },
  },
  {
    key: "linux-deb",
    os: "linux",
    url: DOWNLOAD_URLS.linuxDeb,
    icon: <LinuxIcon />,
    name: "Linux · .deb",
    arch: { en: "amd64 · Debian/Ubuntu", ru: "amd64 · Debian/Ubuntu" },
  },
];

const RECOMMENDED_KEY: Record<DetectedOs, PlatformKey | null> = {
  mac: "mac",
  windows: "windows",
  linux: "linux-appimage",
  unknown: null,
};

function PlatformCard({
  def,
  lang,
  label,
  onDownload,
}: {
  def: PlatformDef;
  lang: Lang;
  label: string;
  onDownload: (platform: PlatformKey) => void;
}) {
  return (
    <OriginLink
      href={def.url}
      onClick={() => onDownload(def.key)}
      variant="platform"
      contentClassName="flex min-w-0 items-center gap-3"
    >
      <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(74,47,8,0.08)] text-[#4a2f08] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
        {def.icon}
      </span>
      <span className="relative z-10 min-w-0">
        <span className="block text-[11px] font-[600] uppercase tracking-[0.08em] text-[rgba(74,47,8,0.6)]">
          {label}
        </span>
        <span className="block text-[15px] font-[800] leading-tight tracking-[-0.01em] text-[#4a2f08]">
          {def.name}
        </span>
        <span className="block text-[11px] font-[500] text-[rgba(74,47,8,0.6)]">
          {def.arch[lang]}
        </span>
      </span>
    </OriginLink>
  );
}

export default function DownloadClient() {
  const [lang, setLang] = useState<Lang>("en");
  const [os, setOs] = useState<DetectedOs>("unknown");
  const [visitorId, setVisitorId] = useState("");

  // Client-only detection. This NEVER triggers a download — the visitor must
  // click. It only decides which platform to highlight as recommended.
  useEffect(() => {
    setOs(detectOs(navigator.userAgent, navigator.platform));
    setVisitorId(getLandingVisitorId());
    if (navigator.language?.toLowerCase().startsWith("ru")) setLang("ru");
  }, []);

  const t = COPY[lang];

  const recommended = useMemo(() => {
    const key = RECOMMENDED_KEY[os];
    return key ? PLATFORMS.find((p) => p.key === key) ?? null : null;
  }, [os]);

  const onDownload = (platform: PlatformKey) => {
    trackLandingEvent(
      "download_clicked",
      {
        download_platform: platform,
        language: lang,
        path: typeof window !== "undefined" ? window.location.pathname : "/download",
        platform,
        source: "download_page",
      },
      visitorId || undefined
    );
  };

  const linuxPlatforms = PLATFORMS.filter((p) => p.os === "linux");
  const desktopPlatforms = PLATFORMS.filter((p) => p.os !== "linux");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_46%,#fff5ea_100%)] text-[#1a1917]">
      {/* Top bar */}
      <header className="mx-auto flex max-w-[1080px] items-center justify-between px-4 py-5 sm:px-6">
        <a
          href={landingOrigin()}
          className="inline-flex items-center gap-2 text-[15px] font-[800] tracking-[-0.01em] text-[#1a1917] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9820f] focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-lg"
        >
          <span aria-hidden="true">←</span>
          {t.back}
        </a>
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "ru" : "en")}
          aria-label={lang === "en" ? "Switch to Russian" : "Switch to English"}
          className="rounded-lg px-3 py-1.5 text-[13px] font-[700] text-[#a35707] transition-colors hover:bg-[rgba(163,87,7,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9820f]"
        >
          {t.langToggle}
        </button>
      </header>

      <div className="mx-auto max-w-[1080px] px-4 pb-24 sm:px-6">
        {/* Hero */}
        <section className="mx-auto max-w-[720px] pt-8 text-center sm:pt-14">
          <p className="mb-3 text-[13px] font-[600] uppercase tracking-[0.16em] text-[#a35707]">
            {t.eyebrow}
          </p>
          <h1 className="text-[clamp(34px,5vw,56px)] font-[700] leading-[1.05] tracking-[-0.04em]">
            {t.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-[16px] font-[400] leading-[1.62] text-[#6b665e] md:text-[17px]">
            {t.sub}
          </p>
        </section>

        {/* Recommended */}
        {recommended ? (
          <section className="mx-auto mt-12 max-w-[560px]">
            <div className="rounded-[28px] border border-[rgba(217,152,30,0.16)] bg-[rgba(255,255,255,0.9)] p-6 text-center shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-8">
              <p className="text-[12px] font-[800] uppercase tracking-[0.16em] text-[#a35707]">
                {t.recommendedFor} {t.osName[os]}
              </p>
              <div className="mx-auto mt-5 max-w-[320px]">
                <OriginLink
                  href={recommended.url}
                  onClick={() => onDownload(recommended.key)}
                  size="lg"
                  className="w-full"
                >
                  {t.download} {recommended.name}
                </OriginLink>
              </div>
              <p className="mt-3 text-[12px] font-[500] text-[#6b665e]">
                {recommended.arch[lang]}
              </p>
              <p className="mx-auto mt-4 max-w-[46ch] text-[12px] leading-[1.5] text-[#8a847b]">
                {t.recommendedNote}
              </p>
            </div>
          </section>
        ) : null}

        {/* All platforms */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <h2 className="text-[clamp(22px,2.6vw,30px)] font-[700] tracking-[-0.03em] text-[#1a1917]">
              {t.choose}
            </h2>
            <p className="mt-2 text-[14px] text-[#6b665e]">{t.chooseSub}</p>
          </div>

          <div className="mx-auto grid max-w-[640px] gap-3 sm:grid-cols-2">
            {desktopPlatforms.map((def) => (
              <PlatformCard
                key={def.key}
                def={def}
                lang={lang}
                label={t.download}
                onDownload={onDownload}
              />
            ))}
          </div>

          {/* Linux (two formats) — anchor target for /download/linux */}
          <div id="linux" className="mx-auto mt-8 max-w-[640px] scroll-mt-24">
            <p className="mb-3 text-center text-[13px] font-[700] uppercase tracking-[0.14em] text-[#6b665e]">
              {t.linux}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {linuxPlatforms.map((def) => (
                <PlatformCard
                  key={def.key}
                  def={def}
                  lang={lang}
                  label={t.download}
                  onDownload={onDownload}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Verify + macOS note */}
        <section className="mx-auto mt-16 max-w-[640px] space-y-4">
          <div className="rounded-[20px] border border-[rgba(29,29,31,0.08)] bg-[rgba(255,255,255,0.75)] p-5 sm:p-6">
            <p className="text-[13px] font-[800] uppercase tracking-[0.14em] text-[#a35707]">
              {t.verifyTitle}
            </p>
            <p className="mt-3 text-[14px] leading-[1.6] text-[#6b665e]">{t.verifyBody}</p>
            <code className="mt-3 block overflow-x-auto rounded-lg bg-[#f7f5f5] px-3 py-2 text-[12px] text-[#423d36]">
              shasum -a 256 -c SHA256SUMS.txt
            </code>
            <a
              href={DOWNLOAD_URLS.checksums}
              className="mt-4 inline-flex items-center gap-1 text-[13px] font-[700] text-[#a35707] hover:text-[#7a4108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9820f] rounded"
            >
              {t.checksums}
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="rounded-[20px] border border-[rgba(29,29,31,0.08)] bg-[rgba(255,255,255,0.75)] p-5 sm:p-6">
            <p className="text-[13px] font-[800] uppercase tracking-[0.14em] text-[#a35707]">
              {t.macNoteLabel}
            </p>
            <p className="mt-3 text-[14px] leading-[1.6] text-[#6b665e]">{t.macNote}</p>
            <code className="mt-3 block overflow-x-auto rounded-lg bg-[#f7f5f5] px-3 py-2 text-[12px] text-[#423d36]">
              {'xattr -cr "/Applications/LiveAssist AI.app"'}
            </code>
          </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto mt-16 flex max-w-[640px] flex-col items-center gap-2 text-center">
          <a
            href={landingOrigin()}
            className="text-[14px] font-[700] text-[#a35707] hover:text-[#7a4108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9820f] rounded"
          >
            ← {t.back}
          </a>
          <p className="text-[12px] text-[#8a847b]">
            {t.version}: v{DOWNLOAD_VERSION}
          </p>
        </footer>
      </div>
    </main>
  );
}
