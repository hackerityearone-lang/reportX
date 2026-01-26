-- Fix Corrupted Inventory Data
-- This script fixes inconsistent stock values and implements proper stock model

-- Step 1: Backup current state
CREATE TABLE IF NOT EXISTS products_backup_before_fix AS 
SELECT * FROM products WHERE quantity < 0 OR boxes_in_stock * pieces_per_box != quantity;

-- Step 2: Identify corrupted products
DO $$
DECLARE
    corrupted_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO corrupted_count
    FROM products 
    WHERE quantity < 0 
       OR (pieces_per_box > 0 AND boxes_in_stock * pieces_per_box != quantity);
    
    RAISE NOTICE 'Found % corrupted products', corrupted_count;
END $$;

-- Step 3: Fix corrupted data by recalculating from transaction history
WITH transaction_totals AS (
    -- Calculate net stock from all transactions (IN - OUT) converted to pieces
    SELECT 
        p.id as product_id,
        p.name,
        p.pieces_per_box,
        p.quantity as current_quantity,
        p.boxes_in_stock as current_boxes,
        p.remaining_pieces as current_remaining,
        COALESCE(
            SUM(
                CASE 
                    WHEN st.type = 'IN' THEN 
                        CASE 
                            WHEN st.unit_sold = 'box' THEN st.quantity * p.pieces_per_box
                            ELSE st.quantity 
                        END
                    WHEN st.type = 'OUT' THEN 
                        -CASE 
                            WHEN st.unit_sold = 'box' THEN st.quantity * p.pieces_per_box
                            ELSE st.quantity 
                        END
                    ELSE 0
                END
            ), 0
        ) as calculated_total_pieces
    FROM products p
    LEFT JOIN stock_transactions st ON p.id = st.product_id 
        AND st.is_cancelled = FALSE 
        AND st.is_deleted = FALSE
    WHERE p.quantity < 0 
       OR (p.pieces_per_box > 0 AND p.boxes_in_stock * p.pieces_per_box != p.quantity)
    GROUP BY p.id, p.name, p.pieces_per_box, p.quantity, p.boxes_in_stock, p.remaining_pieces
)
UPDATE products 
SET 
    quantity = GREATEST(0, tt.calculated_total_pieces),
    boxes_in_stock = CASE 
        WHEN products.pieces_per_box > 0 THEN FLOOR(GREATEST(0, tt.calculated_total_pieces) / products.pieces_per_box)
        ELSE 0 
    END,
    remaining_pieces = CASE 
        WHEN products.pieces_per_box > 0 THEN GREATEST(0, tt.calculated_total_pieces) % products.pieces_per_box
        ELSE 0 
    END,
    updated_at = NOW()
FROM transaction_totals tt
WHERE products.id = tt.product_id;

-- Step 4: Handle products with no transaction history (set to 0)
UPDATE products 
SET 
    quantity = 0,
    boxes_in_stock = 0,
    remaining_pieces = 0,
    updated_at = NOW()
WHERE quantity < 0 
   AND id NOT IN (
       SELECT DISTINCT product_id 
       FROM stock_transactions 
       WHERE product_id IS NOT NULL 
         AND is_cancelled = FALSE 
         AND is_deleted = FALSE
   );

-- Step 5: Create function to maintain stock consistency
CREATE OR REPLACE FUNCTION maintain_stock_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure quantity is always the source of truth
    -- Calculate derived fields from quantity
    IF NEW.pieces_per_box > 0 THEN
        NEW.boxes_in_stock := FLOOR(NEW.quantity / NEW.pieces_per_box);
        NEW.remaining_pieces := NEW.quantity % NEW.pieces_per_box;
    ELSE
        NEW.boxes_in_stock := 0;
        NEW.remaining_pieces := 0;
    END IF;
    
    -- Prevent negative stock
    IF NEW.quantity < 0 THEN
        NEW.quantity := 0;
        NEW.boxes_in_stock := 0;
        NEW.remaining_pieces := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to maintain consistency
DROP TRIGGER IF EXISTS trigger_maintain_stock_consistency ON products;
CREATE TRIGGER trigger_maintain_stock_consistency
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION maintain_stock_consistency();

-- Step 7: Create function for atomic stock updates
CREATE OR REPLACE FUNCTION update_product_stock(
    p_product_id UUID,
    p_quantity_change INTEGER, -- positive for stock in, negative for stock out
    p_unit_type TEXT DEFAULT 'piece' -- 'box' or 'piece'
) RETURNS BOOLEAN AS $$
DECLARE
    v_product RECORD;
    v_pieces_change INTEGER;
    v_new_quantity INTEGER;
BEGIN
    -- Get current product state
    SELECT * INTO v_product FROM products WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;
    
    -- Convert to pieces if needed
    IF p_unit_type = 'box' THEN
        v_pieces_change := p_quantity_change * COALESCE(v_product.pieces_per_box, 1);
    ELSE
        v_pieces_change := p_quantity_change;
    END IF;
    
    -- Calculate new quantity
    v_new_quantity := v_product.quantity + v_pieces_change;
    
    -- Prevent negative stock
    IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Available: % pieces, Requested: % pieces', 
            v_product.quantity, ABS(v_pieces_change);
    END IF;
    
    -- Update quantity (trigger will handle derived fields)
    UPDATE products 
    SET quantity = v_new_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create validation function
CREATE OR REPLACE FUNCTION validate_stock_consistency()
RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    quantity INTEGER,
    boxes_in_stock INTEGER,
    remaining_pieces INTEGER,
    pieces_per_box INTEGER,
    calculated_quantity INTEGER,
    is_consistent BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.quantity,
        p.boxes_in_stock,
        p.remaining_pieces,
        p.pieces_per_box,
        (p.boxes_in_stock * p.pieces_per_box) + p.remaining_pieces as calculated_quantity,
        (p.quantity = (p.boxes_in_stock * p.pieces_per_box) + p.remaining_pieces) as is_consistent
    FROM products p
    WHERE p.pieces_per_box > 0;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Grant permissions
GRANT EXECUTE ON FUNCTION update_product_stock TO authenticated;
GRANT EXECUTE ON FUNCTION validate_stock_consistency TO authenticated;

-- Step 10: Verify the fix
SELECT 
    'BEFORE FIX' as status,
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE quantity < 0) as negative_quantity,
    COUNT(*) FILTER (WHERE pieces_per_box > 0 AND boxes_in_stock * pieces_per_box != quantity) as inconsistent_stock
FROM products_backup_before_fix
UNION ALL
SELECT 
    'AFTER FIX' as status,
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE quantity < 0) as negative_quantity,
    COUNT(*) FILTER (WHERE pieces_per_box > 0 AND boxes_in_stock * pieces_per_box != quantity) as inconsistent_stock
FROM products;

-- Step 11: Show fixed products
SELECT 
    name,
    quantity as fixed_quantity,
    boxes_in_stock as fixed_boxes,
    remaining_pieces as fixed_remaining,
    pieces_per_box
FROM products 
WHERE id IN (
    SELECT id FROM products_backup_before_fix
)
ORDER BY name;