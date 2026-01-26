import { pgTable, uuid, timestamp, text, integer } from "drizzle-orm/pg-core";
import { patients } from "./patients";

/**
 * Patient Documents
 * Stores uploaded files for patient medical records
 */
export const patientDocuments = pgTable("patient_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  patient_id: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),

  // Document metadata
  name: text("name").notNull(),
  file_type: text("file_type").notNull(), // 'image', 'pdf', 'other'
  mime_type: text("mime_type").notNull(), // 'image/png', 'application/pdf', etc.
  file_size: integer("file_size").notNull(), // Size in bytes

  // Storage
  file_url: text("file_url").notNull(), // URL to the file in storage (Supabase Storage or S3)
  storage_path: text("storage_path").notNull(), // Path in storage bucket

  // Timestamps
  uploaded_at: timestamp("uploaded_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type PatientDocument = typeof patientDocuments.$inferSelect;
export type NewPatientDocument = typeof patientDocuments.$inferInsert;
