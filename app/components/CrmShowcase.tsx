"use client";

import { useEffect, useRef, useState } from "react";
import { StickyNote, ListChecks, Tag, Check, ShieldCheck, Sparkles, MousePointerClick } from "lucide-react";
import { AnimateOnScroll } from "../../components/ui/animate-on-scroll";
import type { Lang } from "../../lib/strings";

type ActionState = "applied" | "created" | "skipped";

type CrmAction = {
  icon: typeof StickyNote;
  type: string;
  payload: string;
  confidence: number;
  result: ActionState;
  resultLabel: string;
};

const COPY = {
  en: {
    eyebrow: "After the call",
    title: "Every call, logged in amoCRM — with your approval.",
    sub: "The agent reads your session note and drafts the note, task, and tag from what was actually said. You review the evidence, approve, and it writes back — a repeat is safely skipped as a duplicate.",
    steps: [
      { icon: Sparkles, label: "Extract" },
      { icon: ShieldCheck, label: "Review" },
      { icon: MousePointerClick, label: "Apply" },
    ],
    windowTitle: "CRM Assistant",
    lead: "Acme Corp · Ivan P.",
    stage: "Negotiation",
    live: "amoCRM · live",
    suggested: "Suggested actions",
    confidence: "confidence",
    apply: "Apply approved actions",
    applied: "Apply approved actions",
    resultBanner: "2 applied · 1 skipped as duplicate",
    connects: "Connects to the tools you already use",
    actions: [
      { icon: StickyNote, type: "Add note", payload: "Wants a follow-up demo next week; budget approved on their side.", confidence: 92, result: "applied" as ActionState, resultLabel: "Note added" },
      { icon: ListChecks, type: "Create task", payload: "Send updated pricing PDF · due Friday", confidence: 88, result: "created" as ActionState, resultLabel: "Task created" },
      { icon: Tag, type: "Add tag", payload: "hot-lead", confidence: 74, result: "skipped" as ActionState, resultLabel: "Skipped · duplicate" },
    ],
  },
  ru: {
    eyebrow: "После звонка",
    title: "Каждый звонок — в amoCRM, с вашим подтверждением.",
    sub: "Агент читает вашу заметку о разговоре и собирает черновик: заметку, задачу и тег из того, что реально прозвучало. Вы смотрите доказательство, подтверждаете — и оно записывается. Повтор безопасно пропускается как дубль.",
    steps: [
      { icon: Sparkles, label: "Извлёк" },
      { icon: ShieldCheck, label: "Проверил" },
      { icon: MousePointerClick, label: "Применил" },
    ],
    windowTitle: "CRM Assistant",
    lead: "Acme Corp · Иван П.",
    stage: "Переговоры",
    live: "amoCRM · онлайн",
    suggested: "Предложенные действия",
    confidence: "уверенность",
    apply: "Применить подтверждённые",
    applied: "Применить подтверждённые",
    resultBanner: "2 применено · 1 пропущено как дубль",
    connects: "Работает с инструментами, которыми вы уже пользуетесь",
    actions: [
      { icon: StickyNote, type: "Заметка", payload: "Хочет повторное демо на следующей неделе; бюджет с их стороны согласован.", confidence: 92, result: "applied" as ActionState, resultLabel: "Заметка добавлена" },
      { icon: ListChecks, type: "Задача", payload: "Отправить обновлённый прайс (PDF) · до пятницы", confidence: 88, result: "created" as ActionState, resultLabel: "Задача создана" },
      { icon: Tag, type: "Тег", payload: "hot-lead", confidence: 74, result: "skipped" as ActionState, resultLabel: "Пропущено · дубль" },
    ],
  },
} as const;

const INTEGRATIONS = [
  { src: "/orbit/amo.jpg", label: "amoCRM" },
  { src: "/orbit/whatsapp.png", label: "WhatsApp" },
  { src: "/orbit/workflow.png", label: "Workflows" },
  { src: "/orbit/chatbot.jpg", label: "AI agent" },
];

