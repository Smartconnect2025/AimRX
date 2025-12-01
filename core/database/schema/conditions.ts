import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  date,
  text,
} from "drizzle-orm/pg-core";

import { patients } from "./patients";
import { encounters } from "./encounters";

/**
 * Conditions table for patient medical conditions
 * Stores chronic conditions, diagnoses, and medical problems
 */
export const conditions = pgTable("conditions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  patient_id: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),
  encounter_id: uuid("encounter_id").references(() => encounters.id, {
    onDelete: "set null",
  }),

  // Condition details
  name: varchar("name", { length: 255 }).notNull(),
  onset_date: date("onset_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  severity: varchar("severity", { length: 20 }).notNull().default("mild"),
  notes: text("notes"),

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Condition = typeof conditions.$inferSelect;
export type InsertCondition = typeof conditions.$inferInsert;
export type UpdateCondition = Partial<InsertCondition>;

export type ConditionStatus = "active" | "resolved";
export type ConditionSeverity = "mild" | "moderate" | "severe";
