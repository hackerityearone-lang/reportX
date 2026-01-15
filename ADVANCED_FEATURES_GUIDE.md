# Advanced Stock Management System Implementation Guide

## Overview

This guide documents the implementation of advanced features for the stock management system:
- **Advanced Stock Out (Invoice System)** with multiple products per transaction
- **Customer Management** with credit tracking
- **Credit Payment System** with partial payments
- **Dashboard Analytics** with real-time stats
- **Reports & Analytics** with print/export capabilities

---

## Files Created/Modified

### 1. Database Schema Migration
**File**: `scripts/002_enhance_advanced_features.sql`

**What it adds**:
- `customers` table - store customer records
- `stock_out_items` table - multiple products per stock out
- Enhanced `stock_transactions` table with new columns:
  - `customer_id`, `invoice_number`, `selling_price`, `buying_price`
  - `profit`, `total_profit`, `is_cancelled`, `cancelled_at`, `cancelled_reason`
- Enhanced `credits` table with `customer_id`, `is_active`, `payment_due_date`
- `audit_logs` table - track all system changes
- `daily_reports` table - cache daily analytics
- Comprehensive triggers and functions for:
  - Auto-generating invoice numbers
  - Updating customer credit balance
  - Calculating profit per item
  - Audit logging
  - Daily report calculations

**To apply**:
```bash
# Go to Supabase dashboard
# SQL Editor → Create a new query
# Copy entire script: scripts/002_enhance_advanced_features.sql
# Run it
```

---

### 2. TypeScript Types
**File**: `lib/types.ts` (Updated)

**New interfaces**:
```typescript
interface Customer { /* customer records */ }
interface StockOutItem { /* line items in sales */ }
interface StockTransaction { /* enhanced with new fields */ }
interface Credit { /* enhanced */ }
interface AuditLog { /* for tracking changes */ }
interface DailyReport { /* cached daily analytics */ }
interface TransactionSummary { /* invoice view */ }
interface DashboardStatsSummary { /* dashboard metrics */ }
```

---

### 3. API Services

#### A. Customer Service
**File**: `lib/supabase/customer-service.ts`

**Functions**:
- `getCustomers()` - fetch all customers
- `getCustomerById(id)` - single customer
- `searchCustomers(query)` - search by name/phone
- `createCustomer(data)` - add new customer
- `updateCustomer(id, updates)` - edit customer
- `archiveCustomer(id)` - soft delete
- `getCustomerCreditBalance(customerId)` - total owed
- `getCustomerCreditHistory(customerId)` - payment history

#### B. Stock Out Service
**File**: `lib/supabase/stock-out-service.ts`

**Functions**:
- `createAdvancedStockOut(request)` - create invoice with multiple items
  - Validates stock availability
  - Creates/links customer
  - Generates invoice number
  - Calculates profit per item
  - Updates stock quantities
  - Creates credit record if needed
- `getStockOuts(filters)` - fetch sales with items
- `getStockOutById(id)` - single sale with all details
- `cancelStockOut(id, reason)` - soft delete & restore stock
- `getDailySalesSummary(date)` - daily totals

#### C. Credit Service
**File**: `lib/supabase/credit-service.ts`

**Functions**:
- `getCredits(filters)` - all active credits
- `getCreditById(id)` - single credit with payments
- `getCustomerCredits(customerId)` - customer's credits
- `recordCreditPayment(creditId, amount, notes)` - partial payment
- `getCreditPaymentHistory(creditId)` - payment timeline
- `getCustomerTotalCredit(customerId)` - total balance
- `getCreditStats()` - pending, partial, paid totals
- `settleCredit(creditId)` - mark as complete
- `getOverdueCredits()` - past due accounts

#### D. Reports Service
**File**: `lib/supabase/reports-service.ts`

**Functions**:
- `getDashboardStats()` - today's metrics
- `calculateDashboardStats()` - fallback calculation
- `getDailyReport(date)` - daily totals
- `calculateDailyReport(date)` - compute & cache
- `getWeeklyReport(startDate)` - week breakdown
- `getMonthlyReport(year, month)` - all days in month
- `getTransactionSummaries(filters)` - detailed transactions
- `exportReportToCSV(report)` - CSV export
- `getSalesAnalytics(startDate, endDate)` - customer analysis

---

### 4. Frontend Components

#### A. Advanced Stock Out Form
**File**: `components/stock/advanced-stock-out-form.tsx`

**Features**:
- ✅ Invoice-style interface with dynamic items
- ✅ Add/remove products on the fly
- ✅ Real-time subtotal & profit calculation
- ✅ Stock validation for each item
- ✅ Customer selection or creation
- ✅ Payment type: Cash or Credit
- ✅ Auto-generates invoice number
- ✅ Shows running totals
- ✅ Form validation
- ✅ Error/success messages

**Usage**:
```tsx
import AdvancedStockOutForm from '@/components/stock/advanced-stock-out-form'

export default function StockOutPage({ products }) {
  return <AdvancedStockOutForm products={products} />
}
```

#### B. Customers Manager
**File**: `components/customers/customers-manager.tsx`

