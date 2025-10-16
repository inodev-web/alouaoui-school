"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const data = [
  {
    name: "Jan",
    total: 1200,
  },
  {
    name: "Feb",
    total: 1400,
  },
  {
    name: "Mar",
    total: 1100,
  },
  {
    name: "Apr",
    total: 1600,
  },
  {
    name: "May",
    total: 1800,
  },
  {
    name: "Jun",
    total: 2100,
  },
  {
    name: "Jul",
    total: 1900,
  },
  {
    name: "Aug",
    total: 2200,
  },
  {
    name: "Sep",
    total: 2400,
  },
  {
    name: "Oct",
    total: 2100,
  },
  {
    name: "Nov",
    total: 2300,
  },
  {
    name: "Dec",
    total: 2500,
  },
];

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
