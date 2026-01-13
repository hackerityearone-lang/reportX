"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Beer } from "lucide-react"
import type { Product } from "@/lib/types"

interface StockInFormProps {
  products: Product[]
}

export function StockInForm({ products }: StockInFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    notes: "",
  })

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Ntabwo winjiye mu konti")
      setIsLoading(false)
      return
    }

    const quantity = Number.parseInt(formData.quantity)

    const { error: insertError } = await supabase.from("stock_transactions").insert({
      product_id: formData.product_id,
      type: "STOCK_IN",
      quantity: quantity,
      amount_owed: quantity * (selectedProduct?.price ?? 0),
      notes: formData.notes || null,
      user_id: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    const newQuantity = (selectedProduct?.quantity ?? 0) + quantity
    await supabase.from("products").update({ quantity: newQuantity }).eq("id", formData.product_id)

    setSuccess(true)
    setFormData({
      product_id: "",
      quantity: "",
      notes: "",
    })
    router.refresh()
    setIsLoading(false)

    setTimeout(() => setSuccess(false), 3000)
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Beer className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nta bicuruzwa bihari</h3>
            <p className="text-muted-foreground mb-4">Tangira wongereho ibicuruzwa mbere yo kwandika ibyinjiye</p>
            <Button onClick={() => router.push("/dashboard/products")}>
              <Plus className="h-4 w-4 mr-2" />
              Ongeraho Igicuruzwa
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Andika Ibyinjiye</CardTitle>
        <CardDescription>Ongeraho stock bishya mu bubiko</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="product">Igicuruzwa *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  product_id: value,
                })
              }}
            >
              <SelectTrigger id="product" className="h-12">
                <SelectValue placeholder="Hitamo igicuruzwa" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-2">
                      <span>{product.name}</span>
                      <span className="text-muted-foreground">({product.brand})</span>
                      <span className="text-xs text-muted-foreground ml-2">Stock: {product.quantity}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Umubare *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="h-12 text-lg"
              required
            />
          </div>

          {formData.quantity && selectedProduct && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Igiciro:</span>
                <span className="font-medium">{selectedProduct.price.toLocaleString()} RWF / kimwe</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">Igiteranyo:</span>
                <span className="text-xl font-bold text-foreground">
                  {(Number.parseInt(formData.quantity || "0") * selectedProduct.price).toLocaleString()} RWF
                </span>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Icyitonderwa</Label>
            <Textarea
              id="notes"
              placeholder="Icyitonderwa cyangwa amakuru y'inyongera..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-3">
              <p className="text-sm text-success">Stock yongewe neza!</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Tegereza...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Ongeraho Stock
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
