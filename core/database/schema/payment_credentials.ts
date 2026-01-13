import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * Payment Credentials table
 * Stores AMRX Authorize.Net merchant credentials (admin-managed)
 */
export const paymentCredentials = pgTable("payment_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Merchant identification
  merchantName: text("merchant_name").notNull().default("AMRX"),

  // Authorize.Net credentials (encrypted)
  apiLoginId: text("api_login_id"),
  transactionKeyEncrypted: text("transaction_key_encrypted"), // AES-256 encrypted
  publicClientKey: text("public_client_key"),
  signatureKeyEncrypted: text("signature_key_encrypted"), // AES-256 encrypted

  // Environment configuration
  environment: text("environment").notNull().default("sandbox"), // 'sandbox' | 'live'

  // Connection status
  isVerified: boolean("is_verified").default(false),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  verificationError: text("verification_error"),

  // Active status
  isActive: boolean("is_active").default(true),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type PaymentCredentials = typeof paymentCredentials.$inferSelect;
export type InsertPaymentCredentials = typeof paymentCredentials.$inferInsert;
export type UpdatePaymentCredentials = Partial<InsertPaymentCredentials>;
