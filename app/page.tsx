"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  Car,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  FileCheck2,
  GraduationCap,
  Headphones,
  HeartPulse,
  Home,
  KeyRound,
  Layers3,
  MessageSquareText,
  Mic2,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UsersRound,
  Wand2
} from "lucide-react";

type Icon = typeof Command;

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Use cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" }
];

const heroBullets = [
  "Press a hotkey during a live conversation",
  "Get a short answer in 1-2 seconds",
  "See the exact source from your company documents"
];

const painCards = [
  {
    icon: Search,
    title: "Searching kills momentum",
    body: "Every tab switch and Slack search creates silence. The customer waits while the rep loses the thread."
  },
  {
    icon: GraduationCap,
    title: "New reps do not know every detail",
    body: "Pricing rules, policies, and onboarding terms take time to learn. Live calls do not wait for ramp-up."
  },
  {
    icon: CircleHelp,
    title: "Experienced reps still forget edge cases",
    body: "Even strong teams miss the exact clause, plan limit, or exception when the answer is buried in documents."
  }
];

const steps = [
  {
    icon: UploadCloud,
    title: "Upload company documents",
    body: "Add pricing PDFs, FAQs, terms, SOPs, and knowledge base files."
  },
  {
    icon: MessageSquareText,
    title: "Start a customer conversation",
    body: "Keep working in your call tool, CRM, inbox, or chat app."
  },
  {
    icon: KeyRound,
    title: "Press the hotkey",
    body: "Ask for help the moment a customer asks something specific."
  },
  {
    icon: BadgeCheck,
    title: "Answer with a source",
    body: "Use a short, cited response without breaking the flow."
  }
];

const features = [
  {
    icon: FileCheck2,
    title: "Instant answers from PDFs, FAQ, pricing and SOPs",
    body: "Company knowledge becomes available in the moment it matters.",
    className: "md:col-span-2"
  },
  {
    icon: BookOpenCheck,
    title: "Source citations for every answer",
    body: "Reps can see the document and page behind the response."
  },
  {
    icon: Layers3,
    title: "Floating overlay above every app",
    body: "Works over calls, CRM screens, inboxes, and internal tools."
  },
  {
    icon: Command,
    title: "Hotkey-first workflow",
    body: "No heavy context switch, no digging through folders."
  },
  {
    icon: Mic2,
    title: "Voice or text question input",
    body: "Ask in the way that fits the conversation."
  },
  {
    icon: Headphones,
    title: "Built for live customer conversations",
    body: "Designed for short, accurate answers while someone is waiting.",
    className: "md:col-span-2"
  },
  {
    icon: ShieldCheck,
    title: "No constant listening by default",
    body: "The assistant activates when the user asks for help."
  },
  {
    icon: UsersRound,
    title: "Works for individuals and teams",
    body: "Start with one rep or roll out a shared knowledge base."
  }
];

const useCases = [
  { icon: GraduationCap, title: "Online school managers" },
  { icon: Plane, title: "Travel agents" },
  { icon: HeartPulse, title: "Clinic administrators" },
  { icon: Car, title: "Car service managers" },
  { icon: Home, title: "Real estate agents" },
  { icon: Building2, title: "B2B sales teams" },
  { icon: Headphones, title: "Support agents" },
  { icon: Wand2, title: "Freelancers and consultants" }
];

const pricing = [
  {
    name: "Solo",
    price: "$19",
    period: "/month",
    description: "For individual sellers, agents, consultants, and support reps.",
    features: [
      "Personal document library",
      "Desktop overlay",
      "Hotkey answers",
      "Source citations"
    ]
  },
  {
    name: "Team",
    price: "$99",
    period: "/month",
    description: "Up to 5 users.",
    popular: true,
    features: [
      "Shared company knowledge base",
      "Team document library",
      "Admin controls",
      "Priority support"
    ]
  },
  {
    name: "Custom",
    price: "Contact us",
    period: "",
    description: "For larger teams.",
    features: [
      "Custom onboarding",
      "Compliance needs",
      "Larger document volume",
      "Team rollout support"
    ]
  }
];

