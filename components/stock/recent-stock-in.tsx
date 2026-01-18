import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownToLine } from "lucide-react"
import type { StockTransaction, Product } from "@/lib/types"

interface RecentStockInProps {
  transactions: (StockTransaction & { product: Product | null })[]
}

export function RecentStockIn({ transactions }: RecentStockInProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ibyinjiye Vuba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ArrowDownToLine className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nta byinjiye bihari</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ibyinjiye Vuba</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((transaction) => {
          const date = new Date(transaction.created_at)
          const formattedDate = date.toLocaleDateString("rw-RW", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })

          // Calculate total cost for stock-in transactions
          const totalCost = transaction.buying_price && transaction.quantity 
            ? transaction.buying_price * transaction.quantity 
            : null

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-success/5 border border-success/20"
            >
              <div className="p-2 rounded-lg bg-success/10">
                <ArrowDownToLine className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{transaction.product?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-success">+{transaction.quantity}</p>
                {totalCost && (
                  <p className="text-xs text-muted-foreground">{totalCost.toLocaleString()} RWF</p>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}