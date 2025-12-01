import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { BiomarkerResult, LabResult } from "../../types/lab";
import { BaseLabLineChart } from "./BaseLabLineChart";
import { LabChartCard } from "./LabChartCard";

interface CBCChartProps {
  data: LabResult[];
}

const CBC_BIOMARKERS = {
  wbc: {
    name: "White Blood Cells",
    unit: "K/uL",
    color: "#8884d8",
    referenceRange: {
      min: 4.0,
      max: 11.0,
      criticalMin: 1.0,
      criticalMax: 20.0,
    },
  },
  rbc: {
    name: "Red Blood Cells",
    unit: "M/uL",
    color: "#ff6b6b",
    referenceRange: { min: 4.2, max: 5.4, criticalMin: 2.0, criticalMax: 7.0 },
  },
  hemoglobin: {
    name: "Hemoglobin",
    unit: "g/dL",
    color: "#51cf66",
    referenceRange: {
      min: 12.0,
      max: 16.0,
      criticalMin: 6.0,
      criticalMax: 20.0,
    },
  },
  hematocrit: {
    name: "Hematocrit",
    unit: "%",
    color: "#ffd43b",
    referenceRange: {
      min: 36.0,
      max: 48.0,
      criticalMin: 18.0,
      criticalMax: 60.0,
    },
  },
  platelets: {
    name: "Platelets",
    unit: "K/uL",
    color: "#ff8cc8",
    referenceRange: { min: 150, max: 450, criticalMin: 50, criticalMax: 1000 },
  },
} as const;

export const CBCChart = ({ data: labResults }: CBCChartProps) => {
  const processedData = useMemo(() => {
    type ProcessedValue = { date: string } & Pick<
      BiomarkerResult,
      "status" | "value"
    >;

    const processed: Record<keyof typeof CBC_BIOMARKERS, ProcessedValue[]> = {
      wbc: [],
      rbc: [],
      hemoglobin: [],
      hematocrit: [],
      platelets: [],
    };

    labResults.forEach(
      (labResult) => {
        // Extract the date
        const date = format(parseISO(labResult.test_date), "MMM dd");
        // Get just the CBC panel
        const cbcPanel = labResult.panels["complete_blood_count"];
        if (!cbcPanel) {
          return;
        }
        Object.entries(cbcPanel.results).forEach(
          ([biomarkerKey, biomarker]) => {
            if (!(biomarkerKey in CBC_BIOMARKERS)) {
              return;
            }
            processed[biomarkerKey as keyof typeof CBC_BIOMARKERS].push({
              date,
              value: biomarker.value,
              status: biomarker.status,
            });
          },
        );
      },
      {} as Record<keyof typeof CBC_BIOMARKERS, ProcessedValue[]>,
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
  //   const trends = Object.keys(CBC_BIOMARKERS).map(biomarkerKey => {
  //     const biomarkerData = processedData[biomarkerKey as keyof typeof CBC_BIOMARKERS];
  //     if (biomarkerData.length < 2) return 'stable';

  //     const latest = biomarkerData[biomarkerData.length - 1];
  //     const previous = biomarkerData[biomarkerData.length - 2];
  //     const change = ((latest.value - previous.value) / previous.value) * 100;

  //     if (Math.abs(change) < 5) return 'stable';
  //     return change > 0 ? 'increasing' : 'decreasing';
  //   });

  //   const improvingCount = trends.filter(t => t === 'increasing').length;
  //   const decliningCount = trends.filter(t => t === 'decreasing').length;

  //   if (improvingCount > decliningCount) return 'improving';
  //   if (decliningCount > improvingCount) return 'declining';
  //   return 'stable';
  // }, [processedData]);

  return (
    <div className="space-y-6">
      {Object.entries(CBC_BIOMARKERS).map(([biomarkerKey, config]) => {
        const biomarkerData =
          processedData[biomarkerKey as keyof typeof CBC_BIOMARKERS];

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
