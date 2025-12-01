import { BaseBarChart } from "../BaseBarChart";
import { ChartCard } from "../ChartCard";
import { PhysicalActivityData } from "../../../types/health";

interface DailyStepsChartProps {
  data: PhysicalActivityData[];
}

export const DailyStepsChart = ({ data }: DailyStepsChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    value: item.steps,
  }));

  const maxSteps = Math.max(...chartData.map((d) => d.value));

  return (
    <ChartCard title="Daily Steps">
      <BaseBarChart
        data={chartData}
        dataKey="value"
        color="hsl(120, 60%, 50%)" // Green
        yDomain={[0, maxSteps + 1000]}
        healthyRange={{
          min: 8000,
          max: 12000,
          color: "hsl(120, 60%, 50%)",
        }}
        name="Steps"
        formatAsInteger={true}
      />
    </ChartCard>
  );
};
