import {
  pgTable,
  uuid,
  timestamp,
  text,
  boolean,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * Notifications table for user notifications and alerts
 * Stores system notifications, alerts, and user-specific messages
 */
export const notifications = pgTable("notifications", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Link to auth user
  user_id: uuid("user_id")
    .references(() => authUsers.id, { onDelete: "cascade" })
    .notNull(),

  // Notification content
  type: text("type").notNull(), // e.g., "order", "appointment", "system", "alert"
  title: text("title").notNull(),
  body: text("body").notNull(),

  // Notification state
  read: boolean("read").notNull().default(false),
  critical: boolean("critical").notNull().default(false),

  // Related entity information
  related_entity_type: text("related_entity_type"), // e.g., "order", "appointment", "goal"
  related_entity_id: uuid("related_entity_id"), // ID of the related entity

  // Additional metadata
  metadata: jsonb("metadata"), // Flexible JSON data for notification-specific info

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Notification actions table for actionable notifications
 * Stores actions that users can take on notifications (e.g., "View Order", "Reschedule")
 */
export const notificationActions = pgTable("notification_actions", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Link to notification
  notification_id: uuid("notification_id")
    .references(() => notifications.id, { onDelete: "cascade" })
    .notNull(),

  // Action details
  action_type: text("action_type").notNull(), // e.g., "navigate", "api_call", "modal"
  label: text("label").notNull(), // Button/link text shown to user
  action_data: jsonb("action_data"), // Action-specific data (URLs, API endpoints, etc.)

  // Display configuration
  display_order: integer("display_order").notNull().default(0), // Order for multiple actions

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application code
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type UpdateNotification = Partial<InsertNotification>;

export type NotificationAction = typeof notificationActions.$inferSelect;
export type InsertNotificationAction = typeof notificationActions.$inferInsert;
export type UpdateNotificationAction = Partial<InsertNotificationAction>;
