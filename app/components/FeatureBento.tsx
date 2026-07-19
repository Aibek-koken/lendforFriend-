"use client";

import {
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  CopyCheck,
  Command,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { strings, type Lang } from "../../lib/strings";
import { AnimateOnScroll } from "../../components/ui/animate-on-scroll";

// Icon + bento span for each of the 6 features (order matches strings.features).
const META: { icon: LucideIcon; span: string }[] = [
  { icon: MessageSquareText, span: "lg:col-span-4" },
  { icon: RefreshCw, span: "lg:col-span-2" },
  { icon: ShieldCheck, span: "lg:col-span-2" },
  { icon: CopyCheck, span: "lg:col-span-2" },
  { icon: Command, span: "lg:col-span-2" },
  { icon: Lock, span: "lg:col-span-6" },
];

const HEAD = {
  en: {
    eyebrow: "Capabilities",
    title: "One agent, from the answer to the write-back",
    sub: "Cited answers during the call, then a reviewed, duplicate-safe update to amoCRM after it.",
  },
  ru: {
    eyebrow: "Возможности",
    title: "Один агент — от ответа до записи в CRM",
    sub: "Ответы с источником на звонке, а после — проверенное, без дублей, обновление amoCRM.",
  },
} as const;

export default function FeatureBento({ lang }: { lang: Lang }) {
  const head = HEAD[lang] ?? HEAD.en;
  const features = strings[lang].features;

  return (
    <section className="px-4 py-20 sm:px-5 md:py-28" id="capabilities">
      <div className="mx-auto" style={{ maxWidth: "min(1180px, 100%)" }}>
        <AnimateOnScroll delay={0} className="mb-10 max-w-3xl md:mb-14">
          <p className="mb-3 text-[13px] font-[600] uppercase tracking-[0.16em] text-[#6b665e]">{head.eyebrow}</p>
          <h2 className="mb-5 text-[clamp(32px,4vw,52px)] font-[700] leading-[1.06] tracking-[-0.04em] text-[#1a1917]">
            {head.title}
          </h2>
          <p className="max-w-[620px] text-[16px] font-[400] leading-[1.65] text-[#6b665e] md:text-[17px]">
            {head.sub}
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {features.map((f, i) => {
            const Icon = META[i]?.icon ?? MessageSquareText;
            const span = META[i]?.span ?? "lg:col-span-2";
            const wide = span.includes("col-span-4") || span.includes("col-span-6");
            return (
              <AnimateOnScroll
                key={f[0]}
                delay={0.05 * i}
                className={`group relative overflow-hidden rounded-[22px] border border-[rgba(29,29,31,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,250,247,0.96))] p-6 shadow-[0_18px_44px_-24px_rgba(26,25,23,0.28)] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(217,152,30,0.30)] hover:shadow-[0_30px_70px_-30px_rgba(217,152,30,0.4)] sm:p-7 ${span}`}
              >
                {/* hover sheen */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(217,152,30,0.28), transparent 70%)" }}
                />
                <div className={wide ? "relative flex flex-col gap-4 md:flex-row md:items-center md:gap-6" : "relative"}>
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(217,152,30,0.16)] text-[#a35707] shadow-[0_8px_18px_-8px_rgba(217,152,30,0.4)]"
                    style={{ background: "linear-gradient(135deg,rgba(255,245,245,0.92),rgba(255,255,255,0.96))" }}
                  >
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <div className={wide ? "" : "mt-4"}>
                    <h3 className="text-[19px] font-[700] leading-[1.25] tracking-[-0.02em] text-[#1a1917]">
                      {f[0]}
                    </h3>
                    <p className="mt-1.5 max-w-[52ch] text-[15px] font-[400] leading-[1.6] text-[#6b665e]">
                      {f[1]}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
