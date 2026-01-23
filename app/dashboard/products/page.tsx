import { createClient } from "@/lib/supabase/server"
import { ProductsGrid } from "@/components/products/products-grid"
import { Beer } from "lucide-react"

export default async function ProductsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_archived", false)
    .order("name", { ascending: true })

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Beer className="h-7 w-7 text-primary" />
            Products
          </h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
      </div>

      {/* Products Grid - now includes add product functionality */}
      <ProductsGrid products={products || []} />
    </div>
  )
}
