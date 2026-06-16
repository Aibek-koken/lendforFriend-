'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  FileSearch,
  FileText,
  Keyboard,
  MessageSquareText,
  MousePointer2,
  ShieldCheck,
} from 'lucide-react';
import type { CSSProperties, PointerEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Lang } from '../lib/strings';

type FooterCopy = {
  logo: string;
  tagline: string;
  privacy: string;
  terms: string;
  contact: string;
};

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
      title: '⌘J opens the private layer',
      body: 'No app switching, no searching tabs, no visible customer-facing popup.',
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
      title: '⌘J открывает приватный слой',
      body: 'Без переключения вкладок, ручного поиска и видимого клиенту окна.',
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

export function InteractiveFooter({ lang, copy }: { lang: Lang; copy: FooterCopy }) {
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
    <footer className="relative overflow-hidden border-t border-[#1f2230] bg-[#07080d] px-5 py-20 text-white sm:py-24">
      <div
        className="absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(94,92,230,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(33,168,154,0.12) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(135deg, rgba(94,92,230,0.20), transparent 34%), linear-gradient(225deg, rgba(33,168,154,0.16), transparent 42%), linear-gradient(180deg, transparent, rgba(255,255,255,0.05))',
        }}
      />

      <div className="relative mx-auto" style={{ maxWidth: 'min(1180px, 100%)' }}>
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-[6px] border border-white/10 bg-white/[0.08] px-3 py-1 text-[12px] font-[760] uppercase tracking-[0.16em] text-[#b9bbff]">
              {text.eyebrow}
            </p>
            <h2 className="max-w-[620px] text-[clamp(40px,6vw,72px)] font-[780] leading-[0.95] tracking-[-0.01em]">
              {text.title}
            </h2>
            <p className="mt-6 max-w-[560px] text-[18px] leading-[1.55] text-[#b8bbc8]">
              {text.body}
            </p>
            <p className="mt-5 text-[14px] font-[650] text-[#7ee7dc]">{text.instruction}</p>
          </div>

          <div>
            <div
              role="region"
              aria-label={text.stageLabel}
              onPointerMove={handlePointerMove}
              onPointerEnter={() => setIsInside(true)}
              onPointerLeave={() => setIsInside(false)}
              className="relative min-h-[520px] rounded-[22px] border border-white/[0.14] bg-[#0c0e17] p-3 shadow-[0_34px_90px_rgba(0,0,0,0.45)]"
              style={{
                perspective: '1200px',
              }}
            >
              <div
                className="relative h-full min-h-[496px] overflow-hidden rounded-[18px] border border-white/10 bg-[#10131f]"
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: prefersReducedMotion ? 'none' : 'transform 100ms ease-out',
                }}
              >
                <div className="flex h-10 items-center justify-between border-b border-white/10 bg-white/[0.04] px-4">
                  <div className="flex items-center gap-2" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-[12px] font-[650] text-white/[0.46]">LiveAssist.private</span>
                </div>

                <div className="relative min-h-[456px] p-5" style={stageStyle}>
                  <div
                    className="absolute inset-0 opacity-80"
                    aria-hidden="true"
                    style={{
                      background:
                        'radial-gradient(circle at var(--cursor-x) var(--cursor-y), rgba(126,231,220,0.16), transparent 24%), linear-gradient(120deg, rgba(255,255,255,0.05), transparent 42%)',
                    }}
                  />

                  <div
                    className="relative grid gap-4 md:grid-cols-[0.9fr_1.1fr]"
                    style={{ transform: 'translateZ(32px)' }}
                  >
                    <div className="rounded-[14px] border border-white/10 bg-black/[0.22] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-[12px] font-[760] uppercase tracking-[0.14em] text-white/[0.46]">
                          {text.callTitle}
                        </span>
                        <span className="rounded-full bg-[#21a89a]/[0.14] px-2.5 py-1 text-[11px] font-[700] text-[#7ee7dc]">
                          active
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-[10px] bg-white/[0.06] p-3 text-[13px] leading-[1.45] text-white/[0.78]">
                          {text.transcriptOne}
                        </div>
                        <div className="ml-8 rounded-[10px] bg-[#5e5ce6]/[0.18] p-3 text-[13px] leading-[1.45] text-white/[0.86]">
                          {text.transcriptTwo}
                        </div>
                      </div>
                    </div>

                    <div
                      className="relative rounded-[16px] border border-[#5e5ce6]/[0.34] bg-[#171a2c]/[0.92] p-5 shadow-[0_24px_70px_rgba(94,92,230,0.24)]"
                      style={{ transform: 'translateZ(72px)' }}
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[12px] font-[760] uppercase tracking-[0.14em] text-[#b9bbff]">
                            {text.overlayTitle}
                          </p>
                          <p className="mt-2 text-[18px] font-[720] leading-[1.25] text-white">
                            {activeMoment.title}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/10 text-[#7ee7dc]">
                          <ActiveIcon size={18} aria-hidden="true" />
                        </div>
                      </div>
                      <p className="text-[14px] leading-[1.55] text-[#d7d9e5]">{text.overlayBody}</p>
                      <div className="mt-5 rounded-[12px] border border-white/10 bg-black/[0.24] p-3">
                        <div className="flex items-center gap-2 text-[12px] font-[700] uppercase tracking-[0.12em] text-[#7ee7dc]">
                          <FileText size={14} aria-hidden="true" />
                          {text.sourceLabel}
                        </div>
                        <p className="mt-2 text-[13px] text-white/[0.72]">{activeMoment.source}</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute bottom-5 left-5 right-5 grid gap-3 md:grid-cols-[1fr_0.8fr]"
                    style={{ transform: 'translateZ(48px)' }}
                  >
                    <div className="rounded-[12px] border border-white/10 bg-black/[0.28] p-4 font-mono text-[12px] text-[#aeb2c4]">
                      <p>
                        <span className="text-[#7ee7dc]">$</span> {text.terminalOne}
                      </p>
                      <p className="mt-2">
                        <span className="text-[#b9bbff]">✓</span> {text.terminalTwo}
                      </p>
                    </div>
                    <div className="rounded-[12px] border border-white/10 bg-white/[0.06] p-4">
                      <p className="text-[12px] font-[760] uppercase tracking-[0.12em] text-white/[0.46]">
                        {activeMoment.label}
                      </p>
                      <p className="mt-2 text-[13px] leading-[1.45] text-white/[0.76]">{activeMoment.body}</p>
                    </div>
                  </div>

                  <div
                    className="pointer-events-none absolute z-20 w-[min(300px,calc(100%-32px))]"
                    style={{
                      left: `min(max(${pointer.x}%, 150px), calc(100% - 150px))`,
                      top: `min(max(${pointer.y}%, 88px), calc(100% - 112px))`,
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
                        className="rounded-[14px] border border-white/[0.14] bg-[#f7f8ff] p-4 text-[#17181d] shadow-[0_18px_46px_rgba(0,0,0,0.28)]"
                      >
                        <p className="text-[11px] font-[800] uppercase tracking-[0.13em] text-[#5e5ce6]">
                          {activeMoment.label}
                        </p>
                        <p className="mt-1 text-[15px] font-[760] leading-[1.25]">{activeMoment.title}</p>
                        <p className="mt-2 text-[13px] leading-[1.45] text-[#555864]">{activeMoment.body}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div
                    className={`pointer-events-none absolute z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[#7ee7dc]/40 bg-[#7ee7dc]/[0.12] text-[#7ee7dc] shadow-[0_0_28px_rgba(126,231,220,0.26)] ${
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
                    <MousePointer2 size={18} />
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
                        className={`absolute z-10 flex h-10 w-10 items-center justify-center rounded-full border text-white transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#7ee7dc] ${
                          activeMoment.id === moment.id
                            ? 'border-[#7ee7dc] bg-[#21a89a]/[0.28]'
                            : 'border-white/[0.16] bg-white/10 hover:border-[#7ee7dc]/70'
                        }`}
                        style={{
                          left: `${moment.x}%`,
                          top: `${moment.y}%`,
                          transform: 'translate(-50%, -50%) translateZ(80px)',
                        }}
                        aria-label={moment.label}
                      >
                        <MomentIcon size={15} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {moments.map((moment) => (
                <button
                  key={moment.id}
                  type="button"
                  onClick={() => {
                    setActiveId(moment.id);
                    setPointer({ x: moment.x, y: moment.y });
                    setIsInside(true);
                  }}
                  className={`min-h-11 rounded-[10px] border px-3 text-left text-[12px] font-[700] transition-colors focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#7ee7dc] ${
                    activeMoment.id === moment.id
                      ? 'border-[#7ee7dc]/70 bg-[#21a89a]/[0.18] text-white'
                      : 'border-white/10 bg-white/[0.04] text-white/[0.62] hover:border-white/[0.24] hover:text-white'
                  }`}
                >
                  {moment.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <strong className="text-[15px] font-[650] text-white">{copy.logo}</strong>
            <span className="text-[14px] text-white/[0.52]">{copy.tagline}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-[14px] text-white/[0.58]">
            <a href="#" className="transition-colors hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#7ee7dc]">
              {copy.privacy}
            </a>
            <a href="#" className="transition-colors hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#7ee7dc]">
              {copy.terms}
            </a>
            <a
              href="mailto:hello@liveassist.ai"
              className="transition-colors hover:text-white focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#7ee7dc]"
            >
              {copy.contact}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
