import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp } from "lucide-react"

export async function HomePageProducts() {
  const supabase = await createClient()

  // Fetch products from database
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .limit(6)
    .order("created_at", { ascending: false })

  const productList = products || []

  return (
    <section className="mb-16">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-foreground mb-2">Popular Products</h3>
        <p className="text-muted-foreground">Browse products currently in our system</p>
      </div>

      {productList.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productList.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{product.brand}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Product Image */}
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}

                {/* Stock Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stock Level:</span>
                    <span className={`font-semibold ${product.quantity > product.minimum_stock_level ? "text-green-600" : "text-orange-600"}`}>
                      {product.quantity} units
                    </span>
                  </div>

                  {/* Stock Bar */}
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${product.quantity > product.minimum_stock_level ? "bg-green-500" : "bg-orange-500"}`}
                      style={{ width: `${Math.min((product.quantity / (product.minimum_stock_level * 2)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Price and Minimum Stock */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold text-primary">{Number(product.price_per_unit).toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Min Stock</p>
                    <p className="font-semibold">{product.minimum_stock_level}</p>
                  </div>
                </div>

                {/* Stock Value */}
                <div className="bg-primary/5 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="font-bold text-primary">
                    {(product.quantity * Number(product.price_per_unit)).toLocaleString()} RWF
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex justify-center mb-4">
              <TrendingUp className="w-12 h-12 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-foreground mb-2">No Products Yet</h4>
            <p className="text-muted-foreground">Get started by adding your first product to the system</p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
