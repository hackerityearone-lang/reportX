"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Phone, Mail, Download, Printer, ChevronDown, ChevronUp, Package, CreditCard, CheckCircle2 } from "lucide-react"
import { customerService } from "@/lib/supabase/customer-service"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Customer } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"

interface CustomerDetailsProps {
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerDetailsDialog({ customerId, open, onOpenChange }: CustomerDetailsProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [history, setHistory] = useState<any[] | null>(null)
  const [transactions, setTransactions] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "total">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [expandedTx, setExpandedTx] = useState<Record<string, boolean>>({})

  const exportCsv = () => {
    if (!customer) return
    
    // Create CSV content directly without using array methods
    let csvContent = ""
    csvContent += `Customer,,${customer.name}\n`
    csvContent += `Phone,,${customer.phone || ""}\n`
    csvContent += `TIN,,${customer.tin_number || ""}\n`
    csvContent += `\n`
    csvContent += `Transactions\n`
    csvContent += `Invoice,Date,Payment,Total,Item,Qty,UnitPrice,Subtotal\n`

    for (const tx of (transactions || [])) {
      if (!tx.stock_out_items || tx.stock_out_items.length === 0) {
        csvContent += `${tx.invoice_number || ""},${tx.created_at || ""},${tx.payment_type || ""},${tx.total_amount || 0},,,,\n`
      } else {
        for (let i = 0; i < tx.stock_out_items.length; i++) {
          const it = tx.stock_out_items[i]
          const invoice = i === 0 ? (tx.invoice_number || "") : ""
          const date = i === 0 ? (tx.created_at || "") : ""
          const payment = i === 0 ? (tx.payment_type || "") : ""
          const total = i === 0 ? (tx.total_amount || 0) : ""
          const itemName = it.products?.name || ""
          const qty = it.quantity || 0
          const unitPrice = it.selling_price || 0
          const subtotal = (it.subtotal || ((it.selling_price || 0) * (it.quantity || 0))) || 0
          
          csvContent += `${invoice},${date},${payment},${total},${itemName},${qty},${unitPrice},${subtotal}\n`
        }
      }
    }

    csvContent += `\n`
    csvContent += `Credit History\n`
    csvContent += `Credit ID,Amount Owed,Amount Paid,Status,Created At\n`
    
    for (const h of (history || [])) {
      csvContent += `${h.id || ""},${h.amount_owed || 0},${h.amount_paid || 0},${h.status || ""},${h.created_at || ""}\n`
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${customer.name.replace(/\s+/g, "_")}_details.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handlePrintDetails = () => {
    if (!customer) return
    const win = window.open("", "_blank")
    if (!win) return

    const styles = `
      body { font-family: Arial, sans-serif; color: #222; padding: 20px }
      h1 { font-size: 20px }
      table { width: 100%; border-collapse: collapse; margin-top: 10px }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left }
      th { background: #f3f4f6 }
    `

    const transactionsHtml = (transactions || []).map((tx) => {
      const items = (tx.stock_out_items || []).map((it: any) => `
        <tr>
          <td>${it.products?.name || ''}</td>
          <td>x${it.quantity || 0}</td>
          <td class="text-right">${(it.selling_price || 0).toLocaleString()} RWF</td>
          <td class="text-right">${((it.subtotal) || ((it.selling_price || 0) * (it.quantity || 0))).toLocaleString()} RWF</td>
        </tr>`).join('')

      return `
        <h3>Invoice: ${tx.invoice_number || '-'}</h3>
        <p>${new Date(tx.created_at).toLocaleDateString()} — ${tx.payment_type || ''} — <strong>${(tx.total_amount || 0).toLocaleString()} RWF</strong></p>
        <table>
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
      `
    }).join('\n')

    const historyHtml = (history || []).map((h) => `
      <tr>
        <td>${h.id || ''}</td>
        <td class="text-right">${(h.amount_owed || 0).toLocaleString()}</td>
        <td class="text-right">${(h.amount_paid || 0).toLocaleString()}</td>
        <td>${h.status || ''}</td>
        <td>${h.created_at || ''}</td>
      </tr>
    `).join('')

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Customer Details - ${customer.name}</title>
        <style>${styles}</style>
      </head>
      <body>
        <h1>${customer.name}</h1>
        <p>Phone: ${customer.phone || ''} | TIN: ${customer.tin_number || ''}</p>
        <h2>Transactions</h2>
        ${transactionsHtml}
        <h2>Credit History</h2>
        <table>
          <thead><tr><th>Credit ID</th><th>Amount Owed</th><th>Amount Paid</th><th>Status</th><th>Created At</th></tr></thead>
          <tbody>${historyHtml}</tbody>
        </table>
      </body>
      </html>
    `

    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  useEffect(() => {
    if (!open || !customerId) return
    let mounted = true
    setLoading(true)
    Promise.all([
      customerService.getCustomerById(customerId),
      customerService.getCustomerCreditHistory(customerId),
      customerService.getCustomerTransactions(customerId),
    ])
      .then(([c, h, t]) => {
        if (!mounted) return
        setCustomer(c)
        setHistory(h)
        setTransactions(t)
      })
      .catch(() => {
        if (!mounted) return
        setCustomer(null)
        setHistory([])
        setTransactions([])
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [open, customerId])

  const filteredAndSortedTransactions = () => {
    if (!transactions) return []
    
    const filtered = transactions.filter((tx: any) => {
      const q = filterText.trim().toLowerCase()
      if (!q) return true
      if ((tx.invoice_number || '').toLowerCase().includes(q)) return true
      if ((tx.created_at || '').toLowerCase().includes(q)) return true
      if (tx.stock_out_items?.some((it: any) => (it.products?.name || '').toLowerCase().includes(q))) return true
      return false
    })

    filtered.sort((a: any, b: any) => {
      let diff = 0
      if (sortBy === 'date') {
        diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        diff = (a.total_amount || 0) - (b.total_amount || 0)
      }
      return sortOrder === 'asc' ? diff : -diff
    })

    return filtered
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background w-[95vw] max-w-5xl h-[90vh] sm:rounded-lg p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Customer Details</DialogTitle>
          <DialogDescription>View transaction history and credit status</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && customer && (
            <div className="space-y-6">
              {/* Customer Header */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold">{customer.name}</h3>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {customer.phone && (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" /> {customer.phone}
                          </span>
                        )}
                        {customer.tin_number && (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" /> {customer.tin_number}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total Credit Balance</p>
                        <p className="text-3xl font-bold text-foreground">
                          {(customer.total_credit || 0).toLocaleString()} 
                          <span className="text-lg ml-1">RWF</span>
                        </p>
                      </div>
                      {customer.total_credit === 0 ? (
                        <Badge className="bg-success text-white gap-1 px-3 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          All Paid
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 px-3 py-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          Has Credit
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintDetails} className="gap-2">
                  <Printer className="h-4 w-4" /> Print
                </Button>
              </div>

              {/* Transactions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Recent Transactions
                  </h4>
                </div>

                {/* Search and Sort Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="Search invoice or product..." 
                    value={filterText} 
                    onChange={(e) => setFilterText(e.target.value)} 
                    className="flex-1 h-10"
                  />
                  <div className="flex gap-2">
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value as any)} 
                      className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="total">Sort by Total</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                      className="h-10"
                    >
                      {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-3">
                  {filteredAndSortedTransactions().length > 0 ? (
                    filteredAndSortedTransactions().map((tx: any) => {
                      const isPaid = tx.is_credit_paid || tx.payment_type === 'CASH'
                      const isExpanded = expandedTx[tx.id]
                      
                      return (
                        <Card key={tx.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Transaction Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-base">{tx.invoice_number || '—'}</p>
                                    {tx.payment_type === 'CASH' ? (
                                      <Badge className="bg-success text-white">CASH</Badge>
                                    ) : isPaid ? (
                                      <Badge className="bg-success text-white">PAID</Badge>
                                    ) : (
                                      <Badge variant="destructive">CREDIT</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold">{(tx.total_amount || 0).toLocaleString()}</p>
                                  <p className="text-sm text-muted-foreground">RWF</p>
                                </div>
                              </div>

                              {/* Items Toggle */}
                              {tx.stock_out_items && tx.stock_out_items.length > 0 && (
                                <div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setExpandedTx((s) => ({ ...s, [tx.id]: !s[tx.id] }))}
                                    className="w-full justify-between h-8 text-xs"
                                  >
                                    <span>{tx.stock_out_items.length} item(s)</span>
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>

                                  {isExpanded && (
                                    <div className="mt-3 space-y-2 pl-3 border-l-2 border-primary/20">
                                      {tx.stock_out_items.map((it: any) => (
                                        <div key={it.id} className="flex justify-between items-center text-sm bg-secondary/30 rounded-lg p-3">
                                          <div>
                                            <p className="font-medium">{it.products?.name || 'Unknown'}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {it.quantity} × {(it.selling_price || 0).toLocaleString()} RWF</p>
                                          </div>
                                          <p className="font-semibold">
                                            {((it.subtotal) || ((it.selling_price || 0) * (it.quantity || 0))).toLocaleString()} RWF
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No transactions found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Credit History Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credit History
                </h4>
                
                <div className="space-y-2">
                  {history && history.length > 0 ? (
                    history.map((h) => {
                      const amountOwed = parseFloat(String(h.amount_owed || 0))
                      const amountPaid = parseFloat(String(h.amount_paid || 0))
                      const isPaid = (h.status === 'PAID') || (amountPaid >= amountOwed)
                      
                      return (
                        <Card key={h.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{h.stock_transactions?.invoice_number || "—"}</p>
                                  {isPaid ? (
                                    <Badge className="bg-success text-white gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      PAID
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">{h.status || 'PENDING'}</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {h.created_at ? new Date(h.created_at).toLocaleDateString() : '-'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">{amountOwed.toLocaleString()} RWF</p>
                                <p className="text-xs text-success">Paid: {amountPaid.toLocaleString()} RWF</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No credit history</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && !customer && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Unable to load customer details.</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t bg-secondary/10 flex justify-end">
          <DialogClose asChild>
            <Button size="lg">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CustomerDetailsDialog