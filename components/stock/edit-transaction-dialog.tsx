"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Edit, Package, AlertTriangle, Calculator, Save } from "lucide-react"
import { toast } from "sonner"
import type { StockTransaction, Product, UnitType } from "@/lib/types"

interface EditTransactionDialogProps {
  transaction: StockTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    quantity: "",
    unit_sold: "piece" as UnitType,
    selling_price: "",
    notes: "",
  })

  useEffect(() => {
    if (transaction && open) {
      // Check if transaction has product_id or stock_out_items
      if (!transaction.product_id && (!transaction.stock_out_items || transaction.stock_out_items.length === 0)) {
        setError("This transaction cannot be edited - missing product information")
        return
      }
      
      // For new transactions with stock_out_items, use the first item's product_id
      const productId = transaction.product_id || transaction.stock_out_items?.[0]?.product_id
      
      if (!productId) {
        setError("This transaction cannot be edited - missing product information")
        return
      }
      
      // Calculate selling price from transaction data
      let calculatedPrice = 0
      
      if (transaction.stock_out_items?.[0]?.selling_price) {
        // New transaction structure - selling_price is in stock_out_items
        calculatedPrice = Number(transaction.stock_out_items[0].selling_price)
      } else if (transaction.selling_price) {
        // Old transaction structure - selling_price is on transaction
        calculatedPrice = Number(transaction.selling_price)
      } else {
        // Fallback - calculate from total amount and quantity
        const totalAmount = transaction.total_amount || transaction.amount_owed || 0
        const quantity = transaction.quantity || transaction.stock_out_items?.[0]?.quantity || 1
        if (totalAmount && quantity) {
          calculatedPrice = totalAmount / quantity
        }
      }
      
      setFormData({
        quantity: (transaction.quantity || transaction.stock_out_items?.[0]?.quantity || 1).toString(),
        unit_sold: (transaction.unit_sold === "box" || transaction.unit_sold === "piece") ? transaction.unit_sold as UnitType : "piece",
        selling_price: calculatedPrice.toString(),
        notes: transaction.notes || "",
      })
      
      // Load product details
      loadProduct(productId)
    }
  }, [transaction, open])

  const loadProduct = async (productId: string) => {
    if (!productId) {
      setError("This transaction has no product information and cannot be edited")
      return
    }
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()
      
      if (error) throw error
      setProduct(data)
      
    } catch (err) {
      console.error("Failed to load product:", err)
      setError("Failed to load product details")
    }
  }

  const calculateSubtotal = () => {
    const quantity = Number.parseInt(formData.quantity) || 0
    const sellingPrice = Number.parseFloat(formData.selling_price) || 0
    
    if (!product) return quantity * sellingPrice

    if (product.unit_type === "box" && product.pieces_per_box) {
      if (formData.unit_sold === "box") {
        // Selling boxes - use box price or calculate from piece price
        const boxPrice = product.box_selling_price || (sellingPrice * product.pieces_per_box)
        return quantity * boxPrice
      } else {
        // Selling pieces
        return quantity * sellingPrice
      }
    }
    
    return quantity * sellingPrice
  }

  const calculateProfit = () => {
    const quantity = Number.parseInt(formData.quantity) || 0
    const sellingPrice = Number.parseFloat(formData.selling_price) || 0
    const buyingPrice = product?.price || 0
    
    if (!product) return quantity * (sellingPrice - buyingPrice)

    if (product.unit_type === "box" && product.pieces_per_box) {
      if (formData.unit_sold === "box") {
        // Selling boxes
        const boxPrice = product.box_selling_price || (sellingPrice * product.pieces_per_box)
        return quantity * (boxPrice - buyingPrice)
      } else {
        // Selling pieces
        return quantity * (sellingPrice - (buyingPrice / product.pieces_per_box))
      }
    }
    
    return quantity * (sellingPrice - buyingPrice)
  }

  const validateStock = () => {
    if (!product || !transaction) return null
    
    const newQuantity = Number.parseInt(formData.quantity) || 0
    const originalQuantity = transaction.quantity
    const quantityDiff = newQuantity - originalQuantity
    
    if (quantityDiff <= 0) return null // Reducing quantity is always OK
    
    // Check if we have enough stock for the increase
    if (product.unit_type === "box" && product.pieces_per_box) {
      if (formData.unit_sold === "piece") {
        const totalPieces = (product.quantity * product.pieces_per_box) + (product.remaining_pieces || 0)
        if (quantityDiff > totalPieces) {
          return `Not enough pieces. Need ${quantityDiff} more, have ${totalPieces} available`
        }
      } else {
        if (quantityDiff > product.quantity) {
          return `Not enough boxes. Need ${quantityDiff} more, have ${product.quantity} available`
        }
      }
    } else {
      if (quantityDiff > product.quantity) {
        return `Not enough stock. Need ${quantityDiff} more, have ${product.quantity} available`
      }
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction || !product) return

    setIsLoading(true)
    setError(null)

    const stockError = validateStock()
    if (stockError) {
      setError(stockError)
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const newQuantity = Number.parseInt(formData.quantity) || 0
      const newSellingPrice = Number.parseFloat(formData.selling_price) || 0
      const originalQuantity = transaction.quantity
      const quantityDiff = newQuantity - originalQuantity

      // Update transaction and stock_out_items
      const { error: updateError } = await supabase
        .from("stock_transactions")
        .update({
          quantity: newQuantity,
          unit_sold: formData.unit_sold,
          selling_price: newSellingPrice,
          profit: calculateProfit(),
          total_profit: calculateProfit(),
          amount_owed: calculateSubtotal(),
          notes: formData.notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)

      if (updateError) throw updateError

      // Update stock_out_items if it exists (new transaction structure)
      if (transaction.stock_out_items?.[0]) {
        const { error: itemUpdateError } = await supabase
          .from("stock_out_items")
          .update({
            quantity: newQuantity,
            selling_price: newSellingPrice.toString(),
            subtotal: calculateSubtotal(),
          })
          .eq("transaction_id", transaction.id)
          .eq("product_id", transaction.stock_out_items[0].product_id)

        if (itemUpdateError) throw itemUpdateError
      }

      // Update product stock if quantity changed
      if (quantityDiff !== 0) {
        if (product.unit_type === "box" && product.pieces_per_box) {
          if (formData.unit_sold === "piece") {
            // Handle piece sales - may need to adjust boxes and remaining pieces
            const fullBoxes = Math.floor(Math.abs(quantityDiff) / product.pieces_per_box)
            const remainingPieces = Math.abs(quantityDiff) % product.pieces_per_box
            
            let newBoxQuantity = product.quantity
            let newRemainingPieces = product.remaining_pieces || 0
            
            if (quantityDiff > 0) {
              // Increasing sales - reduce stock
              if (remainingPieces > newRemainingPieces) {
                // Need to open a box
                newBoxQuantity -= 1
                newRemainingPieces = product.pieces_per_box - (remainingPieces - newRemainingPieces)
              } else {
                newRemainingPieces -= remainingPieces
              }
              newBoxQuantity -= fullBoxes
            } else {
              // Decreasing sales - restore stock
              newRemainingPieces += remainingPieces
              if (newRemainingPieces >= product.pieces_per_box) {
                newBoxQuantity += Math.floor(newRemainingPieces / product.pieces_per_box)
                newRemainingPieces = newRemainingPieces % product.pieces_per_box
              }
              newBoxQuantity += fullBoxes
            }
            
            await supabase
              .from("products")
              .update({
                quantity: newBoxQuantity,
                remaining_pieces: newRemainingPieces
              })
              .eq("id", product.id)
          } else {
            // Box sales - simple quantity adjustment
            await supabase
              .from("products")
              .update({ quantity: product.quantity - quantityDiff })
              .eq("id", product.id)
          }
        } else {
          // Regular product - simple quantity adjustment
          await supabase
            .from("products")
            .update({ quantity: product.quantity - quantityDiff })
            .eq("id", product.id)
        }
      }

      toast.success("Transaction updated successfully")
      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to update transaction")
    } finally {
      setIsLoading(false)
    }
  }

  if (!transaction || !product) return null

  const subtotal = calculateSubtotal()
  const profit = calculateProfit()
  const stockError = validateStock()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Transaction
          </DialogTitle>
          <DialogDescription>
            Modify transaction details. Stock will be automatically adjusted.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <Card className="bg-secondary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                  {product.unit_type === "box" && product.pieces_per_box && (
                    <p className="text-xs text-muted-foreground">
                      {product.pieces_per_box} pieces per box
                    </p>
                  )}
                </div>
                <div className="ml-auto text-right">
                  <Badge variant={product.quantity > 10 ? "secondary" : product.quantity > 0 ? "outline" : "destructive"}>
                    {product.unit_type === "box" ? `${product.quantity} boxes` : `${product.quantity} in stock`}
                  </Badge>
                  {product.unit_type === "box" && product.remaining_pieces && (
                    <p className="text-xs text-muted-foreground mt-1">
                      + {product.remaining_pieces} pieces
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unit Type Selection for Box Products */}
            {product.unit_type === "box" && product.allow_retail_sales && (
              <div>
                <Label className="text-sm">Unit Type *</Label>
                <Select
                  value={formData.unit_sold}
                  onValueChange={(value: UnitType) => {
                    let newSellingPrice = 0
                    if (value === "box") {
                      // Selling boxes - use box price or calculate from current piece price
                      newSellingPrice = product.box_selling_price || 
                        (Number.parseFloat(formData.selling_price) * (product.pieces_per_box || 1)) ||
                        (product.selling_price * (product.pieces_per_box || 1))
                    } else {
                      // Selling pieces - use piece price or calculate from current box price
                      newSellingPrice = product.selling_price ||
                        (Number.parseFloat(formData.selling_price) / (product.pieces_per_box || 1)) ||
                        (product.box_selling_price || 0) / (product.pieces_per_box || 1)
                    }
                    
                    // Ensure we don't set 0 price - keep current price if calculation fails
                    if (newSellingPrice <= 0) {
                      newSellingPrice = Number.parseFloat(formData.selling_price) || 0
                    }
                    
                    setFormData({ 
                      ...formData, 
                      unit_sold: value,
                      selling_price: newSellingPrice.toString()
                    })
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="box">
                      Whole Box ({product.pieces_per_box} pieces)
                    </SelectItem>
                    <SelectItem value="piece">
                      Individual Pieces
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm">Quantity * ({formData.unit_sold === "box" ? "boxes" : "pieces"})</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="h-10"
                required
              />
            </div>

            <div>
              <Label className="text-sm">
                Selling Price * (RWF per {formData.unit_sold === "box" ? "box" : "piece"})
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="h-10"
                required
              />
              {product.unit_type === "box" && product.pieces_per_box && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.unit_sold === "box" 
                    ? `≈ ${(Number.parseFloat(formData.selling_price) / (product.pieces_per_box || 1)).toFixed(2)} RWF per piece`
                    : `≈ ${(Number.parseFloat(formData.selling_price) * (product.pieces_per_box || 1)).toFixed(2)} RWF per box`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Calculations */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="font-medium">Transaction Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-bold">{subtotal.toLocaleString()} RWF</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit</p>
                  <p className="text-lg font-bold text-success">{profit.toLocaleString()} RWF</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Validation Error */}
          {stockError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded border border-destructive/30">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{stockError}</p>
            </div>
          )}

          {/* General Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded border border-destructive/30">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-12 flex-1"
              disabled={isLoading || !!stockError}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Transaction
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}