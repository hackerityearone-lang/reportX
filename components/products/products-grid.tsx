"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Beer, 
  Search, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Package, 
  Calculator,
  TrendingUp,
  Box
} from "lucide-react"
import { EditProductDialog } from "./edit-product-dialog"
import { DeleteProductDialog } from "./delete-product-dialog"
import { AddProductDialog } from "./add-product-dialog"
import type { Product } from "@/lib/types"

interface ProductsGridProps {
  products: Product[]
}

export function ProductsGrid({ products }: ProductsGridProps) {
  const [search, setSearch] = useState("")
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const filteredProducts = products.filter(
    (p) => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.brand.toLowerCase().includes(search.toLowerCase())
  )

  const calculateTotalPieces = (product: Product) => {
    if (product.unit_type === "box" && product.pieces_per_box) {
      return (product.quantity * product.pieces_per_box) + (product.remaining_pieces || 0)
    }
    return product.quantity
  }

  const calculateStockPercentage = (product: Product) => {
    const totalStock = calculateTotalPieces(product)
    const minLevel = product.unit_type === "box" && product.pieces_per_box 
      ? product.min_stock_level * product.pieces_per_box 
      : product.min_stock_level
    
    return Math.min((totalStock / (minLevel * 2)) * 100, 100)
  }

  const getProfitMargin = (product: Product) => {
    if (!product.price || !product.selling_price) return 0
    return ((product.selling_price - product.price) / product.price) * 100
  }

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Products</h2>
          <Button onClick={() => setShowAddDialog(true)} size="lg" className="gap-2">
            <Package className="h-5 w-5" />
            Add Product
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Beer className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">Start by adding your first product</p>
              <Button onClick={() => setShowAddDialog(true)}>
                Add Product
              </Button>
            </div>
          </CardContent>
        </Card>
        <AddProductDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Products</h2>
        <Button onClick={() => setShowAddDialog(true)} size="lg" className="gap-2">
          <Package className="h-5 w-5" />
          Add Product
        </Button>
      </div>

      {/* Search - Mobile Optimized */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Products Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const totalPieces = calculateTotalPieces(product)
          const stockPercentage = calculateStockPercentage(product)
          const isLowStock = totalPieces <= (product.unit_type === "box" && product.pieces_per_box 
            ? product.min_stock_level * product.pieces_per_box 
            : product.min_stock_level)
          const isOutOfStock = totalPieces === 0
          const profitMargin = getProfitMargin(product)

          return (
            <Card key={product.id} className="overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative h-32 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-24 w-24 object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center">
                      {product.unit_type === "box" ? (
                        <Package className="h-16 w-16 text-muted-foreground/50" />
                      ) : (
                        <Beer className="h-16 w-16 text-muted-foreground/50" />
                      )}
                    </div>
                  )}

                  {/* Unit Type Badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2 text-xs"
                  >
                    {product.unit_type === "box" ? (
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Box
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Beer className="h-3 w-3" />
                        Piece
                      </div>
                    )}
                  </Badge>

                  {/* Status Badge */}
                  {isOutOfStock && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Out of Stock
                    </Badge>
                  )}
                  {isLowStock && !isOutOfStock && (
                    <Badge variant="outline" className="absolute top-2 right-2 bg-warning/20 border-warning">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Low Stock
                    </Badge>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-8 w-8 bg-background/80 backdrop-blur-sm" 
                      onClick={() => setEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteProduct(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  </div>

                  {/* Stock Information */}
                  <div className="space-y-2">
                    {product.unit_type === "box" && product.pieces_per_box ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Boxes:</span>
                          <span className={`font-bold ${isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-foreground"}`}>
                            {product.quantity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total pieces:</span>
                          <span className={`font-bold ${isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-foreground"}`}>
                            {totalPieces}
                          </span>
                        </div>
                        {(product.remaining_pieces || 0) > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Remaining pieces:</span>
                            <span className="font-medium text-primary">{product.remaining_pieces}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Box className="h-3 w-3" />
                          {product.pieces_per_box} pieces/box
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Stock:</span>
                        <span className={`font-bold ${isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-foreground"}`}>
                          {product.quantity}
                        </span>
                      </div>
                    )}

                    <Progress
                      value={stockPercentage}
                      className={`h-1.5 ${isLowStock ? "[&>div]:bg-warning" : ""} ${isOutOfStock ? "[&>div]:bg-destructive" : ""}`}
                    />
                  </div>

                  {/* Pricing Information */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Buying:</span>
                      <span className="font-medium text-foreground">
                        {(product.price ?? 0).toLocaleString()} RWF
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Selling:</span>
                      <span className="font-medium text-success">
                        {(product.selling_price ?? 0).toLocaleString()} RWF
                      </span>
                    </div>
                    {profitMargin > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Margin:
                        </span>
                        <Badge variant="outline" className="text-xs bg-success/10 border-success/20 text-success">
                          {profitMargin.toFixed(1)}%
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Retail Sales Badge */}
                  {product.unit_type === "box" && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Retail sales:</span>
                      <Badge variant={product.allow_retail_sales ? "default" : "secondary"} className="text-xs">
                        {product.allow_retail_sales ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No Results */}
      {filteredProducts.length === 0 && products.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No products match "{search}"</p>
        </div>
      )}

      {/* Dialogs */}
      <AddProductDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <EditProductDialog 
        product={editProduct} 
        open={!!editProduct} 
        onOpenChange={() => setEditProduct(null)} 
      />
      <DeleteProductDialog 
        product={deleteProduct} 
        open={!!deleteProduct} 
        onOpenChange={() => setDeleteProduct(null)} 
      />
    </div>
  )
}