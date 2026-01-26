-- Emergency fix for stock calculation issues

-- Step 1: Drop and recreate the trigger function
DROP TRIGGER IF EXISTS trigger_maintain_stock_consistency ON products;
DROP FUNCTION IF EXISTS maintain_stock_consistency();

-- Step 2: Create corrected trigger function
CREATE OR REPLACE FUNCTION maintain_stock_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if pieces_per_box is set and > 0
    IF NEW.pieces_per_box > 0 THEN
        NEW.boxes_in_stock := FLOOR(NEW.quantity / NEW.pieces_per_box);
        NEW.remaining_pieces := NEW.quantity % NEW.pieces_per_box;
    ELSE
        -- For non-box products, set boxes_in_stock to quantity and remaining_pieces to 0
        NEW.boxes_in_stock := NEW.quantity;
        NEW.remaining_pieces := 0;
    END IF;
    
    -- Prevent negative values
    IF NEW.quantity < 0 THEN
        NEW.quantity := 0;
        NEW.boxes_in_stock := 0;
        NEW.remaining_pieces := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate trigger
CREATE TRIGGER trigger_maintain_stock_consistency
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION maintain_stock_consistency();

-- Step 4: Fix all existing products by updating their quantity (trigger will recalculate)
UPDATE products 
SET quantity = quantity, updated_at = NOW()
WHERE quantity >= 0;

-- Step 5: Verify results
SELECT 
    name,
    quantity,
    boxes_in_stock,
    remaining_pieces,
    pieces_per_box,
    (boxes_in_stock * pieces_per_box) + remaining_pieces as calculated_total
FROM products 
WHERE name IN ('Tea', 'test', 'INYANGE WATER 500ML', 'AMSTEL')
ORDER BY name;