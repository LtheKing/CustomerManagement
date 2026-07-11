-- Add shared transaction_id so multi-product checkouts can be grouped in the sales report.
-- Run in pgAdmin / psql against CustomerManagementDB (or Supabase SQL Editor).

ALTER TABLE public."Sales"
ADD COLUMN IF NOT EXISTS transaction_id UUID NULL;

-- Existing rows: each line is its own transaction
UPDATE public."Sales"
SET transaction_id = id
WHERE transaction_id IS NULL;

ALTER TABLE public."Sales"
ALTER COLUMN transaction_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS "IX_Sales_transaction_id" ON public."Sales" (transaction_id);
