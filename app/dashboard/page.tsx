import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/components/dashboard/stats"
import { ProductsOverview } from "@/components/dashboard/products-overview"
import { AIInsightsPanel } from "@/components/dashboard/ai-insights"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { QuickActions } from "@/components/dashboard/quick-actions"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // products: no user_id filter (shared table)
  // credits: no user_id column, filter by is_paid instead of status
  // stock_transactions: has user_id, uses "type" not "transaction_type"
  const [{ data: products }, { data: transactions }, { data: credits }] = await Promise.all([
    supabase.from("products").select("*"),
    supabase
      .from("stock_transactions")
      .select("*, product:products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("credits").select("*").eq("is_paid", false),
  ])

  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayTransactions =
    transactions?.filter((t) => {
      const transDate = new Date(t.created_at)
      return transDate >= today && t.type === "OUT"
    }) || []

  const stats = {
    totalProducts: products?.length || 0,
    totalStock: products?.reduce((sum, p) => sum + p.quantity, 0) || 0,
    lowStockCount: products?.filter((p) => p.quantity <= p.min_stock_level).length || 0,
    todaySales: todayTransactions.length,
    todayRevenue: todayTransactions.reduce((sum, t) => sum + (t.amount_owed || 0), 0),
    totalCredits: credits?.length || 0,
    pendingCreditsAmount: credits?.reduce((sum, c) => sum + c.amount, 0) || 0,
  }

  // Generate AI insights
  const insights = generateAIInsights(products || [], transactions || [], credits || [])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Murakaza neza!</h1>
        <p className="text-muted-foreground">Reba uko stock yawe imeze uyu munsi</p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Insights */}
        <div className="lg:col-span-1">
          <AIInsightsPanel insights={insights} />
        </div>

        {/* Products Overview */}
        <div className="lg:col-span-2">
          <ProductsOverview products={products || []} />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={transactions || []} />
    </div>
  )
}

// AI Insights Generator
function generateAIInsights(
  products: Array<{ id: string; name: string; brand: string; quantity: number; min_stock_level: number }>,
  transactions: Array<{
    id: string
    type: string
    quantity: number
    created_at: string
    product_id: string
    amount_owed: number | null
  }>,
  credits: Array<{
    id: string
    customer_name: string
    amount: number
    is_paid: boolean
  }>,
) {
  const insights: Array<{
    id: string
    type: string
    title: string
    titleKy: string
    description: string
    descriptionKy: string
    priority: "LOW" | "MEDIUM" | "HIGH"
    productId?: string
    value?: number
  }> = []

  // Low stock alerts - use min_stock_level
  const lowStockProducts = products.filter((p) => p.quantity <= p.min_stock_level)
  lowStockProducts.forEach((product) => {
    insights.push({
      id: `low-stock-${product.id}`,
      type: "LOW_STOCK",
      title: `Low Stock: ${product.name}`,
      titleKy: `Stock Nke: ${product.name}`,
      description: `${product.name} has only ${product.quantity} units left. Minimum level is ${product.min_stock_level}.`,
      descriptionKy: `${product.name} isigaye ${product.quantity} gusa. Umubare ntarengwa ni ${product.min_stock_level}.`,
      priority: product.quantity === 0 ? "HIGH" : "MEDIUM",
      productId: product.id,
      value: product.quantity,
    })
  })

  // Credit alerts - use amount instead of amount_owed/amount_paid
  const unpaidCredits = credits.filter((c) => !c.is_paid && c.amount > 50000)
  unpaidCredits.forEach((credit) => {
    insights.push({
      id: `high-credit-${credit.id}`,
      type: "CREDIT_RISK",
      title: `High Credit: ${credit.customer_name}`,
      titleKy: `Ideni Rinini: ${credit.customer_name}`,
      description: `${credit.customer_name} has an outstanding balance of ${credit.amount.toLocaleString()} RWF.`,
      descriptionKy: `${credit.customer_name} afite ideni rya ${credit.amount.toLocaleString()} RWF.`,
      priority: "MEDIUM",
      value: credit.amount,
    })
  })

  // Sales trend - use "type" column and amount_owed
  const last7Days = transactions.filter((t) => {
    const date = new Date(t.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return date >= weekAgo && t.type === "OUT"
  })

  if (last7Days.length > 0) {
    const totalSales = last7Days.reduce((sum, t) => sum + (t.amount_owed || 0), 0)
    const avgDaily = totalSales / 7

    insights.push({
      id: "sales-trend-weekly",
      type: "SALES_TREND",
      title: "Weekly Sales Summary",
      titleKy: "Incamake y'Icyumweru",
      description: `You made ${last7Days.length} sales worth ${totalSales.toLocaleString()} RWF this week. Average daily: ${Math.round(avgDaily).toLocaleString()} RWF.`,
      descriptionKy: `Wagurishije inshuro ${last7Days.length} zingana ${totalSales.toLocaleString()} RWF iki cyumweru. Umubare ku munsi: ${Math.round(avgDaily).toLocaleString()} RWF.`,
      priority: "LOW",
      value: totalSales,
    })
  }

  // Restock recommendations - use min_stock_level
  const productsNeedingRestock = products.filter(
    (p) => p.quantity <= p.min_stock_level * 1.5 && p.quantity > p.min_stock_level,
  )
  if (productsNeedingRestock.length > 0) {
    insights.push({
      id: "restock-recommendation",
      type: "RESTOCK",
      title: `Restock ${productsNeedingRestock.length} Products Soon`,
      titleKy: `Ongera Stock ya Ibicuruzwa ${productsNeedingRestock.length}`,
      description: `${productsNeedingRestock.map((p) => p.name).join(", ")} will need restocking soon.`,
      descriptionKy: `${productsNeedingRestock.map((p) => p.name).join(", ")} bazakenera stock vuba.`,
      priority: "LOW",
    })
  }

  return insights.slice(0, 5)
}
