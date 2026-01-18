import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { StockTransaction } from "@/lib/types"

interface RecentTransactionsProps {
  transactions: (StockTransaction & { 
    product?: { name: string; brand: string } | null
    total_amount?: number | null
    payment_type?: "CASH" | "CREDIT" | null
  })[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Recent Transactions
        </CardTitle>
        <Link href="/dashboard/reports">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Quantity</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((transaction) => {
                const isStockIn = transaction.type === "IN"
                const date = new Date(transaction.created_at)
                const formattedDate = date.toLocaleDateString("rw-RW", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })

                return (
                  <tr key={transaction.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isStockIn ? "bg-success/10" : "bg-secondary"}`}>
                          {isStockIn ? (
                            <ArrowDownToLine className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{isStockIn ? "Ibyinjiye" : "Ibisohotse"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm font-medium text-foreground">{transaction.product?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{transaction.product?.brand}</p>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-medium ${isStockIn ? "text-success" : "text-foreground"}`}>
                        {isStockIn ? "+" : "-"}
                        {transaction.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {transaction.total_amount ? (
                        <div>
                          <p className="text-sm font-medium">{transaction.total_amount.toLocaleString()} RWF</p>
                          {transaction.payment_type && (
                            <Badge
                              variant={transaction.payment_type === "CASH" ? "default" : "secondary"}
                              className="text-xs mt-1"
                            >
                              {transaction.payment_type === "CASH" ? "Amafaranga" : "Ideni"}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-muted-foreground">{formattedDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}