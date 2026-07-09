'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  FileSearch,
  FileText,
  Instagram,
  Keyboard,
  Linkedin,
  Mail,
  MessageSquareText,
  MousePointer2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import type { CSSProperties, PointerEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Lang } from '../lib/strings';

type FooterCopy = {
  logo: string;
  tagline: string;
  description: string;
  connect: string;
  legal: string;
  follow: string;
  rights: string;
  builtBy: string;
  privacy: string;
  terms: string;
  contact: string;
};

const CONTACT_EMAIL = 'aibek@liveassist.tech';
const CONTACT_PHONE_DISPLAY = '+7 706 656 96 10';
const CONTACT_PHONE_HREF = 'tel:+77066569610';

const SOCIAL_LINKS = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/aibek-zharylkassyn/',
    icon: Linkedin,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/liveassist_/?hl=ru',
    icon: Instagram,
  },
  {
    id: 'x',
    label: 'X',
    href: 'https://x.com/zharylkassyn_a',
    icon: XIcon,
  },
] as const;

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

type FooterMoment = {
  id: string;
  x: number;
  y: number;
  label: string;
  title: string;
  body: string;
  source: string;
  icon: LucideIcon;
};

type StageStyle = CSSProperties & {
  '--cursor-x': string;
  '--cursor-y': string;
};

const momentsByLang: Record<Lang, FooterMoment[]> = {
  en: [
    {
      id: 'question',
      x: 22,
      y: 34,
      label: 'Live question',
      title: 'Customer asks about quarterly billing',
      body: 'The rep keeps the call moving and asks LiveAssist for the exact policy.',
      source: 'Call transcript',
      icon: MousePointer2,
    },
    {
      id: 'hotkey',
      x: 46,
      y: 58,
      label: 'Hotkey',
      title: 'The shortcut opens the private layer',
      body: 'Ctrl+J on Windows/Linux or ⌘J on Mac. No app switching, no visible customer-facing popup.',
      source: 'Desktop overlay',
      icon: Keyboard,
    },
    {
      id: 'retrieval',
      x: 68,
      y: 31,
      label: 'Retrieval',
      title: 'The right document rises up',
      body: 'Pricing, SOPs, and policy files are scanned against the question.',
      source: 'Pricing_Terms.pdf',
      icon: FileSearch,
    },
    {
      id: 'answer',
      x: 77,
      y: 68,
      label: 'Answer',
      title: 'A cited reply is ready',
      body: 'The rep gets a short, usable answer with a source attached.',
      source: 'Confidence: high',
      icon: MessageSquareText,
    },
    {
      id: 'private',
      x: 34,
      y: 76,
      label: 'Private',
      title: 'Only the rep sees the assist',
      body: 'The overlay stays above the workflow without becoming part of the call.',
      source: 'Rep-only layer',
      icon: ShieldCheck,
    },
  ],
  ru: [
    {
      id: 'question',
      x: 22,
      y: 34,
      label: 'Вопрос в звонке',
      title: 'Клиент спрашивает про квартальную оплату',
      body: 'Менеджер не теряет темп разговора и просит LiveAssist найти точную политику.',
      source: 'Транскрипт звонка',
      icon: MousePointer2,
    },
    {
      id: 'hotkey',
      x: 46,
      y: 58,
      label: 'Хоткей',
      title: 'Хоткей открывает приватный слой',
      body: 'Ctrl+J на Windows/Linux или ⌘J на Mac. Без переключения вкладок и видимого клиенту окна.',
      source: 'Desktop overlay',
      icon: Keyboard,
    },
    {
      id: 'retrieval',
      x: 68,
      y: 31,
      label: 'Поиск',
      title: 'Нужный документ поднимается наверх',
      body: 'Прайсинг, SOP и политики сверяются с вопросом прямо во время звонка.',
      source: 'Pricing_Terms.pdf',
      icon: FileSearch,
    },
    {
      id: 'answer',
      x: 77,
      y: 68,
      label: 'Ответ',
      title: 'Готов короткий ответ с источником',
      body: 'Менеджер получает фразу, которую можно сказать вслух, и ссылку на документ.',
      source: 'Уверенность: высокая',
      icon: MessageSquareText,
    },
    {
      id: 'private',
      x: 34,
      y: 76,
      label: 'Приватно',
      title: 'Подсказку видит только менеджер',
      body: 'Оверлей остается поверх рабочего процесса, но не попадает в звонок.',
      source: 'Rep-only layer',
      icon: ShieldCheck,
    },
  ],
};

