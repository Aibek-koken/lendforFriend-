"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Loader2, ShieldCheck } from "lucide-react";
import { AMOCRM_DOMAIN_ZONES, type AmoCrmCredentialErrors } from "@/lib/crm/amocrm";
import {
  crmAccountLabel,
  resolveCrmAccountState,
  type CrmConnectionMetadata,
  type CrmErrorCode,
} from "@/lib/crm/state";
import { crmErrorCopy, crmStateCopy, integrationStrings } from "@/lib/crm/strings";
import type { Lang } from "@/lib/strings";
import { issueDesktopHandoff } from "../../signup/actions";
import { disconnectAmoCrm, saveAmoCrmSetup, selectAmoCrm } from "../actions";

const focusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a35707] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf8f5]";
const cardClass = "rounded-[24px] bg-white/80 p-5 ring-1 ring-[#e9e3da] shadow-[0_18px_54px_rgba(74,47,8,.06)] sm:p-7";
const compactCardClass = "rounded-[20px] bg-white/80 p-4 ring-1 ring-[#e9e3da] sm:p-5";
const inputClass = `mt-2 min-h-12 w-full rounded-2xl border border-[#ded8cf] bg-[#faf8f5] px-4 text-base text-[#1a1917] placeholder:text-[#8c857b] ${focusClass}`;

type Props = {
  initialLang: Lang;
  metadata: CrmConnectionMetadata & { companyId: string | null };
  redirectUri: string;
  secretsConfigured: boolean;
  callbackError: CrmErrorCode | null;
  justConnected: boolean;
  desktopState?: string | null;
};

