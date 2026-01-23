-- Fix profit calculations for existing transactions
-- This script recalculates profits for piece sales from box products

-- Update stock_out_items with correct buying prices for piece sales
UPDATE stock_out_items 
SET buying_price = (
  SELECT 
    CASE 
      WHEN p.unit_type = 'box' AND p.pieces_per_box > 0 
      THEN p.price / p.pieces_per_box
      ELSE p.price
    END
  FROM products p 
  WHERE p.id = stock_out_items.product_id
)
WHERE product_id IN (
  SELECT id FROM products WHERE unit_type = 'box' AND pieces_per_box > 0
);

-- Update stock_transactions with recalculated total_profit
UPDATE stock_transactions 
SET total_profit = (
  SELECT COALESCE(SUM(soi.quantity * (soi.selling_price - soi.buying_price)), 0)
  FROM stock_out_items soi 
  WHERE soi.transaction_id = stock_transactions.id
)
WHERE type = 'OUT' AND is_deleted = false;