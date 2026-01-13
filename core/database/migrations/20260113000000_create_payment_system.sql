-- Payment System for Authorize.Net Integration
-- This migration creates tables for AMRX payment credentials and transaction tracking

-- 1. Table for storing AMRX Authorize.Net credentials (admin-managed)
CREATE TABLE IF NOT EXISTS payment_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Merchant identification
  merchant_name TEXT NOT NULL DEFAULT 'AMRX',

  -- Authorize.Net credentials (encrypted)
  api_login_id TEXT,
  transaction_key_encrypted TEXT, -- Must be encrypted using AES-256
  public_client_key TEXT,
  signature_key_encrypted TEXT, -- For webhook verification, encrypted

  -- Environment configuration
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),

  -- Connection status
  is_verified BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  verification_error TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Only one set of credentials should be active at a time
  is_active BOOLEAN DEFAULT true
);

-- Only one active payment credential at a time
CREATE UNIQUE INDEX idx_payment_credentials_active ON payment_credentials (is_active) WHERE is_active = true;

-- 2. Table for tracking all payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What is being paid for
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,

  -- Payment breakdown
  total_amount_cents INTEGER NOT NULL,
  consultation_fee_cents INTEGER NOT NULL DEFAULT 0,
  medication_cost_cents INTEGER NOT NULL DEFAULT 0,

  -- Patient information
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_email TEXT,
  patient_phone TEXT,
  patient_name TEXT,

  -- Provider information
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  provider_name TEXT,

  -- Pharmacy information
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  pharmacy_name TEXT,

  -- Authorize.Net transaction details
  authnet_transaction_id TEXT, -- The receipt number from Authorize.Net
  authnet_authorization_code TEXT, -- Bank approval code
  authnet_response_code TEXT,
  authnet_response_reason TEXT,

  -- Payment link (magic link)
  payment_token TEXT UNIQUE NOT NULL, -- Unique token for the payment link
  payment_link_url TEXT, -- Full URL to payment page
  payment_link_expires_at TIMESTAMP WITH TIME ZONE,
  payment_link_used_at TIMESTAMP WITH TIME ZONE,

  -- Card information (PCI compliant - last 4 digits only)
  card_last_four TEXT,
  card_type TEXT, -- Visa, Mastercard, etc.

  -- Payment status
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending',      -- Payment link created, not yet paid
    'completed',    -- Payment successful
    'declined',     -- Payment declined by bank
    'failed',       -- Technical failure
    'cancelled',    -- Cancelled by provider
    'refunded',     -- Payment refunded
    'expired'       -- Payment link expired
  )),

  -- Order progress tracking (for progress bar)
  order_progress TEXT NOT NULL DEFAULT 'payment_pending' CHECK (order_progress IN (
    'payment_pending',     -- Stage 0: Waiting for payment
    'payment_received',    -- Stage 1: Payment confirmed
    'provider_approved',   -- Stage 2: Provider approved
    'pharmacy_processing', -- Stage 3: Pharmacy is filling
    'shipped'              -- Stage 4: Order shipped/ready
  )),

  -- Tracking information
  tracking_number TEXT,
  tracking_url TEXT,

  -- Email/SMS notification tracking
  payment_link_email_sent_at TIMESTAMP WITH TIME ZONE,
  payment_confirmation_email_sent_at TIMESTAMP WITH TIME ZONE,

  -- Description for the payment
  description TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Webhook data (for debugging)
  webhook_received_at TIMESTAMP WITH TIME ZONE,
  webhook_payload JSONB
);

-- Indexes for performance
CREATE INDEX idx_payment_transactions_prescription ON payment_transactions(prescription_id);
CREATE INDEX idx_payment_transactions_patient ON payment_transactions(patient_id);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider_id);
CREATE INDEX idx_payment_transactions_token ON payment_transactions(payment_token);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(payment_status);
CREATE INDEX idx_payment_transactions_authnet_id ON payment_transactions(authnet_transaction_id);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- 3. Add payment tracking fields to prescriptions table (if not exists)
DO $$
BEGIN
  -- Add payment_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN payment_status TEXT DEFAULT 'unpaid'
      CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded'));
  END IF;

  -- Add order_progress if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'order_progress'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN order_progress TEXT DEFAULT 'payment_pending'
      CHECK (order_progress IN ('payment_pending', 'payment_received', 'provider_approved', 'pharmacy_processing', 'shipped'));
  END IF;

  -- Add payment_transaction_id reference if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'payment_transaction_id'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_payment_credentials_updated_at ON payment_credentials;
CREATE TRIGGER update_payment_credentials_updated_at
  BEFORE UPDATE ON payment_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS) policies
ALTER TABLE payment_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

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

COMMENT ON TABLE payment_credentials IS 'Stores AMRX Authorize.Net merchant credentials (admin-managed, encrypted)';
COMMENT ON TABLE payment_transactions IS 'Tracks all payment transactions including status, progress, and Authorize.Net receipt data';
COMMENT ON COLUMN payment_credentials.transaction_key_encrypted IS 'Encrypted Authorize.Net Transaction Key using AES-256-GCM';
COMMENT ON COLUMN payment_credentials.signature_key_encrypted IS 'Encrypted Authorize.Net Signature Key for webhook verification';
COMMENT ON COLUMN payment_transactions.payment_token IS 'Unique token for magic link - allows patient to access payment without login';
COMMENT ON COLUMN payment_transactions.order_progress IS 'Current stage in the 4-stage progress bar (payment → approved → processing → shipped)';
