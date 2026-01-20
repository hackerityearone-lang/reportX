"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Loader2, DollarSign, AlertTriangle, CheckCircle2, Search, X } from "lucide-react"
import type { Credit } from "@/lib/types"
import { creditService } from "@/lib/supabase/credit-service"

interface CreditWithPayments extends Credit {
  credit_payments?: Array<{ id: string; amount: number; payment_date: string; notes: string | null }>
}

export function CreditPaymentManager() {
  const [activeTab, setActiveTab] = useState("pending")
  const [credits, setCredits] = useState<CreditWithPayments[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Payment form state
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Load credits
  useEffect(() => {
    loadCredits()
  }, [activeTab])

  const loadCredits = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const status = activeTab === "pending" ? "PENDING" : activeTab === "partial" ? "PARTIAL" : "PAID"
      const data = await creditService.getCredits({ status })
      setCredits(data)
    } catch (err: any) {
      setError(err.message || "Failed to load credits")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!selectedCreditId || !paymentAmount) return

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const amount = Number.parseFloat(paymentAmount)
      await creditService.recordCreditPayment(selectedCreditId, amount, paymentNotes)

      setSuccess(`Payment recorded successfully!`)
      setPaymentAmount("")
      setPaymentNotes("")
      setSelectedCreditId(null)

      await loadCredits()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to record payment")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayAll = async (creditId: string) => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      await creditService.payAllCredit(creditId, "Full payment")

      setSuccess(`Credit fully paid!`)
      setSelectedCreditId(null)

      await loadCredits()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to pay credit")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (status) {
      case "PENDING":
        return "destructive"
      case "PARTIAL":
        return "secondary"
      case "PAID":
        return "default"
      default:
        return "secondary"
    }
  }

  // Filter credits by search query and status
  const filteredCredits = credits.filter((c) => {
    const matchesStatus = c.status === (activeTab === "pending" ? "PENDING" : activeTab === "partial" ? "PARTIAL" : "PAID")
    const matchesSearch = searchQuery === "" || 
      c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const renderCreditCard = (credit: CreditWithPayments) => {
    const isSelected = selectedCreditId === credit.id
    const remainingBalance = (credit.amount_owed || 0) - (credit.amount_paid || 0)

    return (
      <div
        key={credit.id}
        className={`p-4 rounded-lg border-2 transition-colors ${
          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <div 
          className="flex justify-between items-start gap-4 cursor-pointer"
          onClick={() => setSelectedCreditId(isSelected ? null : credit.id)}
        >
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{credit.customer_name}</p>
              <Badge variant={getStatusColor(credit.status)} className="text-xs">
                {credit.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Owed</p>
                <p className="font-medium">{(credit.amount_owed || 0).toLocaleString()} RWF</p>
              </div>
              <div>
                <p className="text-muted-foreground">Already Paid</p>
                <p className="font-medium text-green-600">{(credit.amount_paid || 0).toLocaleString()} RWF</p>
              </div>
              <div>
                <p className="text-muted-foreground">Remaining</p>
                <p className={`font-medium ${credit.status === "PARTIAL" ? "text-orange-600" : "text-destructive"}`}>
                  {remainingBalance.toLocaleString()} RWF
                </p>
              </div>
            </div>

            {/* Progress Bar for Partial */}
            {credit.status === "PARTIAL" && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {Math.round(((credit.amount_paid || 0) / (credit.amount_owed || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-600 h-full transition-all"
                    style={{
                      width: `${((credit.amount_paid || 0) / (credit.amount_owed || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Payment History */}
            {credit.credit_payments && credit.credit_payments.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Payment History</p>
                {credit.credit_payments.map((payment) => (
                  <div key={payment.id} className="text-xs text-muted-foreground">
                    {new Date(payment.payment_date).toLocaleDateString()}: {payment.amount.toLocaleString()} RWF
                    {payment.notes && ` (${payment.notes})`}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground mb-2">
              {new Date(credit.created_at).toLocaleDateString()}
            </p>
            <Badge variant="outline" className="gap-1">
              <DollarSign className="h-3 w-3" />
              {remainingBalance.toLocaleString()} RWF
            </Badge>
          </div>
        </div>

        {/* Payment Form */}
        {isSelected && (
          <div 
            className="mt-4 p-4 rounded-lg bg-secondary/30 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Record Payment</h4>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handlePayAll(credit.id)}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-3 w-3" />
                    Pay All ({remainingBalance.toLocaleString()} RWF)
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="amount" className="text-sm">
                  Payment Amount (max: {remainingBalance.toLocaleString()} RWF)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingBalance}
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="h-10 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes" className="text-sm">
                  Notes (optional)
                </Label>
                <Input
                  id="notes"
                  placeholder="E.g., Partial payment, Check #123"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="h-10 mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing || !paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > remainingBalance}
                  className="flex-1"
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Record Partial Payment"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedCreditId(null)
                    setPaymentAmount("")
                    setPaymentNotes("")
                  }}
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Credit Management
        </CardTitle>
        <CardDescription>Track and manage customer credits & payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-10 h-11"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending
              {credits.filter((c) => c.status === "PENDING").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {credits.filter((c) => c.status === "PENDING").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="partial">
              Partial
              {credits.filter((c) => c.status === "PARTIAL").length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {credits.filter((c) => c.status === "PARTIAL").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid">
              Paid
              {credits.filter((c) => c.status === "PAID").length > 0 && (
                <Badge variant="default" className="ml-2">
                  {credits.filter((c) => c.status === "PAID").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Credits Tab */}
          <TabsContent value="pending" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCredits.length > 0 ? (
              <div className="space-y-3">
                {filteredCredits.map(renderCreditCard)}
              </div>
            ) : (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No credits found matching "{searchQuery}"</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600 opacity-50" />
                    <p className="text-muted-foreground">No pending credits</p>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Partial Credits Tab */}
          <TabsContent value="partial" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCredits.length > 0 ? (
              <div className="space-y-3">
                {filteredCredits.map(renderCreditCard)}
              </div>
            ) : (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No credits found matching "{searchQuery}"</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600 opacity-50" />
                    <p className="text-muted-foreground">No partial credits</p>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Paid Credits Tab */}
          <TabsContent value="paid" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCredits.length > 0 ? (
              <div className="space-y-3">
                {filteredCredits.map((credit) => (
                  <div key={credit.id} className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{credit.customer_name}</p>
                          <Badge variant="default" className="text-xs bg-green-500">
                            PAID
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Owed</p>
                            <p className="font-medium">{(credit.amount_owed || 0).toLocaleString()} RWF</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Paid</p>
                            <p className="font-medium text-green-600">{(credit.amount_paid || 0).toLocaleString()} RWF</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium text-green-600">Settled</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(credit.created_at).toLocaleDateString()}
                        </p>
                        <Badge variant="default" className="gap-1 bg-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                          Complete
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No credits found matching "{searchQuery}"</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No paid credits</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default CreditPaymentManager;