"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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

export default function ProductMockup({ copy }: { copy: ProductMockupCopy }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const answerBlockRef = useRef<HTMLDivElement>(null);
  const confidenceRef = useRef<HTMLDivElement>(null);
  const citationRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  const isRunningRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const [typedText, setTypedText] = useState("");
  const reduceMotionRef = useRef(false);

  const charDelay = 42;

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

  function resetDOM() {
    const card = cardRef.current;
    if (!card) return;

    card.style.transition = "none";
    card.style.width = "420px";
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
  }

  const showStaticReduced = useCallback(function showStaticReduced() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "none";
    card.style.width = "520px";
    card.style.maxHeight = "none";
    card.style.overflowY = "visible";
    card.style.opacity = "1";
    card.style.transform = "scale(1)";
    setTypedText(copy.question);
  }, [copy.question]);

  const runSequence = useCallback(function runSequence() {
    if (isRunningRef.current) return;
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
      card.style.width = "520px";
      card.style.maxHeight = "480px";
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
      if (card && isRunningRef.current) {
        card.scrollTo({ top: card.scrollHeight, behavior: "smooth" });
      }
    }, 4000);

    safeTimeout(() => {
      if (!isRunningRef.current) return;
      card.style.transition =
        "opacity 600ms ease-in, transform 600ms ease-in, width 400ms ease-in, max-height 400ms ease-in";
      card.style.opacity = "0";
      card.style.transform = "scale(0.97)";
    }, 6000);

    safeTimeout(() => {
      isRunningRef.current = false;
      resetDOM();
      safeTimeout(() => {
        if (!document.hidden) runSequence();
      }, 400);
    }, 6600);
  }, [copy.question]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = mq.matches;

    function handleMQChange(e: MediaQueryListEvent) {
      reduceMotionRef.current = e.matches;
      if (e.matches) {
        stopAnimation();
        resetDOM();
        showStaticReduced();
      } else {
        runSequence();
      }
    }
    mq.addEventListener("change", handleMQChange);

    function handleVisibility() {
      if (document.hidden) {
        stopAnimation();
      } else {
        safeTimeout(() => {
          if (!document.hidden) {
            if (reduceMotionRef.current) {
              showStaticReduced();
            } else {
              runSequence();
            }
          }
        }, 300);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    if (mq.matches) {
      showStaticReduced();
    } else {
      runSequence();
    }

    return () => {
      stopAnimation();
      document.removeEventListener("visibilitychange", handleVisibility);
      mq.removeEventListener("change", handleMQChange);
    };
  }, [runSequence, showStaticReduced]);

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
        animation: "hero-card-float 4s ease-in-out infinite",
        animationPlayState: "paused",
      }}
    >
      <div
        ref={cardRef}
        className="bg-white rounded-[20px]"
        style={{
          width: 420,
          opacity: 0,
          transform: "scale(0.95)",
          overflow: "hidden",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)",
          padding: "20px 24px",
        }}
        aria-label={copy.ariaLabel}
      >
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

        <div className="mb-3">
          <p
            className="text-[10px] uppercase mb-[6px]"
            style={{ color: "#6E6E73", letterSpacing: "0.08em" }}
          >
            {copy.questionLabel}
          </p>
          <div
            className="rounded-xl"
            style={{ backgroundColor: "#F5F5F7", padding: "14px 16px" }}
          >
            <span className="text-[15px]" style={{ color: "#1D1D1F" }}>
              {typedText}
            </span>
            <span
              ref={cursorRef}
              className="text-[15px] font-light"
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

        <div
          ref={answerBlockRef}
          className="mb-3"
          style={{
            display: "none",
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          <p
            className="text-[10px] uppercase mb-[6px]"
            style={{ color: "#6E6E73", letterSpacing: "0.08em" }}
          >
            {copy.answerLabel}
          </p>
          <div
            className="text-[15px] leading-[1.5]"
            style={{
              backgroundColor: "#F0FDF4",
              color: "#1D1D1F",
              padding: "14px 16px",
              borderLeft: "3px solid #22C55E",
              borderRadius: "0 12px 12px 0",
            }}
          >
            {copy.answer}
          </div>
        </div>

        <div
          ref={confidenceRef}
          className="mb-3"
          style={{
            display: "none",
            opacity: 0,
            transform: "translateY(16px)",
          }}
        >
          <p
            className="text-[10px] uppercase mb-[6px]"
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
            className="text-right text-[11px] font-semibold"
            style={{ color: "#22C55E" }}
          >
            {copy.confidenceValue}
          </p>
        </div>

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
                    stroke="#5E5CE6"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M4 4.5H12"
                    stroke="#5E5CE6"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 7H12"
                    stroke="#5E5CE6"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 9.5H8"
                    stroke="#5E5CE6"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="min-w-0">
                  <p
                    className="font-semibold text-[13px] truncate"
                    style={{ color: "#1D1D1F" }}
                  >
                    {copy.sourceFile}
                  </p>
                  <p className="text-[11px]" style={{ color: "#6E6E73" }}>
                    {copy.sourceMeta}
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpen}
                className="text-white text-[11px] rounded-full cursor-pointer border-0 shrink-0 font-medium leading-none"
                style={{ backgroundColor: "#5E5CE6", padding: "4px 10px" }}
              >
                {copy.openFile}
              </button>
            </div>
          </div>

          <div
            className="pt-[10px] mt-[10px] text-right text-[11px]"
            style={{ color: "#9CA3AF", borderTop: "1px solid #F0F0F0" }}
          >
            {copy.answeredIn}
          </div>
        </div>

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
