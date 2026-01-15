"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DollarSign, TrendingUp, Users, AlertCircle, Package, Loader2 } from "lucide-react"
import type { DashboardStatsSummary } from "@/lib/types"
import { reportsService } from "@/lib/supabase/reports-service"

export function AdvancedDashboardStats() {
  const [stats, setStats] = useState<DashboardStatsSummary | null>(null)
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTime, setRefreshTime] = useState<Date>(new Date())

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const dashboardStats = await reportsService.getDashboardStats()
        setStats(dashboardStats)

        // Load weekly data
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        const weeklyReport = await reportsService.getWeeklyReport(startOfWeek)
        setWeeklyData(weeklyReport.dayBreakdown)
      } catch (error) {
        console.error("Failed to load dashboard stats:", error)
      } finally {
        setIsLoading(false)
        setRefreshTime(new Date())
      }
    }

    loadStats()

    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || !stats) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const cashAmount = stats.today_cash || 0
  const creditAmount = stats.today_credit || 0
  const profitAmount = stats.today_profit || 0
  const totalIncome = cashAmount + creditAmount
  const chartData = [
    { name: "Cash", value: cashAmount, fill: "#10b981" },
    { name: "Credit", value: creditAmount, fill: "#f59e0b" },
  ]

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Income */}
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Cash Income</span>
              <DollarSign className="h-4 w-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {(cashAmount || 0).toLocaleString()} RWF
            </div>
            <p className="text-xs text-muted-foreground mt-1">Today's cash sales</p>
          </CardContent>
        </Card>

        {/* Credit Issued */}
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Credit Issued</span>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {(creditAmount || 0).toLocaleString()} RWF
            </div>
            <p className="text-xs text-muted-foreground mt-1">Today's credit sales</p>
          </CardContent>
        </Card>

        {/* Today's Profit */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Today's Profit</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(profitAmount || 0).toLocaleString()} RWF
            </div>
            <p className="text-xs text-muted-foreground mt-1">Gross profit</p>
            {totalIncome > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {((profitAmount / totalIncome) * 100).toFixed(1)}% margin
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending Credit */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Outstanding Credit</span>
              <Package className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {(stats.pending_credit || 0).toLocaleString()} RWF
            </div>
            <p className="text-xs text-muted-foreground mt-1">To be collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>Today's performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Trend</TabsTrigger>
              <TabsTrigger value="breakdown">Payment Breakdown</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold mt-2">
                      {(totalIncome || 0).toLocaleString()} RWF
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-sm text-muted-foreground">Customers</p>
                    <p className="text-2xl font-bold mt-2">{stats.total_customers || 0}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                    <p className="text-2xl font-bold mt-2">{stats.low_stock_products || 0}</p>
                  </div>
                </div>

                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Weekly Trend Tab */}
            <TabsContent value="weekly">
              {weeklyData && weeklyData.length > 0 ? (
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cash"
                        stroke="#10b981"
                        name="Cash"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="credit"
                        stroke="#f59e0b"
                        name="Credit"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#3b82f6"
                        name="Profit"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No weekly data available yet
                </div>
              )}
            </TabsContent>

            {/* Payment Breakdown Tab */}
            <TabsContent value="breakdown">
              <div className="space-y-4">
                {totalIncome > 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) =>
                            `${name}: ${value.toLocaleString()} RWF`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No sales yet today
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                    <p className="text-xs text-muted-foreground">Cash (Immediate)</p>
                    <p className="text-xl font-bold text-success mt-1">
                      {cashAmount.toLocaleString()} RWF
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalIncome > 0
                        ? `${((cashAmount / totalIncome) * 100).toFixed(1)}% of total`
                        : "0%"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <p className="text-xs text-muted-foreground">Credit (IDENI)</p>
                    <p className="text-xl font-bold text-warning mt-1">
                      {creditAmount.toLocaleString()} RWF
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalIncome > 0
                        ? `${((creditAmount / totalIncome) * 100).toFixed(1)}% of total`
                        : "0%"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-right">
        Last updated: {refreshTime.toLocaleTimeString()}
      </div>
    </div>
  )
}

export default AdvancedDashboardStats
