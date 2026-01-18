"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Banknote, 
  CreditCard, 
  Printer,
  Receipt,
  Search,
  Filter,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useState, useMemo } from "react"
import type { StockTransaction, Product, Customer } from "@/lib/types"

interface StockOutItem {
  id: string
  product_id: string
  quantity: number
  selling_price: number
  products?: { name: string; brand?: string }
  product?: { name: string; brand?: string }
}

interface EnhancedStockTransaction extends StockTransaction {
  stock_out_items?: StockOutItem[]
  customers?: Customer | null
  product?: Product | null 
}

interface RecentStockOutProps {
  transactions: EnhancedStockTransaction[]
}

function InvoiceModal({ 
  transaction, 
  isOpen, 
  onClose 
}: { 
  transaction: EnhancedStockTransaction
  isOpen: boolean
  onClose: () => void
}) {
  const date = new Date(transaction.created_at)
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const items = (transaction.stock_out_items && transaction.stock_out_items.length > 0) 
    ? transaction.stock_out_items 
    : transaction.product ? [{
        id: 'legacy',
        quantity: transaction.quantity || 1,
        selling_price: transaction.selling_price || (transaction.total_amount / (transaction.quantity || 1)),
        product: transaction.product,
        products: transaction.product
      }] : [];

  const handlePrint = () => {
    const printContents = document.getElementById('printable-invoice')?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${transaction.invoice_number || transaction.id.slice(0,8).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 20px;
              background: white;
            }
            @media print {
              body { padding: 0; }
              @page { margin: 0.5in; size: A4; }
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Official Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button 
            onClick={handlePrint} 
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>

        <div id="printable-invoice" style={{
          backgroundColor: 'white',
          color: 'black',
          padding: '40px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '4px solid black',
            paddingBottom: '24px',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '4px' }}>INVOICE</h1>
              <p style={{ 
                fontFamily: 'monospace', 
                fontSize: '14px', 
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                #{transaction.invoice_number || transaction.id.slice(0,8).toUpperCase()}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{formattedDate}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>
                Kivu Quality Sheet Ltd
              </h2>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>Kigali, Rwanda</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>+250 788 000 000</p>
            </div>
          </div>

          {/* Customer */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{ 
              fontSize: '10px', 
              fontWeight: '900', 
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '4px'
            }}>
              Bill To:
            </p>
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {transaction.customers?.name || "Cash Customer"}
            </p>
            {transaction.customers?.phone && (
              <p style={{ fontSize: '14px', color: '#4b5563' }}>{transaction.customers.phone}</p>
            )}
          </div>

          {/* Table */}
          <table style={{ width: '100%', marginBottom: '40px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid black',
                textAlign: 'left'
              }}>
                <th style={{ 
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase'
                }}>
                  Product Description
                </th>
                <th style={{ 
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  textAlign: 'center'
                }}>
                  Qty
                </th>
                <th style={{ 
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  textAlign: 'right'
                }}>
                  Price
                </th>
                <th style={{ 
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  textAlign: 'right'
                }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 0' }}>
                    <p style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {item.products?.name || item.product?.name || transaction.product?.name || "Product"}
                    </p>
                    {(item.products?.brand || item.product?.brand) && (
                      <p style={{ fontSize: '10px', color: '#9ca3af' }}>
                        {item.products?.brand || item.product?.brand}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'center', fontWeight: '500' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right' }}>
                    {(item.selling_price || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: '900' }}>
                    {((item.quantity || 0) * (item.selling_price || 0)).toLocaleString()} RWF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            paddingTop: '24px',
            borderTop: '4px solid black'
          }}>
            <div style={{ width: '256px' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '24px',
                fontWeight: '900'
              }}>
                <span>TOTAL:</span>
                <span>{(transaction.total_amount || 0).toLocaleString()} RWF</span>
              </div>
              <p style={{ 
                textAlign: 'right',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#9ca3af',
                textTransform: 'uppercase',
                marginTop: '8px'
              }}>
                Payment Type: {transaction.payment_type}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            marginTop: '96px',
            paddingTop: '32px',
            borderTop: '1px dashed #d1d5db',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '12px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Kivu Quality Sheet Ltd
            </p>
            <p style={{ 
              fontSize: '9px',
              color: '#9ca3af',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Generated via ReportX Management System
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RecentStockOut({ transactions }: RecentStockOutProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<EnhancedStockTransaction | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "CASH" | "CREDIT">("ALL")
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        t.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())

      // Payment filter
      const matchesPayment = paymentFilter === "ALL" || t.payment_type === paymentFilter

      // Date filter
      let matchesDate = true
      if (dateFilter !== "ALL") {
        const transactionDate = new Date(t.created_at)
        const now = new Date()
        
        if (dateFilter === "TODAY") {
          matchesDate = transactionDate.toDateString() === now.toDateString()
        } else if (dateFilter === "WEEK") {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = transactionDate >= weekAgo
        } else if (dateFilter === "MONTH") {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = transactionDate >= monthAgo
        }
      }

      return matchesSearch && matchesPayment && matchesDate
    })
  }, [transactions, searchQuery, paymentFilter, dateFilter])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTransactions, currentPage])

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: any, value: any) => {
    setter(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="text-primary"/> Recent Sales
        </h2>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, invoice..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={(v: any) => handleFilterChange(setPaymentFilter, v)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="CASH">Cash Only</SelectItem>
                <SelectItem value="CREDIT">Credit Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v: any) => handleFilterChange(setDateFilter, v)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="WEEK">Last 7 Days</SelectItem>
                <SelectItem value="MONTH">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

          </div>

          {/* Active Filters Display */}
          {(searchQuery || paymentFilter !== "ALL" || dateFilter !== "ALL") && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mr-2">Active filters:</p>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button onClick={() => handleFilterChange(setSearchQuery, "")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {paymentFilter !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  {paymentFilter}
                  <button onClick={() => handleFilterChange(setPaymentFilter, "ALL")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {dateFilter !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  {dateFilter}
                  <button onClick={() => handleFilterChange(setDateFilter, "ALL")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count & Pagination Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-bold text-foreground">{paginatedTransactions.length}</span> of {filteredTransactions.length} transactions
          {totalPages > 1 && (
            <span className="ml-2">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </p>
      </div>

      {/* Transactions List */}
      <div className="grid gap-3">
        {paginatedTransactions.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No transactions found</p>
              {(searchQuery || paymentFilter !== "ALL" || dateFilter !== "ALL") && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery("")
                    setPaymentFilter("ALL")
                    setDateFilter("ALL")
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          paginatedTransactions.map((t) => (
            <Card 
              key={t.id} 
              className="hover:shadow-md cursor-pointer transition-all border-none shadow-sm group" 
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Payment Icon */}
                    <div className={`p-3 rounded-full ${
                      t.payment_type === 'CASH' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {t.payment_type === 'CASH' ? <Banknote size={20}/> : <CreditCard size={20}/>}
                    </div>

                    {/* Transaction Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm">{t.customers?.name || t.customer_name || "Walk-in Customer"}</p>
                        <Badge variant="outline" className="text-xs">
                          {t.invoice_number || `#${t.id.slice(0, 8)}`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                        {t.customers?.phone && (
                          <span>• {t.customers.phone}</span>
                        )}
                        {t.total_profit && (
                          <span className="text-emerald-600 font-semibold">
                            • Profit: {t.total_profit.toLocaleString()} RWF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-black text-lg text-slate-900">
                        {t.total_amount.toLocaleString()} RWF
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.payment_type}
                      </p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedTransaction(t)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Page <span className="font-bold text-foreground">{currentPage}</span> of {totalPages}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Modal */}
      {selectedTransaction && (
        <InvoiceModal 
          transaction={selectedTransaction} 
          isOpen={!!selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}
    </div>
  )
}