import { BodyCompositionData } from "../../../types/health";
import { BaseAreaChart } from "../BaseAreaChart";
import { ChartCard } from "../ChartCard";

interface BodyCompositionChartProps {
  data: BodyCompositionData[];
}

export const BodyCompositionChart = ({ data }: BodyCompositionChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    values: {
      musclePercent: item.musclePercent,
      fatPercent: item.bodyFatPercent,
      waterPercent: item.waterPercent,
      bonePercent: item.bonePercent,
    },
  }));

  const dataSeries = [
    { dataKey: "musclePercent", color: "hsl(120, 60%, 50%)", name: "Muscle" },
    { dataKey: "fatPercent", color: "hsl(45, 90%, 55%)", name: "Fat" },
    { dataKey: "waterPercent", color: "hsl(200, 70%, 50%)", name: "Water" },
    { dataKey: "bonePercent", color: "hsl(0, 0%, 60%)", name: "Bone" },
  ];

  return (
    <ChartCard title="Body Composition">
      <BaseAreaChart
        data={chartData}
        dataSeries={dataSeries}
        yDomain={[0, 100]}
        stacked={true}
      />
    </ChartCard>
  );
};
