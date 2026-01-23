-- Migration: Add unit-based stock management and safe transaction delete features

-- Add unit configuration fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'pieces' CHECK (unit_type IN ('pieces', 'boxes')),
ADD COLUMN IF NOT EXISTS pieces_per_box INTEGER DEFAULT 1 CHECK (pieces_per_box > 0),
ADD COLUMN IF NOT EXISTS allow_retail_sales BOOLEAN DEFAULT TRUE;

-- Add soft delete fields to stock_transactions table
ALTER TABLE stock_transactions
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_stock_transactions_is_deleted ON stock_transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_deleted_at ON stock_transactions(deleted_at);

-- Update existing products to have default unit_type if null
UPDATE products SET unit_type = 'pieces' WHERE unit_type IS NULL;
UPDATE products SET pieces_per_box = 1 WHERE pieces_per_box IS NULL;
UPDATE products SET allow_retail_sales = TRUE WHERE allow_retail_sales IS NULL;

-- Function to safely delete transaction with rollback
CREATE OR REPLACE FUNCTION safe_delete_transaction(
  p_transaction_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_transaction RECORD;
  v_item RECORD;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM stock_transactions
  WHERE id = p_transaction_id AND user_id = p_user_id AND is_deleted = FALSE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Restore stock for all items
  FOR v_item IN
    SELECT soi.product_id, soi.quantity
    FROM stock_out_items soi
    WHERE soi.transaction_id = p_transaction_id
  LOOP
    UPDATE products
    SET quantity = quantity + v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  -- Mark transaction as deleted (soft delete)
  UPDATE stock_transactions
  SET
    is_deleted = TRUE,
    deleted_at = NOW(),
    deleted_by = p_user_id,
    cancelled_reason = COALESCE(p_reason, 'Safe delete with rollback')
  WHERE id = p_transaction_id;

  -- Deactivate related credits
  UPDATE credits
  SET is_active = FALSE
  WHERE transaction_id = p_transaction_id;

  -- Log the deletion
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    p_user_id,
    'SAFE_DELETE',
    'stock_transactions',
    p_transaction_id,
    row_to_json(v_transaction),
    json_build_object('is_deleted', TRUE, 'deleted_at', NOW(), 'deleted_by', p_user_id, 'cancelled_reason', COALESCE(p_reason, 'Safe delete with rollback'))
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert quantity between units
CREATE OR REPLACE FUNCTION convert_quantity(
  p_product_id UUID,
  p_quantity INTEGER,
  p_from_unit TEXT,
  p_to_unit TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_pieces_per_box INTEGER;
BEGIN
  -- Get pieces per box for the product
  SELECT pieces_per_box INTO v_pieces_per_box
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RETURN p_quantity; -- fallback
  END IF;

  -- Convert based on units
  IF p_from_unit = 'boxes' AND p_to_unit = 'pieces' THEN
    RETURN p_quantity * v_pieces_per_box;
  ELSIF p_from_unit = 'pieces' AND p_to_unit = 'boxes' THEN
    RETURN p_quantity / v_pieces_per_box;
  ELSE
    RETURN p_quantity; -- same unit
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION safe_delete_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION convert_quantity TO authenticated;

-- Update RLS policies to handle soft deletes
DROP POLICY IF EXISTS "Users can view their own transactions" ON stock_transactions;
CREATE POLICY "Users can view their own transactions including soft deleted" ON stock_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow hard delete for admins, soft delete for regular users
DROP POLICY IF EXISTS "Managers can update own transactions" ON stock_transactions;
CREATE POLICY "Managers can update own transactions" ON stock_transactions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'MANAGER' AND p.status = 'APPROVED') AND
    is_deleted = FALSE
  );

-- Add policy for safe delete function
CREATE POLICY "Allow safe delete for managers" ON stock_transactions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'MANAGER' AND p.status = 'APPROVED')
  );
