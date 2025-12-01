import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { CardiovascularData } from "../../../types/health";

interface RestingHeartRateChartProps {
  data: CardiovascularData[];
}

export const RestingHeartRateChart = ({ data }: RestingHeartRateChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    value: item.restingHeartRate,
  }));

  return (
    <ChartCard title="Resting Heart Rate">
      <BaseLineChart
        data={chartData}
        dataKey="value"
        color="hsl(25, 90%, 55%)" // Orange
        yDomain={[0, 100]}
        healthyRange={{
          min: 60,
          max: 100,
          color: "hsl(25, 90%, 55%)",
        }}
        name="Resting Heart Rate"
        unit="bpm"
        formatAsInteger={true}
      />
    </ChartCard>
  );
};
