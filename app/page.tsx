"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CreditCard,
  FileText,
  FileSearch,
  HelpCircle,
  Layers,
  Keyboard,
  Mic,
  Shield,
  MessageSquareText,
  Headphones,
  LockKeyhole,
} from "lucide-react";
import { strings, type Lang } from "../lib/strings";
import { FaqPro, type FaqProItem } from "@/components/ui/faq-pro";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { AnimateOnScroll } from "../components/ui/animate-on-scroll";
import { InteractiveFooter } from "../components/InteractiveFooter";
import ProductMockup from "./components/ProductMockup";
import { StatsBand } from "./components/StatsBand";

const navConfig = [
  { id: "download", labelKey: "navPricing", url: "#download", icon: CreditCard },
  { id: "faq", labelKey: "navFaq", url: "#faq", icon: HelpCircle },
] as const;

const faqIds = ["listening", "sources", "customer", "sales-only", "crm"] as const;
const HINT_IDS = ["question", "answer", "confidence", "source"] as const;
const HERO_MORPH = {
  heroFadeEnd: 0.16,
  cardMoveStart: 0.04,
  cardMoveEnd: 0.34,
  hintsRevealStart: 0.24,
  hintsRevealEnd: 0.38,
  hintsRegionStart: 0.32,
  glowFadeStart: 0.18,
  glowFadeEnd: 0.34,
  cardStartLeft: 78.5,
  cardEndLeft: 38.5,
  cardStartScale: 0.68,
  cardEndScale: 1,
} as const;

const INTER_UI_STACK =
  'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const SCROLL_DISPLAY_STYLE = {
  fontFamily: INTER_UI_STACK,
  fontSize: "clamp(42px, 5vw, 72px)",
  fontWeight: 900,
  letterSpacing: "-2.5px",
  lineHeight: 1,
} as const;
const UI_DISPLAY_STYLE = {
  fontFamily: INTER_UI_STACK,
  fontWeight: 700,
  letterSpacing: "-2px",
} as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

type HeroMetric = {
  title: string;
  lines: [string, string];
};

type HintStory = {
  title: string;
  body: string;
};

type MobileStoryStep = {
  step: string;
  icon: typeof Headphones;
  title: string;
  body: string;
};

const MOBILE_HERO_MORPH = {
  heroFadeEnd: 0.18,
  cardMoveStart: 0.06,
  cardMoveEnd: 0.4,
  hintsRevealStart: 0.38,
  hintsRevealEnd: 0.54,
  hintsRegionStart: 0.46,
  cardStartScale: 0.88,
  cardEndScale: 0.78,
  cardStartY: 40,
  cardEndY: -40,
  glowFadeStart: 0.18,
  glowFadeEnd: 0.42,
} as const;

