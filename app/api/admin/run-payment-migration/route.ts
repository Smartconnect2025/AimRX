import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@core/database/client";
import { getUser } from "@/core/auth/get-user";

/**
 * POST /api/admin/run-payment-migration
 * Manually run the payment system migration
 * Admin only - creates payment_credentials and payment_transactions tables
 */
export async function POST(_request: NextRequest) {
  try {
    const { user, userRole } = await getUser();

    if (!user || userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const supabase = createAdminClient();

    console.log("🔧 Running payment system migration...");

    // Run the migration SQL
    const migrationSQL = `
      -- Payment System for Authorize.Net Integration

      -- 1. Table for storing AMRX Authorize.Net credentials (admin-managed)
      CREATE TABLE IF NOT EXISTS payment_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_name TEXT NOT NULL DEFAULT 'AMRX',
        api_login_id TEXT,
        transaction_key_encrypted TEXT,
        public_client_key TEXT,
        signature_key_encrypted TEXT,
        environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
        is_verified BOOLEAN DEFAULT false,
        last_verified_at TIMESTAMP WITH TIME ZONE,
        verification_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      );

      -- Only one active payment credential at a time
      CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_credentials_active ON payment_credentials (is_active) WHERE is_active = true;

      -- 2. Table for tracking all payment transactions
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
        total_amount_cents INTEGER NOT NULL,
        consultation_fee_cents INTEGER NOT NULL DEFAULT 0,
        medication_cost_cents INTEGER NOT NULL DEFAULT 0,
        patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
        patient_email TEXT,
        patient_phone TEXT,
        patient_name TEXT,
        provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
        provider_name TEXT,
        pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
        pharmacy_name TEXT,
        authnet_transaction_id TEXT,
        authnet_authorization_code TEXT,
        authnet_response_code TEXT,
        authnet_response_reason TEXT,
        payment_token TEXT UNIQUE NOT NULL,
        payment_link_url TEXT,
        payment_link_expires_at TIMESTAMP WITH TIME ZONE,
        payment_link_used_at TIMESTAMP WITH TIME ZONE,
        card_last_four TEXT,
        card_type TEXT,
        payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
          'pending', 'completed', 'declined', 'failed', 'cancelled', 'refunded', 'expired'
        )),
        order_progress TEXT NOT NULL DEFAULT 'payment_pending' CHECK (order_progress IN (
          'payment_pending', 'payment_received', 'provider_approved', 'pharmacy_processing', 'shipped'
        )),
        tracking_number TEXT,
        tracking_url TEXT,
        payment_link_email_sent_at TIMESTAMP WITH TIME ZONE,
        payment_confirmation_email_sent_at TIMESTAMP WITH TIME ZONE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        webhook_received_at TIMESTAMP WITH TIME ZONE,
        webhook_payload JSONB,
        paid_at TIMESTAMP WITH TIME ZONE,
        refund_amount_cents INTEGER,
        refunded_at TIMESTAMP WITH TIME ZONE,
        prescription_medication TEXT
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_prescription ON payment_transactions(prescription_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_patient ON payment_transactions(patient_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_token ON payment_transactions(payment_token);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_authnet_id ON payment_transactions(authnet_transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

      -- 3. Add payment tracking fields to prescriptions table (if not exists)
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'prescriptions' AND column_name = 'payment_status'
        ) THEN
          ALTER TABLE prescriptions ADD COLUMN payment_status TEXT DEFAULT 'unpaid'
            CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded'));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'prescriptions' AND column_name = 'order_progress'
        ) THEN
          ALTER TABLE prescriptions ADD COLUMN order_progress TEXT DEFAULT 'payment_pending'
            CHECK (order_progress IN ('payment_pending', 'payment_received', 'provider_approved', 'pharmacy_processing', 'shipped'));
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'prescriptions' AND column_name = 'payment_transaction_id'
        ) THEN
          ALTER TABLE prescriptions ADD COLUMN payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL;
        END IF;
      END $$;

      -- 4. Row Level Security (RLS) policies
      ALTER TABLE payment_credentials ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Admins can manage payment credentials" ON payment_credentials;
      DROP POLICY IF EXISTS "Providers can view their payment transactions" ON payment_transactions;
      DROP POLICY IF EXISTS "Admins can view all payment transactions" ON payment_transactions;
      DROP POLICY IF EXISTS "System can manage payment transactions" ON payment_transactions;

      -- Only admins can access payment credentials
      CREATE POLICY "Admins can manage payment credentials"
        ON payment_credentials
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
          )
        );

      -- Providers can view their own payment transactions
      CREATE POLICY "Providers can view their payment transactions"
        ON payment_transactions
        FOR SELECT
        TO authenticated
        USING (
          provider_id IN (
            SELECT id FROM providers WHERE user_id = auth.uid()
          )
        );

      -- Admins can view all payment transactions
      CREATE POLICY "Admins can view all payment transactions"
        ON payment_transactions
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
          )
        );

      -- System can insert/update payment transactions (for webhooks)
      CREATE POLICY "System can manage payment transactions"
        ON payment_transactions
        FOR ALL
        TO service_role
        USING (true);

      -- Grant necessary permissions
      GRANT SELECT, INSERT, UPDATE ON payment_credentials TO service_role;
      GRANT SELECT, INSERT, UPDATE ON payment_transactions TO service_role;
    `;

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (migrationError) {
      // If exec_sql doesn't exist, try direct query
      console.log("⚠️ exec_sql not available, trying direct query...");
      const { error: directError } = await supabase.from('payment_credentials').select('id').limit(1);

      if (directError && directError.code === '42P01') {
        // Table doesn't exist
        console.error("❌ Cannot create tables - need Supabase access");
        return NextResponse.json({
          success: false,
          error: "Cannot run migration automatically. Tables need to be created in Supabase dashboard.",
          details: "Please contact your administrator to run the migration SQL."
        }, { status: 500 });
      }

      // Table exists
      console.log("✅ Tables already exist");
      return NextResponse.json({
        success: true,
        message: "Payment tables already exist in database"
      });
    }

    console.log("✅ Payment system migration completed successfully");

    return NextResponse.json({
      success: true,
      message: "Payment system tables created successfully"
    });

  } catch (error) {
    console.error("Error running payment migration:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to run migration"
    }, { status: 500 });
  }
}
