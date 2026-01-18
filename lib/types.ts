export type UserRole = "MANAGER" | "BOSS"

export type UserStatus = "PENDING" | "APPROVED" | "BLOCKED"

export type TransactionType = "IN" | "OUT"

export type PaymentType = "CASH" | "CREDIT"

export type CreditStatus = "PENDING" | "PARTIAL" | "PAID"

export type InsightType = "LOW_STOCK" | "UNUSUAL_ACTIVITY" | "RESTOCK" | "CREDIT_RISK" | "SALES_TREND"

export type InsightPriority = "LOW" | "MEDIUM" | "HIGH"

export interface Product {
  id: string
  name: string
  brand: string
  quantity: number
  min_stock_level: number // Updated from minimum_stock_level
  image_url: string | null
  price: number // Buying/cost price
  selling_price: number // NEW: Selling/retail price
  created_at: string
  updated_at: string
  user_id?: string
}

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  status?: UserStatus
  phone_number: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string
  name: string
  phone: string | null
  email: string | null
  total_credit: number
  created_at: string
  updated_at: string
  is_archived: boolean
}

export interface StockOutItem {
  id: string
  transaction_id: string
  product_id: string
  quantity: number
  selling_price: number
  buying_price: number
  profit_per_unit: number
  subtotal: number
  subtotal_profit: number
  created_at: string
  product?: Product
}

export interface StockTransaction {
  id: string
  product_id: string
  customer_id: string | null
  type: TransactionType // Changed from transaction_type
  quantity: number
  payment_type: PaymentType | null
  amount_owed: number | null // Changed from total_amount
  customer_name: string | null
  phone: string | null
  invoice_number: string | null
  selling_price: number | null
  buying_price: number | null
  profit: number | null
  total_profit: number | null
  notes: string | null
  created_at: string
  user_id: string
  is_cancelled: boolean
  cancelled_at: string | null
  cancelled_reason: string | null
  product?: Product
  customer?: Customer
  items?: StockOutItem[] // For multiple items in one sale
}

export interface Credit {
  id: string
  customer_id: string | null
  customer_name: string
  transaction_id: string | null
  amount_owed: number
  amount_paid: number
  status: CreditStatus
  is_active: boolean
  payment_due_date: string | null
  created_at: string
  updated_at: string
  user_id: string
  customer?: Customer
  transaction?: StockTransaction
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  created_at: string
}

export interface DailyReport {
  id: string
  user_id: string
  report_date: string
  total_cash_income: number
  total_credit_issued: number
  total_profit: number
  total_stock_value: number
  total_units_sold: number
  created_at: string
  updated_at: string
}

export interface TransactionSummary {
  id: string
  invoice_number: string
  user_id: string
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  transaction_type: TransactionType
  payment_type: PaymentType
  total_amount: number
  total_profit: number
  quantity: number
  transaction_date: string
  created_at: string
  is_cancelled: boolean
  product_count: number
}

export interface DashboardStatsSummary {
  today_cash: number
  today_credit: number
  today_profit: number
  total_customers: number
  pending_credit: number
  low_stock_products: number
}

export interface CreditPayment {
  id: string
  credit_id: string
  amount: number
  payment_date: string
  notes: string | null
  user_id: string
}

export interface AIInsight {
  id: string
  type: InsightType
  title: string
  description: string
  priority: InsightPriority
  is_read: boolean
  created_at: string
}

// Dashboard stats
export interface DashboardStats {
  totalProducts: number
  totalStock: number
  lowStockCount: number
  todaySales: number
  todayRevenue: number
  totalCredits: number
  pendingCreditsAmount: number
}

