// Vital Lab Tests API Types
// Based on: https://api.sandbox.tryvital.io/v3/lab_test

export interface VitalLabMarker {
  name: string;
  slug: string;
  description: string;
}

export interface VitalLab {
  slug: string;
  name: string;
  first_line_address: string;
  city: string;
  zipcode: string;
}

export interface VitalLabTest {
  name: string;
  description: string;
  sample_type: string;
  method: string;
  price: number;
  is_active: boolean;
  lab: VitalLab;
  markers: VitalLabMarker[];
}

export interface VitalLabTestData {
  lab_test: VitalLabTest;
}

export interface VitalLabTestsResponse {
  data: VitalLabTestData[];
  next_cursor: string | null;
}

// Converted type for compatibility with existing LabCard component
export interface AvailablePanel {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string; // Will use placeholder since not available in Vital API
  sampleType: string;
  labName: string;
  labAddress: string;
  markers: string[]; // Array of marker names
  isActive: boolean;
}
