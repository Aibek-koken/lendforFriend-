"use client";

import { useState, useEffect, useRef, FormEvent, useCallback } from "react";
import {
  Briefcase,
  CreditCard,
  FileText,
  FileSearch,
  HelpCircle,
  Layers,
  Keyboard,
  Mic,
  Shield,
  Check,
  MessageSquareText,
  Headphones,
} from "lucide-react";
import { strings, type Lang } from "../lib/strings";
import { FaqPro, type FaqProItem } from "@/components/ui/faq-pro";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { AnimateOnScroll } from "../components/ui/animate-on-scroll";
import { InteractiveFooter } from "../components/InteractiveFooter";
import ProductMockup from "./components/ProductMockup";

const useIcons = ["\uD83C\uDF93", "\u2708\uFE0F", "\u279A", "\u2699", "\u2302", "\u25A3", "\u260E", "\u25C7"];

const navConfig = [
  { id: "how-it-works", labelKey: "navHow", url: "#how-it-works", icon: Layers },
  { id: "use-cases", labelKey: "navUseCases", url: "#use-cases", icon: Briefcase },
  { id: "pricing", labelKey: "navPricing", url: "#pricing", icon: CreditCard },
  { id: "faq", labelKey: "navFaq", url: "#faq", icon: HelpCircle },
] as const;

const faqIds = ["listening", "sources", "customer", "sales-only", "crm"] as const;
const HINT_IDS = ["question", "answer", "confidence", "source"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  highlighted?: boolean;
  badge?: string;
  cta: string;
  footnote: string;
  features: string[];
};

