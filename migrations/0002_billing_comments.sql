-- Billing comments / info already live in invoices.notes.
-- Line-item billing selections are stored in invoices.line_items JSON:
--   { "selection": "plc_programming", "description": "...", "quantity": 1, "unit_price_cents": 16500 }
-- This migration is a no-op marker so deploys document the contract.
SELECT 1;
