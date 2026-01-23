-- Clean up products schema - remove redundant columns
ALTER TABLE products 
DROP COLUMN IF EXISTS boxes_in_stock,
DROP COLUMN IF EXISTS current_box_pieces,
DROP COLUMN IF EXISTS box_selling_price;

-- Rename price to buying_price for clarity
ALTER TABLE products 
RENAME COLUMN price TO buying_price;

-- Update constraints
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS check_selling_price_positive;

ALTER TABLE products 
ADD CONSTRAINT check_buying_price_positive CHECK (buying_price >= 0),
ADD CONSTRAINT check_selling_price_positive CHECK (selling_price >= 0);

-- Check the cleaned schema
SELECT 
  name,
  unit_type,
  quantity,
  remaining_pieces,
  pieces_per_box,
  buying_price,
  selling_price,
  allow_retail_sales
FROM products 
LIMIT 3;