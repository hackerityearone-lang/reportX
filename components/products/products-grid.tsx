"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Beer, 
  Search, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Package, 
  Calculator,
  TrendingUp,
  Box,
  Filter,
  ArrowUpDown,
  Grid3X3,
  List
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
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price" | "margin" | "date">("date")
  const [filterBy, setFilterBy] = useState<"all" | "low-stock" | "out-of-stock" | "in-stock">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const calculateTotalPieces = (product: Product) => {
    if (product.pieces_per_box) {
      return (product.boxes_in_stock * product.pieces_per_box) + (product.open_box_pieces || 0)
    }
    return product.boxes_in_stock
  }

  const calculateStockPercentage = (product: Product) => {
    const totalStock = calculateTotalPieces(product)
    const minLevel = product.pieces_per_box 
      ? product.min_stock_level * product.pieces_per_box 
      : product.min_stock_level
    
    return Math.min((totalStock / (minLevel * 2)) * 100, 100)
  }

  const getProfitMargin = (product: Product) => {
    if (!product.buy_price_per_piece || !product.selling_price_per_piece) return 0
    return ((product.selling_price_per_piece - product.buy_price_per_piece) / product.buy_price_per_piece) * 100
  }

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(
      (p) => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.brand.toLowerCase().includes(search.toLowerCase())
    )

    // Apply filters
    if (filterBy !== "all") {
      filtered = filtered.filter((product) => {
        const totalPieces = calculateTotalPieces(product)
        const minLevel = product.pieces_per_box 
          ? product.min_stock_level * product.pieces_per_box 
          : product.min_stock_level
        
        switch (filterBy) {
          case "out-of-stock":
            return totalPieces === 0
          case "low-stock":
            return totalPieces > 0 && totalPieces <= minLevel
          case "in-stock":
            return totalPieces > minLevel
          default:
            return true
        }
      })
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "stock":
          return calculateTotalPieces(b) - calculateTotalPieces(a)
        case "price":
          return (b.selling_price_per_piece || 0) - (a.selling_price_per_piece || 0)
        case "margin":
          return getProfitMargin(b) - getProfitMargin(a)
        case "date":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        default:
          return 0
      }
    })
  }, [products, search, sortBy, filterBy])

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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="stock">Stock High-Low</SelectItem>
              <SelectItem value="price">Price High-Low</SelectItem>
              <SelectItem value="margin">Margin High-Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredAndSortedProducts.length} of {products.length} products
          {search && ` matching "${search}"`}
        </span>
        {(search || filterBy !== "all" || sortBy !== "date") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearch("")
              setFilterBy("all")
              setSortBy("date")
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Products Grid/List */}
      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        : "space-y-3"
      }>
        {filteredAndSortedProducts.map((product) => {
          const totalPieces = calculateTotalPieces(product)
          const stockPercentage = calculateStockPercentage(product)
          const isLowStock = totalPieces <= (product.pieces_per_box 
            ? product.min_stock_level * product.pieces_per_box 
            : product.min_stock_level)
          const isOutOfStock = totalPieces === 0
          const profitMargin = getProfitMargin(product)

          return viewMode === "grid" ? (
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
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Box & Piece
                    </div>
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
                    {product.pieces_per_box ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Boxes:</span>
                          <span className={`font-bold ${isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-foreground"}`}>
                            {product.boxes_in_stock}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total pieces:</span>
                          <span className={`font-bold ${isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-foreground"}`}>
                            {totalPieces}
                          </span>
                        </div>
                        {(product.open_box_pieces || 0) > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Open pieces:</span>
                            <span className="font-medium text-primary">{product.open_box_pieces}</span>
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
                          {product.boxes_in_stock}
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
                    {product.pieces_per_box ? (
                      // Box product - show both box and piece prices
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Buying (box):</span>
                          <span className="font-medium text-foreground">
                            {(product.buy_price_per_box ?? 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Selling (box):</span>
                          <span className="font-medium text-success">
                            {(product.selling_price_per_box ?? 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Buying (piece):</span>
                          <span className="font-medium text-foreground">
                            {(product.buy_price_per_piece ?? 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Selling (piece):</span>
                          <span className="font-medium text-success">
                            {(product.selling_price_per_piece ?? 0).toLocaleString()} RWF
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Piece product - show only piece prices
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Buying:</span>
                          <span className="font-medium text-foreground">
                            {(product.buy_price_per_piece ?? 0).toLocaleString()} RWF
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Selling:</span>
                          <span className="font-medium text-success">
                            {(product.selling_price_per_piece ?? 0).toLocaleString()} RWF
                          </span>
                        </div>
                      </div>
                    )}
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Retail sales:</span>
                    <Badge variant={product.allow_retail_sales ? "default" : "secondary"} className="text-xs">
                      {product.allow_retail_sales ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // List View
            <Card key={product.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="relative h-16 w-16 bg-gradient-to-br from-secondary to-secondary/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-12 w-12 object-contain"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex gap-1 ml-2">
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-xs">Out</Badge>
                        )}
                        {isLowStock && !isOutOfStock && (
                          <Badge variant="outline" className="text-xs bg-warning/20 border-warning">Low</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Stock:</span>
                        <p className={`font-medium ${isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-foreground"}`}>
                          {totalPieces} {product.pieces_per_box ? 'pcs' : 'units'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium text-success">
                          {(product.selling_price_per_piece || 0).toLocaleString()} RWF
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Margin:</span>
                        <p className="font-medium text-success">
                          {profitMargin.toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditProduct(product)}
                          className="h-8"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteProduct(product)}
                          className="h-8 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No Results */}
      {filteredAndSortedProducts.length === 0 && products.length > 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">No products found</p>
          {search && <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>}
          <Button 
            variant="outline" 
            onClick={() => {
              setSearch("")
              setFilterBy("all")
            }}
            className="mt-3"
          >
            Clear filters
          </Button>
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