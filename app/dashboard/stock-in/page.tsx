import { createClient } from "@/lib/supabase/server"
import { StockInForm } from "@/components/stock/stock-in-form"
import { RecentStockIn } from "@/components/stock/recent-stock-in"
import { ArrowDownToLine } from "lucide-react"

export default async function StockInPage() {
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
      .eq("type", "IN")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ArrowDownToLine className="h-7 w-7 text-primary" />
          Ibyinjiye (Stock In)
        </h1>
        <p className="text-muted-foreground">Andika ibicuruzwa bishya byinjiye mu bubiko</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stock In Form */}
        <StockInForm products={products || []} />

        {/* Recent Stock In */}
        <RecentStockIn transactions={transactions || []} />
      </div>
    </div>
  )
}
