import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * System logs table for super admin monitoring
 * Tracks all important system actions (prescription submissions, API tests, etc.)
 */
export const systemLogs = pgTable("system_logs", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Who performed the action
  user_id: uuid("user_id").references(() => authUsers.id, {
    onDelete: "set null",
  }),
  user_email: text("user_email"), // Stored for record keeping even if user deleted
  user_name: text("user_name"), // Display name (e.g., "Dr. Sarah Chen")

  // Action details
  action: text("action").notNull(), // PRESCRIPTION_SUBMITTED, API_TEST, CACHE_CLEAR, etc.
  details: text("details").notNull(), // Human-readable description
  queue_id: text("queue_id"), // Related prescription queue ID (if applicable)

  // Status/result
  status: text("status").default("success").notNull(), // success, error, pending
  error_message: text("error_message"), // If status is error

  // Metadata
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),

  // Timestamp
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = typeof systemLogs.$inferInsert;
