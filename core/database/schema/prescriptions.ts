import {
  pgTable,
  uuid,
  timestamp,
  text,
  integer,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { patients } from "./patients";
import { encounters } from "./encounters";
import { appointments } from "./appointments";

/**
 * Prescriptions table for tracking electronic prescriptions
 * Stores prescription data submitted to DigitalRx pharmacy
 */
export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Who wrote the prescription (prescriber)
  prescriber_id: uuid("prescriber_id")
    .references(() => authUsers.id, { onDelete: "cascade" })
    .notNull(),

  // Which patient the prescription is for
  patient_id: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),

  // Link to encounter (visit context)
  encounter_id: uuid("encounter_id").references(() => encounters.id, {
    onDelete: "set null",
  }),

  // Link to appointment (if created from scheduled appointment)
  appointment_id: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),

  // Prescription details
  medication: text("medication").notNull(),
  dosage: text("dosage").notNull(), // e.g. "10mg" (legacy field, kept for backward compatibility)
  dosage_amount: text("dosage_amount"), // e.g. "10" (new structured field)
  dosage_unit: text("dosage_unit"), // e.g. "mg" (new structured field)
  quantity: integer("quantity").notNull(),
  refills: integer("refills").default(0).notNull(),
  sig: text("sig").notNull(), // Instructions: "Take 1 tablet daily..."

  // Optional attachments (Base64 encoded)
  pdf_base64: text("pdf_base64"),
  signature_base64: text("signature_base64"),

  // DigitalRx integration
  queue_id: text("queue_id").unique(), // ID from DigitalRx API
  status: text("status").default("submitted").notNull(), // submitted → billing → approved → packed → shipped → delivered
  tracking_number: text("tracking_number"),

  // Timestamps
  submitted_at: timestamp("submitted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application code
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;
export type UpdatePrescription = Partial<InsertPrescription>;
