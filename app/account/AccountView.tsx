"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Database, Download, Loader2, LogOut, Plug } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { accountStrings, crmStateCopy } from "@/lib/crm/strings";
import { crmAccountLabel, resolveCrmAccountState } from "@/lib/crm/state";
import type { Lang } from "@/lib/strings";
import type { AccountState } from "./page";

const focusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a35707] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f5]";

const cardClass = "rounded-[24px] bg-white/80 p-5 ring-1 ring-[#e9e3da] shadow-[0_18px_54px_rgba(74,47,8,.06)]";

function StatusPill({ tone, children }: { tone: "neutral" | "good" | "warn"; children: React.ReactNode }) {
  const tones = {
    neutral: "bg-[#f6f2ec] text-[#6b665e] ring-[#e2dbd0]",
    good: "bg-[#eef8ec] text-[#2f6b33] ring-[#cfe6cd]",
    warn: "bg-[#fff4d6] text-[#6b4210] ring-[#efd5ad]",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function AccountView({ initialLang, state }: { initialLang: Lang; state: AccountState }) {
  const [lang, setLang] = useState(initialLang);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const t = accountStrings[lang];

  const crmState = resolveCrmAccountState(state);
  const copy = crmStateCopy(lang, crmState);
  const accountLabel = crmAccountLabel(state);

  const tone = crmState === "connected" ? "good" : crmState === "demo" || crmState === "no_workspace" ? "neutral" : "warn";

  const signOut = async () => {
    setIsSigningOut(true);
    await createClient().auth.signOut();
    router.replace("/signup");
    router.refresh();
  };

  // Demo workspaces have no CRM to manage: their one honest action is to go
  // create a real-company workspace, which is a signup flow, not a settings
  // toggle. Everything else routes into the integrations page.
  const crmHref = crmState === "demo" ? `/signup?lang=${lang}&upgrade=real` : `/account/integrations?lang=${lang}`;
  const crmCta =
    crmState === "demo"
      ? t.connectRealCrm
      : crmState === "connected"
        ? t.manageCrm
        : crmState === "failed"
          ? t.reconnect
          : crmState === "unsupported"
            ? t.manageCrm
            : t.setUpAmoCrm;

  return (
    <main className="signup-surface min-h-[100svh] px-4 py-4 text-[#1a1917] sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-[960px] flex-col sm:min-h-[calc(100svh-3rem)]">
        <header className="flex min-h-12 items-center justify-between gap-4">
          <Link href="/" className={`inline-flex min-h-11 items-center gap-3 rounded-xl pr-3 text-sm font-bold ${focusClass}`}>
            <Image src="/icons/favicon-48x48.png" width={32} height={32} alt="" className="rounded-[10px]" />
            LiveAssist AI
          </Link>
          <button
            type="button"
            onClick={() => setLang((current) => (current === "en" ? "ru" : "en"))}
            className={`min-h-11 min-w-11 rounded-xl border border-[#e9e3da] bg-white/70 px-3 text-xs font-bold text-[#423d36] hover:bg-white ${focusClass}`}
          >
            {lang === "en" ? "RU" : "EN"}
          </button>
        </header>

        <section className="py-10 sm:py-14">
          <h1 className="text-[clamp(1.9rem,5vw,2.6rem)] font-bold leading-[1.06] tracking-[-.04em]">{t.title}</h1>
          <p className="mt-3 text-[15px] leading-6 text-[#6b665e]">{t.subtitle}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6f2ec] text-[#a35707]">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <StatusPill tone={state.mode === "demo" ? "neutral" : "good"}>
                  {state.mode === "demo" ? t.modeDemo : state.mode === "real" ? t.modeReal : t.noWorkspace}
                </StatusPill>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[.12em] text-[#6b665e]">{t.workspace}</p>
              <p className="mt-1 text-lg font-bold">{state.companyName ?? t.noWorkspace}</p>
              {!state.companyId ? (
                <Link
                  href={`/signup?lang=${lang}`}
                  className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-[#a35707] hover:text-[#7a4108] ${focusClass}`}
                >
                  {t.finishSignup} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>

            <div className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6f2ec] text-[#a35707]">
                  <Plug className="h-5 w-5" aria-hidden="true" />
                </span>
                <StatusPill tone={tone}>{copy.label}</StatusPill>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[.12em] text-[#6b665e]">{t.crm}</p>
              <p className="mt-1 text-lg font-bold">
                {accountLabel ?? (state.provider && state.provider !== "none" ? state.provider : t.crm)}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6b665e]">{copy.body}</p>
              {state.companyId ? (
                <Link
                  href={crmHref}
                  className={`mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-[#a35707] hover:text-[#7a4108] ${focusClass}`}
                >
                  {crmCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className={`mt-4 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f6f2ec] text-[#a35707]">
                  <Database className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="max-w-[52ch] text-sm leading-6 text-[#6b665e]">{t.desktopHint}</p>
              </div>
              <Link
                href="/#download"
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#a35707] hover:text-[#7a4108] ${focusClass}`}
              >
                <Download className="h-4 w-4" aria-hidden="true" /> {t.download}
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            disabled={isSigningOut}
            aria-busy={isSigningOut}
            className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#423d36] hover:bg-white/70 hover:text-[#1a1917] disabled:opacity-60 ${focusClass}`}
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden="true" />
            )}
            {isSigningOut ? t.signingOut : t.signOut}
          </button>
        </section>
      </div>
    </main>
  );
}
