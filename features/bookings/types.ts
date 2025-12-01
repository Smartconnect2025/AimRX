/**
 * Core Appointment Types
 * Centralized type definitions for appointments across the application
 */

// Import schema types
import type {
  Appointment as SchemaAppointment,
  InsertAppointment,
  UpdateAppointment,
  AppointmentType,
  Patient as SchemaPatient,
} from "@/core/database/schema";

// Re-export schema types for backward compatibility
export type { AppointmentType, InsertAppointment, UpdateAppointment };

/**
 * Core Appointment interface - extends schema with proper date handling for frontend
 */
export interface Appointment
  extends Omit<SchemaAppointment, "datetime" | "created_at" | "updated_at"> {
  datetime: string; // ISO datetime string for frontend consumption
  created_at?: string; // ISO datetime string
  updated_at?: string; // ISO datetime string
}

/**
 * Appointment with populated provider information
 * Used when displaying appointments with provider details
 */
export interface AppointmentWithProvider extends Appointment {
  provider: {
    id: string;
    first_name: string;
    last_name: string;
    specialty: string | null;
    avatar_url: string | null;
  };
}

/**
 * Appointment with populated patient information
 * Used when displaying appointments with patient details (for providers)
 */
export interface AppointmentWithPatient extends Appointment {
  patient: Pick<SchemaPatient, "id" | "first_name" | "last_name"> & {
    name?: string; // Computed full name for backward compatibility
    avatar_url?: string;
  };
}

/**
 * Appointment creation payload
 * Used when creating new appointments
 */
export interface CreateAppointmentData
  extends Omit<
    InsertAppointment,
    "id" | "created_at" | "updated_at" | "datetime"
  > {
  datetime: string; // ISO datetime string for frontend
}

/**
 * Appointment update payload
 * Used when updating existing appointments
 */
export interface UpdateAppointmentData
  extends Omit<UpdateAppointment, "datetime" | "created_at" | "updated_at"> {
  datetime?: string; // ISO datetime string for frontend
}
