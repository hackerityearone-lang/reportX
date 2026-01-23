-- Add separate piece pricing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS boxes_in_stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS buy_price_per_box numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price_per_box numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS buy_price_per_piece numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price_per_piece numeric(10,2) DEFAULT 0;

-- Update unit_type to support box_and_piece
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_unit_type_check;

ALTER TABLE products 
ADD CONSTRAINT products_unit_type_check CHECK (
  unit_type = ANY (ARRAY['box'::text, 'piece'::text, 'box_and_piece'::text])
);

-- Migrate existing data to new structure FOR ALL PRODUCTS
UPDATE products 
SET 
  boxes_in_stock = quantity,
  buy_price_per_box = buying_price,
  selling_price_per_box = selling_price,
  buy_price_per_piece = CASE 
    WHEN unit_type = 'box' AND pieces_per_box > 0 
    THEN ROUND(buying_price / pieces_per_box, 2)
    ELSE buying_price
  END,
  selling_price_per_piece = CASE 
    WHEN unit_type = 'box' AND pieces_per_box > 0 
    THEN ROUND(selling_price / pieces_per_box, 2)
    ELSE selling_price
  END,
  unit_type = 'box_and_piece';  -- Set ALL products to box_and_piece

-- Verify the new structure for ALL products
SELECT 
  name,
  unit_type,
  boxes_in_stock,
  pieces_per_box,
  remaining_pieces,
  buy_price_per_box,
  selling_price_per_box,
  buy_price_per_piece,
  selling_price_per_piece,
  allow_retail_sales
FROM products 
ORDER BY name;