"use client";

import { OriginLink } from "@/components/ui/origin-button";
import type { Lang } from "../../lib/strings";

type OrbitIcon = {
  src: string;
  alt: string;
  /** soft colored glow cast under the card so each tile "pops" */
  glow: string;
  /** dark tiles already carry their own background; light tiles get a soft face */
  tone: "dark" | "light";
};

// Five product/integration icons the CRM agent connects. Duplicated once so the
// ring reads full & lush — the copies sit on the opposite side (5 slots apart in
// a 10-card ring) so you almost never see the same logo twice at once.
const BASE_ICONS: OrbitIcon[] = [
  { src: "/orbit/amo.jpg", alt: "amoCRM", glow: "rgba(47,127,209,0.55)", tone: "dark" },
  { src: "/orbit/whatsapp.png", alt: "WhatsApp", glow: "rgba(37,211,102,0.5)", tone: "light" },
  { src: "/orbit/chatbot.jpg", alt: "AI assistant", glow: "rgba(91,141,239,0.5)", tone: "light" },
  { src: "/orbit/workflow.png", alt: "Workflow automation", glow: "rgba(74,163,214,0.5)", tone: "light" },
  { src: "/orbit/cursor.png", alt: "Live overlay", glow: "rgba(150,164,190,0.5)", tone: "dark" },
];

const RING_ICONS: OrbitIcon[] = [...BASE_ICONS, ...BASE_ICONS];
const STEP = 360 / RING_ICONS.length;

const COPY: Record<Lang, { eyebrow: string; headline: string; primary: string; secondary: string }> = {
  en: {
    eyebrow: "AI CRM AGENT FOR SALES TEAMS",
    headline: "Turn every client call into an updated CRM.",
    primary: "Get started",
    secondary: "See how it works",
  },
  ru: {
    eyebrow: "AI CRM-АГЕНТ ДЛЯ ОТДЕЛОВ ПРОДАЖ",
    headline: "Каждый звонок клиента — в обновлённую CRM.",
    primary: "Начать бесплатно",
    secondary: "Как это работает",
  },
};

