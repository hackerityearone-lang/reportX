"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { StockInForm } from "@/components/stock/stock-in-form"
import { RecentStockIn } from "@/components/stock/recent-stock-in"
import { ArrowDownToLine, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Product, StockTransaction } from "@/lib/types"

export default function StockInPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const [{ data: productsData }, { data: transactionsData }] = await Promise.all([
        supabase.from("products").select("*").eq("is_archived", false).order("name"),
        supabase
          .from("stock_transactions")
          .select("*, product:products(*)")
          .eq("user_id", user.id)
          .eq("type", "IN")
          .order("created_at", { ascending: false })
          .limit(20),
      ])

      setProducts(productsData || [])
      setTransactions((transactionsData || []) as (StockTransaction & { product: Product | null })[])
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

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
        <StockInForm products={products} onTransactionSuccess={loadData} />

        {/* Recent Stock In */}
        <RecentStockIn transactions={transactions} />
      </div>
    </div>
  )
}
