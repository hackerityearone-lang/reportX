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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Banknote } from "lucide-react"
import type { Credit } from "@/lib/types"

interface PayCreditDialogProps {
  credit: Credit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PayCreditDialog({ credit, open, onOpenChange }: PayCreditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const router = useRouter()

  const remaining = credit ? credit.amount_owed - credit.amount_paid : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!credit) return

    setIsLoading(true)
    setError(null)

    const paymentAmount = Number.parseFloat(amount)
    if (paymentAmount <= 0) {
      setError("Amafaranga agomba kuba menshi kuruta 0")
      setIsLoading(false)
      return
    }

    if (paymentAmount > remaining) {
      setError(`Amafaranga arenze. Asigaye: ${remaining.toLocaleString()} RWF`)
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

    // Create credit payment
    const { error: paymentError } = await supabase.from("credit_payments").insert({
      credit_id: credit.id,
      amount: paymentAmount,
      notes: notes || null,
      user_id: user.id,
    })

    if (paymentError) {
      setError(paymentError.message)
      setIsLoading(false)
      return
    }

    onOpenChange(false)
    setAmount("")
    setNotes("")
    router.refresh()
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-success" />
            Kwishyura Ideni
          </DialogTitle>
          <DialogDescription>Andika amafaranga {credit?.customer_name} yishyura</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Credit Info */}
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Umukiriya:</span>
                <span className="font-medium">{credit?.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ideni ryose:</span>
                <span className="font-medium">{credit?.amount_owed.toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Yishyuye:</span>
                <span className="font-medium text-success">{credit?.amount_paid.toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground font-medium">Asigaye:</span>
                <span className="font-bold text-warning">{remaining.toLocaleString()} RWF</span>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">Amafaranga yishyura *</Label>
              <Input
                id="payment-amount"
                type="number"
                min="1"
                max={remaining}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-lg"
                required
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(remaining.toString())}
                  className="text-xs bg-transparent"
                >
                  Ishyura Byose ({remaining.toLocaleString()})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(Math.floor(remaining / 2).toString())}
                  className="text-xs bg-transparent"
                >
                  Igice ({Math.floor(remaining / 2).toLocaleString()})
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="payment-notes">Icyitonderwa</Label>
              <Textarea
                id="payment-notes"
                placeholder="Icyitonderwa ku kwishyura..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                <>
                  <Banknote className="mr-2 h-4 w-4" />
                  Kwishyura
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
