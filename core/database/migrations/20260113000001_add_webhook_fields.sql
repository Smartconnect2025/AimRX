-- Add webhook-related fields to payment_transactions table

ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster webhook lookups by authnet transaction ID
CREATE INDEX IF NOT EXISTS idx_payment_transactions_authnet_id
  ON payment_transactions(authnet_transaction_id);

-- Add index for payment token lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_token
  ON payment_transactions(payment_token);
