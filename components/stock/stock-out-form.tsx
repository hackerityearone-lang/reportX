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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Minus, Beer, Banknote, CreditCard, AlertTriangle } from "lucide-react"
import type { Product } from "@/lib/types"

interface StockOutFormProps {
  products: Product[]
}

export function StockOutForm({ products }: StockOutFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    payment_type: "CASH" as "CASH" | "CREDIT",
    customer_name: "",
    notes: "",
  })

  const selectedProduct = products.find((p) => p.id === formData.product_id)
  const quantity = Number.parseInt(formData.quantity) || 0
  const isInsufficientStock = selectedProduct && quantity > selectedProduct.quantity
  const totalAmount = quantity * (selectedProduct?.price ?? 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (isInsufficientStock) {
      setError(`Stock ntigihagije. Stock isigaye: ${selectedProduct?.quantity}`)
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Ntabwo winjiye mu konti")
      setIsLoading(false)
      return
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("stock_transactions")
      .insert({
        product_id: formData.product_id,
        type: "STOCK_OUT",
        quantity: quantity,
        payment_type: formData.payment_type,
        customer_name: formData.payment_type === "CREDIT" ? formData.customer_name : null,
        amount_owed: totalAmount,
        notes: formData.notes || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (transactionError) {
      setError(transactionError.message)
      setIsLoading(false)
      return
    }

    if (formData.payment_type === "CREDIT" && formData.customer_name) {
      const { error: creditError } = await supabase.from("credits").insert({
        customer_name: formData.customer_name,
        transaction_id: transaction.id,
        amount: totalAmount,
        is_paid: false,
      })

      if (creditError) {
        setError(creditError.message)
        setIsLoading(false)
        return
      }
    }

    const newQuantity = (selectedProduct?.quantity ?? 0) - quantity
    await supabase.from("products").update({ quantity: newQuantity }).eq("id", formData.product_id)

    setSuccess(true)
    setFormData({
      product_id: "",
      quantity: "",
      payment_type: "CASH",
      customer_name: "",
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
            <p className="text-muted-foreground mb-4">Tangira wongereho ibicuruzwa mbere yo kugurisha</p>
            <Button onClick={() => router.push("/dashboard/products")}>Ongeraho Igicuruzwa</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Andika Ibisohotse</CardTitle>
        <CardDescription>Gurisha igicuruzwa - cash cyangwa ideni</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="product-out">Igicuruzwa *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  product_id: value,
                })
              }}
            >
              <SelectTrigger id="product-out" className="h-12">
                <SelectValue placeholder="Hitamo igicuruzwa" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id} disabled={product.quantity === 0}>
                    <div className="flex items-center gap-2">
                      <span>{product.name}</span>
                      <span
                        className={`text-xs ${product.quantity <= product.min_stock_level ? "text-warning" : "text-muted-foreground"}`}
                      >
                        (Stock: {product.quantity})
                      </span>
                      {product.quantity === 0 && <span className="text-xs text-destructive">(Birabuze)</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity-out">Umubare *</Label>
            <Input
              id="quantity-out"
              type="number"
              min="1"
              max={selectedProduct?.quantity || 999}
              placeholder="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className={`h-12 text-lg ${isInsufficientStock ? "border-destructive" : ""}`}
              required
            />
            {isInsufficientStock && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Stock isigaye: {selectedProduct?.quantity}
              </p>
            )}
          </div>

          {formData.quantity && selectedProduct && !isInsufficientStock && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Igiciro:</span>
                <span className="font-medium">{selectedProduct.price.toLocaleString()} RWF / kimwe</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-muted-foreground">Igiteranyo:</span>
                <span className="text-xl font-bold text-foreground">{totalAmount.toLocaleString()} RWF</span>
              </div>
            </div>
          )}

          {/* Payment Type */}
          <div className="grid gap-3">
            <Label>Uburyo bwo Kwishyura *</Label>
            <RadioGroup
              value={formData.payment_type}
              onValueChange={(value: "CASH" | "CREDIT") => setFormData({ ...formData, payment_type: value })}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="cash"
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  formData.payment_type === "CASH"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="CASH" id="cash" />
                <Banknote className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Amafaranga</p>
                  <p className="text-xs text-muted-foreground">Cash</p>
                </div>
              </Label>
              <Label
                htmlFor="credit"
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  formData.payment_type === "CREDIT"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="CREDIT" id="credit" />
                <CreditCard className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Ideni</p>
                  <p className="text-xs text-muted-foreground">Credit</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Credit Customer Info */}
          {formData.payment_type === "CREDIT" && (
            <div className="space-y-4 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-warning" />
                Amakuru y'Umukiriya
              </h4>
              <div className="grid gap-2">
                <Label htmlFor="customer_name">Izina ry'Umukiriya *</Label>
                <Input
                  id="customer_name"
                  placeholder="Jean Claude"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required={formData.payment_type === "CREDIT"}
                  className="h-11"
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes-out">Icyitonderwa</Label>
            <Textarea
              id="notes-out"
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
              <p className="text-sm text-success">
                Igurishwa ryanditswe neza!
                {formData.payment_type === "CREDIT" && " Ideni ryongerewe."}
              </p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full h-12 text-lg" disabled={isLoading || isInsufficientStock}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Tegereza...
              </>
            ) : (
              <>
                <Minus className="mr-2 h-5 w-5" />
                Gurisha
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
