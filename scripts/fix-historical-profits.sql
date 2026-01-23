-- Recalculate historical transaction profits after price migration
-- This fixes inflated profit calculations from old pricing structure

-- Step 1: Update stock_out_items with correct profit calculations
UPDATE stock_out_items 
SET 
  profit_per_unit = selling_price - buying_price,
  subtotal = quantity * selling_price,
  subtotal_profit = quantity * (selling_price - buying_price)
WHERE transaction_id IN (
  SELECT id FROM stock_transactions 
  WHERE type = 'OUT' AND created_at >= '2026-01-18'
);

-- Step 2: Recalculate stock_transactions total_profit from items
UPDATE stock_transactions 
SET total_profit = (
  SELECT COALESCE(SUM(subtotal_profit), 0)
  FROM stock_out_items 
  WHERE transaction_id = stock_transactions.id
)
WHERE type = 'OUT' AND created_at >= '2026-01-18';

-- Step 3: For transactions that used old box prices as piece prices,
-- we need to adjust the selling_price in stock_out_items to reflect actual piece prices
UPDATE stock_out_items 
SET 
  selling_price = CASE 
    -- If selling price is suspiciously high (likely old box price), convert to piece price
    WHEN selling_price > 15000 AND EXISTS (
      SELECT 1 FROM products p 
      WHERE p.id = stock_out_items.product_id 
      AND p.pieces_per_box > 0 
      AND selling_price > p.selling_price * 5
    ) THEN (
      SELECT p.selling_price 
      FROM products p 
      WHERE p.id = stock_out_items.product_id
    )
    ELSE selling_price
  END
WHERE transaction_id IN (
  SELECT id FROM stock_transactions 
  WHERE type = 'OUT' AND created_at >= '2026-01-18'
);

-- Step 4: Recalculate after price adjustments
UPDATE stock_out_items 
SET 
  subtotal = quantity * selling_price,
  profit_per_unit = selling_price - buying_price,
  subtotal_profit = quantity * (selling_price - buying_price)
WHERE transaction_id IN (
  SELECT id FROM stock_transactions 
  WHERE type = 'OUT' AND created_at >= '2026-01-18'
);

-- Step 5: Final recalculation of transaction totals
UPDATE stock_transactions 
SET 
  total_amount = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM stock_out_items 
    WHERE transaction_id = stock_transactions.id
  ),
  total_profit = (
    SELECT COALESCE(SUM(subtotal_profit), 0)
    FROM stock_out_items 
    WHERE transaction_id = stock_transactions.id
  )
WHERE type = 'OUT' AND created_at >= '2026-01-18';

-- Verification: Check corrected profits
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transactions,
  SUM(total_amount) as total_sales,
  SUM(total_profit) as total_profit,
  ROUND(AVG(total_profit / NULLIF(total_amount, 0) * 100), 2) as avg_profit_margin
FROM stock_transactions 
WHERE type = 'OUT' 
  AND created_at >= '2026-01-18' 
  AND created_at < '2026-01-25'
  AND is_deleted = false
GROUP BY DATE(created_at)
ORDER BY date;