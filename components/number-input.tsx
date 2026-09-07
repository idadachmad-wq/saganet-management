"use client";

import { useEffect, useState } from "react";
import { formatThousands } from "@/lib/number-format";

type Props = {
  name: string;
  defaultValue?: number | string;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

/** Input angka dengan titik pemisah ribuan (format ID): 1.000.000 */
export function NumberInput({
  name,
  defaultValue = "",
  required,
  placeholder = "0",
  className = "input",
}: Props) {
  const initial =
    defaultValue === "" || defaultValue == null
      ? ""
      : formatThousands(defaultValue);
  const [display, setDisplay] = useState(initial);

  useEffect(() => {
    setDisplay(
      defaultValue === "" || defaultValue == null
        ? ""
        : formatThousands(defaultValue),
    );
  }, [defaultValue]);

  return (
    <div>
      <input
        className={className}
        name={name}
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        required={required}
        autoComplete="off"
        onChange={(e) => setDisplay(formatThousands(e.target.value))}
      />
      {display ? (
        <p className="mt-1 text-xs font-medium text-[var(--brand)]">
          Rp {display}
        </p>
      ) : (
        <p className="mt-1 text-xs text-[var(--muted)]">
          Contoh: 250000 → 250.000
        </p>
      )}
    </div>
  );
}
