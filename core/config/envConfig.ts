/**
 * Environment variables configuration with support for required and optional variables
 */

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
];
/**
 * Environment variables with type safety
 */
export const envConfig = {
  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  NPI_REGISTRY_API_URL: "https://npiregistry.cms.hhs.gov/api/?version=2.1",

  // App Configuration (Optional)
  NEXT_PUBLIC_PROJECT_NAME:
    process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Components",
  NEXT_PUBLIC_SUPPORT_EMAIL:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@specode.ai",
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  // DoseSpot Integration (Optional)
  DOSESPOT_CLINIC_ID: process.env.DOSESPOT_CLINIC_ID ?? "",
  DOSESPOT_CLINIC_KEY: process.env.DOSESPOT_CLINIC_KEY ?? "",
  DOSESPOT_SUBSCRIPTION_KEY: process.env.DOSESPOT_SUBSCRIPTION_KEY ?? "",
  DOSESPOT_BASE_URL: process.env.DOSESPOT_BASE_URL ?? "",
  DOSESPOT_PHARMACY_ID: process.env.DOSESPOT_PHARMACY_ID ?? "",
  DOSESPOT_WEBHOOK_SECRET: process.env.DOSESPOT_WEBHOOK_SECRET ?? "",

  // SendGrid (Optional)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ?? "",
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL ?? "noreply@example.com",
  SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME ?? "EPharma Platform",

  // Payment Processing (Optional)
  MERCHANT_X_SECURITY_KEY: process.env.MERCHANT_X_SECURITY_KEY ?? "",

  // Stripe Integration (Required)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  // Twilio (Optional)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? "",

  // DigitalRx API (Optional)
  DIGITALRX_API_KEY: process.env.DIGITALRX_API_KEY ?? "",
  DIGITALRX_BASE_URL:
    process.env.DIGITALRX_BASE_URL ??
    "https://www.dbswebserver.com/DBSRestApi/API",

  // Junction Health API (Optional)
  JUNCTION_API_KEY: process.env.JUNCTION_API_KEY ?? "",
  NEXT_PUBLIC_JUNCTION_API_URL:
    process.env.NEXT_PUBLIC_JUNCTION_API_URL ??
    "https://api.sandbox.tryvital.io",

  // Klaviyo CRM Integration (Optional)
  KLAVIYO_API_KEY: process.env.KLAVIYO_API_KEY ?? "",

  // Feature Flags (Optional)
  USE_SIGNATURE_CONSENT: process.env.NEXT_PUBLIC_USE_SIGNATURE_CONSENT ?? true,
};

/**
 * Validate required environment variables
 * This only runs on the server to avoid breaking client-side rendering
 */
if (typeof window === "undefined") {
  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missingVars
        .map((v) => `  - ${v}`)
        .join("\n")}\n` +
        `Please check your .env file or environment configuration.`,
    );
  }
}

/**
 * Type-safe environment variables for type checking
 */
export type EnvConfig = typeof envConfig;
