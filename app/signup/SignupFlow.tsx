"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Database, Loader2, Play, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DESKTOP_STATE_PARAM } from "@/lib/desktop-auth/handoff";
import {
  crmProviders,
  mainGoals,
  managerCounts,
  validateCompanySetup,
  type CompanySetupInput,
  type SignupState,
  type ValidationErrors,
} from "@/lib/signup/domain";
import { signupStrings } from "@/lib/signup/strings";
import type { Lang } from "@/lib/strings";
import { createDemoWorkspace, createRealWorkspace, issueDesktopHandoff, saveSignupMode } from "./actions";

type Props = {
  configured: boolean;
  databaseReady?: boolean;
  desktopState?: string | null;
  displayName?: string | null;
  initialLang: Lang;
  initialState: SignupState;
  oauthError: boolean;
};

const focusClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a35707] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f5]";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.9A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.3.31-1.9V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.59Z" />
      <path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.59C7.18 7.73 9.39 5.97 12 5.97Z" />
    </svg>
  );
}

function Shell({ children, lang, onLanguage }: { children: React.ReactNode; lang: Lang; onLanguage: () => void }) {
  const t = signupStrings[lang];
  return (
    <main className="signup-surface min-h-[100svh] px-4 py-4 text-[#1a1917] sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-[1120px] flex-col sm:min-h-[calc(100svh-3rem)]">
        <header className="flex min-h-12 items-center justify-between gap-4">
          <Link href="/" className={`inline-flex min-h-11 items-center gap-3 rounded-xl pr-3 text-sm font-bold ${focusClass}`}>
            <Image src="/icons/favicon-48x48.png" width={32} height={32} alt="" className="rounded-[10px]" />
            LiveAssist AI
          </Link>
          <button type="button" onClick={onLanguage} aria-label={t.languageLabel} className={`min-h-11 min-w-11 rounded-xl border border-[#e9e3da] bg-white/70 px-3 text-xs font-bold text-[#423d36] transition-colors duration-100 hover:bg-white active:bg-[#f6f2ec] ${focusClass}`}>
            {lang === "en" ? "RU" : "EN"}
          </button>
        </header>
        <div className="flex flex-1 items-center justify-center py-8 sm:py-12">{children}</div>
      </div>
    </main>
  );
}

