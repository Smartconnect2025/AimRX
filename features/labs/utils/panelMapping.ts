import { BiomarkerResult, LabResult, PanelResults } from "../types/lab";
import { JunctionLabResultWithOrderInfo } from "../services/junctionLabData";

// Panel mapping configuration for converting Junction API biomarkers to lab panels
export const PANEL_MAPPING: Record<
  string,
  { panelKey: string; panelName: string; biomarkerKey: string }
> = {
  glucose: {
    panelKey: "basic_metabolic_panel",
    panelName: "Basic Metabolic Panel (BMP)",
    biomarkerKey: "glucose",
  },
  creatinine: {
    panelKey: "basic_metabolic_panel",
    panelName: "Basic Metabolic Panel (BMP)",
    biomarkerKey: "creatinine",
  },
  alt: {
    panelKey: "basic_metabolic_panel",
    panelName: "Basic Metabolic Panel (BMP)",
    biomarkerKey: "alt",
  },
  sodium: {
    panelKey: "basic_metabolic_panel",
    panelName: "Basic Metabolic Panel (BMP)",
    biomarkerKey: "sodium",
  },
  potassium: {
    panelKey: "basic_metabolic_panel",
    panelName: "Basic Metabolic Panel (BMP)",
    biomarkerKey: "potassium",
  },
  "total cholesterol": {
    panelKey: "lipid_panel",
    panelName: "Lipid Panel",
    biomarkerKey: "total_cholesterol",
  },
  "ldl cholesterol": {
    panelKey: "lipid_panel",
    panelName: "Lipid Panel",
    biomarkerKey: "ldl_cholesterol",
  },
  "hdl cholesterol": {
    panelKey: "lipid_panel",
    panelName: "Lipid Panel",
    biomarkerKey: "hdl_cholesterol",
  },
  triglycerides: {
    panelKey: "lipid_panel",
    panelName: "Lipid Panel",
    biomarkerKey: "triglycerides",
  },
  wbc: {
    panelKey: "complete_blood_count",
    panelName: "Complete Blood Count (CBC)",
    biomarkerKey: "wbc",
  },
  rbc: {
    panelKey: "complete_blood_count",
    panelName: "Complete Blood Count (CBC)",
    biomarkerKey: "rbc",
  },
  hemoglobin: {
    panelKey: "complete_blood_count",
    panelName: "Complete Blood Count (CBC)",
    biomarkerKey: "hemoglobin",
  },
  hematocrit: {
    panelKey: "complete_blood_count",
    panelName: "Complete Blood Count (CBC)",
    biomarkerKey: "hematocrit",
  },
  platelets: {
    panelKey: "complete_blood_count",
    panelName: "Complete Blood Count (CBC)",
    biomarkerKey: "platelets",
  },
  tsh: {
    panelKey: "thyroid_function",
    panelName: "Thyroid Function Panel",
    biomarkerKey: "tsh",
  },
  "free t4": {
    panelKey: "thyroid_function",
    panelName: "Thyroid Function Panel",
    biomarkerKey: "free_t4",
  },
  "free t3": {
    panelKey: "thyroid_function",
    panelName: "Thyroid Function Panel",
    biomarkerKey: "free_t3",
  },
  "t3 total": {
    panelKey: "thyroid_function",
    panelName: "Thyroid Function Panel",
    biomarkerKey: "t3_total",
  },
  "t4 total": {
    panelKey: "thyroid_function",
    panelName: "Thyroid Function Panel",
    biomarkerKey: "t4_total",
  },
  hba1c: {
    panelKey: "hba1c",
    panelName: "Hemoglobin A1c",
    biomarkerKey: "hba1c",
  },
};

// Convert Junction format to LabResult format for chart and component compatibility
export const convertJunctionToLabResult = (
  junctionResult: JunctionLabResultWithOrderInfo,
): LabResult => {
  const panels: Record<string, PanelResults> = {};

  // Since JunctionLabResultWithOrderInfo is a single result, we need to process it differently
  // We'll create a wrapper to match the expected structure
  const resultsArray = [junctionResult];

  resultsArray.forEach((result: JunctionLabResultWithOrderInfo) => {
    const normalizedName = result.name.toLowerCase();
    const mapping = PANEL_MAPPING[normalizedName];

    if (mapping) {
      const { panelKey, panelName, biomarkerKey } = mapping;

      // Initialize panel if it doesn't exist
      if (!panels[panelKey]) {
        panels[panelKey] = {
          panel_name: panelName,
          panel_code: panelKey.toUpperCase(),
          results: {},
        };
      }

      // Convert Junction status to BiomarkerResult status
      const mapJunctionStatusToBiomarkerStatus = (
        interpretation: string,
      ): BiomarkerResult["status"] => {
        switch (interpretation.toLowerCase()) {
          case "critical":
            return "critical";
          case "abnormal":
            return "abnormal";
          case "normal":
          default:
            return "normal";
        }
      };

      // Add biomarker result to the panel
      panels[panelKey].results[biomarkerKey] = {
        value: parseFloat(result.value || result.result || "0"),
        unit: result.unit || "",
        reference_range:
          result.min_range_value && result.max_range_value
            ? `${result.min_range_value}-${result.max_range_value}`
            : "Not specified",
        status: mapJunctionStatusToBiomarkerStatus(
          result.interpretation || "normal",
        ),
        critical: result.interpretation === "critical",
        result_type: "numeric",
        raw_result: result.result || result.value || "0",
        notes: "",
      };
    }
  });

  return {
    result_id: `${junctionResult.order_id}_result`,
    test_date:
      junctionResult.metadata?.date_reported ||
      junctionResult.metadata?.date_collected ||
      new Date().toISOString(),
    lab_location: junctionResult.metadata?.laboratory || "Unknown Lab",
    order_id: junctionResult.order_id,
    status:
      junctionResult.metadata?.status === "final"
        ? "completed"
        : junctionResult.metadata?.status === "pending"
          ? "pending"
          : "in_progress",
    panels,
  };
};
