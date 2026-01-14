import {
  pgTable,
  uuid,
  primaryKey,
  timestamp,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import { pharmacies } from "./pharmacies";

/**
 * Pharmacy Admins
 * Tracks which users have admin access to which pharmacies
 */
export const pharmacy_admins = pgTable(
  "pharmacy_admins",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    pharmacy_id: uuid("pharmacy_id")
      .notNull()
      .references(() => pharmacies.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.pharmacy_id] }),
    };
  }
);

export type PharmacyAdmin = typeof pharmacy_admins.$inferSelect;
export type NewPharmacyAdmin = typeof pharmacy_admins.$inferInsert;
