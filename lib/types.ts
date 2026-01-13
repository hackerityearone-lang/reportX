export type UserRole = "USER" | "STOCK_BOSS"

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
  min_stock_level: number // Changed from minimum_stock_level
  image_url: string | null
  price: number // Changed from price_per_unit
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  phone_number: string | null
  created_at: string
  updated_at: string
}

export interface StockTransaction {
  id: string
  product_id: string
  type: TransactionType // Changed from transaction_type
  quantity: number
  payment_type: PaymentType | null
  amount_owed: number | null // Changed from total_amount
  customer_name: string | null
  notes: string | null
  created_at: string
  user_id: string
  product?: Product
}

export interface Credit {
  id: string
  customer_name: string
  transaction_id: string | null
  amount: number // This is the total owed amount
  is_paid: boolean // Changed from status enum
  paid_at: string | null
  created_at: string
  transaction?: StockTransaction
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

// Kinyarwanda translations
export const KY_TRANSLATIONS = {
  stockIn: "Ibyinjiye",
  stockOut: "Ibisohotse",
  credit: "Ideni",
  credits: "Amadeni",
  cash: "Amafaranga",
  report: "Raporo",
  reports: "Raporo",
  remainingStock: "Ibisigaye",
  products: "Ibicuruzwa",
  dashboard: "Ikibaho",
  dailyReport: "Raporo y'umunsi",
  weeklyReport: "Raporo y'icyumweru",
  monthlyReport: "Raporo y'ukwezi",
  creditReport: "Raporo y'amadeni",
  quantity: "Umubare",
  price: "Igiciro",
  total: "Igiteranyo",
  customer: "Umukiriya",
  date: "Itariki",
  lowStock: "Stock Nke",
  welcome: "Murakaza neza",
  login: "Injira",
  logout: "Sohoka",
  signUp: "Iyandikishe",
  settings: "Igenamiterere",
  save: "Bika",
  cancel: "Hagarika",
  delete: "Siba",
  edit: "Hindura",
  add: "Ongeraho",
  search: "Shakisha",
  filter: "Shungura",
  all: "Byose",
  today: "Uyu munsi",
  thisWeek: "Iki cyumweru",
  thisMonth: "Uku kwezi",
  paid: "Yishyuwe",
  pending: "Bitegereje",
  partial: "Igice",
} as const
