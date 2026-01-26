-- =====================================================
-- Test Script for Stock Correction Verification
-- =====================================================
-- Purpose: Verify that stock reduction logic works correctly
--          for both wholesale and retail sales
-- =====================================================

-- Test Setup: Create a test product
INSERT INTO products (
  id,
  name,
  brand,
  boxes_in_stock,
  remaining_pieces,
  pieces_per_box,
  unit_type,
  allow_retail_sales,
  buy_price_per_box,
  selling_price_per_box,
  buy_price_per_piece,
  selling_price_per_piece,
  min_stock_level
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'Test Beer',
  'Test Brand',
  10,  -- 10 boxes in stock
  5,   -- 5 pieces remaining from open box
  24,  -- 24 pieces per box
  'box',
  true,
  10000,
  12000,
  500,
  600,
  5
) ON CONFLICT (id) DO UPDATE SET
  boxes_in_stock = 10,
  remaining_pieces = 5,
  pieces_per_box = 24;

-- =====================================================
-- TEST 1: Wholesale Sale (Box)
-- =====================================================
-- Expected: boxes_in_stock goes from 10 to 8
--           remaining_pieces stays at 5

SELECT 
  'TEST 1 - Before' as test,
  boxes_in_stock,
  remaining_pieces,
  (boxes_in_stock * pieces_per_box + remaining_pieces) as total_pieces
FROM products 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Simulate wholesale sale of 2 boxes
-- You would run this through your application:
-- createAdvancedStockOut({ items: [{ product_id: '00000000-0000-0000-0000-000000000001', quantity: 2, unit_type: 'boxes' }] })

-- After running the wholesale sale:
-- boxes_in_stock should be 8
-- remaining_pieces should be 5
-- total pieces should be (8 * 24) + 5 = 197

-- =====================================================
-- TEST 2: Retail Sale (Using Remaining Pieces Only)
-- =====================================================
-- Expected: Sell 3 pieces (has 5 remaining)
--           boxes_in_stock stays at 8
--           remaining_pieces goes from 5 to 2

-- Reset for test if needed
UPDATE products 
SET boxes_in_stock = 8, remaining_pieces = 5
WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT 
  'TEST 2 - Before' as test,
  boxes_in_stock,
  remaining_pieces,
  (boxes_in_stock * pieces_per_box + remaining_pieces) as total_pieces
FROM products 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Simulate retail sale of 3 pieces (using remaining pieces)
-- After: boxes = 8, remaining_pieces = 2

-- =====================================================
-- TEST 3: Retail Sale (Need to Open New Box)
-- =====================================================
-- Expected: Sell 10 pieces (has 2 remaining, need to open 1 box)
--           boxes_in_stock goes from 8 to 7
--           remaining_pieces: used 2, opened 1 box (24), sold 10 total = 2 + 24 - 10 = 16

-- Reset for test
UPDATE products 
SET boxes_in_stock = 8, remaining_pieces = 2
WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT 
  'TEST 3 - Before' as test,
  boxes_in_stock,
  remaining_pieces,
  (boxes_in_stock * pieces_per_box + remaining_pieces) as total_pieces
FROM products 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Simulate retail sale of 10 pieces
-- After: boxes = 7, remaining_pieces = 16

-- =====================================================
-- TEST 4: Verify Stock Deduction from Jan 24-26 Period
-- =====================================================
-- Check actual transactions from the problematic period

SELECT 
  st.id,
  st.created_at,
  st.unit_sold,
  st.quantity,
  p.name,
  p.pieces_per_box,
  CASE 
    WHEN st.unit_sold = 'box' THEN st.quantity * p.pieces_per_box
    ELSE st.quantity
  END as pieces_deducted
FROM stock_transactions st
INNER JOIN products p ON st.product_id = p.id
WHERE st.type = 'OUT'
  AND st.created_at >= '2026-01-24 00:00:00+02'::timestamptz
  AND st.created_at <= '2026-01-26 23:59:59+02'::timestamptz
  AND COALESCE(st.is_deleted, FALSE) = FALSE
  AND COALESCE(st.is_cancelled, FALSE) = FALSE
ORDER BY st.created_at;

-- =====================================================
-- TEST 5: Verify No Negative Stock
-- =====================================================
SELECT 
  id,
  name,
  brand,
  boxes_in_stock,
  remaining_pieces,
  (boxes_in_stock * pieces_per_box + remaining_pieces) as total_pieces
FROM products
WHERE boxes_in_stock < 0 OR remaining_pieces < 0
ORDER BY name;

-- Should return 0 rows after correction

-- =====================================================
-- Cleanup Test Data
-- =====================================================
-- DELETE FROM products WHERE id = 'test-product-001';