export default function CrmShowcase({ lang }: { lang: Lang }) {
  const copy = COPY[lang] ?? COPY.en;
  const [applied, setApplied] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setApplied(true);
      return;
    }
    const el = cardRef.current;
    if (!el) return;
    let timer = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = window.setTimeout(() => setApplied(true), 1100);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <section id="crm" className="relative overflow-hidden px-4 py-20 sm:px-5 md:py-28">
      {/* ambient warm glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 78% 30%, rgba(217,152,30,0.10), transparent 70%), radial-gradient(40% 40% at 12% 80%, rgba(37,211,102,0.06), transparent 72%)",
        }}
      />
      <div className="relative mx-auto grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16" style={{ maxWidth: "min(1180px, 100%)" }}>
        {/* LEFT — copy */}
        <AnimateOnScroll delay={0} className="min-w-0">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(217,152,30,0.18)] bg-[rgba(255,244,232,0.72)] px-4 py-2 text-[12px] font-[800] uppercase tracking-[0.16em] text-[#a35707] shadow-[0_12px_30px_rgba(217,152,30,0.08)] backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#c9820f]" aria-hidden="true" />
            {copy.eyebrow}
          </p>
          <h2 className="mb-5 max-w-[15ch] text-[clamp(32px,3.9vw,52px)] font-[700] leading-[1.05] tracking-[-0.04em] text-[#1a1917]">
            {copy.title}
          </h2>
          <p className="mb-8 max-w-[460px] text-[16px] font-[400] leading-[1.66] text-[#6b665e] md:text-[17px]">
            {copy.sub}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {copy.steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(29,29,31,0.08)] bg-white/80 px-3.5 py-2 text-[13px] font-[600] text-[#423d36] shadow-[0_6px_16px_rgba(26,25,23,0.05)] backdrop-blur-sm">
                    <Icon size={15} className="text-[#a35707]" aria-hidden="true" />
                    {s.label}
                  </span>
                  {i < copy.steps.length - 1 && (
                    <span className="text-[#c9a15f]" aria-hidden="true">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </AnimateOnScroll>

        {/* RIGHT — CRM Assistant mockup */}
        <AnimateOnScroll delay={0.1} className="min-w-0">
          <div className="relative min-w-0" ref={cardRef}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-80 blur-[60px]"
              style={{ background: "radial-gradient(60% 60% at 60% 20%, rgba(217,152,30,0.22), transparent 72%)" }}
            />
            <div className="relative rounded-[26px] border border-[rgba(217,152,30,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,248,247,0.97)_100%)] p-2.5 shadow-[0_44px_100px_-40px_rgba(217,152,30,0.34)] backdrop-blur-xl">
              <div aria-hidden="true" className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
              <div className="rounded-[20px] border border-[rgba(29,29,31,0.06)] bg-white p-4 sm:p-5">
                {/* window header */}
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img src="/orbit/amo.jpg" alt="amoCRM" className="h-8 w-8 rounded-[9px] object-cover ring-1 ring-black/5" />
                    <div className="leading-tight">
                      <p className="text-[13px] font-[700] text-[#1a1917]">{copy.lead}</p>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-[600] text-[#6b665e]">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#25c268]" /> {copy.stage}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(37,194,104,0.24)] bg-[rgba(37,194,104,0.08)] px-2.5 py-1 text-[11px] font-[700] text-[#1a7a43]">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#25c268]" />
                    {copy.live}
                  </span>
                </div>

                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-[11px] font-[800] uppercase tracking-[0.14em] text-[#a35707]">{copy.suggested}</p>
                  {applied && (
                    <span className="text-[11px] font-[700] text-[#1a7a43]">{copy.resultBanner}</span>
                  )}
                </div>

                {/* action rows */}
                <div className="space-y-2.5">
                  {copy.actions.map((a) => {
                    const Icon = a.icon;
                    const isSkip = a.result === "skipped";
                    return (
                      <div
                        key={a.type}
                        className="rounded-[14px] border p-3 transition-all duration-500"
                        style={{
                          borderColor: applied
                            ? isSkip
                              ? "rgba(29,29,31,0.10)"
                              : "rgba(37,194,104,0.30)"
                            : "rgba(29,29,31,0.08)",
                          background: applied
                            ? isSkip
                              ? "rgba(248,246,243,0.9)"
                              : "rgba(37,194,104,0.06)"
                            : "rgba(252,250,247,0.7)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] transition-colors duration-500"
                            style={{
                              background: applied && !isSkip ? "rgba(37,194,104,0.14)" : "rgba(217,152,30,0.10)",
                              color: applied && !isSkip ? "#1a7a43" : "#a35707",
                            }}
                          >
                            {applied ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-[700] text-[#1a1917]">{a.type}</p>
                              {applied ? (
                                <span
                                  className="shrink-0 text-[11px] font-[700]"
                                  style={{ color: isSkip ? "#8a7f6f" : "#1a7a43" }}
                                >
                                  {isSkip ? "⤼ " : "✓ "}{a.resultLabel}
                                </span>
                              ) : (
                                <span className="shrink-0 text-[11px] font-[600] text-[#6b665e]">
                                  {a.confidence}% {copy.confidence}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 truncate text-[12.5px] leading-[1.5] text-[#6b665e]">{a.payload}</p>
                            {!applied && (
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgba(29,29,31,0.06)]">
                                <div
                                  className="h-full rounded-full bg-[linear-gradient(90deg,#f5b23f,#c9820f)] transition-[width] duration-700"
                                  style={{ width: `${a.confidence}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* apply button */}
                <button
                  type="button"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-[700] leading-none transition-all duration-500"
                  style={
                    applied
                      ? { background: "rgba(37,194,104,0.12)", color: "#1a7a43", border: "1px solid rgba(37,194,104,0.3)" }
                      : {
                          background: "linear-gradient(180deg,#fff0c4,#ffd27a 45%,#f5b23f)",
                          color: "#4a2f08",
                          boxShadow: "0 14px 30px -10px rgba(217,152,30,0.5), inset 0 1px 0 rgba(255,255,255,0.7)",
                        }
                  }
                  disabled={applied}
                >
                  {applied ? <><Check size={16} /> {copy.resultBanner}</> : copy.apply}
                </button>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>

      {/* integrations strip */}
      <AnimateOnScroll delay={0.12} className="relative mx-auto mt-16 md:mt-20" >
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-6">
          <p className="text-[12px] font-[700] uppercase tracking-[0.18em] text-[#9a9186]">{copy.connects}</p>
          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-5">
            {INTEGRATIONS.map((it) => (
              <div
                key={it.label}
                className="group inline-flex items-center gap-2.5 rounded-2xl border border-[rgba(29,29,31,0.08)] bg-white/75 px-4 py-2.5 shadow-[0_10px_26px_-14px_rgba(26,25,23,0.35)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5"
              >
                <img src={it.src} alt="" className="h-7 w-7 rounded-[8px] object-cover ring-1 ring-black/5" />
                <span className="text-[14px] font-[700] text-[#423d36]">{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
