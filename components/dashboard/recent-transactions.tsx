import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  Trash2, 
  Package, 
  Beer,
  AlertTriangle,
  Loader2,
  Edit
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { StockTransaction } from "@/lib/types"

interface RecentTransactionsProps {
  transactions: (StockTransaction & { 
    product?: { 
      name: string
      brand: string
      unit_type?: string
      pieces_per_box?: number
    } | null
    total_amount?: number | null
    payment_type?: "CASH" | "CREDIT" | null
  })[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [deleteTransaction, setDeleteTransaction] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDeleteTransaction = async () => {
    if (!deleteTransaction) return

    setIsDeleting(true)
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in to delete transactions")
        return
      }

      // Get transaction details first
      const { data: transaction, error: fetchError } = await supabase
        .from('stock_transactions')
        .select('*, product:products(*)')
        .eq('id', deleteTransaction)
        .single()

      if (fetchError || !transaction) {
        toast.error("Transaction not found")
        return
      }

      // Restore stock - handle box products properly
      if (transaction.type === 'OUT') {
        const product = transaction.product
        let updateData: any = {}

        if (product.unit_type === 'box' && product.pieces_per_box && transaction.unit_sold) {
          if (transaction.unit_sold === 'box') {
            // Restore boxes
            updateData.quantity = product.quantity + transaction.quantity
          } else {
            // Restore pieces - add to remaining_pieces
            const currentRemaining = product.remaining_pieces || 0
            updateData.remaining_pieces = currentRemaining + transaction.quantity
          }
        } else {
          // Regular product or piece-only product
          updateData.quantity = product.quantity + transaction.quantity
        }

        const { error: stockError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', transaction.product_id)

        if (stockError) {
          toast.error("Failed to restore stock")
          return
        }
      }

      // Soft delete the transaction
      const { error: deleteError } = await supabase
        .from('stock_transactions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          delete_reason: deleteReason.trim() || null
        })
        .eq('id', deleteTransaction)

      if (deleteError) {
        toast.error("Failed to delete transaction")
        return
      }

      // Mark associated credit as inactive if it exists
      if (transaction.payment_type === "CREDIT") {
        await supabase
          .from('credits')
          .update({ is_active: false })
          .eq('transaction_id', deleteTransaction)
      }

      toast.success("Transaction deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setDeleteTransaction(null)
      setDeleteReason("")
    }
  }

  const formatTransactionDisplay = (transaction: any) => {
    const { product, quantity, unit_sold } = transaction
    
    if (!product) return { quantity: quantity.toString(), unit: "items" }
    
    if (product.unit_type === "box" && product.pieces_per_box) {
      if (unit_sold === "box") {
        return { 
          quantity: quantity.toString(), 
          unit: "boxes",
          subtext: `(${quantity * product.pieces_per_box} pieces)`
        }
      } else {
        return { 
          quantity: quantity.toString(), 
          unit: "pieces",
          subtext: product.pieces_per_box ? `(from boxes)` : undefined
        }
      }
    }
    
    return { quantity: quantity.toString(), unit: "pieces" }
  }

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
    <>
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
          <div className="space-y-3">
            {transactions.slice(0, 8).map((transaction) => {
              const isStockIn = transaction.type === "IN"
              const date = new Date(transaction.created_at)
              const formattedDate = date.toLocaleDateString("rw-RW", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
              const displayInfo = formatTransactionDisplay(transaction)

              return (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Transaction Type Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${isStockIn ? "bg-success/10" : "bg-secondary"}`}>
                      {isStockIn ? (
                        <ArrowDownToLine className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {transaction.product?.name || "Unknown Product"}
                        </p>
                        {transaction.product?.unit_type === "box" && (
                          <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{transaction.product?.brand}</span>
                        <span>•</span>
                        <span className={isStockIn ? "text-success" : "text-foreground"}>
                          {isStockIn ? "+" : "-"}{displayInfo.quantity} {displayInfo.unit}
                        </span>
                        {displayInfo.subtext && (
                          <>
                            <span>•</span>
                            <span>{displayInfo.subtext}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount & Payment Type */}
                    <div className="text-right flex-shrink-0">
                      {transaction.total_amount ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {transaction.total_amount.toLocaleString()} RWF
                          </p>
                          {transaction.payment_type && (
                            <Badge
                              variant={transaction.payment_type === "CASH" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {transaction.payment_type === "CASH" ? "Cash" : "Credit"}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-muted-foreground text-right flex-shrink-0 min-w-[60px]">
                      {formattedDate}
                    </div>
                  </div>

                  {/* Action Buttons - Only for stock out transactions */}
                  {!isStockIn && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => toast.info("Transaction editing functionality will be implemented in a future update.")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Show more button for mobile */}
          {transactions.length > 8 && (
            <div className="mt-4 text-center">
              <Link href="/dashboard/reports">
                <Button variant="outline" size="sm">
                  View {transactions.length - 8} more transactions
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTransaction} onOpenChange={() => setDeleteTransaction(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Transaction
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the transaction and restore the stock. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="delete-reason" className="text-sm font-medium">
                Reason for deletion (optional)
              </Label>
              <Textarea
                id="delete-reason"
                placeholder="e.g., Wrong quantity entered, duplicate entry..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Transaction
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}