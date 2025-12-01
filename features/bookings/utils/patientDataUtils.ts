// Utility functions for working with patient JSONB data

export interface PatientAddress {
  line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface PatientEmergencyContact {
  name?: string;
  phone?: string;
}

export interface PatientMedical {
  allergies?: string;
  conditions?: string;
  medications?: string;
}

export interface PatientDataStructure {
  address?: PatientAddress;
  emergency_contact?: PatientEmergencyContact;
  medical?: PatientMedical;
  intake_completed_at?: string;
  [key: string]: unknown;
}

/**
 * Extract address information from patient data
 */
export function getPatientAddress(
  data: Record<string, unknown>,
): PatientAddress {
  const address = data.address as PatientAddress;
  return {
    line1: address?.line1 || "",
    city: address?.city || "",
    state: address?.state || "",
    postal_code: address?.postal_code || "",
  };
}

/**
 * Extract emergency contact information from patient data
 */
export function getPatientEmergencyContact(
  data: Record<string, unknown>,
): PatientEmergencyContact {
  const emergency_contact = data.emergency_contact as PatientEmergencyContact;
  return {
    name: emergency_contact?.name || "",
    phone: emergency_contact?.phone || "",
  };
}

/**
 * Extract medical information from patient data
 */
export function getPatientMedical(
  data: Record<string, unknown>,
): PatientMedical {
  const medical = data.medical as PatientMedical;
  return {
    allergies: medical?.allergies || "",
    conditions: medical?.conditions || "",
    medications: medical?.medications || "",
  };
}

/**
 * Get formatted patient address as a string
 */
export function formatPatientAddress(data: Record<string, unknown>): string {
  const address = getPatientAddress(data);
  const parts = [
    address.line1,
    address.city,
    address.state,
    address.postal_code,
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Check if patient has completed intake process
 */
export function hasCompletedIntake(data: Record<string, unknown>): boolean {
  return Boolean(data.intake_completed_at);
}

/**
 * Get intake completion date
 */
export function getIntakeCompletionDate(
  data: Record<string, unknown>,
): Date | null {
  const dateString = data.intake_completed_at as string;
  return dateString ? new Date(dateString) : null;
}
