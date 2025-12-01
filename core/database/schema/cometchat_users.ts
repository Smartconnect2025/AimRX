import { pgTable, bigint, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

export const cometchatUsers = pgTable("cometchat_users", {
  id: bigint("id", { mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  cometchatAuthToken: text("cometchat_auth_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type CometChatUserRow = typeof cometchatUsers.$inferSelect;
export type NewCometChatUserRow = typeof cometchatUsers.$inferInsert;
