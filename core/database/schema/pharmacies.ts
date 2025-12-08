import {
  pgTable,
  uuid,
  timestamp,
  text,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Pharmacies Table
 * Multi-pharmacy platform support
 */
export const pharmacies = pgTable("pharmacies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo_url: text("logo_url"),
  primary_color: text("primary_color").default("#00AEEF"),
  tagline: text("tagline"),
  address: text("address"),
  npi: text("npi"),
  phone: text("phone"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type Pharmacy = typeof pharmacies.$inferSelect;
export type NewPharmacy = typeof pharmacies.$inferInsert;