**Features**:
- ✅ List all customers
- ✅ Add new customer
- ✅ Edit customer details
- ✅ Archive (soft delete) customer
- ✅ Display current credit balance
- ✅ Search & filter
- ✅ Show phone, email

**Usage**:
```tsx
import CustomersManager from '@/components/customers/customers-manager'

export default function CustomersPage() {
  return <CustomersManager />
}
```

#### C. Credit Payment Manager
**File**: `components/credits/credit-payment-manager.tsx`

**Features**:
- ✅ Tabs for Pending, Partial, Paid credits
- ✅ Quick payment recording
- ✅ Inline payment form
- ✅ Payment history display
- ✅ Balance tracking
- ✅ Progress bars
- ✅ Payment notes

**Usage**:
```tsx
import CreditPaymentManager from '@/components/credits/credit-payment-manager'

export default function CreditPage() {
  return <CreditPaymentManager />
}
```

#### D. Advanced Dashboard Stats
**File**: `components/dashboard/advanced-dashboard-stats.tsx`

**Features**:
- ✅ Key metrics cards (cash, credit, profit, outstanding)
- ✅ Real-time updates (30s refresh)
- ✅ Bar charts for cash vs credit
- ✅ Line charts for weekly trends
- ✅ Pie charts for payment breakdown
- ✅ Low stock alerts
- ✅ Customer count
- ✅ Profit margin calculation

**Usage**:
```tsx
import AdvancedDashboardStats from '@/components/dashboard/advanced-dashboard-stats'

export default function DashboardPage() {
  return <AdvancedDashboardStats />
}
```

#### E. Advanced Reports Panel
**File**: `components/reports/advanced-reports-panel.tsx`

**Features**:
- ✅ Daily reports with date picker
- ✅ Weekly reports with breakdown
- ✅ Monthly reports with charts
- ✅ Print functionality
- ✅ CSV export
- ✅ Detailed summaries
- ✅ Profit analytics
- ✅ Unit sold tracking

**Usage**:
```tsx
import AdvancedReportsPanel from '@/components/reports/advanced-reports-panel'

export default function ReportsPage() {
  return <AdvancedReportsPanel />
}
```

---

## Implementation Steps

### Step 1: Apply Database Schema
1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Copy-paste `scripts/002_enhance_advanced_features.sql`
4. Click Run

### Step 2: Update App Routes
Add new pages to your app:

```
app/dashboard/
├── customers/
│   └── page.tsx          (show CustomersManager)
├── credits/
│   └── page.tsx          (show CreditPaymentManager)
└── reports/
    └── page.tsx          (show AdvancedReportsPanel)
```

Example `app/dashboard/customers/page.tsx`:
```tsx
import CustomersManager from '@/components/customers/customers-manager'

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customers</h1>
      <CustomersManager />
    </div>
  )
}
```

### Step 3: Update Stock Out Page
Replace or enhance current stock out form:

```tsx
import AdvancedStockOutForm from '@/components/stock/advanced-stock-out-form'
import { getProducts } from '@/lib/supabase/server'

export default async function StockOutPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sales / Stock Out</h1>
      <AdvancedStockOutForm products={products} />
    </div>
  )
}
```

### Step 4: Update Dashboard
Replace or enhance current dashboard:

```tsx
import AdvancedDashboardStats from '@/components/dashboard/advanced-dashboard-stats'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <AdvancedDashboardStats />
    </div>
  )
}
```

### Step 5: Update Navigation
Add links to new pages in your sidebar:

```tsx
<nav>
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/dashboard/stock-out">Sales (Advanced)</Link>
  <Link href="/dashboard/customers">Customers</Link>
  <Link href="/dashboard/credits">Credit Management</Link>
  <Link href="/dashboard/reports">Reports</Link>
</nav>
```

---

## Key Features Explained

### 1. Invoice Number Generation
- **Format**: `INV-YYYYMMDD-0001`
- **Auto-generated** by database trigger
- **Unique** per day
- **Stored** in `stock_transactions.invoice_number`

### 2. Profit Tracking
- **Per Item**:
  - `profit_per_unit = selling_price - buying_price`
  - `subtotal_profit = quantity * profit_per_unit`
- **Per Invoice**:
  - `total_profit = SUM(subtotal_profit)` for all items
- **Automatically calculated** by database

### 3. Customer Credit System
- **Storage**: Linked to `customers` table
- **Multiple Credits**: One customer can have multiple active credits
- **Partial Payments**: Track each payment separately
- **Auto Status Update**:
  - `PENDING` = No payments yet
  - `PARTIAL` = Some payments made
  - `PAID` = Fully settled
- **Audit Trail**: All payments logged in `credit_payments`

### 4. Stock Management
- **Multi-item Sales**: One invoice can sell multiple products
- **Stock Validation**: Prevents overselling
- **Auto-deduction**: Stock reduced when sale completes
- **Cancellation Handling**: Stock restored if sale cancelled

