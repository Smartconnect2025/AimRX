import { pgTable, uuid, timestamp, integer, text } from "drizzle-orm/pg-core";
import { providers } from "./providers";
import { patients } from "./patients";

/**
 * Appointments table for healthcare appointment scheduling
 * Links providers and patients with appointment details
 */
export const appointments = pgTable("appointments", {
  // Primary key - also serves as meeting code
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  provider_id: uuid("provider_id")
    .references(() => providers.id, { onDelete: "cascade" })
    .notNull(),
  patient_id: uuid("patient_id")
    .references(() => patients.id, { onDelete: "cascade" })
    .notNull(),

  // Appointment details
  datetime: timestamp("datetime", { withTimezone: true }).notNull(), // Appointment date and time
  duration: integer("duration").notNull(), // Duration in minutes
  type: text("type").notNull(), // Appointment type (video, phone, chat, etc.)
  reason: text("reason").notNull(), // Purpose/reason for the appointment

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application code
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
export type UpdateAppointment = Partial<InsertAppointment>;

// Common appointment types (not enforced at DB level, but used in application)
export type AppointmentType =
  | "video"
  | "phone"
  | "chat"
  | "consultation"
  | "followup"
  | "therapy"
  | "assessment"
  | "emergency";
