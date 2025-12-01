import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  integer,
  decimal,
} from "drizzle-orm/pg-core";

import { patients } from "./patients";
import { encounters } from "./encounters";

/**
 * Vitals table for patient vital signs
 * Stores vital measurements taken during encounters
 */
export const vitals = pgTable("vitals", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  patient_id: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  encounter_id: uuid("encounter_id")
    .references(() => encounters.id, { onDelete: "cascade" })
    .notNull(),

  // Vital measurements
  blood_pressure: varchar("blood_pressure", { length: 20 }),
  heart_rate: integer("heart_rate"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: varchar("height", { length: 20 }),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  blood_oxygen: integer("blood_oxygen"),
  bmi: decimal("bmi", { precision: 4, scale: 1 }),
  respiratory_rate: integer("respiratory_rate"),

  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Vitals = typeof vitals.$inferSelect;
export type InsertVitals = typeof vitals.$inferInsert;
export type UpdateVitals = Partial<InsertVitals>;
