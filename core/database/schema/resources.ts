import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core";

/**
 * Resources table for educational content, articles, videos, and other materials
 * Stores various types of resources that users can access
 */
export const resources = pgTable("resources", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Resource content
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url"), // Link to the actual resource (nullable for text-based resources)
  content: text("content"), // Text content for resources without external URLs
  cover_src: text("cover_src"), // Cover image/thumbnail URL

  // Resource categorization
  type: text("type").notNull(), // e.g., "article", "video", "pdf", "link"
  tags: text("tags").array(), // Array of tags for filtering/searching

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application code
export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;
export type UpdateResource = Partial<InsertResource>;
