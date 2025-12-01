import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { CardiovascularData } from "../../../types/health";

interface BloodOxygenChartProps {
  data: CardiovascularData[];
}

export const BloodOxygenChart = ({ data }: BloodOxygenChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    value: item.bloodOxygen,
  }));

  return (
    <ChartCard title="Blood Oxygen">
      <BaseLineChart
        data={chartData}
        dataKey="value"
        color="hsl(190, 70%, 50%)" // Cyan
        yDomain={[0, 100]}
        healthyRange={{
          min: 95,
          max: 100,
          color: "hsl(190, 70%, 50%)",
        }}
        name="Blood Oxygen"
        unit="%"
      />
    </ChartCard>
  );
};
