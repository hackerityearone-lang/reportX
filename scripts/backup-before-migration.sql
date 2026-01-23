-- Backup current products data before migration
-- Run this FIRST to create a backup

CREATE TABLE products_backup_before_price_fix AS 
SELECT * FROM products;

-- Verify backup was created
SELECT COUNT(*) as total_products_backed_up FROM products_backup_before_price_fix;