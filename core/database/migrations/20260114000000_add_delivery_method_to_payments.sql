-- Add delivery_method field to payment_transactions table
ALTER TABLE payment_transactions
ADD COLUMN delivery_method TEXT NOT NULL DEFAULT 'pickup';

-- Add comment for delivery_method column
COMMENT ON COLUMN payment_transactions.delivery_method IS 'Fulfillment method: pickup, delivery, or shipping';

-- Update order_progress enum documentation (informational only, TEXT type doesn't enforce enum)
COMMENT ON COLUMN payment_transactions.order_progress IS 'Order progress: payment_pending, payment_received, provider_approved, pharmacy_processing, shipped, ready_for_pickup, or completed';
