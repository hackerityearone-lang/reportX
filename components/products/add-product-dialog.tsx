"use client"

import type React from "react"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"

export function AddProductDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    quantity: "",
    min_stock_level: "10",
    price: "",
    image_url: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: insertError } = await supabase.from("products").insert({
      name: formData.name,
      brand: formData.brand,
      quantity: Number.parseInt(formData.quantity) || 0,
      min_stock_level: Number.parseInt(formData.min_stock_level) || 10,
      price: Number.parseFloat(formData.price) || 0,
      image_url: formData.image_url || null,
    })

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    setOpen(false)
    setFormData({
      name: "",
      brand: "",
      quantity: "",
      min_stock_level: "10",
      price: "",
      image_url: "",
    })
    router.refresh()
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Ongeraho Igicuruzwa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ongeraho Igicuruzwa Gishya</DialogTitle>
          <DialogDescription>Uzuza amakuru y'igicuruzwa gishya</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Izina ry'igicuruzwa *</Label>
              <Input
                id="name"
                placeholder="Urugero: Heineken 33cl"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand">Brand / Urwego</Label>
              <Input
                id="brand"
                placeholder="Urugero: Heineken"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Umubare (Stock)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="min_stock">Stock Ntarengwa</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Igiciro (RWF) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                placeholder="1000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">URL y'Ifoto</Label>
              <Input
                id="image"
                type="url"
                placeholder="https://..."
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-transparent">
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
