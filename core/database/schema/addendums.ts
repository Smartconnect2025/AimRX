import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core";

import { encounters } from "./encounters";

/**
 * Addendums table for encounter notes addendums
 * Stores additional notes added to finalized encounters
 */
export const addendums = pgTable("addendums", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Foreign keys
  encounter_id: uuid("encounter_id")
    .references(() => encounters.id, { onDelete: "cascade" })
    .notNull(),

  // Addendum details
  content: text("content").notNull(),

  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Addendum = typeof addendums.$inferSelect;
export type InsertAddendum = typeof addendums.$inferInsert;
export type UpdateAddendum = Partial<InsertAddendum>;
