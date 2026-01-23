-- Fix missing buying prices after schema migration
-- All products show 0 RWF buying price, need to restore from backup or set realistic values

-- Check current state
SELECT name, unit_type, buying_price, selling_price 
FROM products 
WHERE buying_price = 0 OR buying_price IS NULL
ORDER BY name;

-- Set realistic buying prices based on selling prices (assuming 20-30% profit margin)
-- This means buying_price = selling_price / 1.25 (25% margin)
UPDATE products 
SET buying_price = CASE 
  WHEN unit_type = 'box' THEN ROUND(selling_price / 1.25, 2)
  ELSE ROUND(selling_price / 1.30, 2)  -- 30% margin for pieces
END
WHERE buying_price = 0 OR buying_price IS NULL;

-- Verify the fix
SELECT 
  name,
  unit_type,
  buying_price,
  selling_price,
  ROUND(((selling_price - buying_price) / buying_price) * 100, 1) as profit_margin_percent
FROM products 
ORDER BY name
LIMIT 10;