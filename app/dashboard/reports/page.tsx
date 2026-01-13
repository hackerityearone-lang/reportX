import { createClient } from "@/lib/supabase/server"
import { ReportsTabs } from "@/components/reports/reports-tabs"
import { ReportsHeader } from "@/components/reports/reports-header"

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get date ranges
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [{ data: products }, { data: transactions }, { data: credits }] = await Promise.all([
    supabase.from("products").select("*"),
    supabase
      .from("stock_transactions")
      .select("*, product:products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("credits").select("*"),
  ])

  // Calculate reports data
  const allTransactions = transactions || []

  const filterByDate = (items: typeof allTransactions, startDate: Date) => {
    return items.filter((t) => new Date(t.created_at) >= startDate)
  }

  const calculateReport = (items: typeof allTransactions) => {
    const stockIn = items.filter((t) => t.type === "STOCK_IN")
    const stockOut = items.filter((t) => t.type === "STOCK_OUT")
    const cashSales = stockOut.filter((t) => t.payment_type === "CASH")
    const creditSales = stockOut.filter((t) => t.payment_type === "CREDIT")

    return {
      stockInCount: stockIn.length,
      stockInTotal: stockIn.reduce((sum, t) => sum + (t.amount_owed || 0), 0),
      stockInQuantity: stockIn.reduce((sum, t) => sum + t.quantity, 0),
      stockOutCount: stockOut.length,
      stockOutTotal: stockOut.reduce((sum, t) => sum + (t.amount_owed || 0), 0),
      stockOutQuantity: stockOut.reduce((sum, t) => sum + t.quantity, 0),
      cashSalesCount: cashSales.length,
      cashSalesTotal: cashSales.reduce((sum, t) => sum + (t.amount_owed || 0), 0),
      creditSalesCount: creditSales.length,
      creditSalesTotal: creditSales.reduce((sum, t) => sum + (t.amount_owed || 0), 0),
    }
  }

  const dailyReport = calculateReport(filterByDate(allTransactions, todayStart))
  const weeklyReport = calculateReport(filterByDate(allTransactions, weekStart))
  const monthlyReport = calculateReport(filterByDate(allTransactions, monthStart))

  const stockReport = {
    totalProducts: products?.length || 0,
    totalStock: products?.reduce((sum, p) => sum + p.quantity, 0) || 0,
    lowStockProducts: products?.filter((p) => p.quantity <= p.min_stock_level) || [],
    outOfStockProducts: products?.filter((p) => p.quantity === 0) || [],
    totalValue: products?.reduce((sum, p) => sum + p.quantity * p.price, 0) || 0,
  }

  const unpaidCredits = credits?.filter((c) => !c.is_paid) || []
  const paidCredits = credits?.filter((c) => c.is_paid) || []

  const creditReport = {
    totalCredits: credits?.length || 0,
    pendingCredits: unpaidCredits,
    partialCredits: [],
    paidCredits: paidCredits,
    totalOwed: unpaidCredits.reduce((sum, c) => sum + c.amount, 0),
    totalPaid: paidCredits.reduce((sum, c) => sum + c.amount, 0),
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <ReportsHeader 
        title="Reports"
        subtitle="View daily, weekly, and monthly reports"
      />

      {/* Reports Tabs */}
      <ReportsTabs
        dailyReport={dailyReport}
        weeklyReport={weeklyReport}
        monthlyReport={monthlyReport}
        stockReport={stockReport}
        creditReport={creditReport}
      />
    </div>
  )
}
