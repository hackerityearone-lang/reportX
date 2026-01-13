import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpFromLine, Banknote, CreditCard } from "lucide-react"
import type { StockTransaction, Product } from "@/lib/types"

interface RecentStockOutProps {
  transactions: (StockTransaction & { product: Product | null })[]
}

export function RecentStockOut({ transactions }: RecentStockOutProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ibisohotse Vuba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ArrowUpFromLine className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nta bisohotse bihari</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ibisohotse Vuba</CardTitle>
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

          return (
            <div key={transaction.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border">
              <div className="p-2 rounded-lg bg-secondary">
                <ArrowUpFromLine className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{transaction.product?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">-{transaction.quantity}</p>
                {transaction.total_amount && (
                  <p className="text-xs text-muted-foreground">{transaction.total_amount.toLocaleString()} RWF</p>
                )}
              </div>
              <Badge variant={transaction.payment_type === "CASH" ? "default" : "secondary"} className="shrink-0">
                {transaction.payment_type === "CASH" ? (
                  <>
                    <Banknote className="h-3 w-3 mr-1" />
                    Cash
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3 w-3 mr-1" />
                    Ideni
                  </>
                )}
              </Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
