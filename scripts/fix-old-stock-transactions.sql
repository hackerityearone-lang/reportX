-- Fix old stock transactions to work with inventory system

-- Step 1: Check current transaction types and units
SELECT DISTINCT type, unit_sold, COUNT(*) as count
FROM stock_transactions 
GROUP BY type, unit_sold
ORDER BY type, unit_sold;

-- Step 2: Update old transaction types
UPDATE stock_transactions 
SET type = 'IN'
WHERE type = 'STOCK_IN';

-- Step 3: Set unit_sold to 'box' for stock in transactions that don't have it set
UPDATE stock_transactions 
SET unit_sold = 'box'
WHERE type = 'IN' AND (unit_sold IS NULL OR unit_sold = '');

-- Step 4: Recalculate all product quantities from transaction history
WITH transaction_totals AS (
    SELECT 
        p.id as product_id,
        p.name,
        p.pieces_per_box,
        COALESCE(
            SUM(
                CASE 
                    WHEN st.type = 'IN' THEN 
                        CASE 
                            WHEN st.unit_sold = 'box' THEN st.quantity * COALESCE(p.pieces_per_box, 1)
                            ELSE st.quantity 
                        END
                    WHEN st.type = 'OUT' THEN 
                        -CASE 
                            WHEN st.unit_sold = 'box' THEN st.quantity * COALESCE(p.pieces_per_box, 1)
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
    GROUP BY p.id, p.name, p.pieces_per_box
)
UPDATE products 
SET 
    quantity = GREATEST(0, tt.calculated_total_pieces),
    updated_at = NOW()
FROM transaction_totals tt
WHERE products.id = tt.product_id;

-- Step 5: Verify the results
SELECT 
    p.name,
    p.quantity,
    p.boxes_in_stock,
    p.remaining_pieces,
    p.pieces_per_box,
    COUNT(st.id) as transaction_count
FROM products p
LEFT JOIN stock_transactions st ON p.id = st.product_id AND st.type = 'IN'
WHERE p.name IN ('SKOL MALT 65CL', 'VIRUNGA MIST 33CL', 'SKOL MALT 33CL', 'INYANGE JUICE 500ML', 'INYANGE WATER 500ML', 'AMSTEL', 'INYANGE GALON')
GROUP BY p.id, p.name, p.quantity, p.boxes_in_stock, p.remaining_pieces, p.pieces_per_box
ORDER BY p.name;