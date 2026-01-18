import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp, AlertCircle, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(amount)
}

export async function HomePageProducts() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .limit(6)
    .order("created_at", { ascending: false })

  if (error || !products || products.length === 0) {
    return <EmptyProductsState />
  }

  return (
    <section className="mb-16 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-bold tracking-tight text-foreground">Popular Products</h3>
          <p className="text-muted-foreground mt-1">Real-time overview of your top inventory items.</p>
        </div>
        <Link href="/products" className="group flex items-center text-sm font-medium text-primary hover:underline">
          View all products
          <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const isLowStock = product.quantity <= product.minimum_stock_level
          const stockPercentage = Math.min((product.quantity / (product.minimum_stock_level * 2)) * 100, 100)

          return (
            <Card key={product.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-48 w-full bg-muted">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant={isLowStock ? "destructive" : "secondary"} className="backdrop-blur-md bg-opacity-90">
                    {isLowStock ? "Low Stock" : "In Stock"}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-primary uppercase tracking-wider">{product.brand}</p>
                  <CardTitle className="text-xl line-clamp-1">{product.name}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stock Logic */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Availability</span>
                    <span className={`font-bold ${isLowStock ? "text-destructive" : "text-green-600"}`}>
                      {product.quantity} units
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${isLowStock ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Price</p>
                    <p className="font-semibold text-foreground">{formatCurrency(product.price_per_unit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Total Value</p>
                    <p className="font-bold text-primary">
                      {formatCurrency(product.quantity * product.price_per_unit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function EmptyProductsState() {
  return (
    <section className="py-20 text-center border-2 border-dashed rounded-3xl border-border/60">
      <div className="max-w-[400px] mx-auto space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <TrendingUp className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">No products found</h3>
        <p className="text-muted-foreground">Start by adding items to your inventory to see them displayed here.</p>
        <Link href="/dashboard/products/new">
          <Badge className="mt-4 px-4 py-1 cursor-pointer">Create Product +</Badge>
        </Link>
      </div>
    </section>
  )
}