-- Add payment details columns to investor_transactions table
ALTER TABLE investor_transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_details JSONB;
