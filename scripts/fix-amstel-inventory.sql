-- Fix AMSTEL Product Corrupted Inventory
-- Product ID: 9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b
-- Current state: quantity = -86, boxes_in_stock = 130, pieces_per_box = 24

-- Step 1: Backup current AMSTEL data
CREATE TEMP TABLE amstel_backup AS 
SELECT * FROM products WHERE id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b';

-- Step 2: Show current corrupted state
SELECT 
    'BEFORE FIX' as status,
    name,
    quantity,
    boxes_in_stock,
    remaining_pieces,
    pieces_per_box,
    (boxes_in_stock * pieces_per_box + COALESCE(remaining_pieces, 0)) as calculated_total_pieces
FROM products 
WHERE id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b';

-- Step 3: Calculate correct stock from transaction history
WITH amstel_transactions AS (
    SELECT 
        st.type,
        st.quantity,
        st.unit_sold,
        st.created_at,
        CASE 
            WHEN st.type = 'IN' THEN 
                CASE 
                    WHEN st.unit_sold = 'box' THEN st.quantity * 24  -- Convert boxes to pieces
                    ELSE st.quantity  -- Already in pieces
                END
            WHEN st.type = 'OUT' THEN 
                -CASE 
                    WHEN st.unit_sold = 'box' THEN st.quantity * 24  -- Convert boxes to pieces
                    ELSE st.quantity  -- Already in pieces
                END
            ELSE 0
        END as pieces_change
    FROM stock_transactions st
    WHERE st.product_id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b'
      AND st.is_cancelled = FALSE 
      AND COALESCE(st.is_deleted, FALSE) = FALSE
    ORDER BY st.created_at
),
running_total AS (
    SELECT 
        *,
        SUM(pieces_change) OVER (ORDER BY created_at) as running_pieces_total
    FROM amstel_transactions
)
SELECT 
    'TRANSACTION ANALYSIS' as analysis_type,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN pieces_change > 0 THEN pieces_change ELSE 0 END) as total_stock_in_pieces,
    SUM(CASE WHEN pieces_change < 0 THEN ABS(pieces_change) ELSE 0 END) as total_stock_out_pieces,
    SUM(pieces_change) as net_pieces_total,
    MAX(running_pieces_total) as final_calculated_pieces
FROM running_total;

-- Step 4: Fix AMSTEL stock using calculated values
-- If no transaction history exists, we'll use the boxes_in_stock as the source of truth
-- Calculate correct stock from transaction history or use fallback
WITH amstel_stock_calc AS (
    SELECT 
        COALESCE(
            SUM(
                CASE 
                    WHEN st.type = 'IN' THEN 
                        CASE 
                            WHEN st.unit_sold = 'box' THEN st.quantity * 24
                            ELSE st.quantity 
                        END
                    WHEN st.type = 'OUT' THEN 
                        -CASE 
                            WHEN st.unit_sold = 'box' THEN st.quantity * 24
                            ELSE st.quantity 
                        END
                    ELSE 0
                END
            ), 
            -- Fallback: use current boxes_in_stock * 24
            (SELECT boxes_in_stock * 24 FROM products WHERE id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b')
        ) as calculated_pieces
    FROM stock_transactions st
    WHERE st.product_id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b'
      AND st.is_cancelled = FALSE 
      AND COALESCE(st.is_deleted, FALSE) = FALSE
)
UPDATE products 
SET 
    quantity = GREATEST(0, calc.calculated_pieces),
    boxes_in_stock = FLOOR(GREATEST(0, calc.calculated_pieces) / 24),
    remaining_pieces = GREATEST(0, calc.calculated_pieces) % 24,
    updated_at = NOW()
FROM amstel_stock_calc calc
WHERE id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b';

-- Step 5: Show fixed state
SELECT 
    'AFTER FIX' as status,
    name,
    quantity,
    boxes_in_stock,
    remaining_pieces,
    pieces_per_box,
    (boxes_in_stock * pieces_per_box + COALESCE(remaining_pieces, 0)) as calculated_total_pieces,
    CASE 
        WHEN quantity = (boxes_in_stock * pieces_per_box + COALESCE(remaining_pieces, 0)) 
        THEN 'CONSISTENT' 
        ELSE 'INCONSISTENT' 
    END as consistency_check,
    CASE 
        WHEN quantity >= 0 THEN 'VALID' 
        ELSE 'INVALID' 
    END as stock_validity
FROM products 
WHERE id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b';

-- Step 6: Validation rules check
SELECT 
    'VALIDATION RESULTS' as check_type,
    CASE WHEN quantity >= 0 THEN 'PASS' ELSE 'FAIL' END as non_negative_quantity,
    CASE WHEN remaining_pieces < pieces_per_box THEN 'PASS' ELSE 'FAIL' END as remaining_pieces_valid,
    CASE WHEN quantity = (boxes_in_stock * pieces_per_box + remaining_pieces) THEN 'PASS' ELSE 'FAIL' END as consistency_check
FROM products 
WHERE id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b';

-- Step 7: Show comparison
SELECT 
    'COMPARISON' as type,
    'BEFORE' as state,
    b.quantity as quantity,
    b.boxes_in_stock,
    b.remaining_pieces
FROM amstel_backup b
UNION ALL
SELECT 
    'COMPARISON' as type,
    'AFTER' as state,
    p.quantity,
    p.boxes_in_stock,
    p.remaining_pieces
FROM products p 
WHERE p.id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b';