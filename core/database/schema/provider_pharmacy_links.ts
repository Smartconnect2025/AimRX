import {
  pgTable,
  uuid,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { pharmacies } from "./pharmacies";

/**
 * Provider-Pharmacy Links
 * Tracks which pharmacies each provider can prescribe to
 */
export const provider_pharmacy_links = pgTable(
  "provider_pharmacy_links",
  {
    provider_id: uuid("provider_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    pharmacy_id: uuid("pharmacy_id")
      .notNull()
      .references(() => pharmacies.id, { onDelete: "cascade" }),
    custom_markup_percent: integer("custom_markup_percent"),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.provider_id, table.pharmacy_id] }),
    };
  }
);

export type ProviderPharmacyLink = typeof provider_pharmacy_links.$inferSelect;
export type NewProviderPharmacyLink = typeof provider_pharmacy_links.$inferInsert;
