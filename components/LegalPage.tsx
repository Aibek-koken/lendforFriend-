'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Lang } from '../lib/strings';

export type LegalSection = {
  heading: string;
  body: string[];
};

export type LegalContent = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ content }: { content: Record<Lang, LegalContent> }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('liveassist-lang');
    if (saved === 'en' || saved === 'ru') setLang(saved);
  }, []);

  const t = content[lang];
  const backLabel = lang === 'ru' ? 'На главную' : 'Back to home';

  return (
    <main className="min-h-screen bg-[#fafafb] px-5 py-14 text-[#1d1d1f]">
      <div className="mx-auto w-full" style={{ maxWidth: 'min(760px, 100%)' }}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[14px] font-[600] text-[#2585ff] transition-colors hover:text-[#0a5bd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(37,133,255,0.5)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafb]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>

        <h1 className="mt-8 text-[34px] font-[800] leading-[1.1] tracking-[-0.02em] sm:text-[40px]">
          {t.title}
        </h1>
        <p className="mt-3 text-[13px] font-[600] uppercase tracking-[0.12em] text-[#86868b]">
          {t.updated}
        </p>
        <p className="mt-6 text-[16px] leading-[1.7] text-[#4a4a4f]">{t.intro}</p>

        <div className="mt-10 space-y-9">
          {t.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-[20px] font-[700] tracking-[-0.01em]">{section.heading}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-[15px] leading-[1.7] text-[#4a4a4f]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
