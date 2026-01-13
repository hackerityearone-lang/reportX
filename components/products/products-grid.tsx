"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Beer, Search, AlertTriangle, Edit, Trash2 } from "lucide-react"
import { EditProductDialog } from "./edit-product-dialog"
import { DeleteProductDialog } from "./delete-product-dialog"
import type { Product } from "@/lib/types"

interface ProductsGridProps {
  products: Product[]
}

export function ProductsGrid({ products }: ProductsGridProps) {
  const [search, setSearch] = useState("")
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()),
  )

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Beer className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nta bicuruzwa urafite</h3>
            <p className="text-muted-foreground mb-4">Tangira wongereho igicuruzwa cya mbere</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Shakisha igicuruzwa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const stockPercentage = Math.min((product.quantity / (product.min_stock_level * 2)) * 100, 100)
          const isLowStock = product.quantity <= product.min_stock_level
          const isOutOfStock = product.quantity === 0

          return (
            <Card key={product.id} className="overflow-hidden group">
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative h-32 bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="h-24 w-24 object-contain"
                    />
                  ) : (
                    <Beer className="h-16 w-16 text-muted-foreground/50" />
                  )}

                  {/* Status Badge */}
                  {isOutOfStock && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Birabuze
                    </Badge>
                  )}
                  {isLowStock && !isOutOfStock && (
                    <Badge variant="outline" className="absolute top-2 right-2 bg-warning/20 border-warning">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Stock Nke
                    </Badge>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setEditProduct(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteProduct(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.brand}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stock:</span>
                    <span
                      className={`font-bold ${isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-foreground"}`}
                    >
                      {product.quantity}
                    </span>
                  </div>

                  <Progress
                    value={stockPercentage}
                    className={`h-1.5 mt-2 ${isLowStock ? "[&>div]:bg-warning" : ""} ${isOutOfStock ? "[&>div]:bg-destructive" : ""}`}
                  />

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Igiciro:</span>
                    <span className="font-medium text-foreground">{(product.price ?? 0).toLocaleString()} RWF</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && products.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nta gicuruzwa gihuye na "{search}"</p>
        </div>
      )}

      {/* Edit Dialog */}
      <EditProductDialog product={editProduct} open={!!editProduct} onOpenChange={() => setEditProduct(null)} />

      {/* Delete Dialog */}
      <DeleteProductDialog product={deleteProduct} open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)} />
    </div>
  )
}
