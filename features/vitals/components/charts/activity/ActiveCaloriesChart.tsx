import { BaseBarChart } from "../BaseBarChart";
import { ChartCard } from "../ChartCard";
import { PhysicalActivityData } from "../../../types/health";

interface ActiveCaloriesChartProps {
  data: PhysicalActivityData[];
}

export const ActiveCaloriesChart = ({ data }: ActiveCaloriesChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    value: item.activeCalories,
  }));

  const maxCalories = Math.max(...chartData.map((d) => d.value));

  return (
    <ChartCard title="Active Calories">
      <BaseBarChart
        data={chartData}
        dataKey="value"
        color="hsl(25, 90%, 55%)" // Orange
        yDomain={[0, maxCalories + 100]}
        name="Active Calories"
        unit="cal"
        formatAsInteger={true}
      />
    </ChartCard>
  );
};
