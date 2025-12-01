import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { BodyCompositionData } from "../../../types/health";

interface WeightChartProps {
  data: BodyCompositionData[];
}

export const WeightChart = ({ data }: WeightChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    weight: item.weight,
  }));

  return (
    <ChartCard title="Weight">
      <BaseLineChart
        data={chartData}
        dataKey="weight"
        color="hsl(220, 70%, 50%)" // Blue
        yDomain={[0, 170]}
        name="Weight"
        unit="lbs"
      />
    </ChartCard>
  );
};
