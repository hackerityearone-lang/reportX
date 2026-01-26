-- =====================================================
-- Stock Correction Script for Jan 24-26, 2026 (CORRECTED)
-- =====================================================
-- Purpose: Fix stock quantities using stock_out_items table
-- Period: 2026-01-24 to 2026-01-26 (inclusive)
-- =====================================================

-- =====================================================
-- STEP 1: View affected transactions with products
-- =====================================================
SELECT 
  st.id as transaction_id,
  st.created_at,
  soi.product_id,
  p.name as product_name,
  p.brand,
  soi.quantity,
  p.pieces_per_box,
  p.boxes_in_stock as current_boxes,
  p.remaining_pieces as current_remaining,
  -- All items are pieces since they come from stock_out_items
  soi.quantity as pieces_to_deduct
FROM stock_transactions st
INNER JOIN stock_out_items soi ON st.id = soi.transaction_id
INNER JOIN products p ON soi.product_id = p.id
WHERE st.type = 'OUT'
  AND st.created_at >= '2026-01-24 00:00:00+02'::timestamptz
  AND st.created_at <= '2026-01-26 23:59:59+02'::timestamptz
  AND COALESCE(st.is_deleted, FALSE) = FALSE
  AND COALESCE(st.is_cancelled, FALSE) = FALSE
ORDER BY st.created_at, p.name;

-- =====================================================
-- STEP 2: Summary of stock deductions by product
-- =====================================================
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.brand,
  p.pieces_per_box,
  p.boxes_in_stock as current_boxes,
  p.remaining_pieces as current_remaining,
  (p.boxes_in_stock * p.pieces_per_box + COALESCE(p.remaining_pieces, 0)) as current_total_pieces,
  SUM(soi.quantity) as total_pieces_to_deduct,
  COUNT(DISTINCT st.id) as transaction_count,
  COUNT(soi.id) as line_item_count
FROM stock_transactions st
INNER JOIN stock_out_items soi ON st.id = soi.transaction_id
INNER JOIN products p ON soi.product_id = p.id
WHERE st.type = 'OUT'
  AND st.created_at >= '2026-01-24 00:00:00+02'::timestamptz
  AND st.created_at <= '2026-01-26 23:59:59+02'::timestamptz
  AND COALESCE(st.is_deleted, FALSE) = FALSE
  AND COALESCE(st.is_cancelled, FALSE) = FALSE
GROUP BY p.id, p.name, p.brand, p.pieces_per_box, p.boxes_in_stock, p.remaining_pieces
ORDER BY p.name;

-- =====================================================
-- STEP 3: PREVIEW - Corrected stock levels
-- =====================================================
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.brand,
  p.pieces_per_box,
  -- Current state
  p.boxes_in_stock as current_boxes,
  p.remaining_pieces as current_remaining,
  (p.boxes_in_stock * p.pieces_per_box + COALESCE(p.remaining_pieces, 0)) as current_total_pieces,
  -- Deductions
  SUM(soi.quantity) as total_pieces_to_deduct,
  -- Corrected state
  GREATEST(0, 
    (p.boxes_in_stock * p.pieces_per_box + COALESCE(p.remaining_pieces, 0)) - 
    SUM(soi.quantity)
  ) as corrected_total_pieces,
  FLOOR(
    GREATEST(0, 
      (p.boxes_in_stock * p.pieces_per_box + COALESCE(p.remaining_pieces, 0)) - 
      SUM(soi.quantity)
    )::DECIMAL / p.pieces_per_box
  ) as new_boxes_in_stock,
  GREATEST(0, 
    (p.boxes_in_stock * p.pieces_per_box + COALESCE(p.remaining_pieces, 0)) - 
    SUM(soi.quantity)
  ) % p.pieces_per_box as new_remaining_pieces
FROM stock_transactions st
INNER JOIN stock_out_items soi ON st.id = soi.transaction_id
INNER JOIN products p ON soi.product_id = p.id
WHERE st.type = 'OUT'
  AND st.created_at >= '2026-01-24 00:00:00+02'::timestamptz
  AND st.created_at <= '2026-01-26 23:59:59+02'::timestamptz
  AND COALESCE(st.is_deleted, FALSE) = FALSE
  AND COALESCE(st.is_cancelled, FALSE) = FALSE
GROUP BY p.id, p.name, p.brand, p.pieces_per_box, p.boxes_in_stock, p.remaining_pieces
ORDER BY p.name;

-- =====================================================
-- STEP 4: APPLY THE CORRECTIONS
-- =====================================================
-- IMPORTANT: Review Step 3 before uncommenting!
-- UNCOMMENT THE UPDATE BELOW TO APPLY CORRECTIONS

UPDATE products p
SET 
  boxes_in_stock = (
    SELECT FLOOR(
      GREATEST(0, 
        (p.boxes_in_stock * p.pieces_per_box + COALESCE(p.remaining_pieces, 0)) - 
        COALESCE(SUM(soi.quantity), 0)
      )::DECIMAL / p.pieces_per_box
    )
    FROM stock_transactions st
    INNER JOIN stock_out_items soi ON st.id = soi.transaction_id
    WHERE soi.product_id = p.id
      AND st.type = 'OUT'
      AND st.created_at >= '2026-01-24 00:00:00+02'::timestamptz
      AND st.created_at <= '2026-01-26 23:59:59+02'::timestamptz
      AND COALESCE(st.is_deleted, FALSE) = FALSE
      AND COALESCE(st.is_cancelled, FALSE) = FALSE
  ),
  remaining_pieces = (
    SELECT GREATEST(0, 
      (p.boxes_in_stock * p.pieces_per_box + COALESCE(p.remaining_pieces, 0)) - 
      COALESCE(SUM(soi.quantity), 0)
    ) % p.pieces_per_box
    FROM stock_transactions st
    INNER JOIN stock_out_items soi ON st.id = soi.transaction_id
    WHERE soi.product_id = p.id
      AND st.type = 'OUT'
      AND st.created_at >= '2026-01-24 00:00:00+02'::timestamptz
      AND st.created_at <= '2026-01-26 23:59:59+02'::timestamptz
      AND COALESCE(st.is_deleted, FALSE) = FALSE
      AND COALESCE(st.is_cancelled, FALSE) = FALSE
  ),
  updated_at = NOW()
WHERE p.id IN (
  SELECT DISTINCT soi.product_id
  FROM stock_transactions st
  INNER JOIN stock_out_items soi ON st.id = soi.transaction_id
  WHERE st.type = 'OUT'
    AND st.created_at >= '2026-01-24 00:00:00+02'::timestamptz
    AND st.created_at <= '2026-01-26 23:59:59+02'::timestamptz
    AND COALESCE(st.is_deleted, FALSE) = FALSE
    AND COALESCE(st.is_cancelled, FALSE) = FALSE
);

-- =====================================================
-- STEP 5: Verify no negative stock
-- =====================================================
-- UNCOMMENT AFTER RUNNING UPDATE

/*
SELECT 
  id,
  name,
  brand,
  boxes_in_stock,
  remaining_pieces,
  (boxes_in_stock * pieces_per_box + COALESCE(remaining_pieces, 0)) as total_pieces
FROM products
WHERE boxes_in_stock < 0 OR remaining_pieces < 0;

-- Should return 0 rows
*/
