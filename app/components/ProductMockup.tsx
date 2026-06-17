"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import type { Lang } from "@/lib/strings";

type ProductMockupCopy = {
  ariaLabel: string;
  privateOverlay: string;
  questionLabel: string;
  question: string;
  answerLabel: string;
  answer: string;
  confidenceLabel: string;
  confidenceValue: string;
  sourceFile: string;
  sourceMeta: string;
  openFile: string;
  answeredIn: string;
  openingFile: string;
};

type OnboardingHint = {
  id: string;
  targetLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  zone: CSSProperties;
  tooltip: CSSProperties;
  tail: CSSProperties;
};

type ProductMockupProps = {
  copy: ProductMockupCopy;
  lang: Lang;
  onboarding?: boolean;
  staticState?: boolean;
  large?: boolean;
  /** Если передан — активирует тултип по id через скролл, игнорируя hover */
  scrollActiveHintId?: string | null;
  /** Колбэк когда анимация завершилась (для hero-scroll интеграции) */
  onAnimationComplete?: () => void;
  /** Мгновенно пропустить анимацию и перейти в финальное состояние */
  skipAnimation?: boolean;
};

export default function ProductMockup({
  copy,
  lang,
  onboarding = false,
  staticState = false,
  large = false,
  scrollActiveHintId,
  onAnimationComplete,
  skipAnimation = false,
}: ProductMockupProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const answerBlockRef = useRef<HTMLDivElement>(null);
  const confidenceRef = useRef<HTMLDivElement>(null);
  const citationRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  const isRunningRef = useRef(false);
  const hasPlayedRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const [typedText, setTypedText] = useState("");
  const [isDemoReady, setIsDemoReady] = useState(false);
  const [hoverHint, setHoverHint] = useState<OnboardingHint | null>(null);
  const reduceMotionRef = useRef(false);

  const charDelay = 42;
  const baseWidth = large ? 620 : 420;
  const expandedWidth = large ? 760 : 520;
  const expandedMaxHeight = large ? 620 : 480;
  const outerPadding = large ? "28px 32px" : "20px 24px";
  const fileAccent = onboarding ? "#1F9D63" : "#5E5CE6";
  const sourceButtonBg = onboarding ? "#1D1D1F" : "#5E5CE6";
  const isRussian = lang === "ru";

  const hints: OnboardingHint[] = isRussian
    ? [
        {
          id: "question",
          targetLabel: "Вопрос",
          eyebrow: "Пояснение к вопросу",
          title: "Вопрос клиента",
          body: "Сюда попадает конкретный вопрос, который менеджер задает через хоткей, не уходя из звонка.",
          zone: large
            ? { top: 84, left: 28, right: 28, height: 88 }
            : { top: 74, left: 20, right: 20, height: 102 },
          tooltip: large
            ? { top: "108px", right: "22px" }
            : { top: "118px", left: "28px" },
          tail: { top: 22, left: -6 },
        },
        {
          id: "answer",
          targetLabel: "Ответ AI",
          eyebrow: "Пояснение к ответу",
          title: "Готовая фраза для ответа",
          body: "Это короткая подсказка, которую можно сразу сказать клиенту. Она появляется только после поиска по документам.",
          zone: large
            ? { top: 206, left: 28, right: 28, height: 112 }
            : { top: 192, left: 20, right: 20, height: 110 },
          tooltip: large
            ? { top: "244px", right: "22px" }
            : { top: "250px", right: "28px" },
          tail: { top: 22, left: -6 },
        },
        {
          id: "confidence",
          targetLabel: "Уверенность AI",
          eyebrow: "Пояснение к индикатору",
          title: "Проверка надежности",
          body: "Индикатор показывает, насколько уверенно AI нашел ответ в базе знаний компании.",
          zone: large
            ? { top: 344, left: 28, right: 28, height: 64 }
            : { bottom: 104, left: 20, right: 20, height: 62 },
          tooltip: large
            ? { top: "332px", left: "28px" }
            : { bottom: "118px", left: "28px" },
          tail: { top: 22, right: -6 },
        },
        {
          id: "source",
          targetLabel: "Источник",
          eyebrow: "Пояснение к источнику",
          title: "Документ под ответом",
          body: "Менеджер видит файл и страницу, поэтому может быстро проверить, откуда взялся ответ.",
          zone: large
            ? { top: 432, left: 28, right: 28, height: 86 }
            : { bottom: 36, left: 20, right: 20, height: 76 },
          tooltip: large
            ? { top: "414px", right: "22px" }
            : { bottom: "92px", right: "28px" },
          tail: { top: 22, left: -6 },
        },
      ]
    : [
        {
          id: "question",
          targetLabel: "Question",
          eyebrow: "Attached to question",
          title: "Customer question",
          body: "This is the exact question the rep asks through the hotkey without leaving the live call.",
          zone: large
            ? { top: 84, left: 28, right: 28, height: 88 }
            : { top: 74, left: 20, right: 20, height: 102 },
          tooltip: large
            ? { top: "108px", right: "22px" }
            : { top: "118px", left: "28px" },
          tail: { top: 22, left: -6 },
        },
        {
          id: "answer",
          targetLabel: "AI answer",
          eyebrow: "Attached to answer",
          title: "Ready-to-say response",
          body: "A short answer the rep can use immediately. It appears only after LiveAssist checks company docs.",
          zone: large
            ? { top: 206, left: 28, right: 28, height: 112 }
            : { top: 192, left: 20, right: 20, height: 110 },
          tooltip: large
            ? { top: "244px", right: "22px" }
            : { top: "250px", right: "28px" },
          tail: { top: 22, left: -6 },
        },
        {
          id: "confidence",
          targetLabel: "AI confidence",
          eyebrow: "Attached to confidence",
          title: "Reliability check",
          body: "The score shows how confidently AI matched the answer to your internal knowledge base.",
          zone: large
            ? { top: 344, left: 28, right: 28, height: 64 }
            : { bottom: 104, left: 20, right: 20, height: 62 },
          tooltip: large
            ? { top: "332px", left: "28px" }
            : { bottom: "118px", left: "28px" },
          tail: { top: 22, right: -6 },
        },
        {
          id: "source",
          targetLabel: "Source",
          eyebrow: "Attached to source",
          title: "Document under the answer",
          body: "The rep sees the file and page, so the answer can be verified before saying it out loud.",
          zone: large
            ? { top: 432, left: 28, right: 28, height: 86 }
            : { bottom: 36, left: 20, right: 20, height: 76 },
          tooltip: large
            ? { top: "414px", right: "22px" }
            : { bottom: "92px", right: "28px" },
          tail: { top: 22, left: -6 },
        },
      ];

  // Активный hint: scroll-driven имеет приоритет над hover
  const activeHint = scrollActiveHintId != null
    ? (hints.find((h) => h.id === scrollActiveHintId) ?? null)
    : hoverHint;

  function safeTimeout(fn: () => void, delay: number) {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  }

  function stopAnimation() {
    timeoutsRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timeoutsRef.current = [];
    intervalsRef.current = [];
    isRunningRef.current = false;
  }

  const resetDOM = useCallback(function resetDOM() {
    const card = cardRef.current;
    if (!card) return;

    setIsDemoReady(false);
    setHoverHint(null);

    card.style.transition = "none";
    card.style.width = `${baseWidth}px`;
    card.style.maxHeight = "";
    card.style.height = "auto";
    card.style.opacity = "0";
    card.style.transform = "scale(0.95)";
    card.style.overflowY = "hidden";

    if (floatRef.current) floatRef.current.style.animationPlayState = "paused";
    if (cursorRef.current) cursorRef.current.style.display = "none";
    if (answerBlockRef.current) {
      answerBlockRef.current.style.display = "none";
      answerBlockRef.current.style.opacity = "0";
      answerBlockRef.current.style.transform = "translateY(16px)";
    }
    if (confidenceRef.current) {
      confidenceRef.current.style.display = "none";
      confidenceRef.current.style.opacity = "0";
      confidenceRef.current.style.transform = "translateY(16px)";
      const fill = confidenceRef.current.querySelector(
        "[data-confidence-fill]"
      ) as HTMLElement;
      if (fill) fill.style.width = "0%";
    }
    if (citationRef.current) {
      citationRef.current.style.display = "none";
      citationRef.current.style.opacity = "0";
      citationRef.current.style.transform = "translateY(16px)";
    }
    if (toastRef.current) {
      toastRef.current.style.display = "none";
      toastRef.current.style.opacity = "0";
    }
    setTypedText("");
  }, [baseWidth]);

  const showFinalState = useCallback(function showFinalState() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "none";
    card.style.width = `${expandedWidth}px`;
    card.style.maxHeight = `${expandedMaxHeight}px`;
    card.style.overflowY = "visible";
    card.style.opacity = "1";
    card.style.transform = "scale(1)";
    if (floatRef.current) floatRef.current.style.animationPlayState = "paused";
    if (cursorRef.current) cursorRef.current.style.display = "none";
    const loader = card.querySelector("[data-loader]") as HTMLElement;
    if (loader) {
      loader.style.display = "none";
      loader.style.opacity = "0";
    }
    if (answerBlockRef.current) {
      answerBlockRef.current.style.display = "block";
      answerBlockRef.current.style.opacity = "1";
      answerBlockRef.current.style.transform = "translateY(0)";
    }
    if (confidenceRef.current) {
      confidenceRef.current.style.display = "block";
      confidenceRef.current.style.opacity = "1";
      confidenceRef.current.style.transform = "translateY(0)";
      const fill = confidenceRef.current.querySelector(
        "[data-confidence-fill]"
      ) as HTMLElement;
      if (fill) {
        fill.style.transition = "none";
        fill.style.width = "94%";
      }
    }
    if (citationRef.current) {
      citationRef.current.style.display = "block";
      citationRef.current.style.opacity = "1";
      citationRef.current.style.transform = "translateY(0)";
    }
    if (toastRef.current) {
      toastRef.current.style.display = "none";
      toastRef.current.style.opacity = "0";
    }
    setTypedText(copy.question);
    setIsDemoReady(true);
    hasPlayedRef.current = true;
  }, [copy.question, expandedMaxHeight, expandedWidth]);

  const runSequence = useCallback(function runSequence() {
    if (isRunningRef.current || hasPlayedRef.current) return;
    isRunningRef.current = true;
    resetDOM();

    const card = cardRef.current;
    if (!card) return;

    void card.offsetHeight;

    card.style.transition =
      "opacity 500ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)";
    card.style.opacity = "1";
    card.style.transform = "scale(1)";

    safeTimeout(() => {
      if (floatRef.current) floatRef.current.style.animationPlayState = "running";
    }, 500);

    safeTimeout(() => {
      if (!isRunningRef.current) return;
      if (cursorRef.current) cursorRef.current.style.display = "inline";

      for (let i = 0; i < copy.question.length; i++) {
        safeTimeout(() => {
          if (isRunningRef.current) {
            setTypedText(copy.question.substring(0, i + 1));
          }
        }, i * charDelay);
      }

      safeTimeout(() => {
        if (!isRunningRef.current) return;
        if (cursorRef.current) cursorRef.current.style.display = "none";
      }, copy.question.length * charDelay);
    }, 500);

    safeTimeout(() => {
      if (!isRunningRef.current) return;
      const loader = card.querySelector("[data-loader]") as HTMLElement;
      if (loader) {
        loader.style.display = "flex";
        requestAnimationFrame(() => {
          if (loader) loader.style.opacity = "1";
        });
      }
    }, 2200);

    safeTimeout(() => {
      if (!isRunningRef.current) return;

      const loader = card.querySelector("[data-loader]") as HTMLElement;
      if (loader) {
        loader.style.transition = "opacity 200ms ease-out";
        loader.style.opacity = "0";
      }

      if (floatRef.current) floatRef.current.style.animationPlayState = "paused";

      card.style.transition =
        "width 400ms cubic-bezier(0.4, 0, 0.2, 1), max-height 400ms cubic-bezier(0.4, 0, 0.2, 1)";
      card.style.width = `${expandedWidth}px`;
      card.style.maxHeight = `${expandedMaxHeight}px`;
      card.style.overflowY = "auto";

      safeTimeout(() => {
        if (floatRef.current) floatRef.current.style.animationPlayState = "running";
      }, 400);
    }, 3000);

    safeTimeout(() => {
      if (!isRunningRef.current) return;
      if (!answerBlockRef.current) return;
      answerBlockRef.current.style.display = "block";
      requestAnimationFrame(() => {
        if (!answerBlockRef.current) return;
        answerBlockRef.current.style.transition =
          "opacity 350ms ease-out, transform 350ms ease-out";
        answerBlockRef.current.style.opacity = "1";
        answerBlockRef.current.style.transform = "translateY(0)";
      });
    }, 3200);

    safeTimeout(() => {
      if (!isRunningRef.current) return;
      if (!confidenceRef.current) return;
      confidenceRef.current.style.display = "block";
      requestAnimationFrame(() => {
        if (!confidenceRef.current) return;
        confidenceRef.current.style.transition =
          "opacity 350ms ease-out, transform 350ms ease-out";
        confidenceRef.current.style.opacity = "1";
        confidenceRef.current.style.transform = "translateY(0)";

        const fill = confidenceRef.current.querySelector(
          "[data-confidence-fill]"
        ) as HTMLElement;
        if (fill) {
          fill.style.transition = "width 600ms ease-out";
          fill.style.width = "94%";
        }
      });
    }, 3400);

    safeTimeout(() => {
      if (!isRunningRef.current) return;
      if (!citationRef.current) return;
      citationRef.current.style.display = "block";
      requestAnimationFrame(() => {
        if (!citationRef.current) return;
        citationRef.current.style.transition =
          "opacity 350ms ease-out, transform 350ms ease-out";
        citationRef.current.style.opacity = "1";
        citationRef.current.style.transform = "translateY(0)";
      });
    }, 3600);

    safeTimeout(() => {
      if (!isRunningRef.current) return;
      isRunningRef.current = false;
      hasPlayedRef.current = true;
      setIsDemoReady(true);
      if (floatRef.current) floatRef.current.style.animationPlayState = "paused";
      // Уведомляем родителя что анимация завершена
      onAnimationComplete?.();
    }, 4200);
  }, [copy.question, expandedMaxHeight, expandedWidth, resetDOM, onAnimationComplete]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mq.matches;

    if (staticState) {
      showFinalState();
      return () => {
        stopAnimation();
      };
    }

    function handleMQChange(e: MediaQueryListEvent) {
      reduceMotionRef.current = e.matches;
      if (e.matches) {
        stopAnimation();
        resetDOM();
        showFinalState();
      } else {
        if (hasPlayedRef.current) {
          showFinalState();
        } else {
          runSequence();
        }
      }
    }
    mq.addEventListener("change", handleMQChange);

    function handleVisibility() {
      if (document.hidden) {
        stopAnimation();
      } else {
        safeTimeout(() => {
          if (!document.hidden) {
            if (reduceMotionRef.current || hasPlayedRef.current) {
              showFinalState();
            } else {
              runSequence();
            }
          }
        }, 300);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    if (mq.matches) {
      showFinalState();
    } else {
      runSequence();
    }

    return () => {
      stopAnimation();
      document.removeEventListener("visibilitychange", handleVisibility);
      mq.removeEventListener("change", handleMQChange);
    };
  }, [resetDOM, runSequence, showFinalState, staticState]);

  // Мгновенный пропуск анимации (когда пользователь скроллит до её завершения)
  useEffect(() => {
    if (!skipAnimation) return;
    if (hasPlayedRef.current) return;
    stopAnimation();
    showFinalState();
    onAnimationComplete?.();
  }, [skipAnimation, showFinalState, onAnimationComplete]);

  function handleOpen() {
    const toast = toastRef.current;
    if (!toast) return;
    toast.style.display = "block";
    toast.style.opacity = "1";
    toast.style.transition = "opacity 300ms ease-out";

    safeTimeout(() => {
      if (!toast) return;
      toast.style.transition = "opacity 500ms ease-in";
      toast.style.opacity = "0";
      safeTimeout(() => {
        if (toast) toast.style.display = "none";
      }, 500);
    }, 1500);
  }

  return (
    <div
      ref={floatRef}
      className="flex items-center justify-center"
      style={{
        animation: staticState ? "none" : "hero-card-float 4s ease-in-out infinite",
        animationPlayState: "paused",
        overflow: staticState ? "visible" : undefined,
      }}
    >
      <div
        ref={cardRef}
        className="bg-white rounded-[20px]"
        style={{
          position: "relative",
          width: baseWidth,
          opacity: 0,
          transform: "scale(0.95)",
          overflow: staticState ? "visible" : "hidden",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)",
          padding: outerPadding,
        }}
        aria-label={copy.ariaLabel}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-4 mb-4"
          style={{ borderBottom: "1px solid #F0F0F0" }}
        >
          <div className="flex items-center gap-[6px]">
            <span className="text-[13px] font-semibold" style={{ color: "#1D1D1F" }}>
              LiveAssist AI
            </span>
            <span className="text-[13px]" style={{ color: "#6E6E73" }}>
              &middot; {copy.privateOverlay}
            </span>
          </div>
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: "#22C55E",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Question */}
        <div className={large ? "mb-5" : "mb-3"}>
          <p
            className={large ? "text-[12px] uppercase mb-[8px]" : "text-[10px] uppercase mb-[6px]"}
            style={{ color: "#6E6E73", letterSpacing: "0.08em" }}
          >
            {copy.questionLabel}
          </p>
          <div
            className="rounded-xl"
            style={{ backgroundColor: "#F5F5F7", padding: large ? "18px 20px" : "14px 16px" }}
          >
            <span className={large ? "text-[22px]" : "text-[15px]"} style={{ color: "#1D1D1F" }}>
              {typedText}
            </span>
            <span
              ref={cursorRef}
              className={large ? "text-[22px] font-light" : "text-[15px] font-light"}
              style={{
                color: "#1D1D1F",
                display: "none",
                animation: "blink 500ms step-end infinite",
              }}
            >
              |
            </span>
          </div>
        </div>

        {/* Loader */}
        <div
          data-loader
          className="flex gap-[5px] items-center py-2"
          style={{ display: "none", opacity: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: "#9CA3AF",
                animation: `dot-wave 1.4s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Answer */}
        <div
          ref={answerBlockRef}
          className={large ? "mb-5" : "mb-3"}
          style={{
            display: "none",
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          <p
            className={large ? "text-[12px] uppercase mb-[8px]" : "text-[10px] uppercase mb-[6px]"}
            style={{ color: "#6E6E73", letterSpacing: "0.08em" }}
          >
            {copy.answerLabel}
          </p>
          <div
            className={large ? "text-[22px] leading-[1.5]" : "text-[15px] leading-[1.5]"}
            style={{
              backgroundColor: "#F0FDF4",
              color: "#1D1D1F",
              padding: large ? "18px 20px" : "14px 16px",
              borderLeft: "3px solid #22C55E",
              borderRadius: "0 12px 12px 0",
            }}
          >
            {copy.answer}
          </div>
        </div>

        {/* Confidence */}
        <div
          ref={confidenceRef}
          className={large ? "mb-5" : "mb-3"}
          style={{
            display: "none",
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          <p
            className={large ? "text-[12px] uppercase mb-[8px]" : "text-[10px] uppercase mb-[6px]"}
            style={{ color: "#6E6E73", letterSpacing: "0.08em" }}
          >
            {copy.confidenceLabel}
          </p>
          <div
            className="w-full mb-[2px]"
            style={{ backgroundColor: "#E5E7EB", borderRadius: 2, height: 4 }}
          >
            <div
              data-confidence-fill
              className="h-full"
              style={{
                width: "0%",
                background: "linear-gradient(90deg, #22C55E, #16A34A)",
                borderRadius: 2,
              }}
            />
          </div>
          <p
            className={large ? "text-right text-[16px] font-semibold" : "text-right text-[11px] font-semibold"}
            style={{ color: "#22C55E" }}
          >
            {copy.confidenceValue}
          </p>
        </div>

        {/* Citation / Source */}
        <div
          ref={citationRef}
          style={{
            display: "none",
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: "10px 14px",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{ marginTop: 2, flexShrink: 0 }}
                >
                  <path
                    d="M3 1.5H13C13.8284 1.5 14.5 2.17157 14.5 3V13C14.5 13.8284 13.8284 14.5 13 14.5H3C2.17157 14.5 1.5 13.8284 1.5 13V3C1.5 2.17157 2.17157 1.5 3 1.5Z"
                    stroke={fileAccent}
                    strokeWidth="1.2"
                  />
                  <path d="M4 4.5H12" stroke={fileAccent} strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M4 7H12" stroke={fileAccent} strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M4 9.5H8" stroke={fileAccent} strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <div className="min-w-0">
                  <p
                    className={large ? "font-semibold text-[18px] truncate" : "font-semibold text-[13px] truncate"}
                    style={{ color: "#1D1D1F" }}
                  >
                    {copy.sourceFile}
                  </p>
                  <p className={large ? "text-[15px]" : "text-[11px]"} style={{ color: "#6E6E73" }}>
                    {copy.sourceMeta}
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpen}
                className={large ? "text-white text-[16px] rounded-full cursor-pointer border-0 shrink-0 font-medium leading-none" : "text-white text-[11px] rounded-full cursor-pointer border-0 shrink-0 font-medium leading-none"}
                style={{ backgroundColor: sourceButtonBg, padding: large ? "10px 18px" : "4px 10px" }}
              >
                {copy.openFile}
              </button>
            </div>
          </div>

          <div
            className={large ? "pt-[14px] mt-[14px] text-right text-[15px]" : "pt-[10px] mt-[10px] text-right text-[11px]"}
            style={{ color: "#9CA3AF", borderTop: "1px solid #F0F0F0" }}
          >
            {copy.answeredIn}
          </div>
        </div>

        {/* Onboarding hint zones + tooltip */}
        {onboarding && isDemoReady ? (
          <>
            {hints.map((hint) => {
              const isActive = activeHint?.id === hint.id;
              // В scroll-режиме hover-зоны визуально подсвечиваются, но не меняют activeHint
              const isScrollMode = scrollActiveHintId != null;

              return (
                <button
                  key={hint.id}
                  type="button"
                  onPointerEnter={() => { if (!isScrollMode) setHoverHint(hint); }}
                  onPointerLeave={() => { if (!isScrollMode) setHoverHint(null); }}
                  onFocus={() => { if (!isScrollMode) setHoverHint(hint); }}
                  onBlur={() => { if (!isScrollMode) setHoverHint(null); }}
                  className={`absolute z-20 rounded-[14px] border bg-transparent text-left transition-[border-color,box-shadow,background-color] duration-200 ease-out focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[rgba(31,157,99,0.28)] ${
                    isActive
                      ? "border-[rgba(31,157,99,0.22)] bg-[rgba(31,157,99,0.03)] shadow-[0_0_0_4px_rgba(15,23,42,0.04)]"
                      : "border-transparent"
                  }`}
                  style={hint.zone}
                  aria-label={`${hint.eyebrow}: ${hint.title}`}
                >
                  <span
                    className={`absolute left-3 top-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.96)] px-2.5 py-1 text-[10px] font-[800] uppercase tracking-[0.08em] text-[#1d1d1f] shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition-[opacity,transform] duration-200 ease-out ${
                      isActive ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1F9D63]" aria-hidden="true" />
                    {hint.targetLabel}
                  </span>
                </button>
              );
            })}

            <AnimatePresence>
              {activeHint ? (
                <motion.div
                  key={activeHint.id}
                  initial={reduceMotionRef.current ? false : { opacity: 0, y: 10, scale: 0.96, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={reduceMotionRef.current ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98, filter: "blur(3px)" }}
                  transition={{
                    duration: reduceMotionRef.current ? 0 : 0.22,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="pointer-events-none absolute z-30 w-[270px] rounded-[16px] border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.98)] p-4 text-left shadow-[0_20px_52px_rgba(29,29,31,0.14)] backdrop-blur-xl"
                  style={activeHint.tooltip}
                >
                  <div
                    className="absolute h-3 w-3 rotate-45 border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.98)]"
                    style={activeHint.tail}
                    aria-hidden="true"
                  />
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1F9D63]" aria-hidden="true" />
                    <p className="text-[11px] font-[800] uppercase tracking-[0.12em] text-[#1F9D63]">
                      {activeHint.eyebrow}
                    </p>
                  </div>
                  <p className="text-[15px] font-[720] leading-[1.25] text-[#1d1d1f]">
                    {activeHint.title}
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.45] text-[#6e6e73]">
                    {activeHint.body}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        ) : null}

        {/* Toast */}
        <div
          ref={toastRef}
          className="text-[12px] text-center py-2 rounded-lg mt-2"
          style={{
            display: "none",
            opacity: 0,
            backgroundColor: "#1D1D1F",
            color: "#FFFFFF",
          }}
        >
          {copy.openingFile}
        </div>
      </div>
    </div>
  );
}
