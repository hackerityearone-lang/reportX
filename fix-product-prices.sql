-- Fix incorrect product prices
-- These are box prices stored as piece prices, causing negative profits

-- Update products that have box prices stored as piece prices
UPDATE products 
SET price = CASE 
  -- These should be piece prices (divide box price by pieces_per_box)
  WHEN name = 'B MITZING' THEN 16400.00 / 12
  WHEN name = 'BAVARIA' THEN 52000.00 / 12  
  WHEN name = 'BIG GILYBIS' THEN 8800.00 / 12
  WHEN name = 'CAMINO TEQUILLA' THEN 28000.00 / 12
  WHEN name = 'CORONA' THEN 53000.00 / 12
  WHEN name = 'DESPERADOS' THEN 45000.00 / 12
  WHEN name = 'Fanta 30CL' THEN 11600.00 / 12
  WHEN name = 'GUARANNA' THEN 38000.00 / 12
  WHEN name = 'GUINESS' THEN 29050.00 / 12
  WHEN name = 'Heineken' THEN 25300.00 / 12
  WHEN name = 'INYANGE GALON' THEN 3000.00 / 12
  WHEN name = 'INYANGE JUICE 500ML' THEN 8800.00 / 12
  WHEN name = 'INYANGE MILK' THEN 7700.00 / 12
  WHEN name = 'INYANGE WATER 500ML' THEN 3700.00 / 12
  WHEN name = 'LEFFE' THEN 66000.00 / 12
  WHEN name = 'P MITZING' THEN 18600.00 / 12
  WHEN name = 'PANACHE' THEN 11450.00 / 12
  WHEN name = 'PRIMUS 50CL' THEN 18400.00 / 12
  WHEN name = 'RED BULL' THEN 55000.00 / 12
  WHEN name = 'SAVANNA' THEN 27000.00 / 12
  WHEN name = 'SKOL LAGER 50CL' THEN 17600.00 / 12
  WHEN name = 'SKOL MALT 33CL' THEN 16700.00 / 12
  WHEN name = 'SMALL GILYBIS' THEN 2500.00 / 12
  WHEN name = 'SMIRNOFF ICE' THEN 22850.00 / 12
  WHEN name = 'TURBO KING' THEN 20400.00 / 12
  WHEN name = 'TUSKER LAGER' THEN 22850.00 / 12
  WHEN name = 'TUSKER LITE' THEN 22850.00 / 12
  WHEN name = 'TUSKER MALT' THEN 22850.00 / 12
  WHEN name = 'VIRUNGA GOLD' THEN 20600.00 / 12
  WHEN name = 'VIRUNGA MIST 33CL' THEN 20600.00 / 12
  WHEN name = 'VIRUNGA SILVER' THEN 17400.00 / 12
  ELSE price -- Keep existing price for box products
END
WHERE unit_type = 'piece';

-- Verify the changes
SELECT 
  name,
  price as new_price,
  unit_type,
  pieces_per_box
FROM products 
WHERE unit_type = 'piece'
ORDER BY name;