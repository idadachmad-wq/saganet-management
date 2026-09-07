"use client";

import dynamic from "next/dynamic";
import type { PsbMonthPoint } from "@/components/psb/psb-monthly-chart";

export type { PsbMonthPoint };

export const PsbMonthlyChart = dynamic(
  () =>
    import("@/components/psb/psb-monthly-chart").then((m) => m.PsbMonthlyChart),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-52 w-full animate-pulse rounded-xl bg-[var(--bg-soft)] sm:h-72"
        aria-hidden
      />
    ),
  },
);
