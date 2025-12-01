import {
  pgTable,
  uuid,
  timestamp,
  date,
  text,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * Goals table for patient goal tracking
 * Stores user-defined health and wellness goals
 */
export const goals = pgTable("goals", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Link to auth user
  user_id: uuid("user_id")
    .references(() => authUsers.id, { onDelete: "cascade" })
    .notNull(),

  // Goal details
  metric: text("metric").notNull(), // What is being measured
  description: text("description"), // Goal description
  target_value: text("target_value").notNull(), // Target to achieve
  current_value: text("current_value").notNull().default("0"), // Current progress
  unit: text("unit").notNull(), // Unit of measurement

  // Goal categorization
  type: text("type").notNull(), // Type of goal (e.g., "common", "custom", "provider")
  category: text("category").notNull(), // Category (e.g., "exercise", "nutrition", "medication")
  custom_goal: text("custom_goal"), // Custom goal text if type is custom

  // Progress tracking
  progress: numeric("progress").notNull().default("0"), // Progress percentage
  status: text("status").notNull().default("not-started"), // Current status
  tracking_source: text("tracking_source").notNull().default("manual"), // How progress is tracked

  // Timeline
  timeframe: text("timeframe").notNull(), // Goal timeframe
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  last_updated: timestamp("last_updated", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Milestones table for goal milestones and checkpoints
 * Tracks specific milestones within a goal
 */
export const milestones = pgTable("milestones", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  goal_id: uuid("goal_id")
    .references(() => goals.id, { onDelete: "cascade" })
    .notNull(),

  // Milestone details
  title: text("title").notNull(), // Milestone title/description
  target: numeric("target").notNull(), // Target value for this milestone

  // Achievement tracking
  achieved: boolean("achieved").notNull().default(false),
  achieved_at: timestamp("achieved_at", { withTimezone: true }),
});

/**
 * Goal progress table for tracking progress entries
 * Stores individual progress updates for goals
 */
export const goalProgress = pgTable("goal_progress", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  goal_id: uuid("goal_id")
    .references(() => goals.id, { onDelete: "cascade" })
    .notNull(),

  // Progress details
  current: numeric("current").notNull(), // Current value at this point in time
  date: date("date").notNull(), // Date of this progress entry
  notes: text("notes"), // Optional notes about this progress entry
});

// Type exports for use in application code
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;
export type UpdateGoal = Partial<InsertGoal>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;
export type UpdateMilestone = Partial<InsertMilestone>;

export type GoalProgress = typeof goalProgress.$inferSelect;
export type InsertGoalProgress = typeof goalProgress.$inferInsert;
export type UpdateGoalProgress = Partial<InsertGoalProgress>;
