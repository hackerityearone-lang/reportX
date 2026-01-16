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
import { Loader2, AlertTriangle, Archive } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"

interface DeleteProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleteSuccess?: () => void
}

export function DeleteProductDialog({ product, open, onOpenChange, onDeleteSuccess }: DeleteProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasTransactions, setHasTransactions] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const checkForTransactions = async (productId: string) => {
    const supabase = createClient()
    
    // Check if product has any sales history
    const { data, error } = await supabase
      .from("stock_out_items")
      .select("id")
      .eq("product_id", productId)
      .limit(1)

    return !error && data && data.length > 0
  }

  const handleDelete = async () => {
    if (!product) return

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error("You must be logged in to delete products")
      }

      console.log("Checking for transactions...")
      const hasSales = await checkForTransactions(product.id)
      
      if (hasSales) {
        // Product has sales history - use soft delete (archive)
        console.log("Product has sales history, archiving instead of deleting...")
        
        const { data, error: updateError } = await supabase
          .from("products")
          .update({ 
            is_archived: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", product.id)
          .select()

        if (updateError) {
          console.error("Archive error:", updateError)
          throw new Error(updateError.message)
        }

        if (!data || data.length === 0) {
          throw new Error("Failed to archive product. Please check your permissions.")
        }

        toast({
          title: "Igicuruzwa cyashyizwe mu bubiko",
          description: `${product.name} ntikizagaragara mu bicuruzwa bikora, ariko amateka yacho azakomezwa.`,
        })
        
      } else {
        // No sales history - safe to delete permanently
        console.log("No sales history, deleting permanently...")
        
        const { data, error: deleteError } = await supabase
          .from("products")
          .delete()
          .eq("id", product.id)
          .select()

        if (deleteError) {
          console.error("Delete error:", deleteError)
          throw new Error(deleteError.message)
        }

        if (!data || data.length === 0) {
          throw new Error("Failed to delete product. Please check your permissions.")
        }

        toast({
          title: "Byakunze",
          description: `${product.name} yasibiwe neza.`,
        })
      }

      onOpenChange(false)
      
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
      
      router.refresh()
      
    } catch (err: any) {
      console.error("Failed to delete/archive product:", err)
      
      // Check if it's the foreign key constraint error
      if (err.message?.includes("foreign key constraint")) {
        setError("Igicuruzwa kigizwe n'amateka y'amagurishwa. Ntishobora gusibwa kugira ngo amateka akomezwe. Byashingiwe ku gicuruzwa gishya.")
        setHasTransactions(true)
      } else {
        setError(err.message || "Ntibyashobotse gusiba igicuruzwa")
      }
      
      toast({
        title: "Ikosa",
        description: err.message || "Ntibyashobotse gusiba igicuruzwa",
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
            {hasTransactions ? (
              <>
                <Archive className="h-5 w-5 text-orange-500" />
                Shyira mu bubiko Igicuruzwa
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Siba Igicuruzwa
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasTransactions ? (
              <>
                <strong>{product?.name}</strong> gifite amateka y'amagurishwa. Ntishobora gusibwa kugira ngo amateka akomezwe.
                <br /><br />
                Igicuruzwa kizashyirwa mu bubiko kandi ntikizagaragara mu bicuruzwa bikora.
              </>
            ) : (
              <>
                Urashaka gusiba <strong>{product?.name}</strong>? Ibi ntibishobora gusubizwa inyuma.
              </>
            )}
          </AlertDialogDescription>
          {product && !hasTransactions && (
            <p className="mt-2 text-xs text-muted-foreground">
              ID: {product.id}
            </p>
          )}
          {error && (
            <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive font-medium">Ikosa:</p>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setError(null)
              setHasTransactions(false)
              onOpenChange(false)
            }} 
            disabled={isLoading}
            className="bg-transparent"
          >
            Hagarika
          </Button>
          <Button 
            variant={hasTransactions ? "default" : "destructive"} 
            onClick={handleDelete} 
            disabled={isLoading}
            className={hasTransactions ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tegereza...
              </>
            ) : hasTransactions ? (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Shyira mu bubiko
              </>
            ) : (
              "Siba"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}