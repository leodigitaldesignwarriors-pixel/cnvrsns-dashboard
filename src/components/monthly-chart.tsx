"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatNumber, formatPKR } from "@/lib/format";

export function MonthlyChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#94a3b8"
          tickFormatter={(v) => formatNumber(v)}
        />
        <Tooltip formatter={(value) => formatPKR(Number(value))} />
        <Legend />
        <Bar dataKey="income" fill="#16a34a" radius={[4, 4, 0, 0]} name="Income" />
        <Bar dataKey="expense" fill="#dc2626" radius={[4, 4, 0, 0]} name="Expense" />
      </BarChart>
    </ResponsiveContainer>
  );
}