export default function HomePage() {
  /* ─────────────────────────────────────────────────────────
   * HERO MORPH STORYBOARD
   *
   * Static shell stays interactive.
   * Product card finishes its intro first.
   *
   *    0ms   hero copy and card rest in a calm split layout
   * scroll   hero copy soft-fades and drifts away
   * scroll   card glides toward center while scaling up continuously
   * scroll   onboarding narrative fades in on the right
   * scroll   hint focus advances across question → answer → confidence → source
   * ───────────────────────────────────────────────────────── */
  const [lang, setLang] = useState<Lang>("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollyStep, setScrollyStep] = useState(0);
  const [activeTab, setActiveTab] = useState<(typeof navConfig)[number]["id"]>(
    navConfig[0].id
  );
  const scrollyProgressRef = useRef(0);
  const scrollyTargetRef = useRef(0);
  const scrollyLastRawRef = useRef(-1);

  const scrollyRef = useRef<HTMLElement>(null);
  const mobileScrollyRef = useRef<HTMLElement>(null);
  // Hero scroll refs
  const heroRef = useRef<HTMLElement>(null);
  const mobileHeroRef = useRef<HTMLElement>(null);
  const heroProgressRef = useRef(0);
  const heroTargetRef = useRef(0);

  // Hero scroll state
  const [heroPhase, setHeroPhase] = useState<"hero" | "transition" | "hints">("hero");
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [activeScrollHint, setActiveScrollHint] = useState<string | null>(null);
  const [animComplete, setAnimComplete] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);
  const [skipAnimInstant, setSkipAnimInstant] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const scrollLockedRef = useRef(false);

  const t = (key: string) => {
    const val = (strings[lang] as Record<string, unknown>)[key];
    return val as string;
  };

  const tFeatures = (): [string, string][] => {
    return (strings[lang] as Record<string, unknown>).features as [string, string][];
  };

  const heroMetrics: HeroMetric[] =
    lang === "ru"
      ? [
          { title: "1 кнопка", lines: ["Нажал —", "получил ответ"] },
          { title: "Только ты", lines: ["Оверлей видишь", "только ты"] },
          { title: "Твои файлы", lines: ["Прайс, FAQ,", "условия — всё тут"] },
        ]
      : [
          { title: "1 hotkey", lines: ["Press once and", "get the answer"] },
          { title: "Only you", lines: ["The overlay stays", "visible only to you"] },
          { title: "Your files", lines: ["Pricing, FAQ,", "terms stay attached"] },
        ];

  const heroHeadlineLines =
    lang === "ru"
      ? ["Знай ответ.", "До того, как", "они договорят."]
      : ["Know the answer.", "Before they finish asking."];

  const scrollHintContent: Record<(typeof HINT_IDS)[number], HintStory> =
    lang === "ru"
      ? {
          question: {
            title: "Вопрос клиента",
            body: "Нажмите хоткей прямо в звонке — вопрос ловится без потери темпа.",
          },
          answer: {
            title: "Готовый ответ",
            body: "Короткая фраза, готовая к ответу. Без импровизации под давлением.",
          },
          confidence: {
            title: "Уверенность AI",
            body: "Сигнал уверенности: отвечать сразу или быстро перепроверить.",
          },
          source: {
            title: "Источник ответа",
            body: "Файл и страница рядом с ответом — основание, а не догадка.",
          },
        }
      : {
          question: {
            title: "Customer question",
            body: "Press the hotkey mid-call — the question is captured without breaking your flow.",
          },
          answer: {
            title: "Ready-to-say answer",
            body: "A compact, ready-to-say phrase. No improvising under pressure.",
          },
          confidence: {
            title: "AI confidence",
            body: "A confidence signal: answer now, or pause for a quick check.",
          },
          source: {
            title: "Source document",
            body: "The file and page stay attached — evidence, not a guess.",
          },
        };

  const mobileStorySteps: MobileStoryStep[] =
    lang === "ru"
      ? [
          {
            step: "01",
            icon: Headphones,
            title: t("scrollyStep1"),
            body: "Разговор уже идёт. Нельзя терять темп и уходить в поиск по вкладкам.",
          },
          {
            step: "02",
            icon: MessageSquareText,
            title: t("scrollyStep2"),
            body: "Вопрос звучит внезапно, и ответ нужен в ту же секунду, а не после паузы.",
          },
          {
            step: "03",
            icon: Keyboard,
            title: t("scrollyStep3"),
            body: "Один хоткей открывает приватный слой поверх звонка, CRM или браузера.",
          },
          {
            step: "04",
            icon: LockKeyhole,
            title: t("scrollyStep4"),
            body: "Ответ, уверенность и источник приходят вместе, чтобы менеджер говорил спокойно и точно.",
          },
        ]
      : [
          {
            step: "01",
            icon: Headphones,
            title: t("scrollyStep1"),
            body: "The call is already moving. There is no time to hunt through tabs or docs.",
          },
          {
            step: "02",
            icon: MessageSquareText,
            title: t("scrollyStep2"),
            body: "The question lands unexpectedly, and the answer has to show up in the same moment.",
          },
          {
            step: "03",
            icon: Keyboard,
            title: t("scrollyStep3"),
            body: "One hotkey opens a private layer above the call, CRM, or browser without breaking flow.",
          },
          {
            step: "04",
            icon: LockKeyhole,
            title: t("scrollyStep4"),
            body: "Answer, confidence, and source arrive together so the rep can respond with control.",
          },
        ];

  const tFaqs = (): FaqProItem[] => {
    const faqs = (strings[lang] as Record<string, unknown>).faqs as [string, string][];
    return faqs.map(([question, answer], index) => ({
      id: faqIds[index] ?? `faq-${index}`,
      question,
      answer,
    }));
  };

  const navItems = navConfig.map((item) => ({
    id: item.id,
    name: t(item.labelKey),
    url: item.url,
    icon: item.icon,
  }));

  const heroFadeProgress = clamp01(heroScrollProgress / HERO_MORPH.heroFadeEnd);
  const heroMorphProgress = animComplete
    ? clamp01(
        (heroScrollProgress - HERO_MORPH.cardMoveStart) /
          (HERO_MORPH.cardMoveEnd - HERO_MORPH.cardMoveStart)
      )
    : 0;
  const hintsRevealProgress = animComplete
    ? clamp01(
        (heroScrollProgress - HERO_MORPH.hintsRevealStart) /
          (HERO_MORPH.hintsRevealEnd - HERO_MORPH.hintsRevealStart)
      )
    : 0;
  const cardLeft = `${mix(
    HERO_MORPH.cardStartLeft,
    HERO_MORPH.cardEndLeft,
    heroMorphProgress
  )}%`;
  const cardScale = mix(
    HERO_MORPH.cardStartScale,
    HERO_MORPH.cardEndScale,
    heroMorphProgress
  );
  const cardGlowOpacity =
    1 -
    clamp01(
      (heroScrollProgress - HERO_MORPH.glowFadeStart) /
        (HERO_MORPH.glowFadeEnd - HERO_MORPH.glowFadeStart)
    );
  const mobileHeroMorphProgress = animComplete
    ? clamp01(
        (heroScrollProgress - MOBILE_HERO_MORPH.cardMoveStart) /
          (MOBILE_HERO_MORPH.cardMoveEnd - MOBILE_HERO_MORPH.cardMoveStart)
      )
    : 0;
  const mobileHintsRevealProgress = animComplete
    ? clamp01(
        (heroScrollProgress - MOBILE_HERO_MORPH.hintsRevealStart) /
          (MOBILE_HERO_MORPH.hintsRevealEnd - MOBILE_HERO_MORPH.hintsRevealStart)
      )
    : 0;
  const mobileCardScale = mix(
    MOBILE_HERO_MORPH.cardStartScale,
    MOBILE_HERO_MORPH.cardEndScale,
    mobileHeroMorphProgress
  );
  const mobileCardTranslateY = mix(
    MOBILE_HERO_MORPH.cardStartY,
    MOBILE_HERO_MORPH.cardEndY,
    mobileHeroMorphProgress
  );
  const mobileCardGlowOpacity =
    1 -
    clamp01(
      (heroScrollProgress - MOBILE_HERO_MORPH.glowFadeStart) /
        (MOBILE_HERO_MORPH.glowFadeEnd - MOBILE_HERO_MORPH.glowFadeStart)
    );

  const updateHeroScrollState = useCallback((progress: number) => {
    const hintsRegionStart = isMobileViewport
      ? MOBILE_HERO_MORPH.hintsRegionStart
      : HERO_MORPH.hintsRegionStart;

    setHeroScrollProgress(progress);

    if (progress < 0.05) {
      setHeroPhase("hero");
      setActiveScrollHint(null);
      return;
    }

    if (progress < hintsRegionStart) {
      setHeroPhase("transition");
      setActiveScrollHint(null);
      return;
    }

    setHeroPhase("hints");
    const hintsP = clamp01(
      (progress - hintsRegionStart) / (1 - hintsRegionStart)
    );
    const idx = Math.min(3, Math.floor(hintsP * 4));
    setActiveScrollHint(HINT_IDS[idx]);
  }, [isMobileViewport]);

  const readSectionScrollProgress = useCallback((section: HTMLElement | null) => {
    if (!section) return 0;

    const total = section.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;

    const rect = section.getBoundingClientRect();
    return clamp01(-rect.top / total);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("liveassist-lang") as Lang | null;
    if (saved === "en" || saved === "ru") setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("liveassist-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const mobileMq = window.matchMedia("(max-width: 767px)");
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncViewport = () => {
      setIsMobileViewport(mobileMq.matches);
      setPrefersReducedMotion(reducedMq.matches);
      setViewportReady(true);
    };

    syncViewport();
    mobileMq.addEventListener("change", syncViewport);
    reducedMq.addEventListener("change", syncViewport);

    return () => {
      mobileMq.removeEventListener("change", syncViewport);
      reducedMq.removeEventListener("change", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!viewportReady) return;
    if (!isMobileViewport && !prefersReducedMotion) return;

    setSkipAnim(true);
    setSkipAnimInstant(true);
    setAnimComplete(true);
  }, [isMobileViewport, prefersReducedMotion, viewportReady]);

  useEffect(() => {
    const sectionIds = ["download", "faq"];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const match = navConfig.find((item) => item.id === entry.target.id);
            if (match) setActiveTab(match.id);
          }
        });
      },
      { threshold: 0.4 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const section = isMobileViewport ? mobileScrollyRef.current : scrollyRef.current;
    if (!section) return;
    let animId: number;

    if (mq.matches) {
      const handleScroll = () => {
        const rect = section.getBoundingClientRect();
        const total = section.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        const progress = Math.min(1, Math.max(0, -rect.top / total));
        const next = Math.min(4, Math.floor(progress * 5));
        setScrollyStep(next);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      scrollyTargetRef.current = Math.min(1, Math.max(0, -rect.top / total));
    };

    function tick() {
      scrollyProgressRef.current +=
        (scrollyTargetRef.current - scrollyProgressRef.current) *
        (isMobileViewport ? 0.12 : 0.08);

      const raw = scrollyProgressRef.current * 5;
      const index = Math.min(4, Math.max(0, Math.floor(raw)));
      const frac = raw - index;

      let next = index;
      if (frac < 0.03 && scrollyLastRawRef.current > index) {
        next = scrollyLastRawRef.current;
      } else if (frac > 0.97 && scrollyLastRawRef.current < index) {
        next = scrollyLastRawRef.current;
      }

      if (next !== scrollyLastRawRef.current) {
        scrollyLastRawRef.current = next;
        setScrollyStep(next);
      }

      animId = requestAnimationFrame(tick);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animId);
      scrollyProgressRef.current = 0;
      scrollyTargetRef.current = 0;
      scrollyLastRawRef.current = -1;
    };
  }, [isMobileViewport]);

  useEffect(() => {
    if (isMobileViewport || prefersReducedMotion) {
      scrollLockedRef.current = false;
      return;
    }
    if (animComplete) {
      scrollLockedRef.current = false;
      return;
    }
    scrollLockedRef.current = true;

    let touchStartY = 0;

    const triggerFastForward = () => {
      if (!scrollLockedRef.current) return;
      setSkipAnim(true);
    };

    const triggerInstantFinish = () => {
      if (!scrollLockedRef.current) return;
      setSkipAnim(true);
      setSkipAnimInstant(true);
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0) return;

      if (event.deltaY > 120) {
        triggerInstantFinish();
        return;
      }

      triggerFastForward();
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - currentY;

      if (delta > 90) {
        triggerInstantFinish();
        return;
      }

      if (delta > 12) {
        triggerFastForward();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (["End", "PageDown"].includes(event.key)) {
        triggerInstantFinish();
        return;
      }

      if (["ArrowDown", " ", "Spacebar"].includes(event.key)) {
        triggerFastForward();
      }
    };

    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.18) {
        triggerInstantFinish();
        return;
      }

      if (window.scrollY > 8) {
        triggerFastForward();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [animComplete, isMobileViewport, prefersReducedMotion]);

  useEffect(() => {
    if (!viewportReady) return;
    document.body.style.overflow =
      menuOpen || (!animComplete && !isMobileViewport && !prefersReducedMotion)
        ? "hidden"
        : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [animComplete, isMobileViewport, menuOpen, prefersReducedMotion, viewportReady]);

  // Hero scroll-driven animation
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!animComplete) return;
    const section = isMobileViewport ? mobileHeroRef.current : heroRef.current;
    if (!section) return;
    let rafId: number;

    const onScroll = () => {
      heroTargetRef.current = readSectionScrollProgress(section);
    };

    const initialProgress = readSectionScrollProgress(section);
    heroTargetRef.current = initialProgress;
    heroProgressRef.current = initialProgress;
    updateHeroScrollState(initialProgress);

    const tick = () => {
      heroProgressRef.current +=
        (heroTargetRef.current - heroProgressRef.current) * 0.1;
      const p = heroProgressRef.current;
      updateHeroScrollState(p);

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [animComplete, isMobileViewport, prefersReducedMotion, readSectionScrollProgress, updateHeroScrollState]);

  const featureIcons = [FileText, FileSearch, Layers, Keyboard, Mic, Shield];
  const activeMobileHintId =
    heroPhase === "hints" && activeScrollHint ? activeScrollHint : "question";
  const activeMobileHintContent =
    scrollHintContent[activeMobileHintId as (typeof HINT_IDS)[number]];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-180 ease-out">
        <nav
          className="mx-auto w-full px-4 pt-4 pb-3 sm:px-5 sm:pt-7 sm:pb-3"
          style={{ maxWidth: "min(1180px, calc(100% - 40px))" }}
          aria-label={t("navLabel")}
        >
          <div className="relative md:hidden rounded-[20px] border border-[rgba(29,29,31,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(246,248,255,0.9)_100%)] px-3 py-2 shadow-[0_14px_32px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-md">
            <div className="flex min-h-[40px] items-center justify-between gap-2">
              <span className="inline-flex min-w-0 flex-1 select-none items-center gap-2 overflow-hidden whitespace-nowrap text-[13px] font-[700] text-[#1d1d1f]">
                {t("logo")}
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href="#download"
                  className="inline-flex min-h-[32px] items-center justify-center rounded-full border border-[rgba(72,70,201,0.24)] bg-[linear-gradient(180deg,rgba(114,107,255,0.98)_0%,rgba(94,92,230,1)_100%)] px-3 text-[11px] font-[700] leading-none text-white shadow-[0_10px_18px_rgba(94,92,230,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e5ce6] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {t("navPricing")}
                </a>
                <button
                  onClick={() => setMenuOpen((current) => !current)}
                  className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full border border-[rgba(29,29,31,0.1)] bg-white/88 text-[16px] font-[700] leading-none text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.94)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e5ce6] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  aria-label={menuOpen ? t("closeMenuLabel") : t("openMenuLabel")}
                  aria-expanded={menuOpen}
                >
                  &#9776;
                </button>
              </div>
            </div>

            {menuOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] rounded-[20px] border border-[rgba(29,29,31,0.08)] bg-[rgba(255,255,255,0.96)] p-3 shadow-[0_16px_32px_rgba(15,23,42,0.08)] backdrop-blur-md">
                <div className="flex flex-col gap-1.5">
                  {navItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      onClick={() => {
                        setActiveTab(item.id as (typeof navConfig)[number]["id"]);
                        setMenuOpen(false);
                      }}
                      className="inline-flex min-h-[36px] items-center rounded-full px-3 text-[13px] font-[600] text-[#3f3f46] transition-colors duration-150 hover:bg-[rgba(94,92,230,0.08)] hover:text-[#5e5ce6]"
                    >
                      {item.name}
                    </a>
                  ))}
                  <button
                    onClick={() => {
                      setLang(lang === "en" ? "ru" : "en");
                      setMenuOpen(false);
                    }}
                    className="inline-flex min-h-[36px] items-center justify-between rounded-full px-3 text-[13px] font-[700] text-[#1d1d1f] transition-colors duration-150 hover:bg-[rgba(94,92,230,0.08)]"
                  >
                    <span>{lang === "en" ? "Russian" : "English"}</span>
                    <span className="text-[#5e5ce6]">{lang === "en" ? "RU" : "EN"}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3">
            <span className="inline-flex min-h-10 select-none items-center gap-2 text-[15px] font-[700] text-[#1d1d1f]">
              {t("logo")}
            </span>

            <NavBar
              items={navItems}
              activeTab={activeTab}
              setActiveTab={(id) =>
                setActiveTab(id as (typeof navConfig)[number]["id"])
              }
              className="flex items-center justify-center"
            />

            <div className="flex items-center justify-end gap-[10px]">
              <button
                onClick={() => setLang(lang === "en" ? "ru" : "en")}
                className="inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full border border-[rgba(29,29,31,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,246,255,0.92)_100%)] px-3 text-[13px] font-[500] text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-150 hover:border-[rgba(99,91,255,0.22)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(238,242,255,0.96)_100%)]"
                aria-label={lang === "en" ? t("switchToRu") : t("switchToEn")}
              >
                {lang === "en" ? "RU" : "EN"}
              </button>
              <a
                href="#download"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[rgba(72,70,201,0.34)] bg-[linear-gradient(180deg,rgba(114,107,255,0.98)_0%,rgba(94,92,230,1)_100%)] px-5 text-[15px] font-[600] leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-150 hover:border-[rgba(72,70,201,0.42)] hover:bg-[linear-gradient(180deg,rgba(103,96,247,1)_0%,rgba(72,70,201,1)_100%)] hover:-translate-y-px"
              >
                {t("joinWaitlist")}
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="relative overflow-hidden px-4 pb-10 pt-28 md:hidden">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle at 18% 14%, rgba(94,92,230,0.18), transparent 30%), radial-gradient(circle at 82% 18%, rgba(33,168,154,0.14), transparent 28%), linear-gradient(180deg, #ffffff 0%, #fbfbff 52%, #f5f7ff 100%)",
            }}
          />
          <div className="relative mx-auto max-w-[430px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(94,92,230,0.12)] bg-[rgba(255,255,255,0.82)] px-3 py-2 text-[12px] font-[700] uppercase tracking-[0.14em] text-[#645FDE] shadow-[0_12px_30px_rgba(94,92,230,0.08)] backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#5E5CE6]" aria-hidden="true" />
              {t("heroEyebrow")}
            </p>
            <h1
              className="mt-5 text-[#111111]"
              style={{
                ...UI_DISPLAY_STYLE,
                fontSize: "clamp(42px, 13vw, 58px)",
                lineHeight: 0.92,
              }}
            >
              {heroHeadlineLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-[32ch] text-[16px] font-[400] leading-[1.62] text-[#5a5a63]">
              {t("heroSub")}
            </p>
            <div className="mt-8 grid gap-3">
              <a
                href="#download"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[rgba(72,70,201,0.34)] bg-[linear-gradient(180deg,rgba(114,107,255,0.98)_0%,rgba(94,92,230,1)_100%)] px-6 text-[15px] font-[600] leading-none text-white shadow-[0_20px_40px_rgba(94,92,230,0.22)]"
              >
                {t("heroPrimary")}
              </a>
              <a
                href="#hero-mobile-demo"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[rgba(29,29,31,0.08)] bg-[rgba(255,255,255,0.8)] px-6 text-[15px] font-[600] leading-none text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
              >
                {t("heroSecondary")}
              </a>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {heroMetrics.map((metric, index) => (
                <div
                  key={metric.title}
                  className={`rounded-[22px] border border-[rgba(29,29,31,0.08)] bg-[rgba(255,255,255,0.84)] p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] ${
                    index === heroMetrics.length - 1 ? "col-span-2" : ""
                  }`}
                >
                  <p className="text-[18px] font-[700] leading-none text-[#5B54D6]">
                    {metric.title}
                  </p>
                  <p className="mt-2 text-[14px] font-[400] leading-[1.45] text-[#7d7d88]">
                    <span className="block">{metric.lines[0]}</span>
                    <span className="block">{metric.lines[1]}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          ref={mobileHeroRef}
          id="hero-mobile-demo"
          className="relative md:hidden"
          style={{ minHeight: "320vh" }}
        >
          <div
            className="sticky top-0 px-4 pb-6 pt-24"
            style={{
              minHeight: "100svh",
              background:
                "linear-gradient(180deg, rgba(249,250,255,0.94) 0%, rgba(255,255,255,1) 100%)",
            }}
          >
            <div
              className="mx-auto flex max-w-[430px] items-center justify-center"
              style={{
                minHeight: "calc(100svh - 120px)",
              }}
            >
              <div className="relative z-10 flex w-full flex-col items-center gap-2">
                <div
                  className="relative w-full max-w-[296px]"
                  style={{
                    transform: `translateY(${mobileCardTranslateY}px) scale(${mobileCardScale})`,
                    transformOrigin: "center center",
                    willChange: "transform",
                  }}
                >
                  <div
                    className="absolute left-1/2 top-1/2 aspect-square w-[82vw] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[16px]"
                    aria-hidden="true"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(94,92,230,0.18), transparent 62%), radial-gradient(circle at 36% 28%, rgba(33,168,154,0.14), transparent 38%)",
                      opacity: mobileCardGlowOpacity,
                    }}
                  />
                  <div className="relative rounded-[28px] border border-[rgba(94,92,230,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(244,246,255,0.99)_100%)] p-2.5 shadow-[0_24px_52px_rgba(94,92,230,0.12)]">
                    <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(248,249,255,0.98)_0%,rgba(255,255,255,1)_100%)] p-1.5">
                      <ProductMockup
                        copy={strings[lang].mockup}
                        lang={lang}
                        onboarding
                        staticState
                        compact
                        scrollActiveHintId={activeMobileHintId}
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="w-full max-w-[344px]"
                  style={{
                    opacity: mix(0.96, 1, mobileHintsRevealProgress),
                    transform: `translateY(${mix(-45, -35, mobileHintsRevealProgress)}px)`,
                    filter: `blur(${mix(2, 0, mobileHintsRevealProgress)}px)`,
                    willChange: "transform, opacity, filter",
                  }}
                >
                  <div className="rounded-[26px] border border-[rgba(29,29,31,0.08)] bg-[rgba(255,255,255,0.96)] px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                    <p className="text-[11px] font-[700] uppercase tracking-[0.15em] text-[#6B65CC]">
                      {lang === "ru" ? "Разберём по частям" : "Let's break it down"}
                    </p>
                    <h2 className="mt-2.5 text-[20px] font-[700] leading-[1] tracking-[-0.04em] text-[#111111]">
                      {activeMobileHintContent.title}
                    </h2>
                    <p className="mt-2.5 text-[12px] leading-[1.45] text-[#61616a]">
                      {activeMobileHintContent.body}
                    </p>
                    <div className="mt-4 flex gap-2">
                      {HINT_IDS.map((id) => (
                        <div
                          key={id}
                          className="rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: activeScrollHint === id ? 22 : 6,
                            height: 6,
                            backgroundColor: activeScrollHint === id ? "#5e5ce6" : "#d1d1d6",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HERO + ONBOARDING — объединённая sticky-секция */}
        <section
          ref={heroRef}
          id="hero-desktop"
          className="relative hidden md:block"
          style={{ minHeight: "300vh" }}
        >
          <div
            className="sticky top-0 flex items-center overflow-hidden"
            style={{
              minHeight: "100svh",
              padding: "132px clamp(20px, 4vw, 40px) 88px",
              background:
                "radial-gradient(circle at 82% 22%, rgba(94,92,230,0.12), transparent 30%), linear-gradient(180deg, #ffffff 0%, #fbfbfd 78%, #f5f5f7 100%)",
            }}
          >
            <div
              className="w-full mx-auto relative md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center"
              style={{
                maxWidth: "min(1200px, 90vw)",
                minHeight: "100%",
                columnGap: "clamp(60px, 6vw, 80px)",
              }}
            >
              <div
                className="absolute left-0 top-1/2"
                style={{
                  width: "min(560px, calc((100% - clamp(60px, 6vw, 80px)) / 2))",
                  transform: `translateY(-50%) translateX(${mix(
                    0,
                    -48,
                    heroFadeProgress
                  )}px) scale(${mix(1, 0.985, heroFadeProgress)})`,
                  opacity: 1 - heroFadeProgress,
                  filter: `blur(${mix(0, 10, heroFadeProgress)}px)`,
                  pointerEvents: heroPhase === "hero" ? "auto" : "none",
                  willChange: "transform, opacity, filter",
                }}
              >
                <AnimateOnScroll
                  as="p"
                  delay={0}
                  className="mb-5 text-[13px] font-[600] uppercase tracking-[0.18em] text-[#6B65CC]"
                >
                  {t("heroEyebrow")}
                </AnimateOnScroll>
                <AnimateOnScroll
                  as="h1"
                  delay={0.08}
                  className="mb-6 max-w-[700px] leading-[0.96] text-[#111111]"
                  style={{
                    ...UI_DISPLAY_STYLE,
                    fontSize: "clamp(40px, 4.5vw, 62px)",
                  }}
                >
                  {heroHeadlineLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </AnimateOnScroll>
                <AnimateOnScroll
                  as="p"
                  delay={0.16}
                  className="mb-8 max-w-[420px] text-[16px] font-[400] leading-[1.62] text-[#5a5a63] md:max-w-[360px] md:text-[17px]"
                >
                  {t("heroSub")}
                </AnimateOnScroll>
                <AnimateOnScroll
                  delay={0.22}
                  className="flex flex-wrap gap-x-8 gap-y-5"
                >
                  {heroMetrics.map((metric) => (
                    <div key={metric.title} className="min-w-[132px]">
                      <p className="text-[18px] font-[700] leading-none text-[#5B54D6] md:text-[20px]">
                        {metric.title}
                      </p>
                      <p className="mt-2 text-[15px] font-[400] leading-[1.45] text-[#8a8a94] md:text-[16px]">
                        <span className="block">{metric.lines[0]}</span>
                        <span className="block">{metric.lines[1]}</span>
                      </p>
                    </div>
                  ))}
                </AnimateOnScroll>
              </div>

              {animComplete && (
                <div
                  className="absolute top-1/2"
                  style={{
                    right: 0,
                    width: "min(340px, 29vw)",
                    transform: `translateY(-50%) translateX(${mix(
                      28,
                      0,
                      hintsRevealProgress
                    )}px)`,
                    opacity: hintsRevealProgress,
                    filter: `blur(${mix(10, 0, hintsRevealProgress)}px)`,
                    pointerEvents: "none",
                    zIndex: 10,
                    willChange: "transform, opacity, filter",
                  }}
                >
                  <div
                    style={{
                      paddingLeft: 28,
                      borderLeft: "1px solid rgba(209,209,214,0.9)",
                    }}
                  >
                    <p className="mb-5 text-[13px] font-[600] uppercase tracking-[0.16em] text-[#6e6e73]">
                      {lang === "ru" ? "Разберём по частям" : "Let's break it down"}
                    </p>

                    {activeScrollHint ? (
                      <div>
                        <h2
                          className="mb-4 leading-[1.04]"
                          style={{
                            ...UI_DISPLAY_STYLE,
                            fontSize: "clamp(30px, 3vw, 44px)",
                            color: "#1d1d1f",
                          }}
                        >
                          {scrollHintContent[activeScrollHint as (typeof HINT_IDS)[number]]?.title}
                        </h2>
                        <p className="text-[16px] font-[400] leading-[1.62] text-[#6e6e73] md:text-[17px]">
                          {scrollHintContent[activeScrollHint as (typeof HINT_IDS)[number]]?.body}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-8 flex gap-2">
                      {HINT_IDS.map((id) => (
                        <div
                          key={id}
                          className="rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: activeScrollHint === id ? 28 : 6,
                            height: 6,
                            backgroundColor:
                              activeScrollHint === id ? "#5e5ce6" : "#d1d1d6",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div
                className="absolute top-1/2"
                style={{
                  left: cardLeft,
                  transform: `translate(-50%, -50%) scale(${cardScale})`,
                  transition: "none",
                  transformOrigin: "center center",
                  willChange: "transform, left",
                }}
              >
                <div
                  className="absolute rounded-full pointer-events-none"
                  aria-hidden="true"
                  style={{
                    width: "min(560px, 94vw)",
                    aspectRatio: 1,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(circle, rgba(94,92,230,0.18), transparent 62%), radial-gradient(circle at 32% 28%, rgba(33,168,154,0.16), transparent 38%)",
                    filter: "blur(10px)",
                    opacity: cardGlowOpacity,
                  }}
                />

                <ProductMockup
                  copy={strings[lang].mockup}
                  lang={lang}
                  onboarding={animComplete}
                  staticState={animComplete}
                  large
                  scrollActiveHintId={heroPhase === "hints" ? activeScrollHint : null}
                  onAnimationComplete={() => setAnimComplete(true)}
                  skipAnimation={skipAnim}
                  skipAnimationInstant={skipAnimInstant}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          ref={mobileScrollyRef}
          id="scrolly-mobile"
          className="relative bg-[linear-gradient(180deg,#ffffff_0%,#fafbff_100%)] md:hidden"
          style={{ minHeight: "260vh" }}
        >
          <div
            className="sticky top-0 flex items-center px-4 py-16"
            style={{ minHeight: "100svh" }}
          >
            <div className="relative mx-auto w-full max-w-[430px]" style={{ minHeight: 420 }}>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[320ms]"
                style={{
                  opacity: scrollyStep === 0 ? 1 : 0,
                  transitionDuration: prefersReducedMotion ? "0ms" : "320ms",
                  transform:
                    scrollyStep === 0
                      ? "translateY(0)"
                      : scrollyStep > 0
                        ? "translateY(-18px)"
                        : "translateY(18px)",
                  pointerEvents: scrollyStep === 0 ? "auto" : "none",
                }}
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(94,92,230,0.1)] text-[#5e5ce6]">
                  <Headphones size={24} aria-hidden="true" />
                </div>
                <p className="mt-4 text-[#111111]" style={{ ...SCROLL_DISPLAY_STYLE, fontSize: "clamp(34px, 10vw, 48px)", letterSpacing: "-2px" }}>
                  {mobileStorySteps[0].title}
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[320ms]"
                style={{
                  opacity: scrollyStep === 1 ? 1 : 0,
                  transitionDuration: prefersReducedMotion ? "0ms" : "320ms",
                  transform:
                    scrollyStep === 1
                      ? "translateY(0)"
                      : scrollyStep > 1
                        ? "translateY(-18px)"
                        : "translateY(18px)",
                  pointerEvents: scrollyStep === 1 ? "auto" : "none",
                }}
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(94,92,230,0.1)] text-[#5e5ce6]">
                  <MessageSquareText size={24} aria-hidden="true" />
                </div>
                <p className="mt-4 text-[#111111]" style={{ ...SCROLL_DISPLAY_STYLE, fontSize: "clamp(34px, 10vw, 48px)", letterSpacing: "-2px" }}>
                  {mobileStorySteps[1].title}
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[320ms]"
                style={{
                  opacity: scrollyStep === 2 ? 1 : 0,
                  transitionDuration: prefersReducedMotion ? "0ms" : "320ms",
                  transform:
                    scrollyStep === 2
                      ? "translateY(0)"
                      : scrollyStep > 2
                        ? "translateY(-18px)"
                        : "translateY(18px)",
                  pointerEvents: scrollyStep === 2 ? "auto" : "none",
                }}
              >
                <div
                  className="mb-6 inline-flex items-center justify-center rounded-[22px] bg-[#f5f5f7] px-6 py-5 text-[#5e5ce6] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(0,0,0,0.06)]"
                  style={{ minWidth: 128 }}
                >
                  <span className="text-[34px] font-[700] leading-none">{t("scrollyKey")}</span>
                </div>
                <p className="mt-4 text-[#111111]" style={{ ...SCROLL_DISPLAY_STYLE, fontSize: "clamp(34px, 10vw, 48px)", letterSpacing: "-2px" }}>
                  {mobileStorySteps[2].title}
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[320ms]"
                style={{
                  opacity: scrollyStep === 3 ? 1 : 0,
                  transitionDuration: prefersReducedMotion ? "0ms" : "320ms",
                  transform:
                    scrollyStep === 3
                      ? "translateY(0)"
                      : scrollyStep > 3
                        ? "translateY(-18px)"
                        : "translateY(18px)",
                  pointerEvents: scrollyStep === 3 ? "auto" : "none",
                }}
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(33,168,154,0.12)] text-[#1f9d63]">
                  <LockKeyhole size={24} aria-hidden="true" />
                </div>
                <p className="mt-4 text-[#111111]" style={{ ...SCROLL_DISPLAY_STYLE, fontSize: "clamp(34px, 10vw, 48px)", letterSpacing: "-2px" }}>
                  {mobileStorySteps[3].title}
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[320ms]"
                style={{
                  opacity: scrollyStep === 4 ? 1 : 0,
                  transitionDuration: prefersReducedMotion ? "0ms" : "320ms",
                  transform: scrollyStep === 4 ? "translateY(0)" : "translateY(18px)",
                  pointerEvents: scrollyStep === 4 ? "auto" : "none",
                }}
              >
                <p className="text-[#111111]" style={{ ...SCROLL_DISPLAY_STYLE, fontSize: "clamp(34px, 10vw, 48px)", letterSpacing: "-2px" }}>
                  {t("scrollyStep5")}
                </p>
                <p className="mx-auto mt-5 max-w-[28ch] text-[15px] leading-[1.6] text-[#666670]">
                  {t("scrollyStep5Sub")}
                </p>
                <a
                  href="#download"
                  className="mt-7 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#1d1d1f] px-6 text-[15px] font-[600] leading-none text-white shadow-[0_16px_30px_rgba(29,29,31,0.16)]"
                >
                  {t("joinWaitlist")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SCROLLYTELLING */}
        <section
          ref={scrollyRef}
          id="scrolly-desktop"
          className="relative hidden bg-white md:block"
          style={{ minHeight: "320vh" }}
        >
          <div
            className="sticky top-0 flex items-center bg-white"
            style={{ minHeight: "100svh", padding: "112px 20px" }}
          >
            <div className="relative w-full mx-auto" style={{ maxWidth: "min(700px, 100%)", minHeight: 320 }}>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[400ms]"
                style={{
                  opacity: scrollyStep === 0 ? 1 : scrollyStep < 0 ? 1 : 0,
                  transform: scrollyStep === 0 ? "translateY(0)" : scrollyStep > 0 ? "translateY(-24px)" : "translateY(24px)",
                  pointerEvents: scrollyStep === 0 ? "auto" : "none",
                  transitionTimingFunction: scrollyStep === 0 ? "cubic-bezier(0.4, 0, 0.2, 1)" : "cubic-bezier(0.4, 0, 1, 1)",
                }}
              >
                <div
                  className="mb-8 inline-flex text-[#5e5ce6]"
                  style={{
                    transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                    transitionDelay: scrollyStep === 0 ? "100ms" : "0ms",
                    transform: scrollyStep === 0 ? "scale(1)" : "scale(0.8)",
                    opacity: scrollyStep === 0 ? 1 : 0,
                  }}
                  aria-hidden="true"
                >
                  <Headphones size={32} />
                </div>
                <p className="text-[#1d1d1f]" style={SCROLL_DISPLAY_STYLE}>
                  {t("scrollyStep1")}
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[400ms]"
                style={{
                  opacity: scrollyStep === 1 ? 1 : 0,
                  transform: scrollyStep === 1 ? "translateY(0)" : scrollyStep > 1 ? "translateY(-24px)" : "translateY(24px)",
                  pointerEvents: scrollyStep === 1 ? "auto" : "none",
                  transitionTimingFunction: scrollyStep === 1 ? "cubic-bezier(0.4, 0, 0.2, 1)" : "cubic-bezier(0.4, 0, 1, 1)",
                }}
              >
                <div
                  className="mb-8 inline-flex text-[#5e5ce6]"
                  style={{
                    transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                    transitionDelay: scrollyStep === 1 ? "100ms" : "0ms",
                    transform: scrollyStep === 1 ? "scale(1)" : "scale(0.8)",
                    opacity: scrollyStep === 1 ? 1 : 0,
                  }}
                  aria-hidden="true"
                >
                  <MessageSquareText size={32} />
                </div>
                <p className="text-[#1d1d1f]" style={SCROLL_DISPLAY_STYLE}>
                  {t("scrollyStep2")}
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[400ms]"
                style={{
                  opacity: scrollyStep === 2 ? 1 : 0,
                  transform: scrollyStep === 2 ? "translateY(0)" : scrollyStep > 2 ? "translateY(-24px)" : "translateY(24px)",
                  pointerEvents: scrollyStep === 2 ? "auto" : "none",
                  transitionTimingFunction: scrollyStep === 2 ? "cubic-bezier(0.4, 0, 0.2, 1)" : "cubic-bezier(0.4, 0, 1, 1)",
                }}
              >
                <div
                  className="mb-8 inline-flex items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#5e5ce6] font-[700]"
                  style={{
                    minWidth: 100,
                    minHeight: 72,
                    fontSize: "clamp(28px, 3.5vw, 42px)",
                    padding: "0 24px",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.06)",
                    transition: "transform 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                    transitionDelay: scrollyStep === 2 ? "100ms" : "0ms",
                    transform: scrollyStep === 2 ? "scale(1)" : "scale(0.8)",
                    opacity: scrollyStep === 2 ? 1 : 0,
                  }}
                >
                  {"\u2318J"}
                </div>
                <p className="text-[#1d1d1f]" style={SCROLL_DISPLAY_STYLE}>
                  {t("scrollyStep3")}
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[400ms]"
                style={{
                  opacity: scrollyStep === 3 ? 1 : 0,
                  transform: scrollyStep === 3 ? "translateY(0)" : scrollyStep > 3 ? "translateY(-24px)" : "translateY(24px)",
                  pointerEvents: scrollyStep === 3 ? "auto" : "none",
                  transitionTimingFunction: scrollyStep === 3 ? "cubic-bezier(0.4, 0, 0.2, 1)" : "cubic-bezier(0.4, 0, 1, 1)",
                }}
              >
                <p className="text-[#1d1d1f]" style={SCROLL_DISPLAY_STYLE}>
                  {t("scrollyStep4")}
                </p>
              </div>

              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-[400ms]"
                style={{
                  opacity: scrollyStep === 4 ? 1 : 0,
                  transform: scrollyStep === 4 ? "translateY(0)" : "translateY(24px)",
                  pointerEvents: scrollyStep === 4 ? "auto" : "none",
                  transitionTimingFunction: scrollyStep === 4 ? "cubic-bezier(0.4, 0, 0.2, 1)" : "cubic-bezier(0.4, 0, 1, 1)",
                }}
              >
                <p className="mb-6 text-[#1d1d1f]" style={SCROLL_DISPLAY_STYLE}>
                  {t("scrollyStep5")}
                </p>
                <p className="mx-auto mb-7 max-w-[560px] text-[16px] font-[400] leading-[1.58] text-[#6e6e73] md:text-[17px]">
                  {t("scrollyStep5Sub")}
                </p>
                <a
                  href="#download"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[600] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] transition-all duration-150 hover:bg-[#4846c9] hover:-translate-y-px"
                >
                  {t("heroPrimary")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAND */}
        <StatsBand lang={lang} />

        {/* FEATURES */}
        <section className="px-4 py-20 sm:px-5 md:py-28" id="features">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="mb-10 max-w-3xl md:mb-12">
              <p className="mb-3 text-[13px] font-[600] tracking-[0.16em] uppercase text-[#6e6e73]">
                {t("featuresEyebrow")}
              </p>
              <h2 className="mb-5 text-[clamp(34px,4vw,54px)] font-[700] leading-[1.06] tracking-[-0.04em]">
                {t("featuresTitle")}
              </h2>
              <p className="max-w-[640px] text-[16px] font-[400] leading-[1.65] text-[#6e6e73] md:text-[17px]">
                {t("featuresSub")}
              </p>
            </AnimateOnScroll>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tFeatures().map(([title, body], i) => {
                const IconComp = featureIcons[i];
                return (
                  <AnimateOnScroll
                    key={title}
                    delay={(i + 1) * 0.05}
                    whileHover={{
                      y: -6,
                      boxShadow: "0 20px 40px -12px rgba(0,0,0,0.12)",
                      transition: { type: "spring", stiffness: 300, damping: 20 },
                    }}
                    className="group relative cursor-default overflow-hidden rounded-[18px] border border-[#e5e5ea] bg-white p-7 transition-[border-color,box-shadow] duration-300 hover:border-[rgba(94,92,230,0.28)] hover:shadow-[0_24px_48px_-16px_rgba(94,92,230,0.22)]"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-0 blur-[44px] transition-opacity duration-500 group-hover:opacity-100"
                      style={{ background: "radial-gradient(circle, rgba(94,92,230,0.22), transparent 70%)" }}
                    />
                    <span className="absolute right-6 top-6 text-[13px] font-[700] tabular-nums tracking-[0.04em] text-[#d4d4dd] transition-colors duration-300 group-hover:text-[#a9a7f0]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#5e5ce6] transition-all duration-300 group-hover:-translate-y-[3px] group-hover:bg-[linear-gradient(135deg,#5e5ce6_0%,#4846c9_100%)] group-hover:text-white group-hover:shadow-[0_10px_22px_rgba(94,92,230,0.32)]">
                      <IconComp size={22} aria-hidden="true" />
                    </div>
                    <h3 className="relative mb-2 text-[18px] font-[700] tracking-[-0.02em]">{title}</h3>
                    <p className="relative text-[16px] font-[400] leading-[1.6] text-[#6e6e73]">{body}</p>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="bg-[#f5f5f7] px-4 py-20 sm:px-5 md:py-28" id="pricing">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="mb-10 max-w-3xl md:mb-12">
              <p className="mb-3 text-[13px] font-[600] tracking-[0.16em] uppercase text-[#6e6e73]">
                {t("pricingEyebrow")}
              </p>
              <h2 className="text-[clamp(34px,4vw,54px)] font-[700] leading-[1.06] tracking-[-0.04em]">
                {t("pricingTitle")}
              </h2>
              <p className="mt-5 max-w-[780px] text-[17px] font-[400] leading-[1.62] text-[#5a5a63]">
                {t("pricingSub")}
              </p>
              <p className="mt-4 text-[14px] font-[600] text-[#3f3f46]">
                {t("pricingTrustLine")}
              </p>
            </AnimateOnScroll>
            <AnimateOnScroll
              delay={0.06}
              className="rounded-[28px] border border-[rgba(29,29,31,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(246,248,255,0.92)_100%)] p-7 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-9"
            >
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <p className="text-[13px] font-[700] uppercase tracking-[0.16em] text-[#645FDE]">
                    {t("downloadCardLabel")}
                  </p>
                  <h3 className="mt-3 text-[clamp(28px,3vw,40px)] font-[700] leading-[1.05] tracking-[-0.04em] text-[#1d1d1f]">
                    {t("downloadCardTitle")}
                  </h3>
                  <p className="mt-4 max-w-[56ch] text-[16px] font-[400] leading-[1.65] text-[#5a5a63]">
                    {t("downloadCardBody")}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[rgba(94,92,230,0.12)] bg-[rgba(255,255,255,0.88)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <p className="text-[12px] font-[700] uppercase tracking-[0.16em] text-[#8a8a94]">
                    {t("downloadCardStatusLabel")}
                  </p>
                  <p className="mt-3 text-[34px] font-[700] leading-none tracking-[-0.04em] text-[#1d1d1f]">
                    {t("downloadCardStatus")}
                  </p>
                  <p className="mt-4 text-[15px] font-[400] leading-[1.6] text-[#6e6e73]">
                    {t("downloadCardNote")}
                  </p>
                  <a
                    href="#download"
                    className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#5e5ce6] px-6 text-[15px] font-[600] leading-none text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] transition-all duration-150 hover:bg-[#4846c9] hover:-translate-y-px"
                  >
                    {t("downloadCta")}
                  </a>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-20 sm:px-5 md:py-28" id="faq">
          <div className="mx-auto" style={{ maxWidth: "min(720px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
              <p className="mb-3 text-[13px] font-[600] tracking-[0.16em] uppercase text-[#6e6e73]">
                {t("faqEyebrow")}
              </p>
              <h2 className="text-[clamp(34px,4vw,54px)] font-[700] leading-[1.06] tracking-[-0.04em]">
                {t("faqTitle")}
              </h2>
            </AnimateOnScroll>
            <FaqPro
              items={tFaqs()}
              defaultOpenFirst
              className="w-full max-w-3xl mx-auto"
            />
          </div>
        </section>

        <section id="download" className="px-4 py-20 text-center sm:px-5 md:py-28">
          <div className="mx-auto" style={{ maxWidth: "min(900px, 100%)" }}>
            <h2 className="text-[clamp(28px,4vw,46px)] font-[700] leading-[1.08] tracking-[-0.04em] text-[#1d1d1f]">
              {lang === "ru" ? "Скачать LiveAssist AI" : "Download LiveAssist AI"}
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[16px] font-[400] leading-[1.6] text-[#6e6e73] md:text-[17px]">
              {lang === "ru"
                ? "Доступно для Mac, Windows и Linux. Попробуйте бесплатно."
                : "Available for Mac, Windows, and Linux. Free to try."}
            </p>

            <div className="mx-auto mt-10 grid max-w-[640px] gap-3 sm:grid-cols-3">
              {[
                {
                  href: "https://github.com/Aibek-koken/liveassist-downloads-/releases/download/v0.1.0/LiveAssist.AI-0.1.0-arm64.dmg",
                  label: "Mac",
                  sub: "Apple Silicon",
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.05 12.04c-.03-2.85 2.33-4.22 2.44-4.29-1.33-1.95-3.4-2.22-4.14-2.25-1.76-.18-3.44 1.04-4.33 1.04-.89 0-2.27-1.02-3.74-.99-1.92.03-3.7 1.12-4.69 2.84-2 3.47-.51 8.6 1.43 11.42.95 1.38 2.08 2.93 3.56 2.87 1.43-.06 1.97-.92 3.7-.92 1.72 0 2.21.92 3.72.89 1.54-.03 2.51-1.4 3.45-2.79 1.09-1.6 1.54-3.15 1.56-3.23-.03-.01-2.99-1.15-3.02-4.56zM14.2 3.78c.79-.96 1.32-2.29 1.18-3.62-1.14.05-2.52.76-3.33 1.71-.73.85-1.37 2.21-1.2 3.51 1.27.1 2.57-.65 3.35-1.6z" />
                    </svg>
                  ),
                },
                {
                  href: "https://github.com/Aibek-koken/liveassist-downloads-/releases/download/v0.1.0/LiveAssist.AI.Setup.0.1.0.1.exe",
                  label: "Windows",
                  sub: "Windows 10/11",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 5.48l7.42-1.01v7.16H3V5.48zm0 13.04l7.42 1.01v-7.07H3v6.06zM11.27 4.35L21 3v8.63h-9.73V4.35zm0 15.3L21 21v-8.55h-9.73v7.2z" />
                    </svg>
                  ),
                },
                {
                  href: "https://github.com/Aibek-koken/liveassist-downloads-/releases/download/v0.1.0/LiveAssist.AI-0.1.0.1.AppImage",
                  label: "Linux",
                  sub: "AppImage",
                  icon: (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.918-.601.146-.036.292-.065.43-.065zm2.467 7.7c-.034.024-.063.04-.087.064-.13.135-.323.27-.553.401-.236.135-.58.27-.86.27-.32 0-.66-.135-.91-.27a3.196 3.196 0 01-.43-.27c-.135.067-.32.135-.52.2a4.44 4.44 0 00-.756.333 6.79 6.79 0 00-.78.534 8.34 8.34 0 00-.737.668 7.9 7.9 0 00-.6.668c.063.135.149.336.176.535.061.4.061.802-.07 1.114h.002c.04.04.092.07.151.135.06.067.13.135.222.2.184.135.426.2.66.2.318 0 .587-.07.798-.135a2.93 2.93 0 00.524-.2c.157-.069.28-.135.4-.2.118-.066.214-.135.34-.135.143 0 .258.07.34.135.083.066.158.135.23.2.146.135.302.27.564.337.26.067.578.067.927-.067.347-.135.683-.4.92-.668.236-.27.42-.6.42-.935 0-.336-.184-.6-.42-.802-.236-.2-.578-.4-.84-.667a4.434 4.434 0 01-.55-.668c-.16-.27-.27-.534-.34-.802z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-[18px] border border-[rgba(29,29,31,0.1)] bg-white px-4 py-3.5 text-left shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(94,92,230,0.32)] hover:shadow-[0_16px_32px_rgba(94,92,230,0.12)]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#f5f5f7] text-[#1d1d1f] transition-colors duration-200 group-hover:bg-[rgba(94,92,230,0.1)] group-hover:text-[#5e5ce6]">
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-[500] uppercase tracking-[0.08em] text-[#8a8a94]">
                      {lang === "ru" ? "Скачать для" : "Download for"}
                    </span>
                    <span className="block text-[15px] font-[700] leading-tight tracking-[-0.01em] text-[#1d1d1f]">
                      {item.label}
                    </span>
                    <span className="block text-[11px] font-[400] text-[#9ca3af]">
                      {item.sub}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <p className="mx-auto mt-7 inline-flex max-w-[52ch] flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[13px] leading-[1.5] text-[#8a8a94]">
              {lang === "ru"
                ? "Для Mac после установки выполните в Terminal:"
                : "Mac users — after install, run in Terminal:"}
              <code className="rounded-md bg-[#f5f5f7] px-2 py-0.5 text-[12px] text-[#3f3f46]">
                {"xattr -cr /Applications/LiveAssist\\ AI.app"}
              </code>
            </p>
          </div>
        </section>
      </main>

      <InteractiveFooter
        copy={{
          logo: t("logo"),
          tagline: t("footerTagline"),
          privacy: t("privacy"),
          terms: t("terms"),
          contact: t("contact"),
        }}
      />
    </>
  );
}
