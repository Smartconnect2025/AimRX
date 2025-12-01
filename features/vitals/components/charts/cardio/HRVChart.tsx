import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { CardiovascularData } from "../../../types/health";

interface HRVChartProps {
  data: CardiovascularData[];
}

export const HRVChart = ({ data }: HRVChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    value: item.hrv,
  }));

  return (
    <ChartCard title="Heart Rate Variability">
      <BaseLineChart
        data={chartData}
        dataKey="value"
        color="hsl(270, 60%, 50%)" // Purple
        yDomain={[0, 100]}
        healthyRange={{
          min: 20,
          max: 100,
          color: "hsl(270, 60%, 50%)",
        }}
        name="HRV"
        unit="ms"
        formatAsInteger={true}
      />
    </ChartCard>
  );
};
