"use client"

import { AdvancedDashboardStats } from "@/components/dashboard/advanced-dashboard-stats"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { StockTransaction } from "@/lib/types"

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('stock_transactions')
          .select(`
            *,
            product:products(name, brand, unit_type, pieces_per_box),
            customer:customers(name)
          `)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (error) throw error
        setTransactions(data || [])
      } catch (err) {
        console.error('Failed to load transactions:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Advanced Dashboard with real-time stats and charts */}
      <AdvancedDashboardStats />
      
      {/* Recent Transactions */}
      {!isLoading && <RecentTransactions transactions={transactions} />}
    </div>
  )
}
