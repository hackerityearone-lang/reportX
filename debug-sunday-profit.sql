-- Debug Sunday negative profit
-- Run this in your Supabase SQL editor to find the problematic transactions

-- Check Sunday transactions with their profit calculations
SELECT 
  st.id,
  st.created_at,
  st.total_amount,
  st.total_profit,
  st.payment_type,
  c.name as customer_name,
  -- Get individual items
  soi.quantity,
  soi.selling_price,
  soi.buying_price,
  p.name as product_name,
  p.unit_type,
  p.pieces_per_box,
  -- Calculate expected profit per item
  (soi.selling_price - soi.buying_price) * soi.quantity as calculated_profit
FROM stock_transactions st
LEFT JOIN customers c ON st.customer_id = c.id
LEFT JOIN stock_out_items soi ON st.id = soi.transaction_id
LEFT JOIN products p ON soi.product_id = p.id
WHERE 
  st.type = 'OUT' 
  AND st.is_deleted = false
  AND DATE(st.created_at) = '2026-01-19'  -- Replace with your Sunday date
ORDER BY st.created_at DESC;

-- Check if any products have wrong buying prices
SELECT 
  p.name,
  p.price as stored_price,
  p.unit_type,
  p.pieces_per_box,
  CASE 
    WHEN p.unit_type = 'box' AND p.pieces_per_box > 0 
    THEN p.price / p.pieces_per_box 
    ELSE p.price 
  END as calculated_piece_price
FROM products p
WHERE p.is_archived = false
ORDER BY p.name;