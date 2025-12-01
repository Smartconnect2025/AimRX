import { SleepHealthData } from "../../../types/health";
import { BaseAreaChart } from "../BaseAreaChart";
import { ChartCard } from "../ChartCard";

interface SleepStagesChartProps {
  data: SleepHealthData[];
}

export const SleepStagesChart = ({ data }: SleepStagesChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    values: {
      rem: item.sleepStages.rem * 100,
      deep: item.sleepStages.deep * 100,
      light: item.sleepStages.light * 100,
      awake: item.sleepStages.awake * 100,
    },
  }));

  const dataSeries = [
    { dataKey: "rem", color: "hsl(270, 60%, 50%)", name: "REM" },
    { dataKey: "deep", color: "hsl(220, 70%, 50%)", name: "Deep" },
    { dataKey: "light", color: "hsl(200, 70%, 70%)", name: "Light" },
    { dataKey: "awake", color: "hsl(0, 60%, 60%)", name: "Awake" },
  ];

  return (
    <ChartCard title="Sleep Stages">
      <BaseAreaChart
        data={chartData}
        dataSeries={dataSeries}
        yDomain={[0, 100]}
        stacked={true}
      />
    </ChartCard>
  );
};
