import { sql } from "drizzle-orm";
import {
  pgTable,
  pgPolicy,
  uuid,
  timestamp,
  text,
  integer,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { authUsers, authenticatedRole } from "drizzle-orm/supabase";
import { patients } from "./patients";
import { encounters } from "./encounters";
import { appointments } from "./appointments";
import { pharmacies } from "./pharmacies";
import { pharmacy_backends } from "./pharmacy_backends";
import { pharmacy_medications } from "./pharmacy_medications";
// Note: payment_transaction_id FK is defined at DB level, but we avoid circular import here

/**
 * Prescriptions table for tracking electronic prescriptions
 * Stores prescription data submitted to DigitalRx pharmacy
 */
export const prescriptions = pgTable(
  "prescriptions",
  {
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
    vial_size: text("vial_size"), // e.g. "5mL"
    form: text("form"), // e.g. "Injectable", "Tablet", "Capsule"
    quantity: integer("quantity").notNull(),
    refills: integer("refills").default(0).notNull(),
    sig: text("sig").notNull(), // Instructions: "Take 1 tablet daily..."
    dispense_as_written: boolean("dispense_as_written").default(false), // DAW flag
    pharmacy_notes: text("pharmacy_notes"), // Special instructions for pharmacy

    // Pricing fields
    patient_price: numeric("patient_price", { precision: 10, scale: 2 }), // Price shown to patient
    doctor_price: numeric("doctor_price", { precision: 10, scale: 2 }), // Wholesale/cost price (not shown to patient)

    // Multi-pharmacy upgrade fields
    medication_id: uuid("medication_id").references(
      () => pharmacy_medications.id,
      {
        onDelete: "set null",
      },
    ), // Link to pharmacy medication catalog
    pharmacy_id: uuid("pharmacy_id").references(() => pharmacies.id, {
      onDelete: "set null",
    }), // Which pharmacy fulfilled this
    backend_id: uuid("backend_id").references(() => pharmacy_backends.id, {
      onDelete: "set null",
    }), // Which backend system was used
    profit_cents: integer("profit_cents").default(0), // Doctor markup profit in cents
    total_paid_cents: integer("total_paid_cents").default(0), // Total amount paid by patient in cents
    stripe_payment_intent_id: text("stripe_payment_intent_id"), // Stripe payment reference

    // Payment status fields (synced with payment_transactions)
    payment_status: text("payment_status").default("unpaid"), // 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
    order_progress: text("order_progress").default("payment_pending"), // 'payment_pending' | 'payment_received' | 'provider_approved' | 'pharmacy_processing' | 'shipped'
    payment_transaction_id: uuid("payment_transaction_id"), // FK defined at DB level (to payment_transactions)

    // PDF document storage (new - uses patient_documents table)
    pdf_storage_path: text("pdf_storage_path"), // Path in patient-files bucket
    pdf_document_id: uuid("pdf_document_id"), // FK to patient_documents (defined at DB level to avoid circular import)

    // DigitalRx integration
    queue_id: text("queue_id").unique(), // ID from DigitalRx API
    rx_number: text("rx_number").unique(), // Rx number from DigitalRx API
    status: text("status").default("submitted").notNull(), // submitted → billing → approved → packed → shipped → delivered
    tracking_number: text("tracking_number"),

    // Timestamps
    submitted_at: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    submitted_to_pharmacy_at: timestamp("submitted_to_pharmacy_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    // SELECT: Patient, prescriber, pharmacy admin, or admin
    pgPolicy("prescriptions_select_policy", {
      for: "select",
      to: authenticatedRole,
      using: sql`
      public.is_admin(auth.uid())
      OR ${table.prescriber_id} = auth.uid()
      OR public.is_own_patient_record(${table.patient_id})
      OR public.provider_has_patient_access(${table.patient_id})
      OR public.is_pharmacy_admin(${table.pharmacy_id})
    `,
    }),
    // INSERT: Prescriber (provider) with patient access, or admin
    pgPolicy("prescriptions_insert_policy", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`
      public.is_admin(auth.uid())
      OR (${table.prescriber_id} = auth.uid()
          AND public.provider_has_patient_access(${table.patient_id}))
    `,
    }),
    // UPDATE: Prescriber with patient access, pharmacy admin, or admin
    pgPolicy("prescriptions_update_policy", {
      for: "update",
      to: authenticatedRole,
      using: sql`
      public.is_admin(auth.uid())
      OR (${table.prescriber_id} = auth.uid()
          AND public.provider_has_patient_access(${table.patient_id}))
      OR public.is_pharmacy_admin(${table.pharmacy_id})
    `,
      withCheck: sql`
      public.is_admin(auth.uid())
      OR (${table.prescriber_id} = auth.uid()
          AND public.provider_has_patient_access(${table.patient_id}))
      OR public.is_pharmacy_admin(${table.pharmacy_id})
    `,
    }),
    // DELETE: Admin only
    pgPolicy("prescriptions_delete_policy", {
      for: "delete",
      to: authenticatedRole,
      using: sql`public.is_admin(auth.uid())`,
    }),
  ],
);

// Type exports for use in application code
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;
export type UpdatePrescription = Partial<InsertPrescription>;
