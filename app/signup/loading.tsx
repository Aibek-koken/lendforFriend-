export default function Loading() {
  return (
    <main className="signup-surface flex min-h-[100svh] items-center justify-center px-4" aria-busy="true">
      <div className="w-full max-w-[440px] animate-pulse space-y-4" aria-label="Loading signup">
        <div className="mx-auto h-16 w-16 rounded-[22px] bg-[#efe9e0]" />
        <div className="mx-auto h-4 w-32 rounded bg-[#efe9e0]" />
        <div className="mx-auto h-12 w-4/5 rounded-xl bg-[#efe9e0]" />
        <div className="h-12 w-full rounded-2xl bg-[#efe9e0]" />
      </div>
    </main>
  );
}