### 5. Reports & Analytics
- **Daily Caching**: Results stored in `daily_reports` for speed
- **Weekly Breakdown**: Day-by-day aggregation
- **Monthly Summary**: All days in month
- **Export Ready**: CSV export for Excel
- **Print Friendly**: Format for A4 paper

### 6. Audit Trail
- **Logged Events**: INSERT, UPDATE, DELETE on key tables
- **Stored**: `audit_logs` table with timestamp
- **Fields Captured**: `old_values` and `new_values` as JSON
- **User Tracking**: Records `user_id` for each action

---

## Usage Examples

### Create a Sale with Multiple Products
```typescript
const stockOutService = require('@/lib/supabase/stock-out-service')

// Create or use existing customer
const customer = {
  name: "John's Shop",
  phone: "+250123456789",
  email: "john@shop.rw"
}

// Create sale
const transaction = await stockOutService.createAdvancedStockOut({
  customer,
  payment_type: "CREDIT",
  items: [
    {
      product_id: "prod-1",
      quantity: 10,
      selling_price: 2000,
      buying_price: 1500
    },
    {
      product_id: "prod-2",
      quantity: 5,
      selling_price: 3000,
      buying_price: 2200
    }
  ],
  notes: "Regular order"
})

// Result includes:
// - invoice_number: "INV-20260115-0001"
// - total_amount: 35000
// - total_profit: 4000
```

### Record a Credit Payment
```typescript
const creditService = require('@/lib/supabase/credit-service')

await creditService.recordCreditPayment(
  creditId: "credit-123",
  amount: 10000,
  notes: "Partial payment - check #456"
)

// Updates credit status automatically:
// PENDING → PARTIAL (if some paid)
// PARTIAL → PAID (if fully paid)
```

### Get Daily Report
```typescript
const reportsService = require('@/lib/supabase/reports-service')

const report = await reportsService.getDailyReport(new Date())

// Returns:
// {
//   total_cash_income: 50000,
//   total_credit_issued: 30000,
//   total_profit: 12000,
//   total_units_sold: 25,
//   total_stock_value: 500000
// }
```

---

## Best Practices

### 1. Invoice Management
- ✅ Always use auto-generated invoice numbers
- ✅ Don't allow duplicate invoice numbers
- ✅ Cancel instead of delete if needed
- ✅ Keep cancellation reason for audit

### 2. Credit Management
- ✅ Create customer record before credit
- ✅ Link credit to customer, not just customer_name
- ✅ Record payments immediately (don't batch)
- ✅ Verify payment amount ≤ remaining balance
- ✅ Add notes for traceability

### 3. Stock Handling
- ✅ Always validate stock before creating sale
- ✅ Use transactions to prevent race conditions
- ✅ Don't manually edit stock (let triggers handle it)
- ✅ Keep historical stock values in reports

### 4. Reporting
- ✅ Run daily reports at end of day
- ✅ Cache results in `daily_reports` table
- ✅ Don't query raw transactions for reports (use views)
- ✅ Export before year-end for backup

### 5. Security
- ✅ All queries use RLS policies (row-level security)
- ✅ Users can only see their own data
- ✅ Audit log captures all changes
- ✅ Soft deletes preserve data history

---

## Troubleshooting

### Issue: Invoice number not generating
**Solution**: Check if database trigger `trigger_auto_invoice` exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_invoice';
```

### Issue: Credit status not updating after payment
**Solution**: Verify trigger `trigger_update_credit_status` is active
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_credit_status';
```

### Issue: Stock not deducted
**Solution**: Check if trigger `trigger_update_product_quantity` exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_product_quantity';
```

### Issue: Customer credit balance not calculating
**Solution**: Manually recalculate using function
```sql
UPDATE customers 
SET total_credit = calculate_customer_total_credit(id)
WHERE id = 'customer-uuid';
```

---

## Performance Considerations

### Indexes
The schema includes these indexes for speed:
- `idx_customers_user_id`, `idx_customers_phone`
- `idx_stock_out_items_transaction_id`, `idx_stock_out_items_product_id`
- `idx_stock_transactions_customer_id`, `idx_stock_transactions_invoice`
- `idx_stock_transactions_created_at`
- `idx_credits_customer_id`, `idx_credits_status`
- `idx_audit_logs_created_at`
- `idx_daily_reports_user_date`

### Views
- `transaction_summary` - materialized view for quick invoice lookups

### Caching Strategy
- Daily reports cached in `daily_reports` table
- Dashboard stats calculated on-demand (30s refresh)
- Weekly/monthly aggregated on-the-fly

---

## Next Steps

1. ✅ Apply database schema
2. ✅ Import components into pages
3. ✅ Update navigation/routing
4. ✅ Test with sample data
5. ✅ Train users on new features
6. ✅ Monitor audit logs for issues
7. ✅ Regularly export reports for backup

---

## Support

For issues or questions:
1. Check database triggers are active
2. Verify RLS policies allow access
3. Check audit logs for errors
4. Review console errors in browser dev tools
5. Test with fresh sample data

---

**Implementation Complete!** 🎉

All advanced features are ready to use. Start with the Dashboard to see real-time stats, then create your first sale using the Advanced Stock Out form.
