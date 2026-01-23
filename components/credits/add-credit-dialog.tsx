"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, CreditCard, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface AddCreditDialogProps {
  customerName: string
  existingCredits: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCreditDialog({ customerName, existingCredits, open, onOpenChange }: AddCreditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    amount: "",
    notes: "",
  })

  const resetForm = () => {
    setFormData({
      amount: "",
      notes: "",
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const amount = Number.parseFloat(formData.amount)
    if (amount <= 0) {
      setError("Amount must be greater than 0")
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setIsLoading(false)
      return
    }

    try {
      // Create a new credit record
      const { error: creditError } = await supabase
        .from("credits")
        .insert({
          customer_name: customerName,
          amount: amount,
          amount_owed: amount,
          amount_paid: 0,
          status: "PENDING",
          is_active: true,
          notes: formData.notes.trim() || null,
          user_id: user.id,
          transaction_id: null, // This is an additional credit, not from a sale
        })

      if (creditError) {
        setError(creditError.message)
        setIsLoading(false)
        return
      }

      toast.success(`Added ${amount.toLocaleString()} RWF credit for ${customerName}`)
      resetForm()
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Additional Credit
          </DialogTitle>
          <DialogDescription>
            Add more credit for {customerName} before paying existing credits
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <Card className="bg-secondary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{customerName}</p>
                  <p className="text-sm text-muted-foreground">Current Credits</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {existingCredits.toLocaleString()} RWF
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="credit-amount" className="text-base font-medium">
              Additional Credit Amount * (RWF)
            </Label>
            <Input
              id="credit-amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="h-12 text-lg"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="credit-notes" className="text-base font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="credit-notes"
              placeholder="Reason for additional credit..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          {/* Total Preview */}
          {formData.amount && Number.parseFloat(formData.amount) > 0 && (
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-warning" />
                  <h4 className="font-medium">Credit Summary</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current credits:</span>
                    <span className="font-medium">{existingCredits.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional credit:</span>
                    <span className="font-medium">{Number.parseFloat(formData.amount).toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-warning/20">
                    <span className="font-medium">Total credits:</span>
                    <span className="text-lg font-bold text-warning">
                      {(existingCredits + Number.parseFloat(formData.amount)).toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-12 flex-1"
              disabled={isLoading || !formData.amount || Number.parseFloat(formData.amount) <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Credit
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}