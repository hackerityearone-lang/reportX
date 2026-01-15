"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"

interface DeleteProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteProductDialog({ product, open, onOpenChange }: DeleteProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!product) return

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id)

      if (deleteError) {
        console.error("Delete error:", deleteError)
        throw new Error(deleteError.message)
      }

      toast({
        title: "Success",
        description: `${product.name} has been deleted successfully.`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (err: any) {
      console.error("Failed to delete product:", err)
      setError(err.message || "Failed to delete product")
      
      toast({
        title: "Error",
        description: err.message || "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Siba Igicuruzwa
          </AlertDialogTitle>
          <AlertDialogDescription>
            Urashaka gusiba <strong>{product?.name}</strong>? Ibi ntibishobora gusubizwa inyuma.
          </AlertDialogDescription>
          {error && (
            <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
            className="bg-transparent"
          >
            Hagarika
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tegereza...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}