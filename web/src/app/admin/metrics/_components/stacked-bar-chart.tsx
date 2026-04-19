"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export type StackedPoint = { day: string; [key: string]: string | number };

export function StackedBarChart({
  data,
  series,
}: {
  data: StackedPoint[];
  series: { key: string; label: string; color: string }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="day" fontSize={11} tick={{ fill: "#666" }} />
          <YAxis fontSize={11} tick={{ fill: "#666" }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} stackId="a" fill={s.color} name={s.label} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
