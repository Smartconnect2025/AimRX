import { pgTable, uuid, timestamp, text, boolean } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * User addresses table for storing shipping and billing addresses
 * Stores multiple addresses per user with primary address designation
 */
export const userAddresses = pgTable("user_addresses", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Link to auth user
  user_id: uuid("user_id")
    .references(() => authUsers.id, { onDelete: "cascade" })
    .notNull(),

  // Address recipient information
  given_name: text("given_name").notNull(), // First name
  family_name: text("family_name").notNull(), // Last name
  phone: text("phone"), // Contact phone number

  // Address details
  address_line_1: text("address_line_1").notNull(), // Street address
  address_line_2: text("address_line_2"), // Apartment, suite, etc.
  city: text("city").notNull(),
  state: text("state").notNull(),
  postal_code: text("postal_code").notNull(),

  // Address preferences
  is_primary: boolean("is_primary").notNull().default(false), // Primary address flag

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application code
export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = typeof userAddresses.$inferInsert;
export type UpdateUserAddress = Partial<InsertUserAddress>;
