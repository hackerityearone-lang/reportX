-- Specific migration for the current data
-- Based on the data analysis, this script fixes the selling_price inconsistencies

-- For products like TUSKER MALT, PRIMUS 70CL etc. where selling_price contains box prices
-- but unit_type is 'piece', we need to:
-- 1. Move current selling_price to box_selling_price 
-- 2. Calculate proper piece price

UPDATE products 
SET 
  box_selling_price = selling_price,
  selling_price = ROUND(selling_price / pieces_per_box, 2)
WHERE 
  unit_type = 'piece' 
  AND pieces_per_box > 0 
  AND selling_price > 15000  -- High values that are likely box prices
  AND box_selling_price IS NULL;

-- For PRIMUS 70CL and similar products that have unit_type = 'box'
-- Ensure selling_price represents piece price
UPDATE products 
SET 
  selling_price = ROUND(box_selling_price / pieces_per_box, 2)
WHERE 
  unit_type = 'box' 
  AND box_selling_price > 0 
  AND pieces_per_box > 0
  AND (selling_price = 0 OR selling_price > box_selling_price);

-- For AMSTEL and similar products with very low selling_price
-- These seem to have incorrect piece prices
UPDATE products 
SET 
  selling_price = ROUND(box_selling_price / pieces_per_box, 2)
WHERE 
  unit_type = 'box' 
  AND box_selling_price > 0 
  AND pieces_per_box > 0
  AND selling_price < 100;

-- Final cleanup: ensure all products have both piece and box prices
UPDATE products 
SET 
  box_selling_price = selling_price * pieces_per_box
WHERE 
  box_selling_price IS NULL 
  AND selling_price > 0 
  AND pieces_per_box > 0;

-- Verification: Show the corrected data
SELECT 
  name,
  unit_type,
  ROUND(price::numeric, 2) as buying_price,
  ROUND(selling_price::numeric, 2) as piece_price,
  ROUND(box_selling_price::numeric, 2) as box_price,
  pieces_per_box,
  ROUND((selling_price * pieces_per_box)::numeric, 2) as calculated_box_price,
  CASE 
    WHEN box_selling_price IS NOT NULL AND pieces_per_box > 0 THEN 
      ROUND((box_selling_price / pieces_per_box)::numeric, 2)
    ELSE NULL
  END as calculated_piece_price
FROM products 
WHERE is_archived = false
ORDER BY name;