"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  Minus, 
  Beer, 
  Banknote, 
  CreditCard, 
  AlertTriangle, 
  Package, 
  ShoppingCart,
  Calculator
} from "lucide-react"
import type { Product, UnitType, SaleMode } from "@/lib/types"

interface StockOutFormProps {
  products: Product[]
}

interface StockCalculation {
  totalPieces: number
  boxesDeducted: number
  piecesDeducted: number
  remainingPieces: number
  canSell: boolean
  errorMessage?: string
}

export function StockOutForm({ products }: StockOutFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    unit_sold: "piece" as UnitType,
    payment_type: "CASH" as "CASH" | "CREDIT",
    customer_name: "",
    notes: "",
  })

  const [saleMode, setSaleMode] = useState<SaleMode>("retail")

  const selectedProduct = products.find((p) => p.id === formData.product_id)
  const quantity = Number.parseInt(formData.quantity) || 0

  // Calculate stock availability and conversion
  const calculateStock = (): StockCalculation => {
    if (!selectedProduct || quantity <= 0) {
      return { totalPieces: 0, boxesDeducted: 0, piecesDeducted: 0, remainingPieces: 0, canSell: false }
    }

    const { unit_type, pieces_per_box, quantity: stockQuantity, remaining_pieces } = selectedProduct

    // For non-box products, simple quantity check
    if (unit_type !== "box" || !pieces_per_box) {
      return {
        totalPieces: stockQuantity,
        boxesDeducted: 0,
        piecesDeducted: quantity,
        remainingPieces: 0,
        canSell: quantity <= stockQuantity,
        errorMessage: quantity > stockQuantity ? `Only ${stockQuantity} available` : undefined
      }
    }

    // For box products
    const totalAvailablePieces = (stockQuantity * pieces_per_box) + (remaining_pieces || 0)

    if (formData.unit_sold === "box") {
      // Selling whole boxes
      const piecesNeeded = quantity * pieces_per_box
      return {
        totalPieces: totalAvailablePieces,
        boxesDeducted: quantity,
        piecesDeducted: piecesNeeded,
        remainingPieces: remaining_pieces || 0,
        canSell: quantity <= stockQuantity,
        errorMessage: quantity > stockQuantity ? `Only ${stockQuantity} boxes available` : undefined
      }
    } else {
      // Selling individual pieces
      if (quantity > totalAvailablePieces) {
        return {
          totalPieces: totalAvailablePieces,
          boxesDeducted: 0,
          piecesDeducted: quantity,
          remainingPieces: 0,
          canSell: false,
          errorMessage: `Only ${totalAvailablePieces} pieces available (${stockQuantity} boxes × ${pieces_per_box} pieces + ${remaining_pieces || 0} remaining)`
        }
      }

      // Calculate how many boxes need to be opened
      let piecesFromRemaining = Math.min(quantity, remaining_pieces || 0)
      let piecesStillNeeded = quantity - piecesFromRemaining
      let boxesToOpen = piecesStillNeeded > 0 ? Math.ceil(piecesStillNeeded / pieces_per_box) : 0
      let finalRemainingPieces = (remaining_pieces || 0) - piecesFromRemaining
      
      if (boxesToOpen > 0) {
        finalRemainingPieces += (boxesToOpen * pieces_per_box) - piecesStillNeeded
      }

      return {
        totalPieces: totalAvailablePieces,
        boxesDeducted: boxesToOpen,
        piecesDeducted: quantity,
        remainingPieces: finalRemainingPieces,
        canSell: true
      }
    }
  }

  const stockCalc = calculateStock()
  const totalAmount = quantity * (selectedProduct?.selling_price ?? 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (!stockCalc.canSell) {
      setError(stockCalc.errorMessage || "Insufficient stock")
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You are not logged in")
      setIsLoading(false)
      return
    }

    try {
      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from("stock_transactions")
        .insert({
          product_id: formData.product_id,
          type: "OUT",
          quantity: quantity,
          unit_sold: formData.unit_sold,
          payment_type: formData.payment_type,
          customer_name: formData.payment_type === "CREDIT" ? formData.customer_name : null,
          total_amount: totalAmount,
          notes: formData.notes || null,
          user_id: user.id,
        })
        .select()
        .single()

      if (transactionError) {
        setError(transactionError.message)
        setIsLoading(false)
        return
      }

      // Update stock - handle box products properly
      if (selectedProduct?.unit_type === "box" && selectedProduct.pieces_per_box && formData.unit_sold === "piece") {
        // Selling pieces from box product
        const currentRemaining = selectedProduct.remaining_pieces || 0
        let piecesFromRemaining = Math.min(quantity, currentRemaining)
        let piecesStillNeeded = quantity - piecesFromRemaining
        let boxesToOpen = piecesStillNeeded > 0 ? Math.ceil(piecesStillNeeded / selectedProduct.pieces_per_box) : 0
        let finalRemainingPieces = currentRemaining - piecesFromRemaining
        
        if (boxesToOpen > 0) {
          finalRemainingPieces += (boxesToOpen * selectedProduct.pieces_per_box) - piecesStillNeeded
        }
        
        const newBoxQuantity = selectedProduct.quantity - boxesToOpen
        
        await supabase
          .from("products")
          .update({ 
            quantity: newBoxQuantity,
            remaining_pieces: finalRemainingPieces
          })
          .eq("id", formData.product_id)
      } else {
        // Simple stock update for regular products or box sales
        const newQuantity = (selectedProduct?.quantity ?? 0) - (formData.unit_sold === "box" ? quantity : stockCalc.boxesDeducted)
        await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .eq("id", formData.product_id)
      }

      // Create credit record if needed
      if (formData.payment_type === "CREDIT" && formData.customer_name) {
        const { error: creditError } = await supabase.from("credits").insert({
          customer_name: formData.customer_name,
          transaction_id: transaction.id,
          amount: totalAmount,
          is_paid: false,
        })

        if (creditError) {
          console.error('Credit creation failed:', creditError)
        }
      }

      setSuccess(true)
      setFormData({
        product_id: "",
        quantity: "",
        unit_sold: "piece",
        payment_type: "CASH",
        customer_name: "",
        notes: "",
      })
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Beer className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No products available</h3>
            <p className="text-muted-foreground mb-4">Add products first before recording stock out</p>
            <Button onClick={() => router.push("/dashboard/products")}>Add Product</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile-Optimized Sale Mode Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-base font-medium">Sale Mode</Label>
                <p className="text-sm text-muted-foreground">Choose wholesale or retail</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sale-mode" className={saleMode === "wholesale" ? "font-medium" : "text-muted-foreground"}>
                Wholesale
              </Label>
              <Switch
                id="sale-mode"
                checked={saleMode === "retail"}
                onCheckedChange={(checked) => setSaleMode(checked ? "retail" : "wholesale")}
              />
              <Label htmlFor="sale-mode" className={saleMode === "retail" ? "font-medium" : "text-muted-foreground"}>
                Retail
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Record Stock Out
          </CardTitle>
          <CardDescription>
            {saleMode === "retail" ? "Sell individual pieces" : "Sell whole boxes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product-out" className="text-base font-medium">Product *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => {
                  const product = products.find(p => p.id === value)
                  setFormData({
                    ...formData,
                    product_id: value,
                    unit_sold: saleMode === "wholesale" || product?.unit_type !== "box" ? "box" : "piece"
                  })
                }}
              >
                <SelectTrigger id="product-out" className="h-14 text-base">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => {
                    const totalPieces = product.unit_type === "box" && product.pieces_per_box 
                      ? (product.quantity * product.pieces_per_box) + (product.remaining_pieces || 0)
                      : product.quantity
                    
                    return (
                      <SelectItem key={product.id} value={product.id} disabled={totalPieces === 0}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.brand}</p>
                          </div>
                          <div className="text-right">
                            {product.unit_type === "box" && product.pieces_per_box ? (
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  {product.quantity} boxes
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {totalPieces} pieces total
                                </p>
                              </div>
                            ) : (
                              <Badge variant={totalPieces <= product.min_stock_level ? "destructive" : "secondary"}>
                                {totalPieces} in stock
                              </Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Type Selection for Box Products */}
            {selectedProduct?.unit_type === "box" && selectedProduct.allow_retail_sales && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Unit Type *</Label>
                <RadioGroup
                  value={formData.unit_sold}
                  onValueChange={(value: UnitType) => setFormData({ ...formData, unit_sold: value })}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="unit-box"
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.unit_sold === "box"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="box" id="unit-box" />
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Whole Box</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedProduct.pieces_per_box} pieces/box
                      </p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="unit-piece"
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.unit_sold === "piece"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="piece" id="unit-piece" />
                    <Beer className="h-5 w-5 text-secondary-foreground" />
                    <div>
                      <p className="font-medium">Individual Pieces</p>
                      <p className="text-xs text-muted-foreground">Retail sale</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            )}

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity-out" className="text-base font-medium">
                Quantity * ({formData.unit_sold === "box" ? "boxes" : "pieces"})
              </Label>
              <Input
                id="quantity-out"
                type="number"
                min="1"
                max={selectedProduct?.unit_type === "box" && formData.unit_sold === "piece" 
                  ? stockCalc.totalPieces
                  : selectedProduct?.quantity || 999}
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={`h-14 text-lg ${!stockCalc.canSell && quantity > 0 ? "border-destructive" : ""}`}
                required
              />
              {!stockCalc.canSell && quantity > 0 && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {stockCalc.errorMessage}
                </p>
              )}
            </div>

            {/* Stock Calculation Display */}
            {selectedProduct && quantity > 0 && stockCalc.canSell && (
              <Card className="bg-secondary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Stock Calculation</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {selectedProduct.unit_type === "box" && selectedProduct.pieces_per_box && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Boxes to deduct:</span>
                          <span className="font-medium">{stockCalc.boxesDeducted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pieces sold:</span>
                          <span className="font-medium">{stockCalc.piecesDeducted}</span>
                        </div>
                        {formData.unit_sold === "piece" && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining pieces:</span>
                            <span className="font-medium">{stockCalc.remainingPieces}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Unit price:</span>
                      <span className="font-medium">{selectedProduct.selling_price.toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total amount:</span>
                      <span className="text-lg font-bold text-primary">{totalAmount.toLocaleString()} RWF</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Type - Mobile Optimized */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Payment Method *</Label>
              <RadioGroup
                value={formData.payment_type}
                onValueChange={(value: "CASH" | "CREDIT") => setFormData({ ...formData, payment_type: value })}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="cash"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    formData.payment_type === "CASH"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value="CASH" id="cash" />
                  <Banknote className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">Cash Payment</p>
                    <p className="text-xs text-muted-foreground">Immediate payment</p>
                  </div>
                </Label>
                <Label
                  htmlFor="credit"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    formData.payment_type === "CREDIT"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value="CREDIT" id="credit" />
                  <CreditCard className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">Credit Sale</p>
                    <p className="text-xs text-muted-foreground">Pay later</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {/* Credit Customer Info */}
            {formData.payment_type === "CREDIT" && (
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-4">
                  <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-warning" />
                    Customer Information
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="customer_name" className="text-base">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      placeholder="Enter customer name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      required={formData.payment_type === "CREDIT"}
                      className="h-12"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes-out" className="text-base font-medium">Notes (Optional)</Label>
              <Textarea
                id="notes-out"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                <p className="text-sm text-success font-medium">
                  Sale recorded successfully!
                  {formData.payment_type === "CREDIT" && " Credit has been added."}
                </p>
              </div>
            )}

            {/* Submit Button - Mobile Optimized */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-14 text-lg font-medium" 
              disabled={isLoading || !stockCalc.canSell || !formData.product_id || !formData.quantity}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Minus className="mr-2 h-5 w-5" />
                  Record Sale ({totalAmount.toLocaleString()} RWF)
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
