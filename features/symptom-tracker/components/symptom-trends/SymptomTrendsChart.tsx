import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SymptomTrendsChartProps } from "./types";

const symptomColors = ["#ef4444", "#22c55e", "#3b82f6"];

export const SymptomTrendsChart = ({
  chartData,
  selectedSymptoms,
}: SymptomTrendsChartProps) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "#374151" }}
            cursor={{ stroke: "#9ca3af", strokeWidth: 1 }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "10px",
              fontSize: "12px",
            }}
          />
          {Array.from(selectedSymptoms).map((symptom, index) => {
            return (
              <Line
                key={symptom}
                type="monotone"
                dataKey={symptom}
                stroke={symptomColors[index]}
                strokeWidth={2}
                connectNulls={true}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                  fill: "white",
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
