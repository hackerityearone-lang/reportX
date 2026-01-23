-- Final cleanup script for remaining inconsistencies

-- Fix AMSTEL: piece_price should be 1000.00 (calculated_piece_price), not 1200.00
UPDATE products 
SET selling_price = 1000.00
WHERE name = 'AMSTEL';

-- Fix PRIMUS 70CL: box_price is too high (408000), should be reasonable
UPDATE products 
SET box_selling_price = 17000.00 * 24  -- 408000 is correct, keep as is
WHERE name = 'PRIMUS 70CL';

-- Fix products where piece_price doesn't match calculated values
-- These have inconsistent piece prices that should match box_price / pieces_per_box

UPDATE products 
SET selling_price = ROUND(box_selling_price / pieces_per_box, 2)
WHERE name IN (
  'B MITZING',
  'CAMINO TEQUILLA ', 
  'CORONA',
  'GUARANNA',
  'GUINESS ',
  'P MITZING',
  'PRIMUS 50CL',
  'RED BULL',
  'SAVANNA'
) AND ABS(selling_price - (box_selling_price / pieces_per_box)) > 0.01;

-- Verification query
SELECT 
  name,
  unit_type,
  ROUND(selling_price::numeric, 2) as piece_price,
  ROUND(box_selling_price::numeric, 2) as box_price,
  pieces_per_box,
  ROUND((box_selling_price / pieces_per_box)::numeric, 2) as should_be_piece_price,
  CASE 
    WHEN ABS(selling_price - (box_selling_price / pieces_per_box)) < 0.01 THEN '✓ Correct'
    ELSE '✗ Needs fix'
  END as status
FROM products 
WHERE is_archived = false
ORDER BY name;