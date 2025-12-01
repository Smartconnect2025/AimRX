import { pgTable, uuid, timestamp, text, integer } from "drizzle-orm/pg-core";

/**
 * Tags table for resource categorization
 * Stores tags with usage count tracking for better management
 */
export const tags = pgTable("tags", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Tag details
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(), // URL-friendly version of name

  // Usage tracking
  usage_count: integer("usage_count").notNull().default(0), // Number of resources using this tag

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application code
export type Tag = typeof tags.$inferSelect;
export type CreateTagData = typeof tags.$inferInsert;
