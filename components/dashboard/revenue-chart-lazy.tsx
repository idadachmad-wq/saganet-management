"use client";

import dynamic from "next/dynamic";

export const RevenueChart = dynamic(
  () =>
    import("@/components/dashboard/revenue-chart").then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-64 w-full animate-pulse rounded-xl bg-[var(--bg-soft)]"
        aria-hidden
      />
    ),
  },
);
