import { pgTable, uuid, timestamp, varchar, date } from "drizzle-orm/pg-core";

import { patients } from "./patients";
import { encounters } from "./encounters";

/**
 * Medications table for patient medications
 * Stores prescription and medication history for patients
 */
export const medications = pgTable("medications", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  patient_id: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  encounter_id: uuid("encounter_id").references(() => encounters.id, {
    onDelete: "set null",
  }),

  // Medication details
  name: varchar("name", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }).notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(),
  start_date: date("start_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),

  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;
export type UpdateMedication = Partial<InsertMedication>;

export type MedicationStatus = "active" | "discontinued";
