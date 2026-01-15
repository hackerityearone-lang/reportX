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
      .select("id, name, brand, quantity, min_stock_level, price");

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

    let todayCash = 0, todayCredit = 0, todayProfit = 0, todayUnits = 0
    todayTxs?.forEach(tx => {
      todayUnits += (tx.quantity || 0)
      todayProfit += (tx.total_profit || 0)
      if (tx.payment_type === "CASH") todayCash += (tx.total_amount || 0)
      else todayCredit += (tx.total_amount || 0)
    })

    // Get total customers
    const { count: totalCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Get pending credits
    const { data: credits } = await supabase
      .from("credits")
      .select("amount_owed, amount_paid")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .neq("status", "PAID")

    const pendingCredit = credits?.reduce((sum, c) => sum + (c.amount_owed - c.amount_paid), 0) || 0

    // Get low stock count
    const { data: products } = await supabase
      .from("products")
      .select("quantity, min_stock_level")

    const lowStockCount = products?.filter(p => p.quantity <= p.min_stock_level).length || 0

    return {
      todayCash,
      todayCredit,
      todayProfit,
      totalCustomers: totalCustomers || 0,
      pendingCredit,
      lowStockProducts: lowStockCount
    }
  }
}