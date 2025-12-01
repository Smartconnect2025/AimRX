import {
  pgTable,
  uuid,
  integer,
  time,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { providers } from "./providers";

/**
 * Provider availability table for recurring weekly schedules
 * Defines when providers are available on each day of the week
 */
export const providerAvailability = pgTable("provider_availability", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign key to providers
  provider_id: uuid("provider_id")
    .references(() => providers.id, { onDelete: "cascade" })
    .notNull(),

  // Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  day_of_week: integer("day_of_week").notNull(),

  // Time slots (stored in provider's timezone)
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),

  // Provider's timezone for interpreting the times
  provider_timezone: text("provider_timezone").notNull(),

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for TypeScript usage
export type ProviderAvailability = typeof providerAvailability.$inferSelect;
export type InsertProviderAvailability =
  typeof providerAvailability.$inferInsert;
