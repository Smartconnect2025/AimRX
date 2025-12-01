import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BaseBarChartProps {
  data: unknown[];
  dataKey: string;
  color: string;
  yDomain?: [number, number];
  healthyRange?: {
    min: number;
    max: number;
    color?: string;
  };
  height?: number;
  name?: string;
  unit?: string;
  formatAsInteger?: boolean;
}

export const BaseBarChart = ({
  data,
  dataKey,
  color,
  yDomain,
  healthyRange,
  height = 200,
  name,
  unit,
  formatAsInteger = false,
}: BaseBarChartProps) => {
  const formatXAxisLabel = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM dd");
    } catch {
      return dateStr;
    }
  };

  const formatValue = (value: number) => {
    if (typeof value !== "number") return value;

    const formattedValue = formatAsInteger
      ? Math.round(value).toString()
      : value.toLocaleString();
    return unit ? `${formattedValue} ${unit}` : formattedValue;
  };

  type CustomToolTipProps = {
    active?: boolean;
    payload?: { name: string; value: number | string; color: string }[];
    label?: string;
  };

  const CustomTooltip = ({ active, payload, label }: CustomToolTipProps) => {
    const payloadValue = Number(payload?.[0]?.value || 0);
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border rounded-lg p-2 shadow-lg">
          {label && (
            <p className="text-sm text-muted-foreground mb-1">
              {formatXAxisLabel(label)}
            </p>
          )}
          <p
            className="text-sm font-medium"
            style={{ color: payload[0].color }}
          >
            {payload[0].name}: {formatValue(payloadValue)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
          <ReferenceArea
            y1={healthyRange.min}
            y2={healthyRange.max}
            fill={healthyRange.color || "hsl(var(--primary))"}
            fillOpacity={0.1}
          />
        )}

        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[2, 2, 0, 0]}
          name={name || dataKey}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
