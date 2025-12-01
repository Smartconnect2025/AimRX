import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { BiomarkerResult, LabResult } from "../../types/lab";
import { BaseLabLineChart } from "./BaseLabLineChart";
import { LabChartCard } from "./LabChartCard";

interface MetabolicPanelChartProps {
  data: LabResult[];
}

const METABOLIC_BIOMARKERS = {
  glucose: {
    name: "Glucose",
    unit: "mg/dL",
    color: "#8884d8",
    referenceRange: { min: 70, max: 100, criticalMin: 50, criticalMax: 180 },
  },
  creatinine: {
    name: "Creatinine",
    unit: "mg/dL",
    color: "#82ca9d",
    referenceRange: { min: 0.6, max: 1.2, criticalMin: 0.3, criticalMax: 3.0 },
  },
  alt: {
    name: "ALT",
    unit: "U/L",
    color: "#ffc658",
    referenceRange: { min: 7, max: 35, criticalMin: 3, criticalMax: 100 },
  },
} as const;

export const MetabolicPanelChart = ({
  data: labResults,
}: MetabolicPanelChartProps) => {
  const processedData = useMemo(() => {
    type ProcessedValue = { date: string } & Pick<
      BiomarkerResult,
      "status" | "value"
    >;

    const processed: Record<
      keyof typeof METABOLIC_BIOMARKERS,
      ProcessedValue[]
    > = {
      glucose: [],
      creatinine: [],
      alt: [],
    };

    labResults.forEach(
      (labResult) => {
        // Extract the date
        const date = format(parseISO(labResult.test_date), "MMM dd");
        // Get just the basic metabolic panel
        const metabolicPanel = labResult.panels["basic_metabolic_panel"];
        if (!metabolicPanel) {
          return;
        }
        Object.entries(metabolicPanel.results).forEach(
          ([biomarkerKey, biomarker]) => {
            if (!(biomarkerKey in METABOLIC_BIOMARKERS)) {
              return;
            }
            processed[biomarkerKey as keyof typeof METABOLIC_BIOMARKERS].push({
              date,
              value: biomarker.value,
              status: biomarker.status,
            });
          },
        );
      },
      {} as Record<keyof typeof METABOLIC_BIOMARKERS, ProcessedValue[]>,
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
  //   const trends = Object.keys(METABOLIC_BIOMARKERS).map(biomarkerKey => {
  //     const biomarkerData = processedData[biomarkerKey as keyof typeof METABOLIC_BIOMARKERS];
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
      {Object.entries(METABOLIC_BIOMARKERS).map(([biomarkerKey, config]) => {
        const biomarkerData =
          processedData[biomarkerKey as keyof typeof METABOLIC_BIOMARKERS];

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
