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

        // Load weekly data - pass null as managerId to respect user role
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        const weeklyReport = await reportsService.getWeeklyReport(startOfWeek, null)
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

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Income */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="text-emerald-700">Cash Income</span>
              <div className="p-2 bg-emerald-200 rounded-full">
                <DollarSign className="h-4 w-4 text-emerald-700" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-900">
              {(cashAmount || 0).toLocaleString()} <span className="text-sm font-medium text-emerald-600">RWF</span>
            </div>
            <p className="text-xs text-emerald-600 mt-1 font-semibold">Today's cash sales</p>
          </CardContent>
        </Card>

        {/* Credit Issued */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="text-amber-700">Credit Issued</span>
              <div className="p-2 bg-amber-200 rounded-full">
                <AlertCircle className="h-4 w-4 text-amber-700" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-900">
              {(creditAmount || 0).toLocaleString()} <span className="text-sm font-medium text-amber-600">RWF</span>
            </div>
            <p className="text-xs text-amber-600 mt-1 font-semibold">Today's credit sales</p>
          </CardContent>
        </Card>

        {/* Today's Profit */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="text-blue-700">Today's Profit</span>
              <div className="p-2 bg-blue-200 rounded-full">
                <TrendingUp className="h-4 w-4 text-blue-700" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-900">
              {(profitAmount || 0).toLocaleString()} <span className="text-sm font-medium text-blue-600">RWF</span>
            </div>
            <p className="text-xs text-blue-600 mt-1 font-semibold">Gross profit</p>
            {totalIncome > 0 && (
              <p className="text-xs text-blue-600 mt-2 font-semibold">
                {((profitAmount / totalIncome) * 100).toFixed(1)}% margin
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending Credit */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="text-rose-700">Outstanding Credit</span>
              <div className="p-2 bg-rose-200 rounded-full">
                <Package className="h-4 w-4 text-rose-700" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-900">
              {(stats.pending_credit || 0).toLocaleString()} <span className="text-sm font-medium text-rose-600">RWF</span>
            </div>
            <p className="text-xs text-rose-600 mt-1 font-semibold">To be collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Income Today</p>
                <p className="text-2xl font-black text-foreground mt-1">
                  {(totalIncome || 0).toLocaleString()} RWF
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Customers</p>
                <p className="text-2xl font-black text-foreground mt-1">{stats.total_customers || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Low Stock Items</p>
                <p className="text-2xl font-black text-foreground mt-1">{stats.low_stock_products || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>Performance overview and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Trend</TabsTrigger>
              <TabsTrigger value="breakdown">Payment Breakdown</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-4">
                <div className="h-80 mt-4">
                  {totalIncome > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <YAxis 
                          tick={{ fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                        />
                        <Tooltip 
                          formatter={(value) => `${value.toLocaleString()} RWF`}
                          contentStyle={{ 
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No sales data for today yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Weekly Trend Tab */}
            <TabsContent value="weekly">
              {weeklyData && weeklyData.length > 0 ? (
                <div className="h-80 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <Tooltip 
                        formatter={(value) => `${value.toLocaleString()} RWF`}
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cash"
                        stroke="#10b981"
                        name="Cash"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="credit"
                        stroke="#f59e0b"
                        name="Credit"
                        strokeWidth={3}
                        dot={{ fill: '#f59e0b', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#3b82f6"
                        name="Profit"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No weekly data available yet</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Payment Breakdown Tab */}
            <TabsContent value="breakdown">
              <div className="space-y-4">
                {totalIncome > 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) =>
                            `${name}: ${value.toLocaleString()} RWF (${(percent * 100).toFixed(0)}%)`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `${value.toLocaleString()} RWF`}
                          contentStyle={{ 
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No sales yet today</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-emerald-200 rounded">
                        <DollarSign className="h-4 w-4 text-emerald-700" />
                      </div>
                      <p className="text-xs text-emerald-700 font-bold uppercase">Cash (Immediate)</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-900">
                      {cashAmount.toLocaleString()} RWF
                    </p>
                    <p className="text-xs text-emerald-600 mt-2 font-semibold">
                      {totalIncome > 0
                        ? `${((cashAmount / totalIncome) * 100).toFixed(1)}% of total income`
                        : "0% of total"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 bg-amber-200 rounded">
                        <AlertCircle className="h-4 w-4 text-amber-700" />
                      </div>
                      <p className="text-xs text-amber-700 font-bold uppercase">Credit (IDENI)</p>
                    </div>
                    <p className="text-2xl font-black text-amber-900">
                      {creditAmount.toLocaleString()} RWF
                    </p>
                    <p className="text-xs text-amber-600 mt-2 font-semibold">
                      {totalIncome > 0
                        ? `${((creditAmount / totalIncome) * 100).toFixed(1)}% of total income`
                        : "0% of total"}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-right flex items-center justify-end gap-2">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
        Last updated: {refreshTime.toLocaleTimeString()}
      </div>
    </div>
  )
}

export default AdvancedDashboardStats