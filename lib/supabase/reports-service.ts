"use client"

import { createClient } from "@/lib/supabase/client"
import type { DailyReport } from "@/lib/types"

const supabase = createClient()

// Helper function to get user role
async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  return profile?.role || 'MANAGER'
}

export const reportsService = {
  async getDailyReport(date: Date, managerId?: string | null): Promise<DailyReport | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    
    const userRole = await getUserRole()
    const reportDate = date.toLocaleDateString('en-CA')
    
    // Build query
    let query = supabase
      .from("daily_reports")
      .select("*")
      .eq("report_date", reportDate)
    
    // Filter logic: 
    // - If managerId provided (BOSS viewing specific manager), use that
    // - If BOSS with no managerId (viewing all), don't filter
    // - If MANAGER, use their own ID
    if (managerId) {
      query = query.eq("user_id", managerId)
    } else if (userRole !== 'BOSS') {
      query = query.eq("user_id", user.id)
    }
    
    const { data, error } = await query.single()

    if (!data || data.total_cash_income === 0 || (error && error.code === "PGRST116")) {
      return await this.calculateDailyReport(date, managerId)
    }
    return data
  },

  async calculateDailyReport(date: Date, managerId?: string | null): Promise<DailyReport> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    
    const userRole = await getUserRole()
    const reportDate = date.toLocaleDateString('en-CA')
    const start = new Date(date); start.setHours(0,0,0,0)
    const end = new Date(date); end.setHours(23,59,59,999)

    // Build transactions query
    let txQuery = supabase
      .from("stock_transactions")
      .select("payment_type, total_amount, total_profit, quantity")
      .eq("type", "OUT")
      .eq("is_deleted", false)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
    
    // Filter logic: managerId > own ID > all (for BOSS)
    if (managerId) {
      txQuery = txQuery.eq("user_id", managerId)
    } else if (userRole !== 'BOSS') {
      txQuery = txQuery.eq("user_id", user.id)
    }
    
    const { data: txs } = await txQuery

    let cash = 0, credit = 0, profit = 0, units = 0
    txs?.forEach(tx => {
      units += (tx.quantity || 0)
      profit += (tx.total_profit || 0)
      if (tx.payment_type === "CASH") cash += (tx.total_amount || 0)
      else credit += (tx.total_amount || 0)
    })

    // Build products query - update to use new schema fields
    let productsQuery = supabase.from("products").select("boxes_in_stock, open_box_pieces, pieces_per_box, buy_price_per_box").eq("is_archived", false)
    
    // Filter logic for products
    if (managerId) {
      productsQuery = productsQuery.eq("user_id", managerId)
    } else if (userRole !== 'BOSS') {
      productsQuery = productsQuery.eq("user_id", user.id)
    }
    
    const { data: products } = await productsQuery
    const stockVal = products?.reduce((sum, p) => {
      const totalPieces = (p.boxes_in_stock * (p.pieces_per_box || 1)) + (p.open_box_pieces || 0)
      return sum + (totalPieces * (p.buy_price_per_box || 0) / (p.pieces_per_box || 1))
    }, 0) || 0

    const { data: report } = await supabase
      .from("daily_reports")
      .upsert({
        user_id: managerId || user.id,
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

  async getWeeklyReport(startOfWeek: Date, managerId?: string | null) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    
    const userRole = await getUserRole()
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    // Build transactions query
    let txQuery = supabase
      .from("stock_transactions")
      .select("created_at, payment_type, total_amount, total_profit, quantity")
      .eq("type", "OUT")
      .eq("is_deleted", false)
      .gte("created_at", startOfWeek.toISOString())
      .lte("created_at", endOfWeek.toISOString())
      .order("created_at")
    
    // Filter logic
    if (managerId) {
      txQuery = txQuery.eq("user_id", managerId)
    } else if (userRole !== 'BOSS') {
      txQuery = txQuery.eq("user_id", user.id)
    }
    
    const { data: txs } = await txQuery

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

  async getMonthlyReport(startOfMonth: Date, managerId?: string | null) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")
    
    const userRole = await getUserRole()
    
    // Calculate end of month
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)
    endOfMonth.setHours(23, 59, 59, 999)

    // Build transactions query
    let txQuery = supabase
      .from("stock_transactions")
      .select("created_at, payment_type, total_amount, total_profit, quantity")
      .eq("type", "OUT")
      .eq("is_deleted", false)
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString())
      .order("created_at")
    
    // Filter logic
    if (managerId) {
      txQuery = txQuery.eq("user_id", managerId)
    } else if (userRole !== 'BOSS') {
      txQuery = txQuery.eq("user_id", user.id)
    }
    
    const { data: txs } = await txQuery

    // Group by week
    const weekMap = new Map<number, { cash: number; credit: number; profit: number; units: number; startDate: string; endDate: string }>()
    
    // Initialize weeks in the month
    let currentWeekStart = new Date(startOfMonth)
    let weekNumber = 1
    
    while (currentWeekStart <= endOfMonth) {
      const weekEnd = new Date(currentWeekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      // Don't go beyond month end
      if (weekEnd > endOfMonth) {
        weekEnd.setTime(endOfMonth.getTime())
      }
      
      weekMap.set(weekNumber, {
        cash: 0,
        credit: 0,
        profit: 0,
        units: 0,
        startDate: currentWeekStart.toLocaleDateString('en-CA'),
        endDate: weekEnd.toLocaleDateString('en-CA')
      })
      
      currentWeekStart = new Date(weekEnd)
      currentWeekStart.setDate(currentWeekStart.getDate() + 1)
      weekNumber++
    }

    // Aggregate transactions by week
    txs?.forEach(tx => {
      const txDate = new Date(tx.created_at)
      
      // Find which week this transaction belongs to
      let targetWeek = 1
      for (const [week, data] of weekMap.entries()) {
        const weekStart = new Date(data.startDate)
        const weekEnd = new Date(data.endDate)
        weekEnd.setHours(23, 59, 59, 999)
        
        if (txDate >= weekStart && txDate <= weekEnd) {
          targetWeek = week
          break
        }
      }
      
      const weekData = weekMap.get(targetWeek)
      if (weekData) {
        weekData.units += tx.quantity || 0
        weekData.profit += tx.total_profit || 0
        if (tx.payment_type === "CASH") {
          weekData.cash += tx.total_amount || 0
        } else {
          weekData.credit += tx.total_amount || 0
        }
      }
    })

    // Convert to array format
    const weekBreakdown = Array.from(weekMap.entries()).map(([weekNum, data]) => ({
      weekLabel: `Week ${weekNum}`,
      weekNumber: weekNum,
      startDate: data.startDate,
      endDate: data.endDate,
      cash: data.cash,
      credit: data.credit,
      profit: data.profit,
      units: data.units,
      total: data.cash + data.credit
    }))

    // Calculate totals
    const totalCash = weekBreakdown.reduce((sum, week) => sum + week.cash, 0)
    const totalCredit = weekBreakdown.reduce((sum, week) => sum + week.credit, 0)
    const totalProfit = weekBreakdown.reduce((sum, week) => sum + week.profit, 0)
    const totalUnits = weekBreakdown.reduce((sum, week) => sum + week.units, 0)

    return {
      startDate: startOfMonth.toLocaleDateString('en-CA'),
      endDate: endOfMonth.toLocaleDateString('en-CA'),
      totalCash,
      totalCredit,
      totalProfit,
      totalUnits,
      totalIncome: totalCash + totalCredit,
      weekBreakdown
    }
  },

  async getDetailedDailyLog(date: Date, managerId?: string | null) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const userRole = await getUserRole()
    const start = new Date(date); start.setHours(0,0,0,0)
    const end = new Date(date); end.setHours(23,59,59,999)

    // 1. Fetch Sales with proper product joins and credit status
    let salesQuery = supabase
      .from("stock_transactions")
      .select(`
        id, created_at, total_amount, payment_type,
        customers(id, name, phone),
        stock_out_items(
          id, 
          quantity, 
          products!inner(id, name)
        ),
        credits(id, is_paid, status)
      `)
      .eq("type", "OUT")
      .eq("is_deleted", false)
      .eq("stock_out_items.products.is_archived", false)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order('created_at', { ascending: false })
    
    // Filter logic
    if (managerId) {
      salesQuery = salesQuery.eq("user_id", managerId)
    } else if (userRole !== 'BOSS') {
      salesQuery = salesQuery.eq("user_id", user.id)
    }
    
    const { data: sales } = await salesQuery

    // Add is_credit_paid flag to each sale
    const salesWithCreditStatus = (sales || []).map((sale: any) => {
      const isPaid = sale.credits && sale.credits.length > 0 && (sale.credits[0].is_paid || sale.credits[0].status === "PAID");
      return {
        ...sale,
        is_credit_paid: isPaid
      };
    });

    // 2. Fetch Stock In
    let additionsQuery = supabase
      .from("stock_transactions")
      .select(`id, created_at, quantity, total_amount, products!inner(id, name)`)
      .eq("type", "IN")
      .eq("products.is_archived", false)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
    
    // Filter logic
    if (managerId) {
      additionsQuery = additionsQuery.eq("user_id", managerId)
    } else if (userRole !== 'BOSS') {
      additionsQuery = additionsQuery.eq("user_id", user.id)
    }
    
    const { data: additions } = await additionsQuery

    // 3. Get Low Stock Products - update to use new schema
    let productsQuery = supabase
      .from("products")
      .select("id, name, brand, boxes_in_stock, open_box_pieces, pieces_per_box, min_stock_level, buy_price_per_box")
      .eq("is_archived", false)
    
    // Filter logic
    if (managerId) {
      productsQuery = productsQuery.eq("user_id", managerId)
    } else if (userRole !== 'BOSS') {
      productsQuery = productsQuery.eq("user_id", user.id)
    }
    
    const { data: allProducts, error: productsError } = await productsQuery

    if (productsError) {
      console.error("ERROR fetching products:", productsError);
    }

    const lowStock = (allProducts || []).filter(p => {
      const totalPieces = (p.boxes_in_stock * (p.pieces_per_box || 1)) + (p.open_box_pieces || 0)
      const minAllowed = p.min_stock_level != null ? Number(p.min_stock_level) : 10
      return totalPieces <= minAllowed
    }).sort((a, b) => {
      const aTotal = (a.boxes_in_stock * (a.pieces_per_box || 1)) + (a.open_box_pieces || 0)
      const bTotal = (b.boxes_in_stock * (b.pieces_per_box || 1)) + (b.open_box_pieces || 0)
      return aTotal - bTotal
    })

    return { 
      sales: salesWithCreditStatus, 
      additions: additions || [],
      lowStock: lowStock 
    }
  },

  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const userRole = await getUserRole()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    // Get today's transactions
    let todayTxQuery = supabase
      .from("stock_transactions")
      .select("payment_type, total_amount, total_profit, quantity")
      .eq("type", "OUT")
      .eq("is_deleted", false)
      .gte("created_at", today.toISOString())
      .lte("created_at", endOfDay.toISOString())
    
    if (userRole !== 'BOSS') {
      todayTxQuery = todayTxQuery.eq("user_id", user.id)
    }
    
    const { data: todayTxs } = await todayTxQuery

    let today_cash = 0, today_credit = 0, today_profit = 0, todayUnits = 0
    todayTxs?.forEach(tx => {
      todayUnits += (tx.quantity || 0)
      today_profit += (tx.total_profit || 0)
      if (tx.payment_type === "CASH") today_cash += (tx.total_amount || 0)
      else today_credit += (tx.total_amount || 0)
    })

    // Get total customers
    let customersQuery = supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false)
    
    if (userRole !== 'BOSS') {
      customersQuery = customersQuery.eq("user_id", user.id)
    }
    
    const { count: totalCustomers } = await customersQuery

    // Get pending credits
    let creditsQuery = supabase
      .from("credits")
      .select("amount_owed, amount_paid")
      .eq("is_active", true)
      .neq("status", "PAID")
    
    if (userRole !== 'BOSS') {
      creditsQuery = creditsQuery.eq("user_id", user.id)
    }
    
    const { data: credits } = await creditsQuery
    const pending_credit = credits?.reduce((sum, c) => sum + (c.amount_owed - c.amount_paid), 0) || 0

    // Get low stock count (exclude archived products) - update to use new schema
    let productsQuery = supabase
      .from("products")
      .select("boxes_in_stock, open_box_pieces, pieces_per_box, min_stock_level")
      .eq("is_archived", false)
    
    if (userRole !== 'BOSS') {
      productsQuery = productsQuery.eq("user_id", user.id)
    }
    
    const { data: products } = await productsQuery
    const low_stock_products = products?.filter(p => {
      const totalPieces = (p.boxes_in_stock * (p.pieces_per_box || 1)) + (p.open_box_pieces || 0)
      return totalPieces <= p.min_stock_level
    }).length || 0

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