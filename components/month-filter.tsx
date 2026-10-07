"use client";

import { useRouter, usePathname } from "next/navigation";

/** Filter bulan via query `?month=yyyy-MM` — langsung apply saat dipilih. */
export function MonthFilter({
  value,
  ariaLabel = "Pilih bulan",
}: {
  value: string;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <input
      type="month"
      className="input w-full sm:w-auto"
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => {
        const next = e.target.value;
        if (!next) return;
        router.push(`${pathname}?month=${encodeURIComponent(next)}`);
      }}
    />
  );
}