export function AmoCrmSetup({
  initialLang,
  metadata,
  redirectUri,
  secretsConfigured,
  callbackError,
  justConnected,
  desktopState = null,
}: Props) {
  const [lang, setLang] = useState(initialLang);
  const [errors, setErrors] = useState<AmoCrmCredentialErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSelectingAmoCrm, setIsSelectingAmoCrm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [handoff, setHandoff] = useState<"idle" | "pending" | "opened" | "error">("idle");

  const t = integrationStrings[lang];
  const state = resolveCrmAccountState(metadata);
  const accountLabel = crmAccountLabel(metadata);

  // The stored failure and a failure from the callback redirect are the same
  // class of thing to the reader — show whichever is present, most recent first.
  const shownError = callbackError ?? (metadata.lastErrorCode as CrmErrorCode | null);

  const copyRedirectUri = async () => {
    await navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const input = {
      subdomain: String(form.get("subdomain") ?? ""),
      domainZone: String(form.get("domainZone") ?? ""),
      clientId: String(form.get("clientId") ?? ""),
      clientSecret: String(form.get("clientSecret") ?? ""),
    };

    startTransition(async () => {
      const result = await saveAmoCrmSetup(input, desktopState);
      if (!result.ok) {
        if (result.errors) setErrors(result.errors);
        setFormError(t.errors[result.code === "not_configured" ? "not_configured" : "server_error"]);
        return;
      }
      // Hand the browser to amoCRM's consent screen. The client_secret is
      // already encrypted server-side and is NOT part of this URL.
      window.location.href = result.authorizeUrl;
    });
  };

  const chooseAmoCrm = () => {
    setIsSelectingAmoCrm(true);
    startTransition(async () => {
      const result = await selectAmoCrm();
      if (!result.ok) {
        setFormError(t.errors.server_error);
        setIsSelectingAmoCrm(false);
        return;
      }
      window.location.reload();
    });
  };

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

  const disconnect = () => {
    setIsDisconnecting(true);
    startTransition(async () => {
      await disconnectAmoCrm();
      setIsDisconnecting(false);
      window.location.reload();
    });
  };

  const header = (
    <header className="flex min-h-12 items-center justify-between gap-4">
      <Link
        href={`/account?lang=${lang}`}
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl pr-3 text-sm font-bold text-[#423d36] hover:text-[#1a1917] ${focusClass}`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.backToAccount}
      </Link>
      <button
        type="button"
        onClick={() => setLang((current) => (current === "en" ? "ru" : "en"))}
        className={`min-h-11 min-w-11 rounded-xl border border-[#e9e3da] bg-white/70 px-3 text-xs font-bold text-[#423d36] hover:bg-white ${focusClass}`}
      >
        {lang === "en" ? "RU" : "EN"}
      </button>
    </header>
  );

  const shell = (children: React.ReactNode) => (
    <main className="signup-surface min-h-[100svh] px-4 py-4 text-[#1a1917] sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-[760px] flex-col">
        {header}
        <section className="py-10 sm:py-14">{children}</section>
      </div>
    </main>
  );

  // Demo workspace: no credential form, no CRM lookup, one honest way forward.
  if (state === "demo") {
    return shell(
      <div className={cardClass}>
        <h1 className="text-2xl font-bold tracking-[-.03em]">{t.demoTitle}</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#6b665e]">{t.demoBody}</p>
        <Link
          href={`/signup?lang=${lang}`}
          className={`mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#1a1917] px-5 text-sm font-bold text-white hover:-translate-y-px ${focusClass}`}
        >
          {t.demoCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (state === "unsupported" || state === "no_workspace") {
    return shell(
      <div className={cardClass}>
        <h1 className="text-2xl font-bold tracking-[-.03em]">{t.unsupportedTitle}</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#6b665e]">{t.unsupportedBody}</p>
        {metadata.companyId && metadata.mode === "real" ? (
          <>
            <button
              type="button"
              onClick={chooseAmoCrm}
              disabled={isPending || isSelectingAmoCrm}
              aria-busy={isSelectingAmoCrm}
              className={`mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1a1917] px-5 text-sm font-bold text-white hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}
            >
              {isSelectingAmoCrm ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
              {isSelectingAmoCrm ? t.selectingAmoCrm : t.switchToAmoCrm}
            </button>
            {formError ? (
              <div role="alert" className="mt-4 rounded-2xl bg-[#fff8ed] px-4 py-3 text-sm text-[#6b4210] ring-1 ring-[#efd5ad]">
                {formError}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    );
  }

  const isConnected = state === "connected";
  const formVisible = !isConnected || showForm;
  const createIntegrationSteps = [
    t.createStep1,
    t.createStep2,
    t.createStep3,
    t.createStep4,
    t.createStep5,
    t.createStep6,
    t.createStep7,
  ] as string[];
  const copyKeysSteps = [
    t.copyStep1,
    t.copyStep2,
    t.copyStep3,
    t.copyStep4,
    t.copyStep5,
    t.copyStep6,
  ] as string[];
  const renderNumberedStep = (step: string, index: number, withRedirectUri = false) => (
    <li key={`${index}-${step}`} className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f6f2ec] text-xs font-bold text-[#a35707]">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1">
        {step}
        {withRedirectUri ? (
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <code className="min-w-0 break-all rounded-xl bg-[#faf8f5] px-3 py-2 font-mono text-xs ring-1 ring-[#e2dbd0]">
              {redirectUri}
            </code>
            <button
              type="button"
              onClick={copyRedirectUri}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#ded8cf] bg-white px-3 text-xs font-bold text-[#423d36] hover:bg-[#faf8f5] ${focusClass}`}
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? t.redirectCopied : t.copy}
            </button>
          </span>
        ) : null}
      </span>
    </li>
  );

  return shell(
    <>
      <h1 className="text-[clamp(1.9rem,5vw,2.6rem)] font-bold leading-[1.06] tracking-[-.04em]">{t.title}</h1>
      <p className="mt-3 text-[15px] leading-6 text-[#6b665e]">{t.subtitle}</p>

      {justConnected ? (
        <div role="status" className="mt-6 flex items-center gap-3 rounded-2xl bg-[#eef8ec] px-4 py-3 text-sm font-semibold text-[#2f6b33] ring-1 ring-[#cfe6cd]">
          <Check className="h-4 w-4" aria-hidden="true" /> {crmStateCopy(lang, "connected").label}
        </div>
      ) : null}

      {shownError && !justConnected ? (
        <div role="alert" className="mt-6 rounded-2xl bg-[#fff8ed] px-4 py-3 text-sm leading-5 text-[#6b4210] ring-1 ring-[#efd5ad]">
          {crmErrorCopy(lang, shownError)}
        </div>
      ) : null}

      {!secretsConfigured ? (
        <div role="alert" className="mt-6 rounded-2xl bg-[#fff8ed] px-4 py-3 text-sm leading-5 text-[#6b4210] ring-1 ring-[#efd5ad]">
          {t.errors.not_configured}
        </div>
      ) : null}

      {isConnected ? (
        <div className={`mt-8 ${cardClass}`}>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef8ec] text-[#2f6b33]">
              <Check className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold">{t.connectedTitle}</h2>
              <p className="mt-1 text-sm font-semibold text-[#423d36]">{accountLabel}</p>
              <p className="mt-2 max-w-[52ch] text-sm leading-6 text-[#6b665e]">{t.connectedBody}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowForm((current) => !current)}
              className={`inline-flex min-h-11 items-center rounded-xl border border-[#ded8cf] bg-white px-4 text-sm font-bold text-[#423d36] hover:bg-[#faf8f5] ${focusClass}`}
            >
              {t.change}
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={isDisconnecting || isPending}
              aria-busy={isDisconnecting}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#9b3f27] hover:bg-[#fdf2ef] disabled:opacity-60 ${focusClass}`}
            >
              {isDisconnecting ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
              {isDisconnecting ? t.disconnecting : t.disconnect}
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#6b665e]">{t.disconnectHint}</p>
          {desktopState ? (
            <div className="mt-6 border-t border-[#eee7dd] pt-5">
              <button
                type="button"
                onClick={openDesktopApp}
                disabled={isPending}
                aria-busy={handoff === "pending"}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1a1917] px-5 text-sm font-bold text-white hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}
              >
                {handoff === "pending" ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
                {handoff === "pending" ? t.openingDesktop : t.openDesktop}
                {handoff === "pending" ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>
              {handoff === "opened" ? <p className="mt-3 text-sm leading-5 text-[#6b665e]">{t.desktopOpenedHint}</p> : null}
              {handoff === "error" ? (
                <div role="alert" className="mt-3 rounded-2xl bg-[#fff8ed] px-4 py-3 text-sm leading-5 text-[#6b4210] ring-1 ring-[#efd5ad]">
                  {t.desktopHandoffError}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {formVisible ? (
        <>
          <div className={`mt-8 ${cardClass}`}>
            <h2 className="text-lg font-bold">{t.stepsTitle}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <section className={compactCardClass} aria-labelledby="create-amocrm-integration">
                <h3 id="create-amocrm-integration" className="text-sm font-bold text-[#1a1917]">
                  {t.createIntegrationTitle}
                </h3>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-[#423d36]">
                  {createIntegrationSteps.map((step, index) => renderNumberedStep(step, index, index === 2))}
                </ol>
              </section>

              <section className={compactCardClass} aria-labelledby="copy-amocrm-keys">
                <h3 id="copy-amocrm-keys" className="text-sm font-bold text-[#1a1917]">
                  {t.copyKeysTitle}
                </h3>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-[#423d36]">
                  {copyKeysSteps.map((step, index) => renderNumberedStep(step, index))}
                </ol>
              </section>
            </div>
          </div>

          <form onSubmit={submit} className={`mt-4 ${cardClass}`} noValidate>
            <h2 className="text-lg font-bold">{t.formTitle}</h2>
            <div role="note" className="mt-4 rounded-xl bg-[#f6f5f2] px-4 py-3 text-sm leading-5 text-[#5f5a52] ring-1 ring-[#e4e0d9]">
              {t.authorizationCodeWarning}
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="subdomain" className="text-sm font-bold">{t.subdomain}</label>
                <input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  defaultValue={metadata.subdomain ?? ""}
                  placeholder="acme"
                  aria-invalid={Boolean(errors.subdomain)}
                  className={inputClass}
                />
                <p className="mt-2 text-xs leading-5 text-[#6b665e]">{t.subdomainHint}</p>
                {errors.subdomain ? <p className="mt-1 text-sm text-[#9b3f27]">{t.errors[errors.subdomain]}</p> : null}
              </div>

              <div>
                <label htmlFor="domainZone" className="text-sm font-bold">{t.region}</label>
                <select
                  id="domainZone"
                  name="domainZone"
                  defaultValue={metadata.domainZone ?? AMOCRM_DOMAIN_ZONES[0]}
                  className={inputClass}
                >
                  {AMOCRM_DOMAIN_ZONES.map((zone) => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
                {errors.domainZone ? <p className="mt-1 text-sm text-[#9b3f27]">{t.errors[errors.domainZone]}</p> : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="clientId" className="text-sm font-bold">{t.clientId}</label>
                <input
                  id="clientId"
                  name="clientId"
                  type="text"
                  spellCheck={false}
                  autoComplete="off"
                  defaultValue={metadata.clientId ?? ""}
                  aria-invalid={Boolean(errors.clientId)}
                  className={`${inputClass} font-mono text-sm`}
                />
                <p className="mt-2 text-xs leading-5 text-[#6b665e]">{t.clientIdHint}</p>
                {errors.clientId ? <p className="mt-1 text-sm text-[#9b3f27]">{t.errors[errors.clientId]}</p> : null}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="clientSecret" className="text-sm font-bold">{t.clientSecret}</label>
                {/* type=password + autoComplete=off: the secret must not land in
                    the browser's saved-password store or be shoulder-surfed. It
                    is submitted once, encrypted server-side, and never rendered
                    back — there is no "show current secret" affordance anywhere. */}
                <input
                  id="clientSecret"
                  name="clientSecret"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(errors.clientSecret)}
                  className={`${inputClass} font-mono text-sm`}
                />
                <p className="mt-2 text-xs leading-5 text-[#6b665e]">{t.clientSecretHint}</p>
                <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[#6b665e]">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2f6b33]" aria-hidden="true" />
                  {t.clientSecretSecurityHint}
                </p>
                {errors.clientSecret ? <p className="mt-1 text-sm text-[#9b3f27]">{t.errors[errors.clientSecret]}</p> : null}
              </div>
            </div>

            {formError ? (
              <div role="alert" className="mt-6 rounded-2xl bg-[#fff8ed] px-4 py-3 text-sm text-[#6b4210] ring-1 ring-[#efd5ad]">
                {formError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isPending || !secretsConfigured}
              aria-busy={isPending}
              className={`mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1a1917] px-5 text-sm font-bold text-white transition-transform duration-100 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}
            >
              {isPending ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : null}
              {isPending ? t.authorizing : t.save}
              {isPending ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          </form>
        </>
      ) : null}
    </>
  );
}
