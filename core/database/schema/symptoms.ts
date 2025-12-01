import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  text,
  boolean,
  bigint,
  serial,
  integer,
} from "drizzle-orm/pg-core";

import { patients } from "./patients";

/**
 * Symptoms table for available symptoms
 * Master list of symptoms that can be tracked
 */
export const symptoms = pgTable("symptoms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji"),
  is_common: boolean("is_common").default(false),
});

/**
 * Symptom logs table for patient symptom tracking
 * Records individual symptom instances for patients
 */
export const symptomLogs = pgTable("symptom_logs", {
  id: serial("id").primaryKey(),
  severity: bigint("severity", { mode: "number" }),
  description: varchar("description"),
  patient_id: uuid("patient_id").references(() => patients.id, {
    onDelete: "cascade",
  }),
  symptom_id: text("symptom_id").references(() => symptoms.id, {
    onDelete: "restrict",
  }),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Reminders table for symptom tracking reminders
 * Stores reminder preferences for patients
 */
export const reminders = pgTable("reminders", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  patient_id: uuid("patient_id")
    .references(() => patients.id)
    .notNull(),
  enabled: boolean("enabled").default(true),
  frequency: text("frequency").notNull(),
  time_of_day: text("time_of_day").array().notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Type exports for use in application code
export type Symptom = typeof symptoms.$inferSelect;
export type InsertSymptom = typeof symptoms.$inferInsert;

export type SymptomLog = typeof symptomLogs.$inferSelect;
export type InsertSymptomLog = typeof symptomLogs.$inferInsert;
export type UpdateSymptomLog = Partial<InsertSymptomLog>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;
export type UpdateReminder = Partial<InsertReminder>;
