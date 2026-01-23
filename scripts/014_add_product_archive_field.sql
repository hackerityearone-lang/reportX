-- Add is_archived field to products table for soft delete functionality
-- This allows products with transaction history to be archived instead of deleted

-- Add index for better query performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);

-- Add comment for clarity
COMMENT ON COLUMN products.is_archived IS 'Soft delete flag - archived products are hidden but transaction history is preserved';