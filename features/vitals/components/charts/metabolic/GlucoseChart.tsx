import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { MetabolicData } from "../../../types/health";

interface GlucoseChartProps {
  data: MetabolicData[];
}

export const GlucoseChart = ({ data }: GlucoseChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    value: item.glucoseAverage,
  }));

  return (
    <ChartCard title="Glucose">
      <BaseLineChart
        data={chartData}
        dataKey="value"
        color="hsl(180, 60%, 50%)" // Teal
        yDomain={[0, 200]}
        healthyRange={{
          min: 70,
          max: 140,
          color: "hsl(180, 60%, 50%)",
        }}
        height={200}
        name="Glucose"
        unit="mg/dL"
      />
    </ChartCard>
  );
};
