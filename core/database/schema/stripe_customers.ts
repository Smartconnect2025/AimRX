import {
  pgTable,
  bigint,
  uuid,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

/**
 * Stripe customers table for Stripe payment integration
 * Links users to their Stripe customer records and stores payment-related data
 */
export const stripeCustomers = pgTable("stripe_customers", {
  id: bigint("id", { mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),

  // Link to auth user
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),

  // Stripe customer ID
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),

  // Additional Stripe metadata (optional)
  stripeMetadata: jsonb("stripe_metadata"), // Store any additional Stripe customer data

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type NewStripeCustomer = typeof stripeCustomers.$inferInsert;
export type UpdateStripeCustomer = Partial<NewStripeCustomer>;
