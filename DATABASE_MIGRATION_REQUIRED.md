# CRITICAL: Apply Database Migration to Supabase

## Issue
You're seeing errors like:
- `Could not find the table 'public.customers' in the schema cache`
- `Could not find the table 'public.daily_reports' in the schema cache`
- `Could not find the 'transaction_type' column of 'stock_transactions' in the schema cache`
- `null value in column "product_id" of relation "stock_transactions" violates not-null constraint`

This means the advanced features database migration **has NOT been applied** to your Supabase project, or there's a schema mismatch.

## Solution: Apply Migration Now

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/_/sql/new
2. Select your project

### Step 2: Copy & Paste Migration
Copy the entire contents of:
```
scripts/002_enhance_advanced_features.sql
```

### Step 3: Run Migration
1. Paste the entire SQL script into the Supabase SQL editor
2. Click **RUN** button
3. Wait for completion (should be instant)

### Step 4: Verify Tables Created
After running, check in Supabase Dashboard → Tables:
- ✅ `customers` (new table)
- ✅ `stock_out_items` (new table)
- ✅ `audit_logs` (new table)
- ✅ `daily_reports` (new table)
- ✅ `stock_transactions` (should have new columns)
- ✅ `credits` (should have new columns)

### Step 5: Reload Browser
After migration completes:
1. Stop your dev server (Ctrl+C)
2. Clear cache: `rm -r .next`
3. Restart: `npm run dev`
4. Reload browser

## What This Migration Does

**New Tables:**
- `customers` - Independent customer records
- `stock_out_items` - Line items in sales (multi-product per transaction)
- `audit_logs` - Change history for compliance
- `daily_reports` - Cached daily analytics

**Enhanced Tables:**
- `stock_transactions` + customer_id, invoice_number, profit fields
- `credits` + customer_id, is_active, due_date
- `credit_payments` + customer_id

**Automation:**
- 10+ triggers for auto-calculations
- 4 database functions
- 10+ performance indexes
- Row-Level Security (RLS) policies

## Troubleshooting

**Error: "Permission denied"**
→ Make sure you're logged in as a user with admin/owner access to the project

**Error: "Relation already exists"**
→ Normal if you've run it before. Just proceed.

**Tables not showing up**
→ Refresh the browser or click refresh in Supabase tables list

**Still getting 'table not found' after applying**
→ Go to database settings → clear cache or toggle read replicas

---

## Fix: 'transaction_type' Column Not Found

If you see the error:
```
Could not find the 'transaction_type' column of 'stock_transactions' in the schema cache
```

This happens because there are two different schema files with different column names:
- [`scripts/001_create_tables.sql`](scripts/001_create_tables.sql) uses `type` column
- [`scripts/001-create-tables.sql`](scripts/001-create-tables.sql) uses `transaction_type` column

### Quick Fix

Run this migration script in your Supabase SQL Editor:
```
scripts/003_fix_transaction_type_column.sql
```

Or run this SQL directly:

```sql
-- Rename 'type' to 'transaction_type' if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_transactions'
    AND column_name = 'type'
  ) THEN
    ALTER TABLE stock_transactions RENAME COLUMN type TO transaction_type;
  END IF;
END $$;

-- Add transaction_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_transactions'
    AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE stock_transactions
    ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'OUT'
    CHECK (transaction_type IN ('IN', 'OUT'));
  END IF;
END $$;

-- Update old values if any
UPDATE stock_transactions SET transaction_type = 'OUT' WHERE transaction_type = 'STOCK_OUT';
UPDATE stock_transactions SET transaction_type = 'IN' WHERE transaction_type = 'STOCK_IN';
```

### After Running the Fix

1. **Refresh Supabase Schema Cache:**
   - Go to Supabase Dashboard → Settings → API
   - Click "Reload schema cache" button
   - Or wait 2-3 minutes for automatic refresh

2. **Restart your app:**
   ```bash
   # Stop dev server (Ctrl+C)
   rm -rf .next
   npm run dev
   ```

3. **Hard refresh browser:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## Fix: 'product_id' NOT NULL Constraint Error

If you see the error:
```
null value in column "product_id" of relation "stock_transactions" violates not-null constraint
```

This happens because the original schema requires `product_id` for each transaction, but the advanced stock out system uses the `stock_out_items` table for multiple products per transaction.

### Quick Fix

Run this migration script in your Supabase SQL Editor:
```
scripts/004_fix_product_id_constraint.sql
```

Or run this SQL directly:

```sql
-- Make product_id nullable (allows multi-product transactions via stock_out_items)
ALTER TABLE stock_transactions
ALTER COLUMN product_id DROP NOT NULL;

-- Add transaction_type if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stock_transactions'
    AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE stock_transactions
    ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'OUT'
    CHECK (transaction_type IN ('IN', 'OUT'));
  END IF;
END $$;

-- Add other required columns
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10, 2);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('CASH', 'CREDIT'));
```

### After Running the Fix

1. **Refresh Supabase Schema Cache:**
   - Go to Supabase Dashboard → Settings → API
   - Click "Reload schema cache" button

2. **Restart your app:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Hard refresh browser:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

## Complete Fix: Run All Migrations in Order

If you're setting up from scratch or have multiple errors, run these scripts in order:

1. **Base tables:** `scripts/001-create-tables.sql`
2. **Advanced features:** `scripts/002_enhance_advanced_features.sql`
3. **Fix transaction_type:** `scripts/003_fix_transaction_type_column.sql`
4. **Fix product_id:** `scripts/004_fix_product_id_constraint.sql`

Or run this combined quick fix:

```sql
-- Combined fix for all common issues
ALTER TABLE stock_transactions ALTER COLUMN product_id DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'type') THEN
    ALTER TABLE stock_transactions RENAME COLUMN type TO transaction_type;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_transactions' AND column_name = 'transaction_type') THEN
    ALTER TABLE stock_transactions ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'OUT' CHECK (transaction_type IN ('IN', 'OUT'));
  END IF;
END $$;

ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10, 2);
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('CASH', 'CREDIT'));
```
