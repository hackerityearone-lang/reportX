# Inventory Corruption Fix - Implementation Guide

## Problem Analysis

The system had corrupted inventory data where:
- `quantity = -86` (negative stock - impossible state)
- `boxes_in_stock = 130` (positive boxes)
- `pieces_per_box = 24`
- Inconsistent relationship: `130 * 24 = 3120` pieces vs `-86` quantity

This indicates missing synchronization between the legacy `quantity` field and the new `boxes_in_stock` + `remaining_pieces` fields.

## Solution Overview

### 1. Correct Stock Model (Implemented)
- **quantity**: Single source of truth (total pieces)
- **boxes_in_stock**: Derived field = `FLOOR(quantity / pieces_per_box)`
- **remaining_pieces**: Derived field = `quantity % pieces_per_box`

### 2. Validation Rules (Enforced)
- `quantity >= 0` (no negative stock)
- `remaining_pieces < pieces_per_box` (valid remaining pieces)
- `quantity = (boxes_in_stock * pieces_per_box) + remaining_pieces` (consistency)

## Implementation Steps

### Step 1: Apply Database Fixes

Execute the SQL scripts in this order:

```sql
-- 1. Fix corrupted inventory data
\i scripts/fix-inventory-corruption.sql

-- 2. Fix specific AMSTEL product
\i scripts/fix-amstel-inventory.sql

-- 3. Set up validation and monitoring
\i scripts/stock-validation-monitoring.sql
```

### Step 2: Update Application Code

Replace the old stock-out service:

```bash
# Backup current service
cp lib/supabase/stock-out-service.ts lib/supabase/stock-out-service-backup.ts

# Replace with fixed version
cp lib/supabase/stock-out-service-fixed.ts lib/supabase/stock-out-service.ts
```

### Step 3: Validation and Testing

Run comprehensive validation:

```sql
-- Check all products for issues
SELECT * FROM comprehensive_stock_validation() WHERE validation_status != 'OK';

-- Generate audit report
SELECT * FROM generate_stock_audit_report();

-- Auto-fix any remaining issues
SELECT * FROM auto_fix_stock_inconsistencies();
```

## Key Changes Made

### 1. Database Functions

#### `maintain_stock_consistency()` Trigger
- Automatically calculates derived fields from `quantity`
- Prevents negative stock
- Ensures consistency on every update

#### `update_product_stock()` Function
- Atomic stock updates
- Validates stock availability before update
- Converts units properly (box ↔ piece)

#### Validation Functions
- `comprehensive_stock_validation()`: Identifies all stock issues
- `auto_fix_stock_inconsistencies()`: Automatically fixes common issues
- `generate_stock_audit_report()`: Provides health overview

### 2. Application Logic

#### Stock Validation
```typescript
// Before any stock operation
await validateStockAvailability(items)
```

#### Atomic Updates
```typescript
// Use database function for atomic updates
await updateProductStock(productId, quantityChange, unitType)
```

#### Unit Conversion
```typescript
// Always convert to pieces for validation
const requestedPieces = convertToPieces(quantity, unitType, piecesPerBox)
```

## Future Prevention Measures

### 1. Always Use Atomic Functions
- Never update `boxes_in_stock` or `remaining_pieces` directly
- Always use `update_product_stock()` function
- Let triggers handle derived field calculations

### 2. Validation Before Operations
```typescript
// Validate before every stock operation
if (requestedPieces > product.quantity) {
  throw new Error('Insufficient stock')
}
```

### 3. Regular Monitoring
```sql
-- Run daily health check
SELECT * FROM stock_health_dashboard;

-- Weekly comprehensive validation
SELECT * FROM comprehensive_stock_validation() WHERE validation_status != 'OK';
```

### 4. Transaction Logging
- All stock changes are logged in `stock_transactions`
- Audit trail maintained in `audit_logs`
- Can recalculate stock from transaction history

## Testing the Fix

### 1. Verify AMSTEL Product
```sql
SELECT 
    name,
    quantity,
    boxes_in_stock,
    remaining_pieces,
    pieces_per_box,
    (boxes_in_stock * pieces_per_box + remaining_pieces) as calculated_total
FROM products 
WHERE id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b';
```

Expected result:
- `quantity >= 0`
- `quantity = calculated_total`
- `remaining_pieces < pieces_per_box`

### 2. Test Stock Operations
```typescript
// Test wholesale sale (boxes)
await stockOutService.processStockOut({
  items: [{
    product_id: 'amstel-id',
    quantity: 2,
    unit_type: 'box',
    selling_price: 24000
  }],
  payment_method: 'cash'
})

// Test retail sale (pieces)
await stockOutService.processStockOut({
  items: [{
    product_id: 'amstel-id',
    quantity: 5,
    unit_type: 'piece',
    selling_price: 1500
  }],
  payment_method: 'cash'
})
```

### 3. Validate Consistency
```sql
-- Should return no issues
SELECT * FROM comprehensive_stock_validation() 
WHERE product_id = '9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b'
  AND validation_status != 'OK';
```

## Monitoring and Maintenance

### Daily Checks
```sql
-- Quick health check
SELECT * FROM stock_health_dashboard;
```

### Weekly Audits
```sql
-- Comprehensive validation
SELECT * FROM generate_stock_audit_report();
```

### Monthly Reconciliation
```sql
-- Recalculate from transaction history
SELECT * FROM recalculate_stock_from_transactions();
```

## Rollback Plan

If issues occur, you can rollback:

```sql
-- Restore from backup (if created)
INSERT INTO products SELECT * FROM products_backup_before_fix 
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  boxes_in_stock = EXCLUDED.boxes_in_stock,
  remaining_pieces = EXCLUDED.remaining_pieces;
```

## Success Criteria

✅ **No negative stock values**
✅ **Consistent derived fields**
✅ **Valid remaining pieces**
✅ **Atomic stock operations**
✅ **Comprehensive validation**
✅ **Audit trail maintained**
✅ **Future corruption prevented**

The fix ensures that:
1. All existing corrupted data is corrected
2. Future stock operations maintain consistency
3. Comprehensive monitoring prevents future issues
4. The system is mathematically correct and audit-ready