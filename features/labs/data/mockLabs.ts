import { LabAppointment, LabPanel } from "../types/lab";

export const availablePanels: LabPanel[] = [
  {
    id: "basic-metabolic-panel",
    name: "Basic Metabolic Panel (BMP)",
    description:
      "Evaluates kidney function, liver function, blood sugar, and electrolyte balance",
    biomarkers: ["Glucose", "Creatinine", "ALT", "Sodium", "Potassium"],
    price: 89,
    estimatedTime: "15 minutes",
    fastingRequired: true,
    urgency: "high",
    purchaseDate: "2025-01-05",
    expirationDate: "2025-01-25",
    timeSensitive: true,
  },
  {
    id: "lipid-panel",
    name: "Lipid Panel",
    description:
      "Measures cholesterol and triglycerides to assess cardiovascular risk",
    biomarkers: ["Total Cholesterol", "LDL", "HDL", "Triglycerides"],
    price: 65,
    estimatedTime: "10 minutes",
    fastingRequired: true,
    urgency: "normal",
    purchaseDate: "2025-01-03",
    expirationDate: "2025-02-15",
    timeSensitive: false,
  },
  {
    id: "complete-blood-count",
    name: "Complete Blood Count (CBC)",
    description: "Evaluates overall health and detects blood disorders",
    biomarkers: ["WBC", "RBC", "Hemoglobin", "Hematocrit", "Platelets"],
    price: 45,
    estimatedTime: "10 minutes",
    fastingRequired: false,
    urgency: "high",
    purchaseDate: "2025-01-07",
    expirationDate: "2025-01-21",
    timeSensitive: true,
  },
];

export const mockAppointments: LabAppointment[] = [
  {
    id: "apt-1",
    panelId: "basic-metabolic-panel",
    panelName: "Basic Metabolic Panel (BMP)",
    scheduledDate: new Date("2025-01-20T09:00:00"),
    status: "scheduled",
    location: "Downtown Lab Center",
    address: "123 Main Street, Downtown, CA 90210",
  },
  {
    id: "apt-2",
    panelId: "lipid-panel",
    panelName: "Lipid Panel",
    scheduledDate: new Date("2025-01-25T10:30:00"),
    status: "scheduled",
    location: "Westside Medical Plaza",
    address: "456 West Avenue, Westside, CA 90211",
  },
];
