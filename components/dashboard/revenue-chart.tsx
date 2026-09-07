"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRp } from "@/lib/bagi-hasil";
import { useTheme } from "@/components/theme-provider";

export function RevenueChart({
  data,
}: {
  data: { label: string; masuk: number; keluar: number }[];
}) {
  const { theme } = useTheme();
  const masuk = theme === "dark" ? "#4ade80" : "#16a34a";
  const keluar = theme === "dark" ? "#2dd4bf" : "#0d9488";
  const grid = theme === "dark" ? "#1f4d35" : "#bbf7d0";
  const tick = theme === "dark" ? "#9fd4b0" : "#3f7a55";
  const tipBg = theme === "dark" ? "#0b1f14" : "#ffffff";
  const tipBorder = theme === "dark" ? "#1f4d35" : "#bbf7d0";
  const tipText = theme === "dark" ? "#ecfdf3" : "#052e16";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="masukFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={masuk} stopOpacity={0.35} />
              <stop offset="95%" stopColor={masuk} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="keluarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={keluar} stopOpacity={0.28} />
              <stop offset="95%" stopColor={keluar} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: tick, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          />
          <Tooltip
            contentStyle={{
              background: tipBg,
              border: `1px solid ${tipBorder}`,
              borderRadius: 12,
              color: tipText,
            }}
            formatter={(value) => formatRp(Number(value ?? 0))}
          />
          <Area
            type="monotone"
            dataKey="masuk"
            stroke={masuk}
            fill="url(#masukFill)"
            strokeWidth={3}
          />
          <Area
            type="monotone"
            dataKey="keluar"
            stroke={keluar}
            fill="url(#keluarFill)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
