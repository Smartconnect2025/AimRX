import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { VitalsTooltipProps } from "../../types/health";

interface DataSeries {
  dataKey: string;
  color: string;
  name?: string;
}

type BaseAreaChartDatapoint = {
  date: string;
  values: { [k: string]: number };
};
interface BaseAreaChartProps {
  data: BaseAreaChartDatapoint[];
  dataSeries: DataSeries[];
  yDomain?: [number, number];
  height?: number;
  stacked?: boolean;
}

export const BaseAreaChart = ({
  data,
  dataSeries,
  yDomain,
  height = 200,
  stacked = true,
}: BaseAreaChartProps) => {
  const flattenedData = useMemo(
    () =>
      data.map((item) => ({
        date: item.date,
        ...item.values,
      })),
    [data],
  );

  const formatXAxisLabel = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM dd");
    } catch {
      return dateStr;
    }
  };

  const formatYAxisLabel = (percentValue: string) => {
    try {
      return Math.round(parseFloat(percentValue)) + "%";
    } catch {
      return percentValue;
    }
  };

  const CustomTooltip = ({ active, payload, label }: VitalsTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg p-2 shadow-lg">
          {label && (
            <p className="text-sm text-muted-foreground mb-1">
              {formatXAxisLabel(label)}
            </p>
          )}
          {payload.map((entry, index: number) => (
            <p
              key={index}
              className="text-sm font-medium"
              style={{ color: entry.color }}
            >
              {entry.name}:{" "}
              {typeof entry.value === "number"
                ? entry.value.toFixed(1)
                : entry.value}
              {stacked && typeof entry.value === "number" ? "%" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={flattenedData}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.3}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxisLabel}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={yDomain || [0, "dataMax"]}
          tickFormatter={formatYAxisLabel}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} />

        {dataSeries.map((series) => (
          <Area
            key={series.dataKey}
            type="monotone"
            dataKey={series.dataKey}
            stackId={stacked ? "1" : undefined}
            stroke={series.color}
            fill={series.color}
            fillOpacity={0.6}
            name={series.name || series.dataKey}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};
