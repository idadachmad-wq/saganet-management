"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRp } from "@/lib/bagi-hasil";
import { useTheme } from "@/components/theme-provider";

export type PsbMonthPoint = {
  key: string;
  label: string;
  jumlah: number;
  langganan: number;
  pemasangan: number;
};

export function PsbMonthlyChart({ data }: { data: PsbMonthPoint[] }) {
  const { theme } = useTheme();
  const langganan = theme === "dark" ? "#4ade80" : "#16a34a";
  const pemasangan = theme === "dark" ? "#2dd4bf" : "#0d9488";
  const grid = theme === "dark" ? "#1f4d35" : "#bbf7d0";
  const tick = theme === "dark" ? "#9fd4b0" : "#3f7a55";
  const tipBg = theme === "dark" ? "#0b1f14" : "#ffffff";
  const tipBorder = theme === "dark" ? "#1f4d35" : "#bbf7d0";
  const tipText = theme === "dark" ? "#ecfdf3" : "#052e16";

  return (
    <div className="h-52 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={3} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          />
          <Tooltip
            contentStyle={{
              background: tipBg,
              border: `1px solid ${tipBorder}`,
              borderRadius: 12,
              color: tipText,
            }}
            formatter={(value, name) => {
              const n = Number(value ?? 0);
              if (name === "langganan") return [formatRp(n), "Est. langganan"];
              if (name === "pemasangan") return [formatRp(n), "Biaya pemasangan"];
              return [n, "PSB terpasang"];
            }}
            labelFormatter={(label, payload) => {
              const row = payload?.[0]?.payload as PsbMonthPoint | undefined;
              return row ? `${label} · ${row.jumlah} PSB` : String(label);
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => {
              if (value === "langganan") return "Est. langganan";
              return "Biaya pemasangan";
            }}
          />
          <Bar
            dataKey="langganan"
            fill={langganan}
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="pemasangan"
            fill={pemasangan}
            radius={[6, 6, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
