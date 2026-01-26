"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Beer, Search, X } from "lucide-react"
import type { Product } from "@/lib/types"

interface StockInFormProps {
  products: Product[]
  onTransactionSuccess?: () => void
}

export function StockInForm({ products, onTransactionSuccess }: StockInFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    notes: "",
  })

  // Product search state
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [selectedProductName, setSelectedProductName] = useState("")
  const [showProductSearch, setShowProductSearch] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.product-search-container')) {
        setShowProductSearch(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  // Filter products based on search
  const filteredProducts = products.filter(p => {
    if (!productSearchQuery) return true
    const query = productSearchQuery.toLowerCase()
    return p.name.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query)
  })

  // Get display value for search input
  const getProductDisplayValue = () => {
    if (productSearchQuery) {
      return productSearchQuery
    }
    return selectedProductName || ""
  }

  const handleProductSelect = (product: Product) => {
    setFormData({ ...formData, product_id: product.id })
    setSelectedProductName(product.name)
    setProductSearchQuery("")
    setShowProductSearch(false)
  }

  const handleClearProduct = () => {
    setFormData({ ...formData, product_id: "" })
    setSelectedProductName("")
    setProductSearchQuery("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You are not logged in")
      setIsLoading(false)
      return
    }

    const quantity = Number.parseInt(formData.quantity)

    const { error: insertError } = await supabase.from("stock_transactions").insert({
      product_id: formData.product_id,
      type: "IN",
      quantity: quantity,
      unit_sold: "box",
      amount_owed: quantity * (selectedProduct?.buy_price_per_box || selectedProduct?.buying_price || 0),
      notes: formData.notes || null,
      user_id: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    // Calculate new total pieces (boxes * pieces_per_box + existing remaining_pieces)
    const piecesPerBox = selectedProduct?.pieces_per_box || 1
    const currentRemainingPieces = selectedProduct?.remaining_pieces || 0
    const newTotalPieces = (selectedProduct?.quantity || 0) + (quantity * piecesPerBox)
    
    // Update quantity (trigger will calculate boxes_in_stock and remaining_pieces)
    const { error: updateError } = await supabase
      .from("products")
      .update({ quantity: newTotalPieces })
      .eq("id", formData.product_id)

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    setSuccess(true)
    setFormData({
      product_id: "",
      quantity: "",
      notes: "",
    })
    setSelectedProductName("")
    setProductSearchQuery("")
    
    // Call success callback to refresh parent components
    onTransactionSuccess?.()
    
    setIsLoading(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Beer className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No products available</h3>
            <p className="text-muted-foreground mb-4">Add products first before recording stock in</p>
            <Button onClick={() => router.push("/dashboard/products")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Stock In</CardTitle>
        <CardDescription>Add new stock to inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2 product-search-container">
            <Label htmlFor="product">Igicuruzwa *</Label>
            <div className="relative">
              <div className="relative flex gap-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="product"
                    type="text"
                    placeholder="Search products..."
                    value={getProductDisplayValue()}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value)
                      setShowProductSearch(true)
                    }}
                    onFocus={() => setShowProductSearch(true)}
                    className="h-12 pl-9"
                  />
                </div>
                {(selectedProductName || productSearchQuery) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearProduct}
                    className="h-12 px-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {showProductSearch && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-0"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          {product.brand && (
                            <p className="text-xs text-muted-foreground">{product.brand}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {/* Stock Badge */}
                          {product.unit_type === 'box' || product.unit_type === 'box_and_piece' ? (
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {product.boxes_in_stock} boxes / {product.quantity} pieces
                              </Badge>
                            </div>
                          ) : (
                            <Badge
                              variant={product.quantity > 10 ? "secondary" : product.quantity > 0 ? "outline" : "destructive"}
                              className="text-xs"
                            >
                              Stock: {product.quantity} pieces
                            </Badge>
                          )}

                          {/* Price Display */}
                          <span className="text-xs text-muted-foreground">
                            {(product.price || product.buying_price || 0).toLocaleString()} RWF
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showProductSearch && filteredProducts.length === 0 && productSearchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-20 p-4 text-center text-sm text-muted-foreground">
                  No products found
                </div>
              )}
            </div>
          </div>

            <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity (Boxes) *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="h-12 text-lg"
              required
            />
          </div>

          {formData.quantity && selectedProduct && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">{(selectedProduct.buy_price_per_box || selectedProduct.buying_price || 0).toLocaleString()} RWF / box</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">Total:</span>
                <span className="text-xl font-bold text-foreground">
                  {(Number.parseInt(formData.quantity || "0") * (selectedProduct.buy_price_per_box || selectedProduct.buying_price || 0)).toLocaleString()} RWF
                </span>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-3">
              <p className="text-sm text-success">Stock added successfully!</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled={isLoading || !formData.product_id}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Add Stock
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default StockInForm