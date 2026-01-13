"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CreditCard,
  Package,
  AlertTriangle,
  TrendingUp,
  Calendar,
} from "lucide-react"
import type { Product, Credit } from "@/lib/types"

interface ReportData {
  stockInCount: number
  stockInTotal: number
  stockInQuantity: number
  stockOutCount: number
  stockOutTotal: number
  stockOutQuantity: number
  cashSalesCount: number
  cashSalesTotal: number
  creditSalesCount: number
  creditSalesTotal: number
}

interface StockReportData {
  totalProducts: number
  totalStock: number
  lowStockProducts: Product[]
  outOfStockProducts: Product[]
  totalValue: number
}

interface CreditReportData {
  totalCredits: number
  pendingCredits: Credit[]
  paidCredits: Credit[]
  totalOwed: number
  totalPaid: number
}

interface ReportsTabsProps {
  dailyReport: ReportData
  weeklyReport: ReportData
  monthlyReport: ReportData
  stockReport: StockReportData
  creditReport: CreditReportData
}

function SalesReportCard({ data, title }: { data: ReportData; title: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        {title}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Stock In */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-success" />
              Stock In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transactions:</span>
              <span className="font-medium">{data.stockInCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{data.stockInQuantity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="font-bold text-success">{data.stockInTotal.toLocaleString()} RWF</span>
            </div>
          </CardContent>
        </Card>

        {/* Stock Out */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-primary" />
              Stock Out
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transactions:</span>
              <span className="font-medium">{data.stockOutCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{data.stockOutQuantity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="font-bold text-primary">{data.stockOutTotal.toLocaleString()} RWF</span>
            </div>
          </CardContent>
        </Card>

        {/* Cash Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-5 w-5 text-success" />
              Cash Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transactions Sold:</span>
              <span className="font-medium">{data.cashSalesCount}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="font-bold text-success">{data.cashSalesTotal.toLocaleString()} RWF</span>
            </div>
          </CardContent>
        </Card>

        {/* Credit Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-warning" />
              Credit Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transactions Sold:</span>
              <span className="font-medium">{data.creditSalesCount}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="font-bold text-warning">{data.creditSalesTotal.toLocaleString()} RWF</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">Total Sales</span>
            </div>
            <span className="text-2xl font-bold text-primary">{data.stockOutTotal.toLocaleString()} RWF</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StockReportCard({ data }: { data: StockReportData }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        Stock Report
      </h3>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-foreground">{data.totalProducts}</p>
            <p className="text-xs text-muted-foreground">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-foreground">{data.totalStock.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Stock</p>
          </CardContent>
        </Card>
        <Card className={data.lowStockProducts.length > 0 ? "border-warning" : ""}>
          <CardContent className="pt-4">
            <p
              className={`text-2xl font-bold ${data.lowStockProducts.length > 0 ? "text-warning" : "text-foreground"}`}
            >
              {data.lowStockProducts.length}
            </p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-success">{data.totalValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Stock Value (RWF)</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products - use min_stock_level */}
      {data.lowStockProducts.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Products ({data.lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.lowStockProducts.map((product) => {
              const percentage = (product.quantity / (product.min_stock_level * 2)) * 100
              return (
                <div key={product.id} className="flex items-center gap-4 p-2 rounded-lg bg-warning/5">
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                  </div>
                  <div className="w-24">
                    <Progress value={percentage} className="h-2 [&>div]:bg-warning" />
                  </div>
                  <p className={`font-bold ${product.quantity === 0 ? "text-destructive" : "text-warning"}`}>
                    {product.quantity} / {product.min_stock_level}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CreditReportCard({ data }: { data: CreditReportData }) {
  const paidPercentage =
    data.totalOwed + data.totalPaid > 0 ? (data.totalPaid / (data.totalOwed + data.totalPaid)) * 100 : 0

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        Credit Report
      </h3>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-foreground">{data.totalCredits}</p>
            <p className="text-xs text-muted-foreground">Total Credits</p>
          </CardContent>
        </Card>
        <Card className={data.pendingCredits.length > 0 ? "border-warning" : ""}>
          <CardContent className="pt-4">
            <p className={`text-2xl font-bold ${data.pendingCredits.length > 0 ? "text-warning" : "text-foreground"}`}>
              {data.pendingCredits.length}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-warning">{data.totalOwed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Outstanding (RWF)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-success">{data.totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Paid (RWF)</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium">{Math.round(paidPercentage)}%</span>
            </div>
            <Progress value={paidPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{data.totalPaid.toLocaleString()} RWF paid</span>
              <span>{data.totalOwed.toLocaleString()} RWF outstanding</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Credits - use amount instead of amount_owed */}
      {data.pendingCredits.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pending Credits ({data.pendingCredits.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.pendingCredits.slice(0, 5).map((credit) => {
              return (
                <div key={credit.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <div>
                    <p className="font-medium">{credit.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(credit.created_at).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <p className="font-bold text-warning">{credit.amount.toLocaleString()} RWF</p>
                </div>
              )
            })}
            {data.pendingCredits.length > 5 && (
              <p className="text-center text-sm text-muted-foreground">+{data.pendingCredits.length - 5} more credits</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function ReportsTabs({ dailyReport, weeklyReport, monthlyReport, stockReport, creditReport }: ReportsTabsProps) {
  return (
    <Tabs defaultValue="daily" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="daily">Daily</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="monthly">Monthly</TabsTrigger>
        <TabsTrigger value="stock">Stock</TabsTrigger>
        <TabsTrigger value="credits">Credits</TabsTrigger>
      </TabsList>

      <TabsContent value="daily">
        <SalesReportCard data={dailyReport} title="Daily Report" />
      </TabsContent>

      <TabsContent value="weekly">
        <SalesReportCard data={weeklyReport} title="Weekly Report" />
      </TabsContent>

      <TabsContent value="monthly">
        <SalesReportCard data={monthlyReport} title="Monthly Report" />
      </TabsContent>

      <TabsContent value="stock">
        <StockReportCard data={stockReport} />
      </TabsContent>

      <TabsContent value="credits">
        <CreditReportCard data={creditReport} />
      </TabsContent>
    </Tabs>
  )
}
