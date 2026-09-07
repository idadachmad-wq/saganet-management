import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h2 className="hidden text-2xl font-bold tracking-tight text-[var(--text)] sm:block md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:mt-1 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  accent = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "brand" | "cyan" | "pink" | "orange" | "violet" | "green";
}) {
  return (
    <div className={`panel kpi-card kpi-accent-${accent} p-4 md:p-5`}>
      <p className="relative z-[1] text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="relative z-[1] mt-3 text-2xl font-bold tracking-tight text-[var(--text)] md:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="relative z-[1] mt-2 text-sm text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted)]">
      {message}
    </div>
  );
}