type HeroMetric = {
  title: string;
  lines: [string, string];
};

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
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [emailError, setEmailError] = useState<"" | "invalid" | "server" | "unavailable">("");
  const [scrollyStep, setScrollyStep] = useState(0);
  const [activeTab, setActiveTab] = useState<(typeof navConfig)[number]["id"]>(
    navConfig[0].id
  );
  const scrollyProgressRef = useRef(0);
  const scrollyTargetRef = useRef(0);
  const scrollyLastRawRef = useRef(-1);

  const scrollyRef = useRef<HTMLElement>(null);
  // Hero scroll refs
  const heroRef = useRef<HTMLElement>(null);
  const heroProgressRef = useRef(0);
  const heroTargetRef = useRef(0);

  // Hero scroll state
  const [heroPhase, setHeroPhase] = useState<"hero" | "transition" | "hints">("hero");
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [activeScrollHint, setActiveScrollHint] = useState<string | null>(null);
  const [animComplete, setAnimComplete] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);
  const [skipAnimInstant, setSkipAnimInstant] = useState(false);
  const scrollLockedRef = useRef(false);

  const t = (key: string) => {
    const val = (strings[lang] as Record<string, unknown>)[key];
    return val as string;
  };

  const tPricing = (): PricingPlan[] => {
    return (strings[lang] as Record<string, unknown>).pricing as PricingPlan[];
  };

  const tFeatures = (): [string, string][] => {
    return (strings[lang] as Record<string, unknown>).features as [string, string][];
  };

  const tSteps = (): [string, string][] => {
    return (strings[lang] as Record<string, unknown>).steps as [string, string][];
  };

  const tUseCases = (): string[] => {
    return (strings[lang] as Record<string, unknown>).useCases as string[];
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

  const updateHeroScrollState = useCallback((progress: number) => {
    setHeroScrollProgress(progress);

    if (progress < 0.05) {
      setHeroPhase("hero");
      setActiveScrollHint(null);
      return;
    }

    if (progress < HERO_MORPH.hintsRegionStart) {
      setHeroPhase("transition");
      setActiveScrollHint(null);
      return;
    }

    setHeroPhase("hints");
    const hintsP = clamp01(
      (progress - HERO_MORPH.hintsRegionStart) / (1 - HERO_MORPH.hintsRegionStart)
    );
    const idx = Math.min(3, Math.floor(hintsP * 4));
    setActiveScrollHint(HINT_IDS[idx]);
  }, []);

  const readHeroScrollProgress = useCallback(() => {
    const section = heroRef.current;
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
    const sectionIds = ["how-it-works", "use-cases", "pricing", "faq"];

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

    if (!scrollyRef.current) return;
    const section = scrollyRef.current;
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
      scrollyProgressRef.current += (scrollyTargetRef.current - scrollyProgressRef.current) * 0.08;

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
    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  useEffect(() => {
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
  }, [animComplete]);

  useEffect(() => {
    document.body.style.overflow = menuOpen || !animComplete ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [animComplete, menuOpen]);

  // Hero scroll-driven animation
  useEffect(() => {
    if (!animComplete) return;
    const section = heroRef.current;
    if (!section) return;
    let rafId: number;

    const onScroll = () => {
      heroTargetRef.current = readHeroScrollProgress();
    };

    const initialProgress = readHeroScrollProgress();
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
  }, [animComplete, readHeroScrollProgress, updateHeroScrollState]);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("invalid");
      setEmailStatus("idle");
      return;
    }

    try {
      setEmailError("");
      setEmailStatus("submitting");

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          lang,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { errorCode?: string }
          | null;

        setEmailError(
          payload?.errorCode === "waitlist_not_configured" ? "unavailable" : "server"
        );
        setEmailStatus("idle");
        return;
      }

      setEmail("");
      setEmailError("");
      setEmailStatus("success");
    } catch {
      setEmailError("server");
      setEmailStatus("idle");
    }
  }

  const featureIcons = [FileText, FileSearch, Layers, Keyboard, Mic, Shield];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-180 ease-out">
        <nav
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 w-full px-5 pt-7 pb-3 mx-auto"
          style={{ maxWidth: "min(1180px, calc(100% - 40px))" }}
          aria-label={t("navLabel")}
        >
          <span className="inline-flex min-h-10 select-none items-center gap-2 text-[15px] font-[700] text-[#1d1d1f]">
            {t("logo")}
          </span>

          <NavBar
            items={navItems}
            activeTab={activeTab}
            setActiveTab={(id) =>
              setActiveTab(id as (typeof navConfig)[number]["id"])
            }
            className="hidden md:flex items-center justify-center"
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
              href="#waitlist"
              className="hidden md:inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[rgba(72,70,201,0.34)] bg-[linear-gradient(180deg,rgba(114,107,255,0.98)_0%,rgba(94,92,230,1)_100%)] px-5 text-[15px] font-[600] leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-150 hover:border-[rgba(72,70,201,0.42)] hover:bg-[linear-gradient(180deg,rgba(103,96,247,1)_0%,rgba(72,70,201,1)_100%)] hover:-translate-y-px"
            >
              {t("joinWaitlist")}
            </a>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden inline-flex min-w-[44px] min-h-[44px] flex-col items-center justify-center gap-[4px] rounded-full border border-[rgba(29,29,31,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,246,255,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-all duration-150 hover:border-[rgba(99,91,255,0.22)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(238,242,255,0.96)_100%)]"
              aria-label={menuOpen ? t("closeMenuLabel") : t("openMenuLabel")}
              aria-expanded={menuOpen}
            >
              <span
                className="w-[17px] h-[2px] rounded-full bg-[#1d1d1f] transition-transform duration-180"
                style={{ transform: menuOpen ? "translateY(6px) rotate(45deg)" : "" }}
              />
              <span
                className="w-[17px] h-[2px] rounded-full bg-[#1d1d1f] transition-opacity duration-180"
                style={{ opacity: menuOpen ? 0 : 1 }}
              />
              <span
                className="w-[17px] h-[2px] rounded-full bg-[#1d1d1f] transition-transform duration-180"
                style={{ transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "" }}
              />
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="md:hidden border-t border-[#e5e5ea] bg-white px-5 py-6 space-y-3">
            {[
              ["navHow", "#scrolly"],
              ["navUseCases", "#use-cases"],
              ["navPricing", "#pricing"],
              ["navFaq", "#faq"],
            ].map(([key, href]) => (
              <a
                key={key}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-full px-[14px] py-3 text-[15px] font-[500] text-[#6e6e73] hover:text-[#5e5ce6]"
              >
                {t(key)}
              </a>
            ))}
            <a
              href="#waitlist"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[600] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] w-full"
            >
              {t("joinWaitlist")}
            </a>
          </div>
        )}
      </header>

      <main id="top" style={{ overflow: "clip" }}>
        {/* HERO + ONBOARDING — объединённая sticky-секция */}
        <section
          ref={heroRef}
          id="hero"
          className="relative"
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
              {/* ── Текст Hero (уходит при скролле) ── */}
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

              {/* ── Текст Onboarding (появляется в hints-фазе справа) ── */}
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
                    <p className="text-[13px] font-[600] tracking-[0.16em] uppercase text-[#6e6e73] mb-5">
                      {lang === "ru" ? "Разберём по частям" : "Let's break it down"}
                    </p>

                    {activeScrollHint &&
                      (() => {
                        const texts: Record<string, { title: string; body: string }> =
                          lang === "ru"
                            ? {
                                question: {
                                  title: "Вопрос клиента",
                                  body: "Менеджер нажимает хоткей в момент звонка. Вопрос уходит в overlay тихо и без переключения контекста.",
                                },
                                answer: {
                                  title: "Готовый ответ",
                                  body: "AI возвращает короткую формулировку, которую можно сразу озвучить, без импровизации и пауз.",
                                },
                                confidence: {
                                  title: "Уверенность AI",
                                  body: "Сигнал уверенности помогает понять, когда можно отвечать сразу, а когда лучше перепроверить.",
                                },
                                source: {
                                  title: "Источник ответа",
                                  body: "Файл и страница остаются рядом с ответом, чтобы менеджер видел основание, а не просто догадку модели.",
                                },
                              }
                            : {
                                question: {
                                  title: "Customer question",
                                  body: "The rep triggers the overlay mid-call. The question is captured without breaking the flow of the conversation.",
                                },
                                answer: {
                                  title: "Ready-to-say answer",
                                  body: "AI returns a compact phrase the rep can use immediately instead of improvising under pressure.",
                                },
                                confidence: {
                                  title: "AI confidence",
                                  body: "The confidence signal tells the rep when to answer directly and when to pause for a quick double-check.",
                                },
                                source: {
                                  title: "Source document",
                                  body: "The file and page stay attached to the answer so the rep sees evidence, not just a model guess.",
                                },
                              };
                        const c = texts[activeScrollHint];
                        return c ? (
                          <div>
                            <h2
                              className="mb-4 leading-[1.04]"
                              style={{
                                ...UI_DISPLAY_STYLE,
                                fontSize: "clamp(30px, 3vw, 44px)",
                                color: "#1d1d1f",
                              }}
                            >
                              {c.title}
                            </h2>
                            <p className="text-[16px] font-[400] leading-[1.62] text-[#6e6e73] md:text-[17px]">
                              {c.body}
                            </p>
                          </div>
                        ) : null;
                      })()}

                    <div className="flex gap-2 mt-8">
                      {(["question", "answer", "confidence", "source"] as const).map(
                        (id) => (
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
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ProductMockup: едет из правой колонки в центр ── */}
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
                {/* Glow */}
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

        {/* SCROLLYTELLING */}
        <section
          ref={scrollyRef}
          id="scrolly"
          className="relative bg-white"
          style={{ minHeight: "500vh" }}
        >
          <div
            className="sticky top-0 flex items-center bg-white"
            style={{ minHeight: "100svh", padding: "112px 20px" }}
          >
            <div className="relative w-full mx-auto" style={{ maxWidth: "min(700px, 100%)", minHeight: 320 }}>
              {/* Step 0 — "Your rep is on a live call." */}
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

              {/* Step 1 — "The customer asks something specific." */}
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

              {/* Step 2 — "They press ⌘ J" */}
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

              {/* Step 3 — "Answer in 1–2 seconds. Source included." */}
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

              {/* Step 4 — CTA */}
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
                  href="#waitlist"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[600] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] transition-all duration-150 hover:bg-[#4846c9] hover:-translate-y-px"
                >
                  {t("heroPrimary")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-5 py-28" id="features">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
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
                    className="group relative rounded-[16px] border border-[#e5e5ea] bg-white p-7 cursor-default"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-[#5e5ce6] mb-5 transition-transform duration-300 group-hover:-translate-y-[3px]">
                      <IconComp size={22} aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 text-[18px] font-[700] tracking-[-0.02em]">{title}</h3>
                    <p className="text-[16px] font-[400] leading-[1.6] text-[#6e6e73]">{body}</p>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-5 py-28 bg-[#f5f5f7]" id="how-it-works">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
              <p className="mb-3 text-[13px] font-[600] tracking-[0.16em] uppercase text-[#6e6e73]">
                {t("howEyebrow")}
              </p>
              <h2 className="text-[clamp(34px,4vw,54px)] font-[700] leading-[1.06] tracking-[-0.04em]">
                {t("howTitle")}
              </h2>
            </AnimateOnScroll>
            <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
              {tSteps().map(([title, body], i) => (
                <AnimateOnScroll
                  as="article"
                  key={title}
                  delay={i * 0.08}
                  className="relative bg-white border border-[#e5e5ea] p-7 first:rounded-t-[16px] last:rounded-b-[16px] sm:first:rounded-l-[16px] sm:first:rounded-tr-none sm:last:rounded-r-[16px] sm:last:rounded-bl-none lg:rounded-none lg:first:rounded-l-[16px] lg:last:rounded-r-[16px]"
                  style={{
                    boxShadow: "none",
                    marginTop: i > 0 ? -1 : 0,
                    marginLeft: 0,
                  }}
                >
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f7] text-sm font-[700] text-[#5e5ce6]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mb-2 text-[18px] font-[700] tracking-[-0.02em]">{title}</h3>
                  <p className="text-[16px] font-[400] leading-[1.58] text-[#6e6e73]">{body}</p>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="px-5 py-28" id="use-cases">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
              <p className="mb-3 text-[13px] font-[600] tracking-[0.16em] uppercase text-[#6e6e73]">
                {t("useEyebrow")}
              </p>
              <h2 className="text-[clamp(34px,4vw,54px)] font-[700] leading-[1.06] tracking-[-0.04em]">
                {t("useTitle")}
              </h2>
            </AnimateOnScroll>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tUseCases().map((item, i) => (
                <AnimateOnScroll
                  key={item}
                  delay={(i + 1) * 0.05}
                  whileHover={{
                    y: -3,
                    backgroundColor: "#fafafa",
                    boxShadow: "0 8px 24px -8px rgba(0,0,0,0.08)",
                    transition: { type: "spring", stiffness: 400, damping: 25 },
                  }}
                  className="group flex items-center gap-4 rounded-[16px] border border-[#e5e5ea] bg-white p-5 cursor-default"
                >
                  <span className="text-2xl transition-transform duration-200 group-hover:scale-110" aria-hidden="true">{useIcons[i]}</span>
                  <span className="text-[16px] font-[600]">{item}</span>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="px-5 py-28 bg-[#f5f5f7]" id="pricing">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
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
              delay={0.04}
              className="mb-8 inline-flex rounded-full border border-[rgba(29,29,31,0.08)] bg-[rgba(255,255,255,0.82)] px-4 py-2 text-[13px] font-[500] text-[#6e6e73] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]"
            >
              {t("pricingFutureNote")}
            </AnimateOnScroll>
            <div className="grid gap-5 lg:grid-cols-3">
              {tPricing().map((plan, i) => (
                <AnimateOnScroll
                  as="article"
                  key={plan.name}
                  delay={[0.05, 0.12, 0.2][i] ?? 0.05}
                  y={plan.highlighted ? 40 : 32}
                  className={`relative flex h-full flex-col rounded-[24px] border bg-white p-7 ${
                    plan.highlighted
                      ? "border-[rgba(94,92,230,0.72)] shadow-[0_0_0_1px_rgba(94,92,230,0.28),0_18px_36px_rgba(94,92,230,0.12)]"
                      : "border-[#e5e5ea] shadow-[0_10px_28px_rgba(15,23,42,0.04)]"
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="absolute -top-3 left-6 rounded-full border border-[rgba(94,92,230,0.18)] bg-[linear-gradient(180deg,rgba(114,107,255,0.98)_0%,rgba(94,92,230,1)_100%)] px-3 py-1 text-[11px] font-[700] text-white shadow-[0_8px_18px_rgba(94,92,230,0.2)]">
                      {plan.badge ?? t("popular")}
                    </span>
                  ) : null}
                  <h3 className="text-[18px] font-[700] tracking-[-0.02em]">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-[40px] font-[700] leading-none tracking-[-0.04em]">{plan.price}</span>
                    {plan.period ? (
                      <span className="text-[16px] font-[400] text-[#6e6e73]">{plan.period}</span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-[16px] font-[400] leading-[1.58] text-[#6e6e73]">{plan.description}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-[16px] font-[400]">
                        <Check className="mt-px h-4 w-4 flex-none text-[#5e5ce6]" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#waitlist"
                    className={`mt-8 inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[600] leading-none transition-all duration-150 hover:-translate-y-px ${
                      plan.highlighted
                        ? "bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] hover:bg-[#4846c9]"
                        : "border border-[#d7d7dc] bg-[rgba(255,255,255,0.82)] text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-[rgba(94,92,230,0.38)] hover:text-[#5e5ce6]"
                    }`}
                  >
                    {plan.cta}
                  </a>
                  <p className="mt-3 text-center text-[13px] font-[500] leading-[1.45] text-[#8a8a94]">
                    {plan.footnote}
                  </p>
                </AnimateOnScroll>
              ))}
            </div>
            <AnimateOnScroll
              delay={0.24}
              className="mt-10 rounded-[28px] border border-[rgba(29,29,31,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(250,250,252,0.96)_100%)] px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] sm:px-8"
            >
              <h3 className="text-[24px] font-[700] tracking-[-0.03em] text-[#1d1d1f]">
                {t("pricingNudgeTitle")}
              </h3>
              <p className="mx-auto mt-3 max-w-[620px] text-[16px] font-[400] leading-[1.6] text-[#6e6e73]">
                {t("pricingNudgeBody")}
              </p>
              <a
                href="#waitlist"
                className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 text-[15px] font-[600] leading-none text-white shadow-[0_12px_24px_rgba(29,29,31,0.14)] transition-all duration-150 hover:-translate-y-px hover:bg-[#111111]"
              >
                {t("pricingNudgeCta")}
              </a>
              <p className="mt-3 text-[13px] font-[500] text-[#8a8a94]">
                {t("pricingNudgeNote")}
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-5 py-28" id="faq">
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
              searchPlaceholder={t("faqSearchPlaceholder")}
            />
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 py-28 bg-[#f5f5f7]" id="waitlist">
          <div className="mx-auto text-center" style={{ maxWidth: "min(640px, 100%)" }}>
            <AnimateOnScroll
              as="p"
              delay={0}
              className="mb-3 text-[13px] font-[600] tracking-[0.16em] uppercase text-[#6e6e73]"
            >
              {t("ctaLabel")}
            </AnimateOnScroll>
            <AnimateOnScroll
              as="h2"
              delay={0.08}
              className="mb-7 text-[clamp(34px,4.2vw,50px)] font-[700] leading-[1.06] tracking-[-0.04em]"
            >
              {t("ctaHeadline")}
            </AnimateOnScroll>
            <form onSubmit={handleEmailSubmit} noValidate>
              <AnimateOnScroll delay={0.16} className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto">
                <div className="flex-1">
                  <label htmlFor="cta-email" className="sr-only">{t("emailLabel")}</label>
                  <input
                    id="cta-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                      if (emailStatus === "success") setEmailStatus("idle");
                    }}
                    disabled={emailStatus === "submitting"}
                    aria-invalid={emailError ? "true" : undefined}
                    aria-describedby="cta-message"
                    className="w-full min-h-[48px] rounded-full border border-[#e5e5ea] bg-white px-5 text-[16px] font-[400] text-[#1d1d1f] placeholder:text-[#6e6e73] focus-visible:outline-[3px] focus-visible:outline-[rgba(94,92,230,0.42)] focus-visible:outline-offset-[3px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailStatus === "submitting"}
                  aria-busy={emailStatus === "submitting"}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full px-6 text-[15px] font-[600] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] transition-all duration-150 hover:bg-[#4846c9] hover:-translate-y-px"
                >
                  {emailStatus === "submitting"
                    ? t("emailSubmittingButton")
                    : t("heroPrimary")}
                </button>
              </AnimateOnScroll>
              <p
                id="cta-message"
                className={`mt-4 text-[16px] font-[400] transition-colors ${
                  emailError ? "text-red-500" : emailStatus === "success" ? "text-[#21a89a]" : "text-[#6e6e73]"
                }`}
              >
                {emailError === "invalid"
                  ? t("emailError")
                  : emailError === "unavailable"
                  ? t("emailUnavailable")
                  : emailError === "server"
                  ? t("emailServerError")
                  : emailStatus === "success"
                  ? t("emailSuccess")
                  : emailStatus === "submitting"
                  ? t("emailSubmitting")
                  : t("ctaSub")}
              </p>
            </form>
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