const frameCopy: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    body: string;
    instruction: string;
    stageLabel: string;
    overlayTitle: string;
    overlayBody: string;
    sourceLabel: string;
    sourceBody: string;
    callTitle: string;
    transcriptOne: string;
    transcriptTwo: string;
    terminalOne: string;
    terminalTwo: string;
  }
> = {
  en: {
    eyebrow: 'PRIVATE OVERLAY LAB',
    title: 'Move the cursor. Watch the answer surface.',
    body: 'A miniature desktop scene for the exact moment LiveAssist helps: the question, hotkey, source, answer, and private layer lift into view as you explore.',
    instruction: 'Move across the window or use the controls below.',
    stageLabel: 'Interactive LiveAssist footer demo',
    overlayTitle: 'Suggested response',
    overlayBody: 'Yes. Quarterly billing is available on annual team plans. Mention that onboarding remains included.',
    sourceLabel: 'Source attached',
    sourceBody: 'Pricing_Terms.pdf · page 4',
    callTitle: 'Live call',
    transcriptOne: 'Customer: Can we pay quarterly?',
    transcriptTwo: 'Rep: Let me confirm that quickly.',
    terminalOne: 'retrieving company docs',
    terminalTwo: 'answer ready in 1.2s',
  },
  ru: {
    eyebrow: 'ЛАБОРАТОРИЯ ОВЕРЛЕЯ',
    title: 'Веди курсором. Ответ сам выходит на поверхность.',
    body: 'Мини-десктоп в футере показывает момент работы LiveAssist: вопрос, хоткей, источник, ответ и приватный слой двигаются вместе с вниманием менеджера.',
    instruction: 'Веди мышкой по окну или нажимай кнопки ниже.',
    stageLabel: 'Интерактивная демонстрация футера LiveAssist',
    overlayTitle: 'Подсказка для ответа',
    overlayBody: 'Да. Квартальная оплата доступна на годовых team-планах. Онбординг остается включенным.',
    sourceLabel: 'Источник прикреплен',
    sourceBody: 'Pricing_Terms.pdf · стр. 4',
    callTitle: 'Live call',
    transcriptOne: 'Клиент: можем платить поквартально?',
    transcriptTwo: 'Менеджер: сейчас быстро проверю.',
    terminalOne: 'retrieving company docs',
    terminalTwo: 'answer ready in 1.2s',
  },
};