function PrimaryButton({ children, loading = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button {...props} disabled={props.disabled || loading} aria-busy={loading} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/60 bg-[linear-gradient(160deg,#fff0c4_0%,#ffd27a_48%,#f5b23f_100%)] px-5 py-3 text-sm font-extrabold text-[#4a2f08] shadow-[inset_0_1px_0_rgba(255,255,255,.85),inset_0_-8px_16px_rgba(214,148,24,.2),0_10px_24px_rgba(240,180,40,.22)] transition-[transform,filter] duration-100 hover:brightness-[1.02] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${focusClass} ${props.className ?? ""}`}>
      {loading ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function SignupFlow({ configured, databaseReady = true, desktopState = null, displayName, initialLang, initialState, oauthError }: Props) {
  const [lang, setLang] = useState(initialLang);
  const [state, setState] = useState(initialState);
  const [error, setError] = useState(oauthError ? "auth" : "");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isPending, startTransition] = useTransition();
  const [handoff, setHandoff] = useState<"idle" | "pending" | "opened" | "error">("idle");
  const companyNameRef = useRef<HTMLInputElement>(null);
  const t = signupStrings[lang];

  const step = state.companyId ? "complete" : state.step;
  const options = useMemo(() => ({
    managers: managerCounts,
    crms: crmProviders,
    goals: mainGoals,
  }), []);

  const toggleLanguage = () => setLang((current) => (current === "en" ? "ru" : "en"));

  const beginGoogle = async () => {
    setError("");
    if (!configured) {
      setError("config");
      return;
    }
    // Carry the desktop nonce across the Google round trip so the final screen
    // can still mint a code bound to the app that started this signup.
    const callback = new URL("/auth/callback", window.location.origin);
    if (desktopState) callback.searchParams.set(DESKTOP_STATE_PARAM, desktopState);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        queryParams: { prompt: "select_account" },
      },
    });
    if (authError) setError("auth");
  };

  // Mints a fresh single-use code and hands it to the desktop app. The code is
  // never rendered, never copied to the clipboard, and never put in browser
  // history as a visited URL — assigning window.location.href to a custom scheme
  // triggers the OS handler without creating a history entry we can leak later.
  //
  // Every click issues a NEW code (the previous one is invalidated server-side),
  // so a user who clicks twice is never asked to reuse a spent code.
  const openDesktopApp = () => {
    if (!desktopState) return;
    setHandoff("pending");
    startTransition(async () => {
      const result = await issueDesktopHandoff(desktopState);
      if (!result.ok) {
        setHandoff("error");
        return;
      }
      setHandoff("opened");
      window.location.href = result.deepLink;
    });
  };

  const chooseMode = (mode: "real" | "demo") => {
    setError("");
    startTransition(async () => {
      const result = mode === "demo" ? await createDemoWorkspace(lang) : await saveSignupMode(mode, lang);
      if (!result.ok) {
        setError("submit");
        return;
      }
      setState(result.state);
    });
  };

  const submitCompany = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const input: CompanySetupInput = {
      companyName: String(form.get("companyName") ?? ""),
      managerCount: String(form.get("managerCount") ?? ""),
      crmProvider: String(form.get("crmProvider") ?? ""),
      mainGoal: String(form.get("mainGoal") ?? ""),
    };
    const validation = validateCompanySetup(input);
    if (!validation.ok) {
      setErrors(validation.errors);
      const firstInvalidName = (Object.keys(validation.errors) as Array<keyof CompanySetupInput>)[0];
      const firstInvalid = event.currentTarget.elements.namedItem(firstInvalidName);
      if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
      else companyNameRef.current?.focus();
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await createRealWorkspace(input, lang);
      if (!result.ok) {
        setErrors(result.errors ?? {});
        setError("submit");
        return;
      }
      setState(result.state);
    });
  };

  const cardClass = `group w-full rounded-[24px] bg-white/80 p-5 text-left shadow-[0_18px_54px_rgba(74,47,8,.08)] ring-1 ring-[#e9e3da] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_22px_64px_rgba(74,47,8,.12)] active:translate-y-0 ${focusClass}`;

  return (
    <Shell lang={lang} onLanguage={toggleLanguage}>
      <section className="signup-enter w-full max-w-[720px]">
        {step === "auth" ? (
          <div className="mx-auto max-w-[440px] text-center">
            <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white shadow-[0_16px_48px_rgba(74,47,8,.1)] ring-1 ring-[#e9e3da]">
              <Image src="/icons/icon-192x192.png" width={44} height={44} alt="LiveAssist AI" className="rounded-[14px]" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a35707]">{t.badge}</p>
            <h1 className="mt-3 text-[clamp(2rem,7vw,3rem)] font-bold leading-[1.04] tracking-[-.045em]">{t.authTitle}</h1>
            <p className="mx-auto mt-4 max-w-[36ch] text-[15px] leading-6 text-[#6b665e]">{t.authBody}</p>
            <button type="button" onClick={beginGoogle} className={`mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#1a1917] shadow-[0_14px_36px_rgba(74,47,8,.1)] ring-1 ring-[#ded8cf] transition-[transform,box-shadow] duration-100 hover:-translate-y-px hover:shadow-[0_18px_42px_rgba(74,47,8,.14)] active:translate-y-0 ${focusClass}`}>
              <GoogleMark /> {error === "auth" ? t.retry : t.google}
            </button>
            {error || !configured ? (
              <div role="alert" className="mt-4 rounded-2xl bg-[#fff8ed] px-4 py-3 text-left text-sm leading-5 text-[#6b4210] ring-1 ring-[#efd5ad]">
                {error === "config" || !configured ? (process.env.NODE_ENV === "development" ? t.authMissing : t.authError) : t.authError}
              </div>
            ) : null}
            <p className="mt-6 text-xs leading-5 text-[#6b665e]">
              {t.legalPrefix} <Link href="/privacy" className={`underline decoration-[#c9820f]/40 underline-offset-4 hover:text-[#a35707] ${focusClass}`}>{t.privacy}</Link> {t.and} <Link href="/terms" className={`underline decoration-[#c9820f]/40 underline-offset-4 hover:text-[#a35707] ${focusClass}`}>{t.terms}</Link>.
            </p>
          </div>
        ) : null}

        {step === "mode" ? (
          <div>
            <div className="mx-auto max-w-[560px] text-center">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a35707]">01 · 02</p>
              <h1 className="mt-3 text-[clamp(2rem,7vw,3rem)] font-bold leading-[1.04] tracking-[-.045em]">{t.modeTitle}</h1>
              <p className="mt-4 text-[15px] leading-6 text-[#6b665e]">{t.modeBody}</p>
            </div>
            {!databaseReady || error === "submit" ? <div role="alert" className="mx-auto mt-6 max-w-[560px] rounded-2xl bg-[#fff8ed] px-4 py-3 text-sm text-[#6b4210] ring-1 ring-[#efd5ad]">{!databaseReady && process.env.NODE_ENV === "development" ? t.databaseMissing : t.submitError}</div> : null}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button type="button" disabled={isPending || !databaseReady} onClick={() => chooseMode("real")} className={cardClass}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6f2ec] text-[#a35707]"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
                <span className="mt-7 flex items-center justify-between gap-3 text-lg font-bold"><span>{t.realTitle}</span><ArrowRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" /></span>
                <span className="mt-2 block text-sm leading-6 text-[#6b665e]">{t.realBody}</span>
              </button>
              <button type="button" disabled={isPending || !databaseReady} onClick={() => chooseMode("demo")} className={cardClass} aria-busy={isPending}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff4d6] text-[#a35707]">{isPending ? <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" /> : <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />}</span>
                <span className="mt-7 flex items-center justify-between gap-3 text-lg font-bold"><span>{isPending ? t.demoLoading : t.demoTitle}</span><ArrowRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" /></span>
                <span className="mt-2 block text-sm leading-6 text-[#6b665e]">{t.demoBody}</span>
              </button>
            </div>
          </div>
        ) : null}

        {step === "company" ? (
          <form onSubmit={submitCompany} className="mx-auto max-w-[620px]" noValidate>
            <button type="button" onClick={() => setState((current) => ({ ...current, mode: null, step: "mode" }))} className={`mb-6 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#6b665e] hover:text-[#1a1917] ${focusClass}`}><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t.back}</button>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a35707]">02 · 02</p>
            <h1 className="mt-3 text-[clamp(2rem,7vw,3rem)] font-bold leading-[1.04] tracking-[-.045em]">{t.companyTitle}</h1>
            <p className="mt-4 text-[15px] leading-6 text-[#6b665e]">{t.companyBody}</p>

            <div className="mt-8 space-y-7 rounded-[28px] bg-white/80 p-5 shadow-[0_18px_54px_rgba(74,47,8,.08)] ring-1 ring-[#e9e3da] sm:p-7">
              <div>
                <label htmlFor="companyName" className="text-sm font-bold">{t.companyName}</label>
                <input ref={companyNameRef} id="companyName" name="companyName" type="text" autoComplete="organization" spellCheck={false} maxLength={120} aria-invalid={Boolean(errors.companyName)} aria-describedby={errors.companyName ? "companyName-error" : undefined} className={`mt-2 min-h-12 w-full rounded-2xl border border-[#ded8cf] bg-[#faf8f5] px-4 text-base text-[#1a1917] placeholder:text-[#8c857b] ${focusClass}`} placeholder={t.companyPlaceholder} />
                {errors.companyName ? <p id="companyName-error" className="mt-2 text-sm text-[#9b3f27]">{errors.companyName === "company_name_long" ? t.companyNameLong : t.companyNameShort}</p> : null}
              </div>
              <ChoiceGroup legend={t.managers} name="managerCount" values={options.managers} labels={{}} error={errors.managerCount ? t.required : ""} />
              <ChoiceGroup legend={t.crm} name="crmProvider" values={options.crms} labels={{ amocrm: "amoCRM", bitrix24: "Bitrix24", hubspot: "HubSpot", other: t.other, none: t.noCrm }} error={errors.crmProvider ? t.required : ""} />
              <ChoiceGroup legend={t.goal} name="mainGoal" values={options.goals} labels={{ sales: t.sales, support: t.support, training: t.training, other: t.other }} error={errors.mainGoal ? t.required : ""} />
              {error === "submit" ? <div role="alert" className="rounded-2xl bg-[#fff8ed] px-4 py-3 text-sm text-[#6b4210] ring-1 ring-[#efd5ad]">{t.submitError}</div> : null}
              <PrimaryButton type="submit" loading={isPending}>{isPending ? t.saving : t.continue}<ArrowRight className="h-4 w-4" aria-hidden="true" /></PrimaryButton>
            </div>
          </form>
        ) : null}

        {step === "complete" ? (
          <div className="mx-auto max-w-[540px] text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#eef8ec] text-[#327a35] shadow-[0_16px_44px_rgba(50,122,53,.12)]"><Check className="h-7 w-7" strokeWidth={2.4} aria-hidden="true" /></div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-[#a35707]">{t.completeEyebrow}</p>
            <h1 className="mt-3 text-[clamp(2rem,7vw,3rem)] font-bold leading-[1.04] tracking-[-.045em]">{displayName ? `${displayName}, ${t.completeTitleNamed}` : t.completeTitle}</h1>
            <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-[#e9e3da]"><Database className="h-5 w-5 text-[#a35707]" aria-hidden="true" /><p className="mt-3 text-xs font-semibold uppercase tracking-[.12em] text-[#6b665e]">{state.mode === "demo" ? t.completeDemo : t.completeReal}</p><p className="mt-1 font-bold">{state.companyName}</p></div>
              <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-[#e9e3da]"><ShieldCheck className="h-5 w-5 text-[#a35707]" aria-hidden="true" /><p className="mt-3 text-xs font-semibold uppercase tracking-[.12em] text-[#6b665e]">{t.crmLabel}</p><p className="mt-1 font-bold">{state.crmStatus ? t[state.crmStatus] : t.demo}</p></div>
            </div>
            {/* Stage 2 handoff. The button mints a short-lived, single-use code
                server-side and opens liveassist://auth/callback?code=…&state=….
                No Supabase access_token or refresh_token is ever put in this link. */}
            {desktopState ? (
              <>
                <button
                  type="button"
                  onClick={openDesktopApp}
                  disabled={isPending}
                  aria-busy={handoff === "pending"}
                  className={`mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1a1917] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(26,25,23,.18)] transition-transform duration-100 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}
                >
                  {handoff === "pending" ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
                  {handoff === "pending" ? t.opening : t.open}
                  {handoff === "pending" ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </button>
                {handoff === "opened" ? (
                  <p className="mt-3 text-sm leading-5 text-[#6b665e]">{t.openedHint}</p>
                ) : null}
                {handoff === "error" ? (
                  <div role="alert" className="mt-3 rounded-2xl bg-[#fff8ed] px-4 py-3 text-left text-sm leading-5 text-[#6b4210] ring-1 ring-[#efd5ad]">
                    {t.handoffError}
                  </div>
                ) : null}
              </>
            ) : (
              // Web-initiated signup: there is no desktop nonce to bind a code to,
              // and the desktop app rejects any callback it did not start. Sending
              // the user back to the app is the only safe finish.
              <div className="mt-7 rounded-2xl bg-white/80 px-4 py-4 text-left text-sm leading-6 text-[#423d36] ring-1 ring-[#e9e3da]">
                <p className="font-bold text-[#1a1917]">{t.desktopFinishTitle}</p>
                <p className="mt-1 text-[#6b665e]">{t.desktopFinishBody}</p>
              </div>
            )}
            <Link href="/#download" className={`mt-3 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold text-[#a35707] hover:text-[#7a4108] ${focusClass}`}>{t.download}</Link>
            <p className="mx-auto mt-4 max-w-[48ch] text-xs leading-5 text-[#6b665e]">{t.handoffNote}</p>
          </div>
        ) : null}
      </section>
    </Shell>
  );
}

function ChoiceGroup({ legend, name, values, labels, error }: { legend: string; name: string; values: readonly string[]; labels: Record<string, string>; error: string }) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="text-sm font-bold">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <label key={value} className={`relative cursor-pointer rounded-xl ${focusClass}`}>
            <input type="radio" name={name} value={value} className="peer sr-only" />
            <span className="inline-flex min-h-11 items-center rounded-xl border border-[#ded8cf] bg-[#faf8f5] px-3.5 text-sm font-semibold text-[#423d36] transition-[background-color,border-color,color] duration-100 hover:bg-white peer-checked:border-[#c9820f] peer-checked:bg-[#fff4d6] peer-checked:text-[#6b3b08]">{labels[value] ?? value}</span>
          </label>
        ))}
      </div>
      {error ? <p id={`${name}-error`} className="mt-2 text-sm text-[#9b3f27]">{error}</p> : null}
    </fieldset>
  );
}
