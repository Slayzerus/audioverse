import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

type ChartProps<T = Record<string, unknown>> = {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  color?: string;
  height?: number;
};

const SimpleLineChartInner = <T extends object>({ data, xKey, yKey, color = 'var(--chart-line, #4caf50)', height = 220 }: ChartProps<T>) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke, #333)" />
      <XAxis dataKey={xKey as string} stroke="var(--axis-stroke, #aaa)" />
      <YAxis stroke="var(--axis-stroke, #aaa)" />
      <Tooltip />
      <Line type="monotone" dataKey={yKey as string} stroke={color} strokeWidth={3} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);
export const SimpleLineChart = React.memo(SimpleLineChartInner) as typeof SimpleLineChartInner;

const SimpleBarChartInner = <T extends object>({ data, xKey, yKey, color = 'var(--chart-bar, #e53935)', height = 220 }: ChartProps<T>) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke, #333)" />
      <XAxis dataKey={xKey as string} stroke="var(--axis-stroke, #aaa)" />
      <YAxis stroke="var(--axis-stroke, #aaa)" />
      <Tooltip />
      <Bar dataKey={yKey as string} fill={color} radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
export const SimpleBarChart = React.memo(SimpleBarChartInner) as typeof SimpleBarChartInner;
