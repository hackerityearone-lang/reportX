-- Migration script to fix selling_price data inconsistency
-- This script converts box prices in selling_price column to proper piece prices

-- Step 1: For products with unit_type = 'piece' and high selling_price values (likely box prices)
-- Convert them to piece prices by dividing by pieces_per_box

UPDATE products 
SET 
  selling_price = CASE 
    WHEN unit_type = 'piece' AND pieces_per_box > 0 AND selling_price > (price * 2) THEN 
      ROUND(selling_price / pieces_per_box, 2)
    ELSE selling_price
  END,
  box_selling_price = CASE 
    WHEN unit_type = 'piece' AND pieces_per_box > 0 AND selling_price > (price * 2) THEN 
      selling_price
    ELSE box_selling_price
  END
WHERE unit_type = 'piece' AND pieces_per_box > 0;

-- Step 2: For products with unit_type = 'box' and selling_price = 0 or very low
-- Set proper piece price from box_selling_price

UPDATE products 
SET 
  selling_price = CASE 
    WHEN unit_type = 'box' AND box_selling_price > 0 AND pieces_per_box > 0 THEN 
      ROUND(box_selling_price / pieces_per_box, 2)
    ELSE selling_price
  END
WHERE unit_type = 'box' AND (selling_price = 0 OR selling_price < 100) AND box_selling_price > 0;

-- Step 3: For products that still don't have box_selling_price but should
-- Calculate it from piece price

UPDATE products 
SET 
  box_selling_price = CASE 
    WHEN box_selling_price IS NULL AND selling_price > 0 AND pieces_per_box > 0 THEN 
      selling_price * pieces_per_box
    ELSE box_selling_price
  END
WHERE box_selling_price IS NULL AND selling_price > 0 AND pieces_per_box > 0;

-- Step 4: Ensure all products have reasonable piece prices
-- If selling_price is still 0 or very low, set a default markup

UPDATE products 
SET 
  selling_price = CASE 
    WHEN selling_price = 0 OR selling_price < 100 THEN 
      ROUND(price * 1.2, 2)  -- 20% markup as default
    ELSE selling_price
  END
WHERE selling_price = 0 OR selling_price < 100;

-- Verification query to check the results
SELECT 
  name,
  unit_type,
  price as buying_price,
  selling_price as piece_price,
  box_selling_price,
  pieces_per_box,
  CASE 
    WHEN pieces_per_box > 0 THEN ROUND(selling_price * pieces_per_box, 2)
    ELSE NULL
  END as calculated_box_price
FROM products 
ORDER BY name;