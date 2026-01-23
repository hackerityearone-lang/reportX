-- Fix mixed up selling prices
-- The selling prices contain wrong values (piece prices for box products, etc.)

-- Set realistic selling prices based on buying prices with proper margins
UPDATE products 
SET selling_price = CASE 
  -- Box products: 15-20% margin on box price
  WHEN unit_type = 'box' AND name = 'AMSTEL' THEN 24000
  WHEN unit_type = 'box' AND name = 'B MITZING' THEN 18000  
  WHEN unit_type = 'box' AND name = 'Fanta 50CL' THEN 16000
  WHEN unit_type = 'box' AND name = 'PRIMUS 70CL' THEN 17000
  WHEN unit_type = 'box' AND name = 'SKOL MALT 65CL' THEN 17000
  WHEN unit_type = 'box' AND name = 'SMIRNOFF ICE' THEN 25000
  WHEN unit_type = 'box' AND name = 'Coding' THEN 12000
  
  -- Piece products: 25-40% margin on piece price  
  WHEN unit_type = 'piece' AND name = 'BAVARIA' THEN 5000
  WHEN unit_type = 'piece' AND name = 'CORONA' THEN 5000
  WHEN unit_type = 'piece' AND name = 'DESPERADOS' THEN 4500
  WHEN unit_type = 'piece' AND name = 'GUARANNA' THEN 4000
  WHEN unit_type = 'piece' AND name = 'Fanta 30CL' THEN 1200
  WHEN unit_type = 'piece' AND name = 'CAMINO TEQUILLA' THEN 35000
  WHEN unit_type = 'piece' AND name = 'Heineken' THEN 2500
  WHEN unit_type = 'piece' AND name = 'P MITZING' THEN 1800
  WHEN unit_type = 'piece' AND name = 'PRIMUS 50CL' THEN 1800
  WHEN unit_type = 'piece' AND name = 'TURBO KING' THEN 2000
  WHEN unit_type = 'piece' AND name = 'TUSKER LAGER' THEN 2200
  WHEN unit_type = 'piece' AND name = 'TUSKER LITE' THEN 2200
  WHEN unit_type = 'piece' AND name = 'TUSKER MALT' THEN 2200
  WHEN unit_type = 'piece' AND name = 'VIRUNGA GOLD' THEN 2000
  WHEN unit_type = 'piece' AND name = 'VIRUNGA MIST 33CL' THEN 2000
  WHEN unit_type = 'piece' AND name = 'VIRUNGA SILVER' THEN 1800
  WHEN unit_type = 'piece' AND name = 'SAVANNA' THEN 2800
  WHEN unit_type = 'piece' AND name = 'SKOL LAGER 50CL' THEN 1700
  WHEN unit_type = 'piece' AND name = 'SKOL MALT 33CL' THEN 1600
  WHEN unit_type = 'piece' AND name = 'LEFFE' THEN 6500
  WHEN unit_type = 'piece' AND name = 'RED BULL' THEN 5500
  WHEN unit_type = 'piece' AND name = 'PANACHE' THEN 1100
  
  -- Keep existing for others
  ELSE ROUND(buying_price * 1.25, 2)
END;

-- Verify the fixes
SELECT 
  name,
  unit_type,
  buying_price,
  selling_price,
  ROUND(((selling_price - buying_price) / buying_price) * 100, 1) as profit_margin_percent
FROM products 
WHERE name IN ('AMSTEL', 'B MITZING', 'BAVARIA', 'Fanta 30CL', 'Fanta 50CL', 'CORONA')
ORDER BY name;