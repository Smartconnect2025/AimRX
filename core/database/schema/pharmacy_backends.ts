import {
  pgTable,
  uuid,
  timestamp,
  text,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { pharmacies } from "./pharmacies";

/**
 * Pharmacy Backend Systems
 * Tracks which backend system each pharmacy uses for prescription fulfillment
 */
export const systemTypeEnum = pgEnum("pharmacy_system_type", [
  "DigitalRx",
  "PioneerRx",
  "QS1",
  "Liberty",
  "Custom",
  "BestRx",
]);

export const pharmacy_backends = pgTable("pharmacy_backends", {
  id: uuid("id").primaryKey().defaultRandom(),
  pharmacy_id: uuid("pharmacy_id")
    .notNull()
    .references(() => pharmacies.id, { onDelete: "cascade" }),
  system_type: systemTypeEnum("system_type").notNull(),
  api_url: text("api_url"),
  api_key_encrypted: text("api_key_encrypted"),
  store_id: text("store_id"),
  location_id: text("location_id"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export type PharmacyBackend = typeof pharmacy_backends.$inferSelect;
export type NewPharmacyBackend = typeof pharmacy_backends.$inferInsert;
