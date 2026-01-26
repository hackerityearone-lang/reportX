-- Check if stock_out_items table has the product information
-- for these orphaned transactions

SELECT 
  st.id as transaction_id,
  st.created_at,
  st.quantity as transaction_quantity,
  st.unit_sold,
  soi.id as item_id,
  soi.product_id,
  soi.quantity as item_quantity,
  p.name as product_name,
  p.boxes_in_stock,
  p.remaining_pieces
FROM stock_transactions st
LEFT JOIN stock_out_items soi ON st.id = soi.transaction_id
LEFT JOIN products p ON soi.product_id = p.id
WHERE st.type = 'OUT'
  AND st.created_at >= '2026-01-24 00:00:00'::timestamptz
  AND st.created_at <= '2026-01-26 23:59:59'::timestamptz
ORDER BY st.created_at
LIMIT 20;
