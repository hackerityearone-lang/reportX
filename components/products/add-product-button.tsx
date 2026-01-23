"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddProductDialog } from "./add-product-dialog"

export function AddProductButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Add Product
      </Button>
      <AddProductDialog open={open} onOpenChange={setOpen} />
    </>
  )
}