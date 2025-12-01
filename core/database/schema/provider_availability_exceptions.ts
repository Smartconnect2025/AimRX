import {
  pgTable,
  uuid,
  date,
  boolean,
  time,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { providers } from "./providers";

/**
 * Provider availability exceptions table for specific date overrides
 * Allows providers to block time or add extra availability on specific dates
 */
export const providerAvailabilityExceptions = pgTable(
  "provider_availability_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Foreign key to providers
    provider_id: uuid("provider_id")
      .references(() => providers.id, { onDelete: "cascade" })
      .notNull(),

    // The specific date for this exception
    exception_date: date("exception_date").notNull(),

    // Whether this is adding availability (true) or removing it (false)
    is_available: boolean("is_available").notNull(),

    // Time slots for the exception (nullable for full-day blocking)
    start_time: time("start_time"),
    end_time: time("end_time"),

    // Provider's timezone for interpreting the times
    provider_timezone: text("provider_timezone").notNull(),

    // Timestamps
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

// Type exports for TypeScript usage
export type ProviderAvailabilityException =
  typeof providerAvailabilityExceptions.$inferSelect;
export type InsertProviderAvailabilityException =
  typeof providerAvailabilityExceptions.$inferInsert;
