import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { SleepHealthData } from "../../../types/health";

interface SleepEfficiencyChartProps {
  data: SleepHealthData[];
}

export const SleepEfficiencyChart = ({ data }: SleepEfficiencyChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    efficiency: item.sleepEfficiency,
  }));

  return (
    <ChartCard title="Sleep Efficiency">
      <BaseLineChart
        data={chartData}
        dataKey="efficiency"
        color="hsl(120, 60%, 50%)" // Green
        yDomain={[0, 100]}
        healthyRange={{
          min: 85,
          max: 100,
          color: "hsl(120, 60%, 50%)",
        }}
        name="Efficiency"
        unit="%"
      />
    </ChartCard>
  );
};
