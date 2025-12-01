import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { BiomarkerResult, LabResult } from "../../types/lab";
import { BaseLabLineChart } from "./BaseLabLineChart";
import { LabChartCard } from "./LabChartCard";

interface HbA1cChartProps {
  data: LabResult[];
}

const HBA1C_BIOMARKERS = {
  hba1c: {
    name: "HbA1c",
    unit: "%",
    color: "#8884d8",
    referenceRange: { min: 4.0, max: 5.6, criticalMin: 3.0, criticalMax: 10.0 },
  },
} as const;

// const getDiabetesRisk = (value: number) => {
//   if (value < 5.7) return { level: 'Normal', color: 'bg-green-100 text-green-800' };
//   if (value < 6.5) return { level: 'Prediabetes', color: 'bg-yellow-100 text-yellow-800' };
//   return { level: 'Diabetes', color: 'bg-red-100 text-red-800' };
// };

export const HbA1cChart = ({ data: labResults }: HbA1cChartProps) => {
  const processedData = useMemo(() => {
    type ProcessedValue = { date: string } & Pick<
      BiomarkerResult,
      "status" | "value"
    >;

    const processed: Record<keyof typeof HBA1C_BIOMARKERS, ProcessedValue[]> = {
      hba1c: [],
    };

    labResults.forEach((labResult) => {
      // Extract the date
      const date = format(parseISO(labResult.test_date), "MMM dd");
      // Extract HbA1c data from any panel
      Object.entries(labResult.panels).forEach(([, panel]) => {
        Object.entries(panel.results).forEach(([biomarkerKey, biomarker]) => {
          if (biomarkerKey === "hba1c") {
            processed.hba1c.push({
              date,
              value: biomarker.value,
              status: biomarker.status,
            });
          }
        });
      });
    });

    return processed;
  }, [labResults]);

  // Check for critical values
  const hasCriticalValues = useMemo(() => {
    return processedData.hba1c.some(
      (point) =>
        point.status === "critical_high" || point.status === "critical_low",
    );
  }, [processedData]);

  // Calculate trend
  // const trend = useMemo(() => {
  //   if (processedData.hba1c.length < 2) return 'stable';

  //   const latest = processedData.hba1c[processedData.hba1c.length - 1];
  //   const previous = processedData.hba1c[processedData.hba1c.length - 2];
  //   const change = ((latest.value - previous.value) / previous.value) * 100;

  //   // For HbA1c, lower values are generally better
  //   if (Math.abs(change) < 3) return 'stable';
  //   return change < 0 ? 'improving' : 'declining';
  // }, [processedData]);

  // const latestValue = processedData.hba1c[processedData.hba1c.length - 1];
  // const diabetesRisk = latestValue ? getDiabetesRisk(latestValue.value) : null;

  if (processedData.hba1c.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No HbA1c data available</p>
      </div>
    );
  }

  return (
    <LabChartCard title="HbA1c (%)" hasCriticalValues={hasCriticalValues}>
      <BaseLabLineChart
        data={processedData.hba1c}
        biomarkerKey="hba1c"
        biomarkerName="HbA1c"
        unit="%"
        color="#8884d8"
        referenceRange={HBA1C_BIOMARKERS.hba1c.referenceRange}
        height={220}
      />
    </LabChartCard>
  );
};
