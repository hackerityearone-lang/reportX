import { createClient } from "@/lib/supabase/server"
import { StockOutForm } from "@/components/stock/stock-out-form"
import { RecentStockOut } from "@/components/stock/recent-stock-out"
import { ArrowUpFromLine } from "lucide-react"

export default async function StockOutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: products }, { data: transactions }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase
      .from("stock_transactions")
      .select("*, product:products(*)")
      .eq("user_id", user.id)
      .eq("type", "OUT")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowUpFromLine className="h-7 w-7 text-primary" />
          Ibisohotse (Stock Out)
        </h1>
        <p className="text-muted-foreground">Andika ibigurishijwe - amafaranga cyangwa amadeni</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock Out Form */}
        <StockOutForm products={products || []} />

        {/* Recent Stock Out */}
        <RecentStockOut transactions={transactions || []} />
      </div>
    </div>
  )
}