const faqs = [
  {
    question: "Does LiveAssist AI listen all the time?",
    answer:
      "No. It is designed as a hotkey-first assistant. It activates when the user asks for help."
  },
  {
    question: "Where do answers come from?",
    answer:
      "From the documents you upload or connect, such as pricing files, FAQ, terms, SOPs and internal knowledge base documents."
  },
  {
    question: "Can the customer see the overlay?",
    answer: "No. The overlay is private to the user's screen."
  },
  {
    question: "Is this only for sales teams?",
    answer:
      "No. It is useful for sales, support, clinics, travel agencies, real estate, online schools, agencies and consultants."
  },
  {
    question: "Does it replace my CRM or knowledge base?",
    answer:
      "No. It sits on top of your workflow and helps you retrieve answers during live conversations."
  }
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function IconBadge({ icon: IconComponent }: { icon: Icon }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-cyan-200 shadow-cyan">
      <IconComponent className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p className="mb-3 text-sm font-medium text-cyan-200">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-normal text-foreground md:text-4xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function PrimaryLink({
  href,
  children,
  className
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {children}
    </a>
  );
}

function SecondaryLink({
  href,
  children,
  className
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-foreground motion-safe:transition-colors motion-safe:duration-150 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {children}
    </a>
  );
}

function ProductMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-2xl rounded-2xl border border-white/12 bg-slate-950/70 p-2 shadow-2xl shadow-black/40"
      aria-label="LiveAssist AI desktop overlay example"
    >
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#070b18]">
        <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-white/[0.04] px-4">
          <span className="h-3 w-3 rounded-full bg-red-400/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-300/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs text-muted-foreground">CRM workspace</span>
        </div>

        <div className="relative min-h-[420px] bg-grid-dark bg-[size:32px_32px] p-4 sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.22),transparent_32%),radial-gradient(circle_at_10%_70%,hsl(var(--accent)/0.14),transparent_28%)]" />
          <div className="relative grid gap-4 opacity-55 blur-[1px] md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-300 to-indigo-400" />
                <div>
                  <div className="h-3 w-28 rounded-full bg-white/30" />
                  <div className="mt-2 h-2 w-20 rounded-full bg-white/15" />
                </div>
              </div>
              <div className="aspect-video rounded-xl border border-white/10 bg-slate-900/70" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="h-16 rounded-xl bg-white/[0.06]" />
                <div className="h-16 rounded-xl bg-white/[0.06]" />
                <div className="h-16 rounded-xl bg-white/[0.06]" />
              </div>
            </div>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="h-4 w-32 rounded-full bg-white/25" />
              <div className="h-24 rounded-xl bg-white/[0.06]" />
              <div className="h-3 w-full rounded-full bg-white/20" />
              <div className="h-3 w-4/5 rounded-full bg-white/15" />
              <div className="h-3 w-3/5 rounded-full bg-white/15" />
            </div>
          </div>

          <div className="absolute left-4 right-4 top-16 mx-auto max-w-md rounded-2xl border border-cyan-200/24 bg-slate-950/88 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl sm:left-auto sm:right-8 sm:top-20">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/18 text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">LiveAssist AI</p>
                  <p className="text-xs text-muted-foreground">Private overlay</p>
                </div>
              </div>
              <kbd className="rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold text-cyan-100">
                &#8984; J
              </kbd>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-medium text-muted-foreground">Question</p>
                <p className="mt-1 text-sm text-foreground">
                  Does the annual plan include onboarding?
                </p>
              </div>
              <div className="rounded-xl border border-primary/25 bg-primary/10 p-3">
                <p className="text-xs font-medium text-cyan-200">Answer</p>
                <p className="mt-1 text-sm leading-6 text-foreground">
                  Yes. Annual plans include onboarding and priority support.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileCheck2 className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                  <span>Pricing_Terms.pdf · Page 4</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-100">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Answered in 1.4s
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid work email.");
      setSubmitted(false);
      return;
    }
    setError("");
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/12 bg-white/[0.05] p-3 shadow-2xl shadow-black/20 backdrop-blur"
      noValidate
    >
      <label htmlFor="waitlist-email" className="sr-only">
        Work email
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError("");
          }}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "waitlist-error" : submitted ? "waitlist-success" : undefined}
          className="min-h-12 flex-1 rounded-xl border border-white/12 bg-slate-950/70 px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Join waitlist
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {error ? (
        <p id="waitlist-error" className="mt-3 px-1 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {submitted ? (
        <p id="waitlist-success" className="mt-3 px-1 text-sm text-cyan-100">
          You are on the list. We will email you when early access opens.
        </p>
      ) : null}
    </form>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-grid-dark bg-[size:48px_48px]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,hsl(var(--primary)/0.28),transparent_34%),radial-gradient(circle_at_90%_20%,hsl(var(--accent)/0.16),transparent_28%),linear-gradient(180deg,transparent,hsl(var(--background))_75%)]" />

      <header className="sticky top-0 z-50 border-b border-white/8 bg-background/72 backdrop-blur-xl">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <a
            href="#top"
            className="flex min-h-10 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
              <Command className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold md:text-base">LiveAssist AI</span>
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {link.label}
              </a>
            ))}
          </div>

          <PrimaryLink href="#waitlist" className="min-h-10 px-4 py-2">
            Join waitlist
          </PrimaryLink>
        </nav>
      </header>

      <section id="top" className="relative px-4 pb-20 pt-16 md:px-6 md:pb-28 md:pt-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-cyan-100">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Source-backed answers in 1-2 seconds
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-foreground md:text-6xl lg:text-7xl">
              Never pause a customer call to search for an answer again
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              LiveAssist AI is a desktop overlay that gives sales and support teams
              instant answers from company documents while they talk to customers.
            </p>
            <ul className="mt-8 space-y-3">
              {heroBullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm leading-6 text-foreground md:text-base">
                  <Check className="mt-0.5 h-5 w-5 flex-none text-cyan-200" aria-hidden="true" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#waitlist">
                Join the waitlist
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </PrimaryLink>
              <SecondaryLink href="#how-it-works">
                See how it works
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </SecondaryLink>
            </div>
          </div>

          <ProductMockup />
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.02] px-4 py-20 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Your team knows the answer. They just cannot find it fast enough."
            body="During live conversations, people lose time searching in Notion, PDFs, Excel, CRM notes, or Slack. The customer waits, the conversation loses momentum, and the rep becomes less confident."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {painCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out hover:-translate-y-1"
              >
                <IconBadge icon={card.icon} />
                <h3 className="mt-5 text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="How it works"
            title="One hotkey between the question and the answer"
          />
          <div className="mt-14 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="relative rounded-2xl border border-white/10 bg-slate-950/60 p-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <IconBadge icon={step.icon} />
                  <span className="text-sm font-semibold text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Features"
            title="Built around the moment a customer asks a hard question"
            body="LiveAssist AI stays out of the way until the user needs a fast, document-backed answer."
          />
          <div className="mt-14 grid auto-rows-fr gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className={cn(
                  "rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur motion-safe:transition-colors motion-safe:duration-150 hover:bg-white/[0.07]",
                  feature.className
                )}
              >
                <IconBadge icon={feature.icon} />
                <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="border-y border-white/8 bg-white/[0.02] px-4 py-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title="Built for anyone who answers customer questions live" />
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((useCase) => (
              <article
                key={useCase.title}
                className="flex min-h-28 items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/56 p-5"
              >
                <IconBadge icon={useCase.icon} />
                <h3 className="text-base font-semibold leading-6 text-foreground">
                  {useCase.title}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Pricing" title="Simple pricing for daily use" />
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {pricing.map((plan) => (
              <article
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border bg-white/[0.04] p-6 backdrop-blur",
                  plan.popular
                    ? "border-primary/50 shadow-glow"
                    : "border-white/10"
                )}
              >
                {plan.popular ? (
                  <div className="absolute right-5 top-5 rounded-full bg-primary/18 px-3 py-1 text-xs font-semibold text-cyan-100">
                    Most popular
                  </div>
                ) : null}
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-foreground">{plan.price}</span>
                  {plan.period ? (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  ) : null}
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-cyan-200" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <SecondaryLink href="#waitlist" className="mt-8 w-full">
                  {plan.name === "Custom" ? "Contact us" : "Join waitlist"}
                </SecondaryLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-white/8 bg-white/[0.02] px-4 py-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader eyebrow="FAQ" title="Questions teams ask before trying it" />
          <div className="mt-12 divide-y divide-white/10 rounded-2xl border border-white/10 bg-slate-950/56">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  {faq.question}
                  <ChevronRight
                    className="h-5 w-5 flex-none text-muted-foreground motion-safe:transition-transform motion-safe:duration-150 group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="px-4 py-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/12 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.24),transparent_42%),hsl(var(--muted)/0.45)] px-5 py-14 text-center shadow-2xl shadow-black/30 md:px-10">
          <p className="text-sm font-medium text-cyan-200">Early access</p>
          <h2 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            Be first to try LiveAssist AI
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Join the early access list and get notified when the desktop app is ready.
          </p>
          <WaitlistForm />
        </div>
      </section>

      <footer className="border-t border-white/8 px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">LiveAssist AI</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Real-time knowledge assistance for customer-facing teams.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a
                key={link}
                href="#waitlist"
                className="rounded-full px-3 py-2 text-sm text-muted-foreground motion-safe:transition-colors motion-safe:duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
