export default function AppLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy aria-label="Memuat">
      <div className="h-7 w-40 rounded-lg bg-[var(--bg-soft)]" />
      <div className="h-4 w-64 max-w-full rounded bg-[var(--bg-soft)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
        <div className="h-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
        <div className="h-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] sm:col-span-2 lg:col-span-1" />
      </div>
      <div className="h-48 rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
      <div className="space-y-2">
        <div className="h-12 rounded-xl bg-[var(--bg-soft)]" />
        <div className="h-12 rounded-xl bg-[var(--bg-soft)]" />
        <div className="h-12 rounded-xl bg-[var(--bg-soft)]" />
      </div>
    </div>
  );
}
