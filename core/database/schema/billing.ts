import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { encounters } from "./encounters";

/**
 * Billing groups table for encounter billing
 * Groups procedures, diagnoses, and modifiers for billing purposes
 */
export const billingGroups = pgTable("billing_groups", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  encounter_id: uuid("encounter_id")
    .references(() => encounters.id, { onDelete: "cascade" })
    .notNull(),

  // Billing details
  procedure_code: varchar("procedure_code", { length: 10 }).notNull(),
  procedure_description: text("procedure_description").notNull(),
  modifiers: varchar("modifiers", { length: 50 }),

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Billing diagnoses table
 * Links diagnoses to billing groups for proper coding
 */
export const billingDiagnoses = pgTable("billing_diagnoses", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  billing_group_id: uuid("billing_group_id")
    .references(() => billingGroups.id, { onDelete: "cascade" })
    .notNull(),

  // Diagnosis details
  icd_code: varchar("icd_code", { length: 20 }).notNull(),
  description: text("description").notNull(),
  is_primary: boolean("is_primary").notNull().default(false),

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Billing procedures table
 * Links procedures to billing groups for additional billing items
 */
export const billingProcedures = pgTable("billing_procedures", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  billing_group_id: uuid("billing_group_id")
    .references(() => billingGroups.id, { onDelete: "cascade" })
    .notNull(),

  // Procedure details
  cpt_code: varchar("cpt_code", { length: 10 }).notNull(),
  description: text("description").notNull(),

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application code
export type BillingGroup = typeof billingGroups.$inferSelect;
export type InsertBillingGroup = typeof billingGroups.$inferInsert;
export type UpdateBillingGroup = Partial<InsertBillingGroup>;

export type BillingDiagnosis = typeof billingDiagnoses.$inferSelect;
export type InsertBillingDiagnosis = typeof billingDiagnoses.$inferInsert;
export type UpdateBillingDiagnosis = Partial<InsertBillingDiagnosis>;

export type BillingProcedure = typeof billingProcedures.$inferSelect;
export type InsertBillingProcedure = typeof billingProcedures.$inferInsert;
export type UpdateBillingProcedure = Partial<InsertBillingProcedure>;
