"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Mood, MoodEntry } from "../types";
import { transformMoodDataForChart, getMoodConfig } from "../utils";

interface MoodChartProps {
  entries: MoodEntry[];
  className?: string;
}

export const MoodChart: React.FC<MoodChartProps> = ({ entries, className }) => {
  const chartData = transformMoodDataForChart(entries.slice(0, 14).reverse()); // Last 14 days, reversed for chronological order

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ payload: { mood: string; date: string } }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const moodConfig = getMoodConfig(data.mood as Mood);

      return (
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            {label ? format(new Date(label), "MMM d, yyyy") : ""}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-3 h-3 rounded-full ${moodConfig.bgColor}`}></div>
            <span className="text-sm">{moodConfig.label}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-64 bg-muted/30 rounded-lg ${className}`}
      >
        <div className="text-center">
          <p className="text-muted-foreground">No mood data available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start tracking your moods to see your trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), "MMM d")}
            className="text-xs"
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={(value) => {
              const moods = [
                "",
                "Angry",
                "Anxious",
                "Neutral",
                "Good",
                "Amazing",
              ];
              return moods[value] || "";
            }}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="moodValue"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
