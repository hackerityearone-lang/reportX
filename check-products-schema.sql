-- Check current products table schema and data
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Check actual product data structure
SELECT 
  name,
  unit_type,
  pieces_per_box,
  price,
  selling_price,
  -- Check if these new fields exist
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'buy_price_per_piece'
  ) THEN 'HAS_PIECE_FIELDS' ELSE 'NO_PIECE_FIELDS' END as schema_type
FROM products 
WHERE name IN ('SMIRNOFF ICE', 'AMSTEL', 'Fanta 50CL')
LIMIT 5;