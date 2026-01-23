-- Optimized products table schema
-- Removes redundant columns and uses clear naming

-- Drop redundant columns and rename for clarity
ALTER TABLE products 
DROP COLUMN IF EXISTS boxes_in_stock,           -- Same as quantity for box products
DROP COLUMN IF EXISTS current_box_pieces,       -- Same as remaining_pieces  
DROP COLUMN IF EXISTS box_selling_price;        -- Same as selling_price for box products

-- Rename columns for clarity
ALTER TABLE products 
RENAME COLUMN price TO buying_price;            -- Clear that this is buying price
-- selling_price stays as is (clear already)

-- Update constraints to match new column names
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS check_selling_price_positive;

ALTER TABLE products 
ADD CONSTRAINT check_buying_price_positive CHECK (buying_price >= 0);

ALTER TABLE products 
ADD CONSTRAINT check_selling_price_positive CHECK (selling_price >= 0);

-- Final clean schema structure:
/*
FINAL PRODUCTS TABLE STRUCTURE:
- id: UUID primary key
- name: Product name
- brand: Product brand  
- quantity: Stock quantity (boxes for box products, pieces for piece products)
- remaining_pieces: Loose pieces for box products (0 for piece products)
- pieces_per_box: How many pieces in one box (12, 24, etc.)
- unit_type: 'box' or 'piece'
- buying_price: Cost price (per box for box products, per piece for piece products)
- selling_price: Selling price (per box for box products, per piece for piece products)
- min_stock_level: Minimum stock alert level
- allow_retail_sales: Whether box products can be sold as pieces
- user_id, created_at, updated_at, is_archived: Standard fields
*/

-- Verify the clean schema
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
WHERE name IN ('AMSTEL', 'SMIRNOFF ICE', 'Fanta 50CL')
ORDER BY name;