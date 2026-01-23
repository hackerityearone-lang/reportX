"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  CreditCard, 
  Loader2, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  X, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Filter,
  Download,
  Eye,
  Zap,
  Calculator,
  History,
  User,
  Phone,
  Mail,
  MapPin
} from "lucide-react"
import type { Credit } from "@/lib/types"
import { creditService } from "@/lib/supabase/credit-service"

interface CreditWithPayments extends Credit {
  credit_payments?: Array<{ id: string; amount: number; payment_date: string; notes: string | null }>
  customers?: { id: string; name: string; phone?: string; email?: string }
}

export function CreditPaymentManager() {
  const [activeTab, setActiveTab] = useState("pending")
  const [credits, setCredits] = useState<CreditWithPayments[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [amountFilter, setAmountFilter] = useState<"all" | "small" | "medium" | "large">("all")

  // Payment form state
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [quickAmounts, setQuickAmounts] = useState<number[]>([])

  // Dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedCredit, setSelectedCredit] = useState<CreditWithPayments | null>(null)

  useEffect(() => {
    loadCredits()
  }, [])

  const loadCredits = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await creditService.getCredits()
      setCredits(data)
    } catch (err: any) {
      setError(err.message || "Failed to load credits")
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate quick payment amounts based on remaining balance
  const calculateQuickAmounts = (remainingBalance: number) => {
    const amounts = [
      Math.round(remainingBalance * 0.25), // 25%
      Math.round(remainingBalance * 0.5),  // 50%
      Math.round(remainingBalance * 0.75), // 75%
      remainingBalance // 100%
    ].filter(amount => amount > 0)
    return [...new Set(amounts)].sort((a, b) => a - b)
  }

  const handlePaymentSubmit = async () => {
    if (!selectedCreditId || !paymentAmount) return

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const amount = Number.parseFloat(paymentAmount)
      await creditService.recordCreditPayment(selectedCreditId, amount, paymentNotes)

      setSuccess(`Payment of ${amount.toLocaleString()} RWF recorded successfully!`)
      setPaymentAmount("")
      setPaymentNotes("")
      setSelectedCreditId(null)
      setShowPaymentDialog(false)

      await loadCredits()
      setTimeout(() => setSuccess(null), 5000)
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
      setSuccess("Credit fully paid!")
      setSelectedCreditId(null)
      setShowPaymentDialog(false)
      await loadCredits()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setError(err.message || "Failed to pay credit")
    } finally {
      setIsProcessing(false)
    }
  }

  const openPaymentDialog = (credit: CreditWithPayments) => {
    setSelectedCredit(credit)
    setSelectedCreditId(credit.id)
    const remainingBalance = (credit.amount_owed || 0) - (credit.amount_paid || 0)
    setQuickAmounts(calculateQuickAmounts(remainingBalance))
    setShowPaymentDialog(true)
  }

  const openDetailsDialog = (credit: CreditWithPayments) => {
    setSelectedCredit(credit)
    setShowDetailsDialog(true)
  }

  // Advanced filtering and sorting
  const filteredAndSortedCredits = useMemo(() => {
    let filtered = credits.filter((c) => {
      const matchesStatus = c.status === (activeTab === "pending" ? "PENDING" : activeTab === "partial" ? "PARTIAL" : "PAID")
      const matchesSearch = searchQuery === "" || 
        c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customers?.phone?.includes(searchQuery)
      
      let matchesAmount = true
      if (amountFilter !== "all") {
        const amount = c.amount_owed || 0
        switch (amountFilter) {
          case "small": matchesAmount = amount < 50000; break
          case "medium": matchesAmount = amount >= 50000 && amount < 200000; break
          case "large": matchesAmount = amount >= 200000; break
        }
      }
      
      return matchesStatus && matchesSearch && matchesAmount
    })

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      switch (sortBy) {
        case "amount":
          aVal = a.amount_owed || 0
          bVal = b.amount_owed || 0
          break
        case "remaining":
          aVal = (a.amount_owed || 0) - (a.amount_paid || 0)
          bVal = (b.amount_owed || 0) - (b.amount_paid || 0)
          break
        case "customer":
          aVal = a.customer_name || ""
          bVal = b.customer_name || ""
          break
        default:
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [credits, activeTab, searchQuery, amountFilter, sortBy, sortOrder])

  // Statistics
  const stats = useMemo(() => {
    const pending = credits.filter(c => c.status === "PENDING")
    const partial = credits.filter(c => c.status === "PARTIAL")
    const paid = credits.filter(c => c.status === "PAID")
    
    return {
      totalPending: pending.reduce((sum, c) => sum + (c.amount_owed || 0), 0),
      totalPartial: partial.reduce((sum, c) => sum + ((c.amount_owed || 0) - (c.amount_paid || 0)), 0),
      totalPaid: paid.reduce((sum, c) => sum + (c.amount_owed || 0), 0),
      pendingCount: pending.length,
      partialCount: partial.length,
      paidCount: paid.length
    }
  }, [credits])

  const getStatusColor = (status: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (status) {
      case "PENDING": return "destructive"
      case "PARTIAL": return "secondary"
      case "PAID": return "default"
      default: return "secondary"
    }
  }

  const renderCreditCard = (credit: CreditWithPayments) => {
    const remainingBalance = (credit.amount_owed || 0) - (credit.amount_paid || 0)
    const paymentProgress = ((credit.amount_paid || 0) / (credit.amount_owed || 1)) * 100

    return (
      <Card key={credit.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold text-lg">{credit.customer_name}</p>
                  </div>
                  <Badge variant={getStatusColor(credit.status)} className="text-xs">
                    {credit.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDetailsDialog(credit)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {credit.status !== "PAID" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPaymentDialog(credit)}
                      className="h-8 w-8 p-0"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              {credit.customers && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {credit.customers.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{credit.customers.phone}</span>
                    </div>
                  )}
                  {credit.customers.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{credit.customers.email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Amount Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-xs text-muted-foreground mb-1">Total Owed</p>
                  <p className="font-bold text-blue-600">{(credit.amount_owed || 0).toLocaleString()} RWF</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="text-xs text-muted-foreground mb-1">Paid</p>
                  <p className="font-bold text-green-600">{(credit.amount_paid || 0).toLocaleString()} RWF</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className="font-bold text-orange-600">{remainingBalance.toLocaleString()} RWF</p>
                </div>
              </div>

              {/* Progress Bar */}
              {credit.status === "PARTIAL" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Payment Progress</span>
                    <span className="font-medium">{Math.round(paymentProgress)}%</span>
                  </div>
                  <Progress value={paymentProgress} className="h-2" />
                </div>
              )}

              {/* Quick Actions */}
              {credit.status !== "PAID" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPaymentDialog(credit)}
                    className="flex-1"
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    Record Payment
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handlePayAll(credit.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pay All
                  </Button>
                </div>
              )}
            </div>

            {/* Right Side Info */}
            <div className="text-right space-y-2 shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(credit.created_at).toLocaleDateString()}</span>
              </div>
              {credit.status === "PAID" && (
                <Badge variant="default" className="gap-1 bg-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Credits</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalPending.toLocaleString()} RWF</p>
                <p className="text-xs text-muted-foreground">{stats.pendingCount} credits</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partial Payments</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalPartial.toLocaleString()} RWF</p>
                <p className="text-xs text-muted-foreground">{stats.partialCount} credits</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Credits</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalPaid.toLocaleString()} RWF</p>
                <p className="text-xs text-muted-foreground">{stats.paidCount} credits</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Management
          </CardTitle>
          <CardDescription>Advanced credit tracking and payment management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alerts */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-600">{success}</p>
              <Button variant="ghost" size="sm" onClick={() => setSuccess(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="amount">Total Amount</SelectItem>
                <SelectItem value="remaining">Remaining</SelectItem>
                <SelectItem value="customer">Customer Name</SelectItem>
              </SelectContent>
            </Select>

            <Select value={amountFilter} onValueChange={(value) => setAmountFilter(value as "all" | "small" | "medium" | "large")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Amounts</SelectItem>
                <SelectItem value="small">&lt; 50K</SelectItem>
                <SelectItem value="medium">50K - 200K</SelectItem>
                <SelectItem value="large">&gt; 200K</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="relative">
                Pending
                {stats.pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 text-xs">
                    {stats.pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="partial" className="relative">
                Partial
                {stats.partialCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {stats.partialCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="paid" className="relative">
                Paid
                {stats.paidCount > 0 && (
                  <Badge variant="default" className="ml-2 h-5 text-xs">
                    {stats.paidCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAndSortedCredits.length > 0 ? (
                <div className="space-y-4">
                  {filteredAndSortedCredits.map(renderCreditCard)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No credits found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? `No results for "${searchQuery}"` : `No ${activeTab} credits`}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record a payment for {selectedCredit?.customer_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCredit && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Owed</p>
                    <p className="font-medium">{(selectedCredit.amount_owed || 0).toLocaleString()} RWF</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-medium text-orange-600">
                      {((selectedCredit.amount_owed || 0) - (selectedCredit.amount_paid || 0)).toLocaleString()} RWF
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              {quickAmounts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Quick Amounts</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setPaymentAmount(amount.toString())}
                        className="text-xs"
                      >
                        {amount.toLocaleString()} RWF
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="payment-amount">Payment Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  placeholder="Enter amount..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-notes">Notes (optional)</Label>
                <Input
                  id="payment-notes"
                  placeholder="Payment notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing || !paymentAmount || Number(paymentAmount) <= 0}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Record Payment
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Credit Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedCredit && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedCredit.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(selectedCredit.status)} className="mt-1">
                    {selectedCredit.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Amount Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-sm text-muted-foreground mb-1">Total Owed</p>
                  <p className="text-xl font-bold text-blue-600">
                    {(selectedCredit.amount_owed || 0).toLocaleString()} RWF
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-xl font-bold text-green-600">
                    {(selectedCredit.amount_paid || 0).toLocaleString()} RWF
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                  <p className="text-xl font-bold text-orange-600">
                    {((selectedCredit.amount_owed || 0) - (selectedCredit.amount_paid || 0)).toLocaleString()} RWF
                  </p>
                </div>
              </div>

              {/* Payment History */}
              {selectedCredit.credit_payments && selectedCredit.credit_payments.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Payment History</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedCredit.credit_payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{payment.amount.toLocaleString()} RWF</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-muted-foreground italic">{payment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreditPaymentManager