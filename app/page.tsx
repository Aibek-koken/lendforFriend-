"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
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

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  highlighted?: boolean;
  features: string[];
};

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("en");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [scrollyStep, setScrollyStep] = useState(0);
  const [activeTab, setActiveTab] = useState<(typeof navConfig)[number]["id"]>(
    navConfig[0].id
  );
  const scrollyProgressRef = useRef(0);
  const scrollyTargetRef = useRef(0);
  const scrollyLastRawRef = useRef(-1);

  const scrollyRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    const saved = localStorage.getItem("liveassist-lang") as Lang | null;
    if (saved === "en" || saved === "ru") setLang(saved);

    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
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
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim().includes("@")) {
      setEmailError(t("emailError"));
      setEmailSubmitted(false);
      return;
    }
    setEmailError("");
    setEmailSubmitted(true);
  }

  const featureIcons = [FileText, FileSearch, Layers, Keyboard, Mic, Shield];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-180 ease-out ${
          scrolled || menuOpen
            ? "border-[rgba(229,229,234,0.88)] bg-[rgba(255,255,255,0.82)] shadow-[0_1px_0_rgba(255,255,255,0.65)_inset] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <nav
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 w-full h-16 px-5 mx-auto"
          style={{ maxWidth: "min(1180px, calc(100% - 40px))" }}
          aria-label={t("navLabel")}
        >
          <a href="#top" className="inline-flex items-center gap-2 rounded-full text-[15px] font-[650] min-h-10">
            {t("logo")}
          </a>

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
              className="inline-flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full border border-[#e5e5ea] bg-[rgba(255,255,255,0.72)] text-[13px] font-bold text-[#1d1d1f]"
              aria-label={lang === "en" ? t("switchToRu") : t("switchToEn")}
            >
              {lang === "en" ? "RU" : "EN"}
            </button>
            <a
              href="#waitlist"
              className="hidden md:inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[650] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] transition-all duration-150 hover:bg-[#4846c9] hover:-translate-y-px"
            >
              {t("joinWaitlist")}
            </a>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden inline-flex min-w-[44px] min-h-[44px] flex-col items-center justify-center gap-[4px] rounded-full border border-[#e5e5ea] bg-[rgba(255,255,255,0.72)]"
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
                className="block rounded-full px-[14px] py-3 text-[15px] font-[560] text-[#6e6e73] hover:text-[#5e5ce6]"
              >
                {t(key)}
              </a>
            ))}
            <a
              href="#waitlist"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[650] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] w-full"
            >
              {t("joinWaitlist")}
            </a>
          </div>
        )}
      </header>

      <main id="top" style={{ overflow: "clip" }}>
        {/* HERO */}
        <section
          className="flex items-center px-5"
          style={{
            minHeight: "100svh",
            padding: "132px 20px 88px",
            background:
              "radial-gradient(circle at 82% 22%, rgba(94,92,230,0.12), transparent 30%), linear-gradient(180deg, #ffffff 0%, #fbfbfd 78%, #f5f5f7 100%)",
          }}
        >
          <div
            className="grid items-center gap-16 w-full mx-auto"
            style={{
              gridTemplateColumns: "minmax(0, 1.08fr) minmax(360px, 0.72fr)",
              maxWidth: "min(1180px, 100%)",
            }}
          >
            <div>
              <AnimateOnScroll
                as="p"
                delay={0}
                className="text-[13px] font-[760] tracking-[0.16em] uppercase text-[#6e6e73] mb-5"
              >
                {t("heroEyebrow")}
              </AnimateOnScroll>
              <AnimateOnScroll
                as="h1"
                delay={0.08}
                className="font-[760] leading-[0.96] mb-6"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
                  fontSize: "clamp(48px, 7vw, 86px)",
                  letterSpacing: 0,
                }}
              >
                {t("heroHeadline")}
              </AnimateOnScroll>
              <AnimateOnScroll
                as="p"
                delay={0.16}
                className="text-[21px] leading-[1.45] text-[#6e6e73] mb-8 max-w-[650px]"
              >
                {t("heroSub")}
              </AnimateOnScroll>
              <AnimateOnScroll delay={0.22} className="flex flex-wrap gap-3">
                <a
                  href="#waitlist"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[650] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] transition-all duration-150 hover:bg-[#4846c9] hover:-translate-y-px"
                >
                  {t("heroPrimary")}
                </a>
                <a
                  href="#scrolly"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[650] leading-none border border-[#e5e5ea] bg-[rgba(255,255,255,0.76)] text-[#1d1d1f] transition-all duration-150 hover:border-[rgba(94,92,230,0.38)] hover:text-[#5e5ce6] hover:-translate-y-px"
                >
                  {t("heroSecondary")}
                </a>
              </AnimateOnScroll>
            </div>

            <AnimateOnScroll delay={0.3} y={48} className="relative min-h-[520px] flex items-center justify-center">
              <div
                className="absolute rounded-full"
                aria-hidden="true"
                style={{
                  width: "min(560px, 94vw)",
                  aspectRatio: 1,
                  background:
                    "radial-gradient(circle, rgba(94,92,230,0.18), transparent 62%), radial-gradient(circle at 32% 28%, rgba(33,168,154,0.16), transparent 38%)",
                  filter: "blur(4px)",
                }}
              />
              <ProductMockup copy={strings[lang].mockup} lang={lang} />
            </AnimateOnScroll>
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
                <p className="font-[800] text-[#1d1d1f]" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}>
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
                <p className="font-[800] text-[#1d1d1f]" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}>
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
                  className="inline-flex items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#5e5ce6] font-bold mb-8"
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
                <p className="font-[800] text-[#1d1d1f]" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}>
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
                <p className="font-[800] text-[#1d1d1f]" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}>
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
                <p className="font-[800] text-[#1d1d1f] mb-6" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.05 }}>
                  {t("scrollyStep5")}
                </p>
                <p className="text-[21px] leading-[1.45] text-[#6e6e73] max-w-[560px] mx-auto mb-7">
                  {t("scrollyStep5Sub")}
                </p>
                <a
                  href="#waitlist"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[650] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] transition-all duration-150 hover:bg-[#4846c9] hover:-translate-y-px"
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
              <p className="text-[13px] font-[760] tracking-[0.16em] uppercase text-[#6e6e73] mb-3">
                {t("featuresEyebrow")}
              </p>
              <h2 className="text-[clamp(36px,4vw,56px)] font-[760] leading-[1.05] mb-5">
                {t("featuresTitle")}
              </h2>
              <p className="text-[19px] leading-[1.5] text-[#6e6e73] max-w-[640px]">
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
                    <h3 className="text-[19px] font-[650] mb-2">{title}</h3>
                    <p className="text-[15px] leading-[1.55] text-[#6e6e73]">{body}</p>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        <section className="w-full overflow-x-auto bg-white py-24 md:overflow-x-visible">
          <div className="mx-auto max-w-6xl px-6">
            <AnimateOnScroll delay={0} y={48} duration={0.7} className="min-w-[760px] md:min-w-0">
              <div className="flex justify-center">
                <ProductMockup
                  copy={strings[lang].mockup}
                  lang={lang}
                  onboarding
                  staticState
                  large
                />
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-5 py-28 bg-[#f5f5f7]" id="how-it-works">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
              <p className="text-[13px] font-[760] tracking-[0.16em] uppercase text-[#6e6e73] mb-3">
                {t("howEyebrow")}
              </p>
              <h2 className="text-[clamp(36px,4vw,56px)] font-[760] leading-[1.05]">
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
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f5f5f7] text-[#5e5ce6] text-sm font-bold mb-4">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[17px] font-[650] mb-2">{title}</h3>
                  <p className="text-[14px] leading-[1.5] text-[#6e6e73]">{body}</p>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="px-5 py-28" id="use-cases">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
              <p className="text-[13px] font-[760] tracking-[0.16em] uppercase text-[#6e6e73] mb-3">
                {t("useEyebrow")}
              </p>
              <h2 className="text-[clamp(36px,4vw,56px)] font-[760] leading-[1.05]">
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
                  <span className="text-[15px] font-[560]">{item}</span>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="px-5 py-28 bg-[#f5f5f7]" id="pricing">
          <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
              <p className="text-[13px] font-[760] tracking-[0.16em] uppercase text-[#6e6e73] mb-3">
                {t("pricingEyebrow")}
              </p>
              <h2 className="text-[clamp(36px,4vw,56px)] font-[760] leading-[1.05]">
                {t("pricingTitle")}
              </h2>
            </AnimateOnScroll>
            <div className="grid gap-4 lg:grid-cols-3">
              {tPricing().map((plan, i) => (
                <AnimateOnScroll
                  as="article"
                  key={plan.name}
                  delay={[0.05, 0.12, 0.2][i] ?? 0.05}
                  y={plan.highlighted ? 40 : 32}
                  className={`relative rounded-[16px] border bg-white p-7 ${
                    plan.highlighted
                      ? "border-[#5e5ce6] shadow-[0_0_0_1px_#5e5ce6,0_12px_24px_rgba(94,92,230,0.12)]"
                      : "border-[#e5e5ea]"
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="absolute -top-3 left-6 rounded-full bg-[#5e5ce6] text-white text-[11px] font-bold px-3 py-1">
                      {t("popular")}
                    </span>
                  ) : null}
                  <h3 className="text-[17px] font-[650]">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-[40px] font-[760] leading-none">{plan.price}</span>
                    {plan.period ? (
                      <span className="text-[15px] text-[#6e6e73]">{plan.period}</span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-[14px] leading-[1.5] text-[#6e6e73]">{plan.description}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-[14px]">
                        <Check className="mt-px h-4 w-4 flex-none text-[#5e5ce6]" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#waitlist"
                    className={`mt-7 inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-[650] leading-none transition-all duration-150 hover:-translate-y-px ${
                      plan.highlighted
                        ? "bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] hover:bg-[#4846c9]"
                        : "border border-[#e5e5ea] bg-[rgba(255,255,255,0.76)] text-[#1d1d1f] hover:border-[rgba(94,92,230,0.38)] hover:text-[#5e5ce6]"
                    }`}
                  >
                    {t("heroPrimary")}
                  </a>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-5 py-28" id="faq">
          <div className="mx-auto" style={{ maxWidth: "min(720px, 100%)" }}>
            <AnimateOnScroll delay={0} className="max-w-3xl mb-16">
              <p className="text-[13px] font-[760] tracking-[0.16em] uppercase text-[#6e6e73] mb-3">
                {t("faqEyebrow")}
              </p>
              <h2 className="text-[clamp(36px,4vw,56px)] font-[760] leading-[1.05]">
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
              className="text-[13px] font-[760] tracking-[0.16em] uppercase text-[#6e6e73] mb-3"
            >
              {t("ctaLabel")}
            </AnimateOnScroll>
            <AnimateOnScroll
              as="h2"
              delay={0.08}
              className="text-[clamp(32px,4.5vw,52px)] font-[760] leading-[1.05] mb-7"
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
                      if (emailSubmitted) setEmailSubmitted(false);
                    }}
                    aria-invalid={emailError ? "true" : undefined}
                    aria-describedby="cta-message"
                    className="w-full min-h-[48px] rounded-full border border-[#e5e5ea] bg-white px-5 text-[15px] text-[#1d1d1f] placeholder:text-[#6e6e73] focus-visible:outline-[3px] focus-visible:outline-[rgba(94,92,230,0.42)] focus-visible:outline-offset-[3px]"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full px-6 text-[15px] font-[650] leading-none bg-[#5e5ce6] text-white shadow-[0_12px_24px_rgba(94,92,230,0.24)] transition-all duration-150 hover:bg-[#4846c9] hover:-translate-y-px"
                >
                  {t("heroPrimary")}
                </button>
              </AnimateOnScroll>
              <p
                id="cta-message"
                className={`mt-4 text-[14px] transition-colors ${
                  emailError ? "text-red-500" : emailSubmitted ? "text-[#21a89a]" : "text-[#6e6e73]"
                }`}
              >
                {emailError
                  ? t("emailError")
                  : emailSubmitted
                  ? t("emailSuccess")
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
