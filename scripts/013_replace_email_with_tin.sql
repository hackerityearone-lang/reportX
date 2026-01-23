-- Replace email field with TIN number in customers table
-- This migration changes the email column to tin_number

-- Add new TIN number column
ALTER TABLE customers 
ADD COLUMN tin_number VARCHAR(20);

-- Drop the email column
ALTER TABLE customers 
DROP COLUMN email;

-- Add comment for clarity
COMMENT ON COLUMN customers.tin_number IS 'Tax Identification Number for the customer';