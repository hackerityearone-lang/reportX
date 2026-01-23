"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Edit, Package, Beer, AlertCircle, Calculator } from "lucide-react"
import type { Product, UnitType } from "@/lib/types"

interface EditProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProductDialog({ product, open, onOpenChange }: EditProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    quantity: "",
    min_stock_level: "",
    price: "",
    selling_price: "",
    box_selling_price: "",
    unit_type: "piece" as UnitType,
    pieces_per_box: "",
    allow_retail_sales: true,
    remaining_pieces: "",
    image_url: "",
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand,
        quantity: product.quantity.toString(),
        min_stock_level: product.min_stock_level.toString(),
        price: product.price.toString(),
        selling_price: (product.selling_price || 0).toString(),
        box_selling_price: (product.box_selling_price || "").toString(),
        unit_type: (product.unit_type === "box" || product.unit_type === "piece") ? product.unit_type : "piece",
        pieces_per_box: (product.pieces_per_box || "").toString(),
        allow_retail_sales: product.allow_retail_sales ?? true,
        remaining_pieces: (product.remaining_pieces || 0).toString(),
        image_url: product.image_url || "",
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setIsLoading(true)
    setError(null)

    if (formData.unit_type === "box" && !formData.pieces_per_box) {
      setError("Pieces per box is required for box-type products")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    const updateData = {
      name: formData.name.trim(),
      brand: formData.brand.trim(),
      quantity: Number.parseInt(formData.quantity) || 0,
      min_stock_level: Number.parseInt(formData.min_stock_level) || 10,
      price: Number.parseFloat(formData.price) || 0,
      selling_price: Number.parseFloat(formData.selling_price) || 0,
      box_selling_price: formData.unit_type === "box" && formData.box_selling_price ? Number.parseFloat(formData.box_selling_price) : null,
      unit_type: formData.unit_type,
      pieces_per_box: formData.unit_type === "box" ? Number.parseInt(formData.pieces_per_box) : null,
      allow_retail_sales: formData.allow_retail_sales,
      remaining_pieces: Number.parseInt(formData.remaining_pieces) || 0,
      image_url: formData.image_url.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", product.id)

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    onOpenChange(false)
    router.refresh()
    setIsLoading(false)
  }

  const calculateTotalPieces = () => {
    if (formData.unit_type !== "box" || !formData.pieces_per_box || !formData.quantity) {
      return null
    }
    return Number.parseInt(formData.quantity) * Number.parseInt(formData.pieces_per_box) + Number.parseInt(formData.remaining_pieces || "0")
  }

  const calculateProfitMargin = () => {
    const buyingPrice = Number.parseFloat(formData.price) || 0
    const sellingPrice = Number.parseFloat(formData.selling_price) || 0
    if (buyingPrice === 0) return 0
    return ((sellingPrice - buyingPrice) / buyingPrice) * 100
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Product
          </DialogTitle>
          <DialogDescription>
            Update product information and configuration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-base">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-brand" className="text-base">Brand *</Label>
                <Input
                  id="edit-brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image_url" className="text-base">Image URL (Optional)</Label>
              <Input
                id="edit-image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="h-12"
              />
            </div>
          </div>

          {/* Unit Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Unit Configuration</h3>
            
            <div className="space-y-3">
              <Label className="text-base">Unit Type *</Label>
              <Select
                value={formData.unit_type}
                onValueChange={(value: UnitType) => {
                  setFormData({ 
                    ...formData, 
                    unit_type: value,
                    pieces_per_box: value === "piece" ? "" : formData.pieces_per_box,
                    allow_retail_sales: value === "piece" ? true : formData.allow_retail_sales
                  })
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">
                    <div className="flex items-center gap-2">
                      <Beer className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Individual Pieces</p>
                        <p className="text-xs text-muted-foreground">Sold as individual items</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="box">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Box/Case</p>
                        <p className="text-xs text-muted-foreground">Contains multiple pieces</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.unit_type === "box" && (
              <Card className="bg-secondary/20">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Box Configuration</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-pieces_per_box" className="text-base">Pieces per Box *</Label>
                      <Input
                        id="edit-pieces_per_box"
                        type="number"
                        min="1"
                        value={formData.pieces_per_box}
                        onChange={(e) => setFormData({ ...formData, pieces_per_box: e.target.value })}
                        className="h-12"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-remaining_pieces" className="text-base">Remaining Pieces</Label>
                      <Input
                        id="edit-remaining_pieces"
                        type="number"
                        min="0"
                        value={formData.remaining_pieces}
                        onChange={(e) => setFormData({ ...formData, remaining_pieces: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="edit-allow_retail" className="text-base font-medium">
                        Allow Retail Sales
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow selling individual pieces from boxes
                      </p>
                    </div>
                    <Switch
                      id="edit-allow_retail"
                      checked={formData.allow_retail_sales}
                      onCheckedChange={(checked) => setFormData({ ...formData, allow_retail_sales: checked })}
                    />
                  </div>

                  {calculateTotalPieces() && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        Total pieces: <strong>{calculateTotalPieces()}</strong>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stock & Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Stock & Pricing</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity" className="text-base">
                  Stock Quantity * ({formData.unit_type === "box" ? "boxes" : "pieces"})
                </Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-min_stock_level" className="text-base">
                  Minimum Stock Level * ({formData.unit_type === "box" ? "boxes" : "pieces"})
                </Label>
                <Input
                  id="edit-min_stock_level"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-base">
                  Buying Price * (RWF per {formData.unit_type})
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-selling_price" className="text-base">
                  Piece Price * (RWF per piece)
                </Label>
                <Input
                  id="edit-selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
            </div>

            {formData.unit_type === "box" && (
              <div className="space-y-2">
                <Label htmlFor="edit-box_selling_price" className="text-base">
                  Box Price * (RWF per box)
                </Label>
                <Input
                  id="edit-box_selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.box_selling_price}
                  onChange={(e) => setFormData({ ...formData, box_selling_price: e.target.value })}
                  className="h-12"
                  required
                />
                {formData.pieces_per_box && formData.box_selling_price && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {(Number.parseFloat(formData.box_selling_price) / Number.parseInt(formData.pieces_per_box)).toFixed(2)} RWF per piece
                  </p>
                )}
              </div>
            )}

            {/* Profit Margin Display */}
            {formData.price && formData.selling_price && (
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Profit Margin</p>
                      <p className="text-lg font-bold text-success">
                        {calculateProfitMargin().toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Profit per piece</p>
                      <p className="text-lg font-bold text-success">
                        {(Number.parseFloat(formData.selling_price) - (formData.unit_type === "box" ? Number.parseFloat(formData.price) / (Number.parseInt(formData.pieces_per_box) || 1) : Number.parseFloat(formData.price))).toLocaleString()} RWF
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Product
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}