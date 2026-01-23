-- Enhanced Features Migration Script
-- Feature 1: Box/Piece Support for Products
-- Feature 2: Soft Delete for Transactions
-- Feature 3: Enhanced Transaction Tracking

-- Add new columns to products table for box/piece support
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'piece' CHECK (unit_type IN ('box', 'piece')),
ADD COLUMN IF NOT EXISTS pieces_per_box INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS allow_retail_sales BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS remaining_pieces INTEGER DEFAULT 0;

-- Add soft delete columns to stock_transactions table
ALTER TABLE stock_transactions 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delete_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS unit_sold TEXT DEFAULT 'piece' CHECK (unit_sold IN ('box', 'piece'));

-- Create index for better performance on deleted transactions
CREATE INDEX IF NOT EXISTS idx_stock_transactions_not_deleted ON stock_transactions (id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_stock_transactions_deleted ON stock_transactions (deleted_at) WHERE is_deleted = true;

-- Create function to handle box/piece conversion
CREATE OR REPLACE FUNCTION calculate_total_pieces(box_quantity INTEGER, pieces_per_box INTEGER, remaining_pieces INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF pieces_per_box IS NULL THEN
    RETURN box_quantity; -- For non-box items, return quantity as is
  END IF;
  
  RETURN (box_quantity * pieces_per_box) + COALESCE(remaining_pieces, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to handle stock-out in pieces
CREATE OR REPLACE FUNCTION stock_out_pieces(
  product_id_param UUID,
  pieces_to_remove INTEGER
) RETURNS JSON AS $$
DECLARE
  product_record RECORD;
  boxes_to_deduct INTEGER := 0;
  remaining_pieces_after INTEGER := 0;
  result JSON;
BEGIN
  -- Get current product state
  SELECT * INTO product_record FROM products WHERE id = product_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Product not found');
  END IF;
  
  -- If not a box-type product, just deduct from quantity
  IF product_record.unit_type != 'box' OR product_record.pieces_per_box IS NULL THEN
    IF product_record.quantity < pieces_to_remove THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient stock');
    END IF;
    
    UPDATE products 
    SET quantity = quantity - pieces_to_remove,
        updated_at = NOW()
    WHERE id = product_id_param;
    
    RETURN json_build_object('success', true, 'boxes_deducted', 0, 'pieces_deducted', pieces_to_remove);
  END IF;
  
  -- For box-type products, handle box/piece logic
  remaining_pieces_after := product_record.remaining_pieces - pieces_to_remove;
  
  -- If we need more pieces than available in remaining_pieces
  IF remaining_pieces_after < 0 THEN
    boxes_to_deduct := CEIL(ABS(remaining_pieces_after)::DECIMAL / product_record.pieces_per_box);
    
    -- Check if we have enough boxes
    IF product_record.quantity < boxes_to_deduct THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient stock');
    END IF;
    
    -- Calculate final remaining pieces after deducting boxes
    remaining_pieces_after := (boxes_to_deduct * product_record.pieces_per_box) + remaining_pieces_after;
  END IF;
  
  -- Update product quantities
  UPDATE products 
  SET quantity = quantity - boxes_to_deduct,
      remaining_pieces = remaining_pieces_after,
      updated_at = NOW()
  WHERE id = product_id_param;
  
  RETURN json_build_object(
    'success', true, 
    'boxes_deducted', boxes_to_deduct, 
    'pieces_deducted', pieces_to_remove,
    'remaining_pieces', remaining_pieces_after
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to restore stock when transaction is soft deleted
CREATE OR REPLACE FUNCTION restore_stock_from_transaction(transaction_id_param UUID)
RETURNS JSON AS $$
DECLARE
  transaction_record RECORD;
  product_record RECORD;
  result JSON;
BEGIN
  -- Get transaction details
  SELECT * INTO transaction_record FROM stock_transactions WHERE id = transaction_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found');
  END IF;
  
  -- Get product details
  SELECT * INTO product_record FROM products WHERE id = transaction_record.product_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Product not found');
  END IF;
  
  -- Restore stock based on transaction type
  IF transaction_record.type = 'STOCK_OUT' THEN
    -- For stock out, add back the quantity
    IF transaction_record.unit_sold = 'box' OR product_record.unit_type != 'box' THEN
      -- Simple quantity restoration
      UPDATE products 
      SET quantity = quantity + transaction_record.quantity,
          updated_at = NOW()
      WHERE id = transaction_record.product_id;
    ELSE
      -- Piece-based restoration for box products
      UPDATE products 
      SET remaining_pieces = remaining_pieces + transaction_record.quantity,
          updated_at = NOW()
      WHERE id = transaction_record.product_id;
    END IF;
  ELSIF transaction_record.type = 'STOCK_IN' THEN
    -- For stock in, subtract the quantity
    UPDATE products 
    SET quantity = GREATEST(0, quantity - transaction_record.quantity),
        updated_at = NOW()
    WHERE id = transaction_record.product_id;
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'Stock restored successfully');
END;
$$ LANGUAGE plpgsql;

-- Update existing products to have default values for new columns
UPDATE products 
SET unit_type = 'piece',
    allow_retail_sales = true,
    remaining_pieces = 0
WHERE unit_type IS NULL;

-- Create view for transaction reporting that excludes deleted transactions
CREATE OR REPLACE VIEW active_stock_transactions AS
SELECT * FROM stock_transactions 
WHERE is_deleted = false;

-- Add RLS policies for soft delete functionality
CREATE POLICY "Users can soft delete own transactions" ON stock_transactions 
FOR UPDATE TO authenticated 
USING (
  auth.uid() = user_id AND 
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'MANAGER' AND p.status = 'APPROVED')
);

-- Update existing RLS policies to exclude deleted transactions from SELECT
DROP POLICY IF EXISTS "Users can view all transactions" ON stock_transactions;
CREATE POLICY "Users can view active transactions" ON stock_transactions 
FOR SELECT TO authenticated 
USING (is_deleted = false);

-- Create policy for viewing deleted transactions (admin only)
CREATE POLICY "Managers can view deleted transactions" ON stock_transactions 
FOR SELECT TO authenticated 
USING (
  is_deleted = true AND 
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'MANAGER' AND p.status = 'APPROVED')
);

COMMENT ON COLUMN products.unit_type IS 'Type of unit: box or piece';
COMMENT ON COLUMN products.pieces_per_box IS 'Number of pieces per box (null for non-box items)';
COMMENT ON COLUMN products.allow_retail_sales IS 'Whether this product allows retail (piece-by-piece) sales';
COMMENT ON COLUMN products.remaining_pieces IS 'Remaining pieces from opened boxes';
COMMENT ON COLUMN stock_transactions.is_deleted IS 'Soft delete flag';
COMMENT ON COLUMN stock_transactions.deleted_at IS 'When the transaction was deleted';
COMMENT ON COLUMN stock_transactions.deleted_by IS 'User who deleted the transaction';
COMMENT ON COLUMN stock_transactions.delete_reason IS 'Reason for deletion';
COMMENT ON COLUMN stock_transactions.unit_sold IS 'Unit type sold: box or piece';