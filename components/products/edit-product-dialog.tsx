"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"

interface EditProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProductDialog({ product, open, onOpenChange }: EditProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    quantity: "",
    min_stock_level: "",
    price: "",
    image_url: "",
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand,
        quantity: product.quantity.toString(),
        min_stock_level: product.min_stock_level.toString(),
        price: product.price.toString(),
        image_url: product.image_url || "",
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name: formData.name,
        brand: formData.brand,
        quantity: Number.parseInt(formData.quantity) || 0,
        min_stock_level: Number.parseInt(formData.min_stock_level) || 10,
        price: Number.parseFloat(formData.price) || 0,
        image_url: formData.image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)

    if (updateError) {
      setError(updateError.message)
      setIsLoading(false)
      return
    }

    onOpenChange(false)
    router.refresh()
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hindura Igicuruzwa</DialogTitle>
          <DialogDescription>Hindura amakuru y'igicuruzwa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Izina ry'igicuruzwa *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-brand">Brand / Urwego</Label>
              <Input
                id="edit-brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-quantity">Umubare (Stock)</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-min_stock">Stock Ntarengwa</Label>
                <Input
                  id="edit-min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Igiciro (RWF) *</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">URL y'Ifoto</Label>
              <Input
                id="edit-image"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent">
              Hagarika
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tegereza...
                </>
              ) : (
                "Bika"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
