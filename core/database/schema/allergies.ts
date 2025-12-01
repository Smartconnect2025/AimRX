import { pgTable, uuid, timestamp, varchar } from "drizzle-orm/pg-core";

import { patients } from "./patients";
import { encounters } from "./encounters";

/**
 * Allergies table for patient allergies and sensitivities
 * Stores allergy information including allergen, reaction, and severity
 */
export const allergies = pgTable("allergies", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  patient_id: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  encounter_id: uuid("encounter_id").references(() => encounters.id, {
    onDelete: "set null",
  }),

  // Allergy details
  allergen: varchar("allergen", { length: 255 }).notNull(),
  reaction_type: varchar("reaction_type", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("mild"),

  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Allergy = typeof allergies.$inferSelect;
export type InsertAllergy = typeof allergies.$inferInsert;
export type UpdateAllergy = Partial<InsertAllergy>;

export type AllergySeverity = "mild" | "moderate" | "severe";