export default function HeroOrbit({ lang }: { lang: Lang }) {
  const copy = COPY[lang] ?? COPY.en;

  return (
    <section
      id="hero"
      className="hero-orbit relative isolate flex items-center justify-center overflow-hidden"
    >
      <style dangerouslySetInnerHTML={{ __html: HERO_ORBIT_CSS }} />

      {/* warm-dark backdrop + ambient amber glow, fading into the light body below */}
      <div className="hero-orbit__bg" aria-hidden="true" />
      <div className="hero-orbit__glow" aria-hidden="true" />

      {/* rotating 3D ring of product icons */}
      <div className="hero-orbit__stage" aria-hidden="true">
        <div className="hero-orbit__float">
          <div className="hero-orbit__ring">
            {RING_ICONS.map((icon, i) => (
              <div
                key={`${icon.src}-${i}`}
                className="hero-orbit__card"
                data-tone={icon.tone}
                style={
                  {
                    "--angle": `${i * STEP}deg`,
                    "--glow": icon.glow,
                  } as React.CSSProperties
                }
              >
                <div className="hero-orbit__cardInner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon.src} alt="" loading="eager" draggable={false} />
                  <span className="hero-orbit__sheen" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* soft scrim so the headline stays crisp over the moving cards */}
      <div className="hero-orbit__scrim" aria-hidden="true" />

      {/* center content */}
      <div className="hero-orbit__content">
        <p className="hero-orbit__eyebrow">
          <span className="hero-orbit__dot" aria-hidden="true" />
          {copy.eyebrow}
        </p>
        <h1 className="hero-orbit__headline">{copy.headline}</h1>
        <div className="hero-orbit__cta">
          <OriginLink href={`/signup?lang=${lang}`} size="lg">
            {copy.primary}
          </OriginLink>
          <a href="#features" className="hero-orbit__ghost">
            {copy.secondary}
          </a>
        </div>
      </div>

      {/* bottom seam-blend into the warm page body */}
      <div className="hero-orbit__fade" aria-hidden="true" />
    </section>
  );
}

const HERO_ORBIT_CSS = `
.hero-orbit {
  --bg: #141210;
  --card: 188px;
  --radius: 412px;
  --perspective: 1500px;
  min-height: 100svh;
  padding: clamp(120px, 16vh, 180px) 20px clamp(96px, 12vh, 140px);
}
.hero-orbit__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(120% 90% at 50% 8%, #211b13 0%, #17130e 46%, #100d0a 100%);
}
.hero-orbit__glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(46% 40% at 50% 44%, rgba(245,178,63,0.16), transparent 68%),
    radial-gradient(30% 26% at 22% 30%, rgba(210,150,60,0.10), transparent 70%),
    radial-gradient(30% 26% at 80% 62%, rgba(120,150,200,0.08), transparent 72%);
}

/* ── 3D ring ─────────────────────────────────────────────── */
.hero-orbit__stage {
  position: absolute;
  left: 50%;
  top: 53%;
  z-index: 2;
  width: var(--card);
  height: var(--card);
  transform: translate(-50%, -50%);
  perspective: var(--perspective);
  perspective-origin: 50% 50%;
  pointer-events: none;
}
.hero-orbit__float {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: heroOrbitFloat 9s ease-in-out infinite;
}
.hero-orbit__ring {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: rotateX(-13deg);
  animation: heroOrbitSpin 64s linear infinite;
}
.hero-orbit__card {
  position: absolute;
  inset: 0;
  transform: rotateY(var(--angle)) translateZ(var(--radius));
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.hero-orbit__cardInner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 26px;
  overflow: hidden;
  background: linear-gradient(160deg, #ffffff 0%, #eef1f6 100%);
  box-shadow:
    0 26px 60px -18px var(--glow),
    0 18px 44px rgba(0,0,0,0.5),
    inset 0 0 0 1px rgba(255,255,255,0.14);
}
.hero-orbit__card[data-tone="dark"] .hero-orbit__cardInner {
  background: linear-gradient(160deg, #12100c 0%, #0b0a08 100%);
  box-shadow:
    0 26px 60px -18px var(--glow),
    0 18px 44px rgba(0,0,0,0.6),
    inset 0 0 0 1px rgba(255,255,255,0.08);
}
.hero-orbit__cardInner img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}
.hero-orbit__sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(150deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 38%);
  mix-blend-mode: screen;
}

/* ── center content ──────────────────────────────────────── */
.hero-orbit__scrim {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  width: min(1100px, 120vw);
  height: min(680px, 90vh);
  transform: translate(-50%, -50%);
  pointer-events: none;
  background: radial-gradient(ellipse 46% 42% at 50% 50%, rgba(14,11,8,0.94) 0%, rgba(14,11,8,0.78) 40%, rgba(14,11,8,0.32) 60%, transparent 74%);
}
.hero-orbit__content {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 860px;
}
.hero-orbit__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid rgba(245,178,63,0.28);
  background: rgba(245,178,63,0.08);
  color: #f6c977;
  font-weight: 800;
  font-size: clamp(11px, 1.3vw, 13px);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}
.hero-orbit__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #f5b23f;
  box-shadow: 0 0 12px rgba(245,178,63,0.9);
}
.hero-orbit__headline {
  margin-top: 22px;
  max-width: 15ch;
  color: #fdfbf7;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.03;
  font-size: clamp(38px, 6.4vw, 72px);
  text-wrap: balance;
  text-shadow: 0 2px 40px rgba(0,0,0,0.5);
}
.hero-orbit__cta {
  margin-top: 38px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.hero-orbit__ghost {
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  padding: 0 26px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.06);
  color: #f4efe7;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  backdrop-filter: blur(6px);
  transition: background 150ms ease, border-color 150ms ease;
}
.hero-orbit__ghost:hover {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.32);
}

.hero-orbit__fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  height: 26%;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(250,248,245,0) 0%, rgba(250,248,245,0.55) 62%, #faf8f5 100%);
}

@keyframes heroOrbitSpin {
  from { transform: rotateX(-13deg) rotateY(0deg); }
  to   { transform: rotateX(-13deg) rotateY(360deg); }
}
@keyframes heroOrbitFloat {
  0%, 100% { transform: translateY(-10px); }
  50%      { transform: translateY(10px); }
}

/* ── responsive ──────────────────────────────────────────── */
@media (max-width: 1024px) {
  .hero-orbit { --card: 168px; --radius: 320px; --perspective: 1200px; }
}
@media (max-width: 640px) {
  .hero-orbit { --card: 116px; --radius: 208px; --perspective: 900px; }
  .hero-orbit__cardInner { border-radius: 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-orbit__ring { animation: none; }
  .hero-orbit__float { animation: none; }
}
`;
