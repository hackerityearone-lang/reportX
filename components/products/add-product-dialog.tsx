"use client"

import { useState } from "react"
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
import { Loader2, Plus, Package, Beer, AlertCircle, Calculator } from "lucide-react"
import type { UnitType } from "@/lib/types"

interface EnhancedAddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddProductDialog({ open, onOpenChange }: EnhancedAddProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    quantity: "",
    min_stock_level: "10",
    price: "",
    selling_price: "",
    box_selling_price: "",
    unit_type: "piece" as UnitType,
    pieces_per_box: "",
    allow_retail_sales: true,
    image_url: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      quantity: "",
      min_stock_level: "10",
      price: "",
      selling_price: "",
      box_selling_price: "",
      unit_type: "piece",
      pieces_per_box: "",
      allow_retail_sales: true,
      image_url: "",
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.unit_type === "box" && !formData.pieces_per_box) {
      setError("Pieces per box is required for box-type products")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    const productData = {
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
      remaining_pieces: 0,
      image_url: formData.image_url.trim() || null,
    }

    const { error: insertError } = await supabase.from("products").insert(productData)

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    resetForm()
    onOpenChange(false)
    router.refresh()
    setIsLoading(false)
  }

  const calculateTotalPieces = () => {
    if (formData.unit_type !== "box" || !formData.pieces_per_box || !formData.quantity) {
      return null
    }
    return Number.parseInt(formData.quantity) * Number.parseInt(formData.pieces_per_box)
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
            <Plus className="h-5 w-5" />
            Add New Product
          </DialogTitle>
          <DialogDescription>
            Create a new product with advanced box/piece configuration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Fanta Orange"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-base">Brand *</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Coca-Cola"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-base">Image URL (Optional)</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="h-12"
              />
            </div>
          </div>

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
                  
                  <div className="space-y-2">
                    <Label htmlFor="pieces_per_box" className="text-base">Pieces per Box *</Label>
                    <Input
                      id="pieces_per_box"
                      type="number"
                      min="1"
                      placeholder="e.g., 12"
                      value={formData.pieces_per_box}
                      onChange={(e) => setFormData({ ...formData, pieces_per_box: e.target.value })}
                      className="h-12"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow_retail" className="text-base font-medium">
                        Allow Retail Sales
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow selling individual pieces from boxes
                      </p>
                    </div>
                    <Switch
                      id="allow_retail"
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

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Stock & Pricing</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-base">
                  Initial Stock * ({formData.unit_type === "box" ? "boxes" : "pieces"})
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_stock_level" className="text-base">
                  Minimum Stock Level * ({formData.unit_type === "box" ? "boxes" : "pieces"})
                </Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-base">
                  Buying Price * (RWF per {formData.unit_type})
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="selling_price" className="text-base">
                  Piece Price * (RWF per piece)
                </Label>
                <Input
                  id="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  className="h-12"
                  required
                />
              </div>
            </div>

            {formData.unit_type === "box" && (
              <div className="space-y-2">
                <Label htmlFor="box_selling_price" className="text-base">
                  Box Price * (RWF per box)
                </Label>
                <Input
                  id="box_selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
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
                      <p className="text-sm text-muted-foreground">Profit per unit</p>
                      <p className="text-lg font-bold text-success">
                        {(Number.parseFloat(formData.selling_price) - Number.parseFloat(formData.price)).toLocaleString()} RWF
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}

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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}