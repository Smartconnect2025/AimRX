import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const accessRequests = pgTable("access_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(), // 'doctor' or 'pharmacy'
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'

  // Common fields
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),

  // Store all form data as JSON
  formData: jsonb("form_data").notNull(),

  // Approval tracking
  reviewedBy: uuid("reviewed_by"), // user_id of admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  rejectionReason: text("rejection_reason"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type NewAccessRequest = typeof accessRequests.$inferInsert;
