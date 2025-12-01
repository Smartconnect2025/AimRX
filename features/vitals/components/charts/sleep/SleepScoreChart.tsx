import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { SleepHealthData } from "../../../types/health";

interface SleepScoreChartProps {
  data: SleepHealthData[];
}

export const SleepScoreChart = ({ data }: SleepScoreChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    score: item.sleepScore,
  }));

  return (
    <ChartCard title="Sleep Score">
      <BaseLineChart
        data={chartData}
        dataKey="score"
        color="hsl(270, 60%, 50%)" // Purple
        yDomain={[0, 100]}
        healthyRange={{
          min: 70,
          max: 100,
          color: "hsl(270, 60%, 50%)",
        }}
        name="Score"
      />
    </ChartCard>
  );
};
