import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { BiomarkerResult, LabResult } from "../types/lab";

interface RecentResultsSectionProps {
  title?: string;
  showViewButton?: boolean;
  showSubtitle?: boolean;
  variant?: "dashboard" | "labs";
  labResults?: LabResult[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "critical":
      return "destructive";
    case "abnormal":
      return "destructive";
    case "normal":
      return "default";
    default:
      return "default";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "critical":
      return "Critical";
    case "abnormal":
      return "Abnormal";
    case "normal":
      return "Normal";
    default:
      return "Normal";
  }
};

const RecentResultsSection = ({
  title = "Latest Labs",
  showViewButton = true,
  showSubtitle = false,
  variant = "dashboard",
  labResults = [],
}: RecentResultsSectionProps = {}) => {
  const router = useRouter();

  // Get the most recent result
  const latestResult =
    labResults.length > 0 ? labResults[labResults.length - 1] : null;

  // Show empty state if no data
  if (!latestResult) {
    return (
      <section className="space-y-4">
        {variant === "dashboard" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            </div>
            {showViewButton && (
              <Button
                variant="outline"
                onClick={() => router.push("/labs/history")}
                className="flex items-center gap-2"
              >
                View Lab Results
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <Card className="border-0 rounded-2xl">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No lab results available</p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Extract key biomarkers from all panels (for dashboard)
  const keyResults = [];

  // From Basic Metabolic Panel
  const glucoseResults =
    latestResult.panels.basic_metabolic_panel?.results.glucose;
  if (glucoseResults) {
    keyResults.push({
      name: "Glucose",
      value: glucoseResults.value,
      unit: glucoseResults.unit,
      status: glucoseResults.status,
      panel: "BMP",
      reference_range: glucoseResults.reference_range,
    });
  }

  // From Lipid Panel
  const totalCholesterolResults =
    latestResult.panels.lipid_panel?.results.total_cholesterol;
  if (totalCholesterolResults) {
    keyResults.push({
      name: "Total Cholesterol",
      value: totalCholesterolResults.value,
      unit: totalCholesterolResults.unit,
      status: totalCholesterolResults.status,
      panel: "Lipid",
      reference_range: totalCholesterolResults.reference_range,
    });
  }
  const ldlCholesterolResults =
    latestResult.panels.lipid_panel?.results.ldl_cholesterol;
  if (ldlCholesterolResults) {
    keyResults.push({
      name: "LDL Cholesterol",
      value: ldlCholesterolResults.value,
      unit: ldlCholesterolResults.unit,
      status: ldlCholesterolResults.status,
      panel: "Lipid",
      reference_range: ldlCholesterolResults.reference_range,
    });
  }

  // From Complete Blood Count
  const hemoglobinResults =
    latestResult.panels.complete_blood_count?.results.hemoglobin;
  if (hemoglobinResults) {
    keyResults.push({
      name: "Hemoglobin",
      value: hemoglobinResults.value,
      unit: hemoglobinResults.unit,
      status: hemoglobinResults.status,
      panel: "CBC",
      reference_range: hemoglobinResults.reference_range,
    });
  }

  // Calculate overall health indicators for each panel (for labs page)
  const calculatePanelHealth = (
    panelResults: Record<string, BiomarkerResult>,
  ) => {
    const results = Object.values(panelResults);
    const normalCount = results.filter(
      (result) => result.status === "normal",
    ).length;
    const totalCount = results.length;
    const percentage = Math.round((normalCount / totalCount) * 100);

    let status = "normal";
    if (percentage < 50) status = "critical";
    else if (percentage < 80) status = "abnormal";

    return { percentage, status, normalCount, totalCount };
  };

  const panelHealthResults = [];

  // Basic Metabolic Panel health
  if (latestResult.panels.basic_metabolic_panel) {
    const health = calculatePanelHealth(
      latestResult.panels.basic_metabolic_panel.results,
    );
    panelHealthResults.push({
      name: "Basic Metabolic Panel",
      shortName: "BMP",
      health: health,
      description: `${health.normalCount}/${health.totalCount} markers normal`,
    });
  }

  // Lipid Panel health
  if (latestResult.panels.lipid_panel) {
    const health = calculatePanelHealth(
      latestResult.panels.lipid_panel.results,
    );
    panelHealthResults.push({
      name: "Lipid Panel",
      shortName: "Lipid",
      health: health,
      description: `${health.normalCount}/${health.totalCount} markers normal`,
    });
  }

  // Complete Blood Count health
  if (latestResult.panels.complete_blood_count) {
    const health = calculatePanelHealth(
      latestResult.panels.complete_blood_count.results,
    );
    panelHealthResults.push({
      name: "Complete Blood Count",
      shortName: "CBC",
      health: health,
      description: `${health.normalCount}/${health.totalCount} markers normal`,
    });
  }

  // Thyroid Function health (if available)
  if (latestResult.panels.thyroid_function) {
    const health = calculatePanelHealth(
      latestResult.panels.thyroid_function.results,
    );
    panelHealthResults.push({
      name: "Thyroid Function",
      shortName: "Thyroid",
      health: health,
      description: `${health.normalCount}/${health.totalCount} markers normal`,
    });
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <section className="space-y-4">
      {variant === "dashboard" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          </div>
          {showViewButton && (
            <Button
              variant="outline"
              onClick={() => router.push("/labs/history")}
              className="flex items-center gap-2"
            >
              View Lab Results
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <Card className="border-0 rounded-2xl">
        {showSubtitle && variant === "dashboard" && (
          <CardHeader>
            <CardTitle className="text-lg">Latest Results</CardTitle>
            <p className="text-sm text-muted-foreground">
              Completed {formatDate(latestResult.test_date)}
            </p>
          </CardHeader>
        )}
        <CardContent
          className={showSubtitle && variant === "dashboard" ? "pt-0" : "pt-6"}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {variant === "dashboard"
              ? // Dashboard: Show individual biomarkers
                keyResults.map((result, index) => (
                  <div key={index} className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{result.name}</span>
                      <Badge
                        variant={getStatusColor(result.status)}
                        className="text-xs"
                      >
                        {getStatusLabel(result.status)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {result.value}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        {result.unit}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.panel} Panel
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Completed {formatDate(latestResult.test_date)}
                    </div>
                  </div>
                ))
              : // Labs page: Show panel health indicators
                panelHealthResults.slice(0, 4).map((panel, index) => (
                  <div key={index} className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {panel.shortName}
                      </span>
                      <Badge
                        variant={getStatusColor(panel.health.status)}
                        className="text-xs"
                      >
                        {getStatusLabel(panel.health.status)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">
                      {panel.health.percentage}
                      <span className="text-sm font-normal text-muted-foreground">
                        %
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {panel.description}
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default RecentResultsSection;
