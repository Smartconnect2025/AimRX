"use client";
import { format } from "date-fns";
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
import { Goal, GoalHistoryEntry } from "../../types";

interface PerformanceChartProps {
  goal: Goal;
  historyData: GoalHistoryEntry[];
}

export function PerformanceChart({ goal, historyData }: PerformanceChartProps) {
  const targetValue = Number(goal.target_value);
  const unit =
    goal.unit ||
    (goal.metric === "steps"
      ? "steps"
      : goal.metric === "deep_breathing"
        ? "minutes"
        : "times");

  // Prepare chart data
  const chartData = historyData.map((entry) => ({
    date: format(entry.date, "MMM dd"),
    actual:
      entry.actualValue ?? Math.round((entry.progress / 100) * targetValue),
    target: targetValue,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
          <YAxis
            unit={` ${unit}`}
            allowDecimals={false}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(value: number) => `${value} ${unit}`} />
          <Legend />
          <Bar
            name="Actual"
            dataKey="actual"
            fill="#66cdcc"
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
          />
          <Bar
            name="Target"
            dataKey="target"
            fill="#6b7280"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.3}
            stackId="target"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
