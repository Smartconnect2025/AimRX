import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BaseLineChartProps {
  data: { date: string }[];
  dataKey: string;
  color: string;
  yDomain?: [number, number];
  healthyRange?:
    | {
        min: number;
        max: number;
        color?: string;
      }
    | {
        min: number;
        max: number;
        color?: string;
      }[];
  height?: number;
  secondaryLine?: {
    dataKey: string;
    color: string;
    name?: string;
  };
  name?: string;
  unit?: string;
  formatAsInteger?: boolean;
}

export const BaseLineChart = ({
  data,
  dataKey,
  color,
  yDomain,
  healthyRange,
  height = 200,
  secondaryLine,
  name,
  unit,
  formatAsInteger = false,
}: BaseLineChartProps) => {
  const formatXAxisLabel = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM dd");
    } catch {
      return dateStr;
    }
  };

  const formatValue = (value: number | string, entryName: string) => {
    if (typeof value !== "number") return value;

    const shouldFormatAsInteger =
      formatAsInteger ||
      entryName.toLowerCase().includes("systolic") ||
      entryName.toLowerCase().includes("diastolic") ||
      entryName.toLowerCase().includes("heart rate") ||
      entryName.toLowerCase().includes("hrv");

    const formattedValue = shouldFormatAsInteger
      ? Math.round(value).toString()
      : value.toFixed(1);
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  };

  type CustomToolTipProps = {
    active?: boolean;
    payload?: { name: string; value: number | string; color: string }[];
    label?: string;
  };

  const CustomTooltip = ({ active, payload, label }: CustomToolTipProps) => {
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
              {entry.name}: {formatValue(entry.value, entry.name)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
          domain={yDomain}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} />

        {healthyRange && (
          <>
            {Array.isArray(healthyRange) ? (
              healthyRange.map((range, index) => (
                <ReferenceArea
                  key={index}
                  y1={range.min}
                  y2={range.max}
                  fill={range.color || "hsl(var(--primary))"}
                  fillOpacity={0.1}
                />
              ))
            ) : (
              <ReferenceArea
                y1={healthyRange.min}
                y2={healthyRange.max}
                fill={healthyRange.color || "hsl(var(--primary))"}
                fillOpacity={0.1}
              />
            )}
          </>
        )}

        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: color }}
          name={name || dataKey}
        />

        {secondaryLine && (
          <Line
            type="monotone"
            dataKey={secondaryLine.dataKey}
            stroke={secondaryLine.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: secondaryLine.color }}
            name={secondaryLine.name || secondaryLine.dataKey}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};
