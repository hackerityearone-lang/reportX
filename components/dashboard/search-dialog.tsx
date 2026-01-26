"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Package, Users, CreditCard, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  type: "product" | "customer" | "credit"
  title: string
  subtitle: string
  href: string
  status?: string
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim() || !open) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const searchResults: SearchResult[] = []

        // Search products
        const { data: products } = await supabase
          .from('products')
          .select('id, name, brand, boxes_in_stock, pieces_per_box, min_stock_level')
          .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
          .limit(5)

        products?.forEach(product => {
          const totalStock = product.pieces_per_box 
            ? (product.boxes_in_stock * product.pieces_per_box)
            : product.boxes_in_stock
          const isLowStock = totalStock <= product.min_stock_level
          
          searchResults.push({
            id: product.id,
            type: "product",
            title: product.name,
            subtitle: `${product.brand} • ${totalStock} in stock`,
            href: "/dashboard/products",
            status: totalStock === 0 ? "Out of Stock" : isLowStock ? "Low Stock" : undefined
          })
        })

        // Search customers
        const { data: customers } = await supabase
          .from('customers')
          .select('id, name, phone, email')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(5)

        customers?.forEach(customer => {
          searchResults.push({
            id: customer.id,
            type: "customer",
            title: customer.name,
            subtitle: customer.phone || customer.email || "No contact info",
            href: "/dashboard/customers"
          })
        })

        // Search credits
        const { data: credits } = await supabase
          .from('credits')
          .select('id, customer_name, amount_owed, amount_paid, status')
          .ilike('customer_name', `%${query}%`)
          .limit(5)

        credits?.forEach(credit => {
          const remaining = credit.amount_owed - credit.amount_paid
          searchResults.push({
            id: credit.id,
            type: "credit",
            title: credit.customer_name,
            subtitle: `${remaining.toLocaleString()} RWF remaining`,
            href: "/dashboard/credits",
            status: credit.status
          })
        })

        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, open])

  const handleResultClick = (result: SearchResult) => {
    router.push(result.href)
    onOpenChange(false)
    setQuery("")
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "product": return <Package className="h-4 w-4" />
      case "customer": return <Users className="h-4 w-4" />
      case "credit": return <CreditCard className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Out of Stock": return "destructive"
      case "Low Stock": return "outline"
      case "PENDING": return "outline"
      case "OVERDUE": return "destructive"
      default: return "secondary"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Search products, customers, credits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-base"
            autoFocus
          />

          {loading && (
            <div className="text-center py-4 text-muted-foreground">
              Searching...
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <Button
                  key={`${result.type}-${result.id}`}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 hover:bg-muted"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="text-muted-foreground">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                    </div>
                    {result.status && (
                      <Badge variant={getStatusColor(result.status)} className="text-xs">
                        {result.status}
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              ))}
            </div>
          )}

          {query && !loading && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}