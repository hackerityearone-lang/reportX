-- Recalculate Sunday transactions with corrected prices
-- This will update the total_profit in stock_transactions table

-- Recalculate ALL transactions with corrected prices (not just Sunday)
UPDATE stock_transactions 
SET total_profit = (
  SELECT COALESCE(SUM(
    soi.quantity * (soi.selling_price - soi.buying_price)
  ), 0)
  FROM stock_out_items soi
  WHERE soi.transaction_id = stock_transactions.id
)
WHERE type = 'OUT' 
  AND is_deleted = false;

-- Also update the buying_price in stock_out_items to match corrected product prices
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
WHERE transaction_id IN (
  SELECT id FROM stock_transactions 
  WHERE type = 'OUT' AND is_deleted = false
);

-- Verify Sunday's recalculation
SELECT 
  st.id,
  st.created_at,
  st.total_amount,
  st.total_profit,
  st.payment_type,
  -- Show item details
  soi.quantity,
  soi.selling_price,
  soi.buying_price,
  p.name,
  (soi.selling_price - soi.buying_price) * soi.quantity as item_profit
FROM stock_transactions st
JOIN stock_out_items soi ON st.id = soi.transaction_id
JOIN products p ON soi.product_id = p.id
WHERE st.type = 'OUT' 
  AND st.is_deleted = false 
  AND DATE(st.created_at) BETWEEN '2026-01-19' AND '2026-01-23'
ORDER BY st.created_at, st.id;