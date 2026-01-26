"use client"

import { useState, useEffect } from "react"
import { RecentStockOut } from "@/components/stock/recent-stock-out"
import { AdvancedStockOutForm } from "@/components/stock/advanced-stock-out-form"
import { stockOutService } from "@/lib/supabase/stock-out-service"
import { Loader2, TrendingDown, DollarSign, Package, TrendingUp, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { StockTransaction } from "@/lib/types"

export default function StockOutPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stats
  const [todayStats, setTodayStats] = useState({
    totalCash: 0,
    totalCredit: 0,
    totalProfit: 0,
    totalUnits: 0,
    transactionCount: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load transactions
      const data = await stockOutService.getStockOuts({ includeDeleted: false })
      
      // Transform data to include total_amount if not present
      const enhancedData = data.map((tx: any) => {
        // Check if total_amount already exists
        if (tx.total_amount !== undefined) {
          return tx
        }
        
        // Calculate total_amount from available fields
        // Try different possible field name combinations
        const quantity = tx.quantity || tx.qty || 0
        const price = tx.unit_price || tx.price || tx.selling_price || tx.amount || 0
        
        return {
          ...tx,
          total_amount: quantity * price
        }
      })
      
      setTransactions(enhancedData)

      // Load today's stats
      const stats = await stockOutService.getDailySalesSummary(new Date())
      setTodayStats(stats)
    } catch (err: any) {
      console.error("Failed to load stock out data:", err)
      setError(err.message || "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh data after successful transaction
  const handleTransactionSuccess = () => {
    loadData()
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Out</h1>
          <p className="text-muted-foreground mt-1">
            Record sales, manage invoices, and track inventory
          </p>
        </div>
        <Button
          onClick={loadData}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayStats.transactionCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {todayStats.totalCash.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">RWF today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {todayStats.totalCredit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">RWF today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayStats.totalUnits}
            </div>
            <p className="text-xs text-muted-foreground">Items today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {todayStats.totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">RWF today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-2 lg:grid-cols-1">
        {/* Stock Out Form */}
        <div>
          <AdvancedStockOutForm onTransactionSuccess={loadData} />
        </div>

        {/* Recent Transactions */}
        <div>
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading transactions...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <RecentStockOut 
              transactions={transactions} 
              onTransactionUpdated={loadData}
            />
          )}
        </div>
      </div>
    </div>
  )
}