import { BaseBarChart } from "../BaseBarChart";
import { ChartCard } from "../ChartCard";
import { PhysicalActivityData } from "../../../types/health";

interface ActiveMinutesChartProps {
  data: PhysicalActivityData[];
}

export const ActiveMinutesChart = ({ data }: ActiveMinutesChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    value: item.activeMinutes,
  }));

  const maxMinutes = Math.max(...chartData.map((d) => d.value));

  return (
    <ChartCard title="Active Minutes">
      <BaseBarChart
        data={chartData}
        dataKey="value"
        color="hsl(180, 60%, 50%)" // Teal
        yDomain={[0, maxMinutes + 10]}
        healthyRange={{
          min: 30,
          max: 90,
          color: "hsl(180, 60%, 50%)",
        }}
        name="Active Minutes"
        unit="min"
        formatAsInteger={true}
      />
    </ChartCard>
  );
};
