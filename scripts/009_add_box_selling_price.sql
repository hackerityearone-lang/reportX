-- Add box_selling_price column to products table
-- This allows separate pricing for box and piece sales

-- Add the new column
ALTER TABLE products 
ADD COLUMN box_selling_price DECIMAL(10,2) DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN products.box_selling_price IS 'Selling price per box (for box products only)';

-- Update existing box products to have a default box price (selling_price * pieces_per_box)
UPDATE products 
SET box_selling_price = selling_price * pieces_per_box 
WHERE unit_type = 'box' 
  AND pieces_per_box IS NOT NULL 
  AND pieces_per_box > 0
  AND box_selling_price IS NULL;