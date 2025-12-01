import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { BiomarkerResult, LabResult } from "../../types/lab";
import { BaseLabLineChart } from "./BaseLabLineChart";
import { LabChartCard } from "./LabChartCard";

interface ThyroidChartProps {
  data: LabResult[];
}

const THYROID_BIOMARKERS = {
  tsh: {
    name: "TSH",
    unit: "mIU/L",
    color: "#8884d8",
    referenceRange: { min: 0.4, max: 4.0, criticalMin: 0.1, criticalMax: 10.0 },
  },
  free_t4: {
    name: "Free T4",
    unit: "ng/dL",
    color: "#82ca9d",
    referenceRange: { min: 0.8, max: 1.8, criticalMin: 0.4, criticalMax: 3.0 },
  },
  free_t3: {
    name: "Free T3",
    unit: "pg/mL",
    color: "#ffc658",
    referenceRange: { min: 2.3, max: 4.2, criticalMin: 1.5, criticalMax: 6.0 },
  },
} as const;

export const ThyroidChart = ({ data: labResults }: ThyroidChartProps) => {
  const processedData = useMemo(() => {
    type ProcessedValue = { date: string } & Pick<
      BiomarkerResult,
      "status" | "value"
    >;

    const processed: Record<keyof typeof THYROID_BIOMARKERS, ProcessedValue[]> =
      {
        tsh: [],
        free_t4: [],
        free_t3: [],
      };

    labResults.forEach(
      (labResult) => {
        // Extract the date
        const date = format(parseISO(labResult.test_date), "MMM dd");
        // Get just the thyroid function panel
        const thyroidPanel = labResult.panels["thyroid_function"];
        if (!thyroidPanel) {
          return;
        }
        Object.entries(thyroidPanel.results).forEach(
          ([biomarkerKey, biomarker]) => {
            if (!(biomarkerKey in THYROID_BIOMARKERS)) {
              return;
            }
            processed[biomarkerKey as keyof typeof THYROID_BIOMARKERS].push({
              date,
              value: biomarker.value,
              status: biomarker.status,
            });
          },
        );
      },
      {} as Record<keyof typeof THYROID_BIOMARKERS, ProcessedValue[]>,
    );

    return processed;
  }, [labResults]);

  // Check for critical values
  const hasCriticalValues = useMemo(() => {
    return Object.values(processedData).some((biomarkerData) =>
      biomarkerData.some(
        (point) =>
          point.status === "critical_high" || point.status === "critical_low",
      ),
    );
  }, [processedData]);

  // Calculate overall trend
  // const trend = useMemo(() => {
  //   const trends = Object.keys(THYROID_BIOMARKERS).map(biomarkerKey => {
  //     const biomarkerData = processedData[biomarkerKey as keyof typeof THYROID_BIOMARKERS];
  //     if (biomarkerData.length < 2) return 'stable';

  //     const latest = biomarkerData[biomarkerData.length - 1];
  //     const previous = biomarkerData[biomarkerData.length - 2];
  //     const change = ((latest.value - previous.value) / previous.value) * 100;

  //     if (Math.abs(change) < 10) return 'stable';
  //     return change > 0 ? 'increasing' : 'decreasing';
  //   });

  //   const improvingCount = trends.filter(t => t === 'increasing').length;
  //   const decliningCount = trends.filter(t => t === 'decreasing').length;

  //   if (improvingCount > decliningCount) return 'improving';
  //   if (decliningCount > improvingCount) return 'declining';
  //   return 'stable';
  // }, [processedData]);

  const hasData = Object.values(processedData).some(
    (biomarkerData) => biomarkerData.length > 0,
  );

  if (!hasData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No thyroid function data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(THYROID_BIOMARKERS).map(([biomarkerKey, config]) => {
        const biomarkerData =
          processedData[biomarkerKey as keyof typeof THYROID_BIOMARKERS];

        if (biomarkerData.length === 0) {
          return (
            <div
              key={biomarkerKey}
              className="text-center py-4 text-muted-foreground"
            >
              <p className="text-sm">No {config.name} data available</p>
            </div>
          );
        }

        return (
          <LabChartCard
            key={biomarkerKey}
            title={`${config.name} (${config.unit})`}
            hasCriticalValues={hasCriticalValues}
          >
            <BaseLabLineChart
              data={biomarkerData}
              biomarkerKey={biomarkerKey}
              biomarkerName={config.name}
              unit={config.unit}
              color={config.color}
              referenceRange={config.referenceRange}
              height={200}
            />
          </LabChartCard>
        );
      })}
    </div>
  );
};
