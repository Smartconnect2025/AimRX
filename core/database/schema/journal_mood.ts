import {
  pgTable,
  uuid,
  timestamp,
  date,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * Journal entries table for user journaling and wellness tracking
 * Stores daily journal entries with wellness indicators
 */
export const journalEntries = pgTable("journal_entries", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Link to auth user
  user_id: uuid("user_id")
    .references(() => authUsers.id, { onDelete: "cascade" })
    .notNull(),

  // Entry details
  date: date("date").notNull(), // Date of the journal entry
  content: text("content").notNull(), // Main journal content

  // Wellness indicators
  did_exercise: boolean("did_exercise").notNull().default(false), // Exercise tracking
  caffeine_servings: integer("caffeine_servings").notNull().default(0), // Caffeine intake

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Mood entries table for mood tracking and emotional wellness
 * Stores mood check-ins with tags for categorization
 */
export const moodEntries = pgTable("mood_entries", {
  // Primary key
  id: uuid("id").primaryKey().defaultRandom(),

  // Link to auth user
  user_id: uuid("user_id")
    .references(() => authUsers.id, { onDelete: "cascade" })
    .notNull(),

  // Mood details
  mood: text("mood").notNull(), // Mood description/level (e.g., "happy", "anxious", "calm")
  tags: text("tags").array(), // Array of tags for mood context/triggers

  // Timestamps
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Type exports for use in application code
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;
export type UpdateJournalEntry = Partial<InsertJournalEntry>;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = typeof moodEntries.$inferInsert;
export type UpdateMoodEntry = Partial<InsertMoodEntry>;
