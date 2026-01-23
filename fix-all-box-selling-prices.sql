-- Fix selling prices for all box products
-- Many box products have piece prices stored as selling prices instead of box prices

-- First, check all box products with their current pricing
SELECT 
  name,
  unit_type,
  pieces_per_box,
  price as buying_price_box,
  selling_price as current_selling_price,
  ROUND(price / pieces_per_box, 2) as buying_price_piece,
  ROUND(selling_price / pieces_per_box, 2) as current_selling_piece,
  CASE 
    WHEN selling_price < price THEN 'LOSS - Selling below cost!'
    WHEN selling_price < (price * 1.1) THEN 'LOW - Less than 10% margin'
    ELSE 'OK'
  END as status
FROM products 
WHERE unit_type = 'box'
ORDER BY name;

-- Fix selling prices for box products with realistic margins (15-25%)
UPDATE products 
SET selling_price = CASE 
  WHEN name = 'AMSTEL' THEN 24000          -- 21,500 -> 24,000 (11.6% margin)
  WHEN name = 'Fanta 50CL' THEN 16000      -- 14,000 -> 16,000 (14.3% margin)  
  WHEN name = 'PRIMUS 70CL' THEN 17000     -- 15,000 -> 17,000 (13.3% margin)
  WHEN name = 'SKOL MALT 65CL' THEN 17000  -- 15,000 -> 17,000 (13.3% margin)
  ELSE selling_price -- Keep current price for others
END
WHERE unit_type = 'box' 
  AND name IN ('AMSTEL', 'Fanta 50CL', 'PRIMUS 70CL', 'SKOL MALT 65CL');

-- Verify the fixes
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
WHERE unit_type = 'box'
ORDER BY name;