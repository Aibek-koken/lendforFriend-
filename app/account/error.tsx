"use client";

export default function AccountError({ reset }: { reset: () => void }) {
  return (
    <main className="signup-surface flex min-h-[100svh] items-center justify-center px-4 text-[#1a1917]">
      <div className="max-w-md rounded-[28px] bg-white/80 p-7 text-center shadow-lg ring-1 ring-[#e9e3da]">
        <h1 className="text-2xl font-bold">Couldn&apos;t load your account</h1>
        <p className="mt-3 text-sm leading-6 text-[#6b665e]">
          This is usually a temporary network issue. Your workspace and CRM connection are safe.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 rounded-xl bg-[#1a1917] px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a35707] focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
