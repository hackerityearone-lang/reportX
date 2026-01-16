"use client"

import { createClient } from "@/lib/supabase/client"
import type { DailyReport } from "@/lib/types"

const supabase = createClient()

export const reportsService = {
  async getDailyReport(date: Date): Promise<DailyReport | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    const reportDate = date.toLocaleDateString('en-CA') 
    const { data, error } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("user_id", user.id)
      .eq("report_date", reportDate)
      .single()

    if (!data || data.total_cash_income === 0 || (error && error.code === "PGRST116")) {
      return await this.calculateDailyReport(date)
    }
    return data
  },

  async calculateDailyReport(date: Date): Promise<DailyReport> {
    const { data: { user } } = await supabase.auth.getUser()
    const reportDate = date.toLocaleDateString('en-CA')
    const start = new Date(date); start.setHours(0,0,0,0)
    const end = new Date(date); end.setHours(23,59,59,999)

    const { data: txs } = await supabase
      .from("stock_transactions")
      .select("payment_type, total_amount, total_profit, quantity")
      .eq("user_id", user?.id)
      .eq("type", "OUT")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    let cash = 0, credit = 0, profit = 0, units = 0
    txs?.forEach(tx => {
      units += (tx.quantity || 0)
      profit += (tx.total_profit || 0)
      if (tx.payment_type === "CASH") cash += (tx.total_amount || 0)
      else credit += (tx.total_amount || 0)
    })

    const { data: products } = await supabase.from("products").select("quantity, price")
    const stockVal = products?.reduce((sum, p) => sum + (p.quantity * p.price), 0) || 0

    const { data: report } = await supabase
      .from("daily_reports")
      .upsert({
        user_id: user?.id,
        report_date: reportDate,
        total_cash_income: cash,
        total_credit_issued: credit,
        total_profit: profit,
        total_stock_value: stockVal,
        total_units_sold: units,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,report_date" })
      .select().single()

    return report as DailyReport
  },

  async getWeeklyReport(startOfWeek: Date) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Get all transactions for the week
    const { data: txs } = await supabase
      .from("stock_transactions")
      .select("created_at, payment_type, total_amount, total_profit, quantity")
      .eq("user_id", user.id)
      .eq("type", "OUT")
      .gte("created_at", startOfWeek.toISOString())
      .lte("created_at", endOfWeek.toISOString())
      .order("created_at")

    // Group by day
    const dayMap = new Map<string, { cash: number; credit: number; profit: number; units: number }>()
    
    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      const dateKey = day.toLocaleDateString('en-CA')
      dayMap.set(dateKey, { cash: 0, credit: 0, profit: 0, units: 0 })
    }

    // Aggregate transactions by day
    txs?.forEach(tx => {
      const txDate = new Date(tx.created_at)
      const dateKey = txDate.toLocaleDateString('en-CA')
      const dayData = dayMap.get(dateKey)
      
      if (dayData) {
        dayData.units += tx.quantity || 0
        dayData.profit += tx.total_profit || 0
        if (tx.payment_type === "CASH") {
          dayData.cash += tx.total_amount || 0
        } else {
          dayData.credit += tx.total_amount || 0
        }
      }
    })

    // Convert to array format for charts
    const dayBreakdown = Array.from(dayMap.entries()).map(([dateKey, data]) => {
      const date = new Date(dateKey)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return {
        date: dayNames[date.getDay()],
        fullDate: dateKey,
        cash: data.cash,
        credit: data.credit,
        profit: data.profit,
        units: data.units,
        total: data.cash + data.credit
      }
    })

    // Calculate totals
    const totalCash = dayBreakdown.reduce((sum, day) => sum + day.cash, 0)
    const totalCredit = dayBreakdown.reduce((sum, day) => sum + day.credit, 0)
    const totalProfit = dayBreakdown.reduce((sum, day) => sum + day.profit, 0)
    const totalUnits = dayBreakdown.reduce((sum, day) => sum + day.units, 0)

    return {
      startDate: startOfWeek.toLocaleDateString('en-CA'),
      endDate: endOfWeek.toLocaleDateString('en-CA'),
      totalCash,
      totalCredit,
      totalProfit,
      totalUnits,
      totalIncome: totalCash + totalCredit,
      dayBreakdown
    }
  },

  async getDetailedDailyLog(date: Date) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const start = new Date(date); start.setHours(0,0,0,0)
    const end = new Date(date); end.setHours(23,59,59,999)

    // 1. Fetch Sales with proper product joins
    const { data: sales } = await supabase
      .from("stock_transactions")
      .select(`
        id, created_at, total_amount, payment_type,
        customers(id, name, phone),
        stock_out_items(
          id, 
          quantity, 
          products(id, name)
        )
      `)
      .eq("user_id", user.id)
      .eq("type", "OUT")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order('created_at', { ascending: false });

    // 2. Fetch Stock In
    const { data: additions } = await supabase
      .from("stock_transactions")
      .select(`id, created_at, quantity, total_amount, products(id, name)`)
      .eq("user_id", user.id)
      .eq("type", "IN")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString());

    // 3. Get Low Stock Products
    const { data: allProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, brand, quantity, min_stock_level, price")
      .eq("is_archived", false); // Exclude archived products

    if (productsError) {
      console.error("ERROR fetching products:", productsError);
    }

    const lowStock = (allProducts || []).filter(p => {
      const currentQty = Number(p.quantity || 0);
      const minAllowed = p.min_stock_level != null ? Number(p.min_stock_level) : 10;
      return currentQty <= minAllowed;
    }).sort((a, b) => Number(a.quantity) - Number(b.quantity));

    return { 
      sales: sales || [], 
      additions: additions || [],
      lowStock: lowStock 
    }
  },

  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    // Get today's transactions
    const { data: todayTxs } = await supabase
      .from("stock_transactions")
      .select("payment_type, total_amount, total_profit, quantity")
      .eq("user_id", user.id)
      .eq("type", "OUT")
      .gte("created_at", today.toISOString())
      .lte("created_at", endOfDay.toISOString())

    let today_cash = 0, today_credit = 0, today_profit = 0, todayUnits = 0
    todayTxs?.forEach(tx => {
      todayUnits += (tx.quantity || 0)
      today_profit += (tx.total_profit || 0)
      if (tx.payment_type === "CASH") today_cash += (tx.total_amount || 0)
      else today_credit += (tx.total_amount || 0)
    })

    // Get total customers
    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_archived", false)

    // Get pending credits
    const { data: credits } = await supabase
      .from("credits")
      .select("amount_owed, amount_paid")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .neq("status", "PAID")

    const pending_credit = credits?.reduce((sum, c) => sum + (c.amount_owed - c.amount_paid), 0) || 0

    // Get low stock count (exclude archived products)
    const { data: products } = await supabase
      .from("products")
      .select("quantity, min_stock_level")
      .eq("is_archived", false)

    const low_stock_products = products?.filter(p => p.quantity <= p.min_stock_level).length || 0

    return {
      today_cash,
      today_credit,
      today_profit,
      total_customers: totalCustomers || 0,
      pending_credit,
      low_stock_products
    }
  }
}