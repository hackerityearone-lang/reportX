-- Add soft delete fields to stock_transactions table if they don't exist
ALTER TABLE stock_transactions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delete_reason TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_transactions_is_deleted ON stock_transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_deleted_at ON stock_transactions(deleted_at);

-- Update existing transactions to have is_deleted = false if null
UPDATE stock_transactions SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Create function for safe transaction deletion with proper stock restoration
CREATE OR REPLACE FUNCTION safe_delete_stock_transaction(
  p_transaction_id UUID,
  p_reason TEXT DEFAULT 'Transaction deleted'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_transaction RECORD;
  v_item RECORD;
  v_user_id UUID;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO v_user_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get transaction details
  SELECT * INTO v_transaction
  FROM stock_transactions
  WHERE id = p_transaction_id 
    AND user_id = v_user_id 
    AND is_deleted = FALSE
    AND type = 'OUT';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Restore stock for all items with proper box/piece logic
  FOR v_item IN
    SELECT soi.product_id, soi.quantity, p.unit_type, p.pieces_per_box, p.quantity as current_quantity, p.remaining_pieces
    FROM stock_out_items soi
    JOIN products p ON p.id = soi.product_id
    WHERE soi.transaction_id = p_transaction_id
  LOOP
    IF v_item.unit_type = 'box' AND v_item.pieces_per_box IS NOT NULL THEN
      -- For box products, restore as pieces to remaining_pieces
      UPDATE products
      SET remaining_pieces = COALESCE(remaining_pieces, 0) + v_item.quantity
      WHERE id = v_item.product_id;
    ELSE
      -- Regular product - restore to main quantity
      UPDATE products
      SET quantity = quantity + v_item.quantity
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  -- Soft delete the transaction
  UPDATE stock_transactions
  SET
    is_deleted = TRUE,
    deleted_at = NOW(),
    deleted_by = v_user_id,
    delete_reason = p_reason,
    is_cancelled = TRUE,
    cancelled_at = NOW(),
    cancelled_reason = p_reason
  WHERE id = p_transaction_id;

  -- Deactivate related credits
  UPDATE credits
  SET is_active = FALSE
  WHERE transaction_id = p_transaction_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safe_delete_stock_transaction TO authenticated;

-- Update RLS policies to exclude deleted transactions by default
DROP POLICY IF EXISTS "Users can view their own transactions" ON stock_transactions;
CREATE POLICY "Users can view their own non-deleted transactions" ON stock_transactions
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = FALSE);

-- Allow viewing deleted transactions for audit purposes (optional)
CREATE POLICY "Users can view their own deleted transactions for audit" ON stock_transactions
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = TRUE);

-- Update policy for updates to allow soft delete
DROP POLICY IF EXISTS "Managers can update own transactions" ON stock_transactions;
CREATE POLICY "Managers can update own transactions" ON stock_transactions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('MANAGER', 'BOSS') AND p.status = 'APPROVED')
  );