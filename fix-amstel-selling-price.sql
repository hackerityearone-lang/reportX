-- Fix AMSTEL selling price
-- Currently showing 1,000 RWF but should be around 24,000 RWF for a box

-- Check current AMSTEL data
SELECT 
  name,
  unit_type,
  pieces_per_box,
  price as buying_price,
  selling_price,
  (selling_price / pieces_per_box) as calculated_piece_selling_price
FROM products 
WHERE name = 'AMSTEL';

-- Update AMSTEL selling price to realistic box price
-- If buying price is 21,500, selling should be around 24,000 (about 12% margin)
UPDATE products 
SET selling_price = 24000
WHERE name = 'AMSTEL';

-- Verify the fix
SELECT 
  name,
  unit_type,
  pieces_per_box,
  price as buying_price_box,
  selling_price as selling_price_box,
  ROUND(price / pieces_per_box, 2) as buying_price_piece,
  ROUND(selling_price / pieces_per_box, 2) as selling_price_piece,
  ROUND(((selling_price - price) / price) * 100, 1) as profit_margin_percent
FROM products 
WHERE name = 'AMSTEL';