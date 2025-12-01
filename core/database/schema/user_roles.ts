import { pgEnum, pgTable, uuid, bigint } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// Enum for user roles in the application
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "provider"]);

/**
 * User roles table for role-based access control
 * Links users to their assigned roles in the system
 */
export const userRoles = pgTable("user_roles", {
  id: bigint("id", { mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: uuid("user_id")
    .references(() => authUsers.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  // Role assignment
  role: userRoleEnum("role").notNull(),
});

// Type exports for use in application code
export type UserRole = typeof userRoles.$inferSelect;
