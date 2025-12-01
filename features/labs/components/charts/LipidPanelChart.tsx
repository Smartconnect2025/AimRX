import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { BiomarkerResult, LabResult } from "../../types/lab";
import { BaseLabLineChart } from "./BaseLabLineChart";
import { LabChartCard } from "./LabChartCard";

interface LipidPanelChartProps {
  data: LabResult[];
}

const LIPID_BIOMARKERS = {
  total_cholesterol: {
    name: "Total Cholesterol",
    unit: "mg/dL",
    color: "#8884d8",
    referenceRange: { min: 100, max: 200, criticalMin: 50, criticalMax: 300 },
  },
  ldl_cholesterol: {
    name: "LDL Cholesterol",
    unit: "mg/dL",
    color: "#ff6b6b",
    referenceRange: { min: 50, max: 100, criticalMin: 25, criticalMax: 200 },
  },
  hdl_cholesterol: {
    name: "HDL Cholesterol",
    unit: "mg/dL",
    color: "#51cf66",
    referenceRange: { min: 40, max: 60, criticalMin: 20, criticalMax: 100 },
  },
  triglycerides: {
    name: "Triglycerides",
    unit: "mg/dL",
    color: "#ffd43b",
    referenceRange: { min: 50, max: 150, criticalMin: 25, criticalMax: 500 },
  },
} as const;

export const LipidPanelChart = ({ data: labResults }: LipidPanelChartProps) => {
  const processedData = useMemo(() => {
    type ProcessedValue = { date: string } & Pick<
      BiomarkerResult,
      "status" | "value"
    >;

    const processed: Record<keyof typeof LIPID_BIOMARKERS, ProcessedValue[]> = {
      total_cholesterol: [],
      ldl_cholesterol: [],
      hdl_cholesterol: [],
      triglycerides: [],
    };

    labResults.forEach(
      (labResult) => {
        // Extract the date
        const date = format(parseISO(labResult.test_date), "MMM dd");
        // Get just the lipid panel
        const lipidPanel = labResult.panels["lipid_panel"];
        if (!lipidPanel) {
          return;
        }
        Object.entries(lipidPanel.results).forEach(
          ([biomarkerKey, biomarker]) => {
            if (!(biomarkerKey in LIPID_BIOMARKERS)) {
              return;
            }
            processed[biomarkerKey as keyof typeof LIPID_BIOMARKERS].push({
              date,
              value: biomarker.value,
              status: biomarker.status,
            });
          },
        );
      },
      {} as Record<keyof typeof LIPID_BIOMARKERS, ProcessedValue[]>,
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
  //   const trends = Object.keys(LIPID_BIOMARKERS).map(biomarkerKey => {
  //     const biomarkerData = processedData[biomarkerKey as keyof typeof LIPID_BIOMARKERS];
  //     if (biomarkerData.length < 2) return 'stable';

  //     const latest = biomarkerData[biomarkerData.length - 1];
  //     const previous = biomarkerData[biomarkerData.length - 2];
  //     const change = ((latest.value - previous.value) / previous.value) * 100;

  //     // For cholesterol, lower is generally better (except HDL)
  //     if (biomarkerKey === 'hdl_cholesterol') {
  //       if (change > 5) return 'improving';
  //       else if (change < -5) return 'declining';
  //     } else {
  //       if (change < -5) return 'improving';
  //       else if (change > 5) return 'declining';
  //     }
  //     return 'stable';
  //   });

  //   const improvingCount = trends.filter(t => t === 'improving').length;
  //   const decliningCount = trends.filter(t => t === 'declining').length;

  //   if (improvingCount > decliningCount) return 'improving';
  //   if (decliningCount > improvingCount) return 'declining';
  //   return 'stable';
  // }, [processedData]);

  return (
    <div className="space-y-6">
      {Object.entries(LIPID_BIOMARKERS).map(([biomarkerKey, config]) => {
        const biomarkerData =
          processedData[biomarkerKey as keyof typeof LIPID_BIOMARKERS];

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
