import { pgTable, uuid, timestamp, unique, index } from "drizzle-orm/pg-core";
import { providers } from "./providers";
import { patients } from "./patients";

/**
 * Provider-Patient Mappings table for many-to-many relationships
 * Stores the relationships between providers and their assigned patients
 */
export const providerPatientMappings = pgTable(
  "provider_patient_mappings",
  {
    // Primary key
    id: uuid("id").primaryKey().defaultRandom(),

    // Foreign keys
    provider_id: uuid("provider_id")
      .references(() => providers.id, { onDelete: "cascade" })
      .notNull(),
    patient_id: uuid("patient_id")
      .references(() => patients.id, { onDelete: "cascade" })
      .notNull(),

    // Timestamps
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate mappings
    providerPatientUnique: unique("provider_patient_unique").on(
      table.provider_id,
      table.patient_id,
    ),
    // Indexes for better query performance
    providerIdIdx: index("idx_provider_patient_mappings_provider_id").on(
      table.provider_id,
    ),
    patientIdIdx: index("idx_provider_patient_mappings_patient_id").on(
      table.patient_id,
    ),
  }),
);

// Type exports for use in application code
export type ProviderPatientMapping =
  typeof providerPatientMappings.$inferSelect;
export type InsertProviderPatientMapping =
  typeof providerPatientMappings.$inferInsert;
export type UpdateProviderPatientMapping =
  Partial<InsertProviderPatientMapping>;
