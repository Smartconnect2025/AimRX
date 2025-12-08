import {
  pgTable,
  uuid,
  timestamp,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { pharmacies } from "./pharmacies";

/**
 * Pharmacy Medications Catalog
 * Medications available at each pharmacy with pricing
 */
export const pharmacy_medications = pgTable("pharmacy_medications", {
  id: uuid("id").primaryKey().defaultRandom(),
  pharmacy_id: uuid("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id),
  name: text("name").notNull(),
  strength: text("strength"),
  form: text("form"),
  ndc: text("ndc"),
  retail_price_cents: integer("retail_price_cents").notNull(),
  doctor_markup_percent: integer("doctor_markup_percent").default(25),
  category: text("category"), // Weight Loss (GLP-1), Peptides, Sexual Health, etc.
  dosage_instructions: text("dosage_instructions"), // How to take the medication
  image_url: text("image_url"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type PharmacyMedication = typeof pharmacy_medications.$inferSelect;
export type NewPharmacyMedication = typeof pharmacy_medications.$inferInsert;
