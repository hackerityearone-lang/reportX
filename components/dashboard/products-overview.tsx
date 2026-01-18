import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Beer, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"

interface ProductsOverviewProps {
  products: Product[]
}

export function ProductsOverview({ products }: ProductsOverviewProps) {
  // Sort products by quantity (low stock first)
  const sortedProducts = [...products]
    .sort((a, b) => {
      const aRatio = a.quantity / a.min_stock_level
      const bRatio = b.quantity / b.min_stock_level
      return aRatio - bRatio
    })
    .slice(0, 8)

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Beer className="h-5 w-5 text-primary" />
            Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Beer className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No products yet</p>
            <Link href="/dashboard/products">
              <Button>Add Product</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Beer className="h-5 w-5 text-primary" />
          Ibicuruzwa (Products)
        </CardTitle>
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm">
            Reba Byose
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {sortedProducts.map((product) => {
            const stockPercentage = Math.min((product.quantity / (product.min_stock_level * 2)) * 100, 100)
            const isLowStock = product.quantity <= product.min_stock_level
            const isOutOfStock = product.quantity === 0

            return (
              <div
                key={product.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                {/* Product Image */}
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {product.image_url ? (
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <Beer className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    {isOutOfStock && (
                      <Badge variant="destructive" className="text-xs">
                        Birabuze
                      </Badge>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <Badge variant="outline" className="text-xs border-warning text-warning-foreground">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Nke
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <div className="mt-2">
                    <Progress
                      value={stockPercentage}
                      className={`h-1.5 ${isLowStock ? "[&>div]:bg-warning" : ""} ${isOutOfStock ? "[&>div]:bg-destructive" : ""}`}
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div className="text-right shrink-0">
                  <p
                    className={`text-lg font-bold ${isLowStock ? "text-warning" : "text-foreground"} ${isOutOfStock ? "text-destructive" : ""}`}
                  >
                    {product.quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">/ {product.min_stock_level * 2}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
