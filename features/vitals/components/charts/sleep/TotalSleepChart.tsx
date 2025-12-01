import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { SleepHealthData } from "../../../types/health";

interface TotalSleepChartProps {
  data: SleepHealthData[];
}

export const TotalSleepChart = ({ data }: TotalSleepChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    value: item.totalSleepHours,
  }));

  return (
    <ChartCard title="Total Sleep">
      <BaseLineChart
        data={chartData}
        dataKey="value"
        color="hsl(220, 70%, 50%)" // Blue
        yDomain={[0, 12]}
        healthyRange={{
          min: 7,
          max: 9,
          color: "hsl(220, 70%, 50%)",
        }}
        name="Sleep"
        unit="hours"
      />
    </ChartCard>
  );
};