export function InteractiveDemoPanel({ lang }: { lang: Lang }) {
  const prefersReducedMotion = useReducedMotion();
  const moments = momentsByLang[lang];
  const text = frameCopy[lang];
  const [activeId, setActiveId] = useState(moments[0].id);
  const [pointer, setPointer] = useState({ x: 50, y: 48 });
  const [isInside, setIsInside] = useState(false);

  const activeMoment = useMemo(
    () => moments.find((moment) => moment.id === activeId) ?? moments[0],
    [activeId, moments]
  );

  const rotateX = prefersReducedMotion ? 0 : (50 - pointer.y) / 7;
  const rotateY = prefersReducedMotion ? 0 : (pointer.x - 50) / 8;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const nextPointer = {
      x: Math.min(92, Math.max(8, x)),
      y: Math.min(88, Math.max(12, y)),
    };

    setPointer(nextPointer);
    setIsInside(true);

    const nearest = moments.reduce((closest, moment) => {
      const closestDistance = Math.hypot(closest.x - nextPointer.x, closest.y - nextPointer.y);
      const distance = Math.hypot(moment.x - nextPointer.x, moment.y - nextPointer.y);
      return distance < closestDistance ? moment : closest;
    }, moments[0]);

    setActiveId(nearest.id);
  }

  const stageStyle: StageStyle = {
    '--cursor-x': `${pointer.x}%`,
    '--cursor-y': `${pointer.y}%`,
  };
  const ActiveIcon = activeMoment.icon;

  return (
    <div className="mx-auto w-full max-w-[1100px]">
            <div
              role="region"
              aria-label={text.stageLabel}
              onPointerMove={handlePointerMove}
              onPointerEnter={() => setIsInside(true)}
              onPointerLeave={() => setIsInside(false)}
        className="relative min-h-[600px] rounded-[24px] border border-white/[0.14] bg-[#0c0e17] p-4 text-white shadow-[0_34px_90px_rgba(0,0,0,0.45)]"
              style={{
                perspective: '1200px',
              }}
            >
              <div
          className="relative h-full min-h-[568px] overflow-hidden rounded-[18px] border border-white/10 bg-[#10131f]"
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: prefersReducedMotion ? 'none' : 'transform 100ms ease-out',
                }}
              >
          <div className="flex h-12 items-center justify-between border-b border-white/10 bg-white/[0.04] px-5">
                  <div className="flex items-center gap-2" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
            <span className="text-sm font-[600] text-white/[0.46]">LiveAssist.private</span>
                </div>

          <div className="relative min-h-[520px] p-6" style={stageStyle}>
                  <div
                    className="absolute inset-0 opacity-80"
                    aria-hidden="true"
                    style={{
                      background:
                        'radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(143,227,255,0.2), transparent 26%), linear-gradient(120deg, rgba(255,255,255,0.05), transparent 42%)',
                    }}
                  />

                  <div
            className="relative grid gap-5 md:grid-cols-[0.9fr_1.1fr]"
                    style={{ transform: 'translateZ(32px)' }}
                  >
              <div className="rounded-[14px] border border-white/10 bg-black/[0.22] p-8 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-[600] uppercase tracking-[0.14em] text-white/[0.46]">
                          {text.callTitle}
                        </span>
                  <span className="rounded-full bg-[#2585ff]/[0.14] px-3 py-1.5 text-xs font-[700] text-[#8fe3ff]">
                          active
                        </span>
                      </div>
                <div className="space-y-4">
                  <div className="rounded-[10px] bg-white/[0.06] p-4 text-base leading-[1.45] text-white/[0.78]">
                          {text.transcriptOne}
                        </div>
                  <div className="ml-8 rounded-[10px] bg-[#2585ff]/[0.18] p-4 text-base leading-[1.45] text-white/[0.86]">
                          {text.transcriptTwo}
                        </div>
                      </div>
                    </div>

                    <div
              className="relative rounded-[16px] border border-[#2585ff]/[0.34] bg-[#171a2c]/[0.92] p-8 shadow-[0_24px_70px_rgba(37,133,255,0.24)]"
                      style={{ transform: 'translateZ(72px)' }}
                    >
                <div className="mb-5 flex items-start justify-between gap-5">
                        <div>
                    <p className="text-sm font-[600] uppercase tracking-[0.14em] text-[#8fe3ff]">
                            {text.overlayTitle}
                          </p>
                    <p className="mt-3 text-[22px] font-[700] leading-[1.25] tracking-[-0.03em] text-white">
                            {activeMoment.title}
                          </p>
                        </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-white/10 text-[#8fe3ff]">
                    <ActiveIcon size={22} aria-hidden="true" />
                        </div>
                      </div>
                <p className="text-[16px] font-[400] leading-[1.6] text-[#d7d9e5]">{text.overlayBody}</p>
                <div className="mt-6 rounded-[12px] border border-white/10 bg-black/[0.24] p-4">
                  <div className="flex items-center gap-2 text-sm font-[600] uppercase tracking-[0.12em] text-[#8fe3ff]">
                    <FileText size={16} aria-hidden="true" />
                          {text.sourceLabel}
                        </div>
                  <p className="mt-2 text-sm text-white/[0.72]">{activeMoment.source}</p>
                      </div>
                    </div>
                  </div>

                  <div
            className="absolute bottom-6 left-6 right-6 grid gap-4 md:grid-cols-[1fr_0.8fr]"
                    style={{ transform: 'translateZ(48px)' }}
                  >
              <div className="rounded-[12px] border border-white/10 bg-black/[0.28] p-5 font-mono text-sm text-[#aeb2c4]">
                      <p>
                        <span className="text-[#8fe3ff]">$</span> {text.terminalOne}
                      </p>
                      <p className="mt-2">
                        <span className="text-[#8fe3ff]">✓</span> {text.terminalTwo}
                      </p>
                    </div>
              <div className="rounded-[12px] border border-white/10 bg-white/[0.06] p-5">
                <p className="text-sm font-[600] uppercase tracking-[0.12em] text-white/[0.46]">
                        {activeMoment.label}
                      </p>
                <p className="mt-2 text-[16px] font-[400] leading-[1.55] text-white/[0.76]">{activeMoment.body}</p>
                    </div>
                  </div>

                  <div
            className="pointer-events-none absolute z-20 w-[min(360px,calc(100%-40px))]"
                    style={{
              left: `min(max(${pointer.x}%, 180px), calc(100% - 180px))`,
              top: `min(max(${pointer.y}%, 110px), calc(100% - 132px))`,
                      transform: 'translate(-50%, -112%)',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeMoment.id}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0, 0, 0.2, 1] }}
                className="rounded-[14px] border border-white/[0.14] bg-[#f7faff] p-5 text-[#17181d] shadow-[0_18px_46px_rgba(0,0,0,0.28)]"
                      >
                <p className="text-xs font-[700] uppercase tracking-[0.13em] text-[#2585ff]">
                          {activeMoment.label}
                        </p>
                <p className="mt-2 text-lg font-[700] leading-[1.25] tracking-[-0.02em]">{activeMoment.title}</p>
                <p className="mt-3 text-[16px] font-[400] leading-[1.55] text-[#6e6e73]">{activeMoment.body}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div
            className={`pointer-events-none absolute z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[#8fe3ff]/40 bg-[#8fe3ff]/[0.12] text-[#8fe3ff] shadow-[0_0_30px_rgba(143,227,255,0.32)] ${
                      isInside ? 'opacity-100' : 'opacity-55'
                    }`}
                    style={{
                      left: 'var(--cursor-x)',
                      top: 'var(--cursor-y)',
                      transform: 'translate(-50%, -50%) translateZ(96px)',
                      transition: prefersReducedMotion ? 'none' : 'opacity 150ms ease-out',
                    }}
                    aria-hidden="true"
                  >
            <MousePointer2 size={20} />
                  </div>

                  {moments.map((moment) => {
                    const MomentIcon = moment.icon;

                    return (
                      <button
                        key={moment.id}
                        type="button"
                        onClick={() => {
                          setActiveId(moment.id);
                          setPointer({ x: moment.x, y: moment.y });
                        }}
                className={`absolute z-10 flex h-11 w-11 items-center justify-center rounded-full border text-white transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#8fe3ff] ${
                          activeMoment.id === moment.id
                            ? 'border-[#8fe3ff] bg-[#2585ff]/[0.28]'
                            : 'border-white/[0.16] bg-white/10 hover:border-[#8fe3ff]/70'
                        }`}
                        style={{
                          left: `${moment.x}%`,
                          top: `${moment.y}%`,
                          transform: 'translate(-50%, -50%) translateZ(80px)',
                        }}
                        aria-label={moment.label}
                      >
                <MomentIcon size={17} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

      <div className="mt-5 flex min-w-max gap-3">
              {moments.map((moment) => (
                <button
                  key={moment.id}
                  type="button"
                  onClick={() => {
                    setActiveId(moment.id);
                    setPointer({ x: moment.x, y: moment.y });
                    setIsInside(true);
                  }}
            className={`min-h-[52px] rounded-[10px] border px-8 py-3 text-left text-sm font-[600] transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#8fe3ff] ${
                    activeMoment.id === moment.id
                      ? 'border-[#8fe3ff]/70 bg-[#2585ff]/[0.18] text-white'
                      : 'border-white/10 bg-white/[0.04] text-white/[0.62] hover:border-white/[0.24] hover:text-white'
                  }`}
                >
                  {moment.label}
                </button>
              ))}
            </div>
    </div>
  );
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(37,133,255,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafb]';

export function InteractiveFooter({ copy }: { copy: FooterCopy }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e5e5ea] bg-[#fafafb] px-5 pb-8 pt-14">
      <div className="mx-auto w-full" style={{ maxWidth: 'min(1180px, 100%)' }}>
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr] lg:gap-16">
          {/* Brand */}
          <div className="max-w-[420px]">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#2585ff] to-[#0a5bd6] text-[15px] font-[800] text-white shadow-[0_6px_18px_rgba(37,133,255,0.3)]"
              >
                L
              </span>
              <strong className="text-[17px] font-[700] tracking-[-0.01em] text-[#1d1d1f]">
                {copy.logo}
              </strong>
            </div>
            <p className="mt-4 text-[14px] leading-[1.6] text-[#6e6e73]">{copy.description}</p>

            <div className="mt-6">
              <p className="text-[12px] font-[700] uppercase tracking-[0.14em] text-[#86868b]">
                {copy.follow}
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                {SOCIAL_LINKS.map(({ id, label, href, icon: Icon }) => (
                  <a
                    key={id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border border-[#e0e0e5] bg-white text-[#4a4a4f] transition-all hover:-translate-y-0.5 hover:border-[#2585ff] hover:text-[#2585ff] hover:shadow-[0_8px_20px_rgba(37,133,255,0.18)] ${focusRing}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[12px] font-[700] uppercase tracking-[0.14em] text-[#86868b]">
              {copy.connect}
            </p>
            <ul className="mt-4 space-y-3 text-[14px]">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className={`group inline-flex items-center gap-2.5 text-[#4a4a4f] transition-colors hover:text-[#1d1d1f] ${focusRing}`}
                >
                  <Mail size={16} className="text-[#86868b] transition-colors group-hover:text-[#2585ff]" aria-hidden="true" />
                  <span className="break-all">{CONTACT_EMAIL}</span>
                </a>
              </li>
              <li>
                <a
                  href={CONTACT_PHONE_HREF}
                  className={`group inline-flex items-center gap-2.5 text-[#4a4a4f] transition-colors hover:text-[#1d1d1f] ${focusRing}`}
                >
                  <Phone size={16} className="text-[#86868b] transition-colors group-hover:text-[#2585ff]" aria-hidden="true" />
                  <span>{CONTACT_PHONE_DISPLAY}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[12px] font-[700] uppercase tracking-[0.14em] text-[#86868b]">
              {copy.legal}
            </p>
            <ul className="mt-4 space-y-3 text-[14px]">
              <li>
                <a
                  href="/privacy"
                  className={`text-[#4a4a4f] transition-colors hover:text-[#1d1d1f] ${focusRing}`}
                >
                  {copy.privacy}
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className={`text-[#4a4a4f] transition-colors hover:text-[#1d1d1f] ${focusRing}`}
                >
                  {copy.terms}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[#e5e5ea] pt-6 text-[13px] text-[#86868b] sm:flex-row sm:items-center">
          <span>
            © {year} {copy.logo}. {copy.rights}
          </span>
          <span>{copy.builtBy}</span>
        </div>
      </div>
    </footer>
  );
}
