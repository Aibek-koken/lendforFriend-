"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import type { Lang } from "@/lib/strings";

type Stat = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Non-numeric text shown instead of a counting number (e.g. 3 OS). */
  display?: string;
  label: string;
};

function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  active,
  instant,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  active: boolean;
  instant: boolean;
}) {
  const [n, setN] = useState(instant ? value : 0);

  useEffect(() => {
    if (instant) {
      setN(value);
      return;
    }
    if (!active) return;

    let raf = 0;
    const duration = 1100;
    const start = performance.now();

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, instant, value]);

  return (
    <>
      {prefix}
      {n.toFixed(decimals)}
      {suffix}
    </>
  );
}

export function StatsBand({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const instant = !!prefersReduced;

  const stats: Stat[] =
    lang === "ru"
      ? [
          { value: 1.4, decimals: 1, suffix: " с", label: "среднее время ответа" },
          { value: 94, suffix: "%", label: "уверенность с источником" },
          { display: "3 ОС", value: 0, label: "хоткей для Mac, Windows и Linux" },
          { value: 0, label: "фоновой прослушки" },
        ]
      : [
          { value: 1.4, decimals: 1, suffix: "s", label: "average answer time" },
          { value: 94, suffix: "%", label: "source-backed confidence" },
          { display: "3 OS", value: 0, label: "shortcut for Mac, Windows, and Linux" },
          { value: 0, label: "always-on listening" },
        ];

  return (
    <section className="px-4 py-14 sm:px-5 md:py-20">
      <div
        ref={ref}
        className="relative mx-auto overflow-hidden rounded-[28px] border border-[rgba(217,152,30,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255, 246, 244,0.92)_100%)] px-5 py-9 shadow-[0_24px_60px_rgba(217,152,30,0.08)] sm:px-10 sm:py-12"
        style={{ maxWidth: "min(1080px, 100%)" }}
      >
        {/* soft floating orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full blur-[60px]"
          style={{ background: "radial-gradient(circle, rgba(217,152,30,0.18), transparent 70%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full blur-[70px]"
          style={{ background: "radial-gradient(circle, rgba(210,194,172,0.18), transparent 70%)" }}
        />

        <div className="relative grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center transition-all duration-700 ease-out"
              style={{
                opacity: instant || inView ? 1 : 0,
                transform: instant || inView ? "translateY(0)" : "translateY(16px)",
                transitionDelay: `${i * 90}ms`,
              }}
            >
              <p
                className="bg-clip-text text-[clamp(34px,6vw,52px)] font-[800] leading-none tracking-[-0.03em] text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #c9820f 0%, #c9820f 55%, #e0a92e 120%)",
                }}
              >
                {stat.display ? (
                  stat.display
                ) : (
                  <CountUp
                    value={stat.value}
                    decimals={stat.decimals}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    active={inView}
                    instant={instant}
                  />
                )}
              </p>
              <p className="mx-auto mt-2.5 max-w-[18ch] text-[13px] font-[500] leading-[1.4] text-[#6b665e] sm:text-[14px]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
