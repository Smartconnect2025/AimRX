import { BaseLineChart } from "../BaseLineChart";
import { ChartCard } from "../ChartCard";
import { CardiovascularData } from "../../../types/health";

interface BloodPressureChartProps {
  data: CardiovascularData[];
}

export const BloodPressureChart = ({ data }: BloodPressureChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    systolic: item.systolicBP,
    diastolic: item.diastolicBP,
  }));

  return (
    <ChartCard title="Blood Pressure">
      <BaseLineChart
        data={chartData}
        dataKey="systolic"
        color="hsl(0, 70%, 50%)" // Red
        yDomain={[0, 180]}
        healthyRange={[
          {
            min: 90,
            max: 120,
            color: "hsl(0, 70%, 50%)",
          },
          {
            min: 60,
            max: 80,
            color: "hsl(220, 70%, 50%)",
          },
        ]}
        secondaryLine={{
          dataKey: "diastolic",
          color: "hsl(220, 70%, 50%)", // Blue
          name: "Diastolic",
        }}
        name="Systolic"
        unit="mmHg"
        formatAsInteger={true}
      />
    </ChartCard>
  );
};
