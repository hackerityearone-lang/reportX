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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { useState, useMemo } from "react"
import  {stockOutService} from "@/lib/supabase/stock-out-service"
import { useToast } from "@/hooks/use-toast"
import type { StockTransaction, Product, Customer } from "@/lib/types"

interface StockOutItem {
  id: string
  product_id: string
  quantity: number
  selling_price: number
  buying_price?: number
  products?: { name: string; brand?: string | null } | null
  product?: { name: string; brand?: string | null } | null
}

type EnhancedStockTransaction = {
  id: string
  created_at: string
  quantity?: number | null
  stock_out_items?: StockOutItem[]
  customers?: Customer | null
  customer_name?: string
  product?: Product | null
  total_amount: number
  total_profit?: number | null
  selling_price?: number | null
  payment_type: 'CASH' | 'CREDIT'
  invoice_number?: string | null
}

interface RecentStockOutProps {
  transactions: EnhancedStockTransaction[]
  onTransactionUpdated?: () => void
}

function EditTransactionDialog({ 
  transaction, 
  isOpen, 
  onClose,
  onSuccess
}: { 
  transaction: EnhancedStockTransaction
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [paymentType, setPaymentType] = useState(transaction.payment_type)
  const [customerName, setCustomerName] = useState(transaction.customers?.name || "")
  const [customerPhone, setCustomerPhone] = useState(transaction.customers?.phone || "")
  const [items, setItems] = useState<StockOutItem[]>(
    transaction.stock_out_items || []
  )

  const handleUpdateItem = (index: number, field: 'quantity' | 'selling_price', value: number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSave = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await stockOutService.updateStockOut({
        transactionId: transaction.id,
        customer: {
          name: customerName,
          phone: customerPhone || null,
        },
        payment_type: paymentType,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          selling_price: item.selling_price,
          buying_price: item.buying_price,
        })),
      })

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      })
      
      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Transaction #{transaction.invoice_number || transaction.id.slice(0,8)}
          </DialogTitle>
          <DialogDescription>
            Update transaction details and items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Customer Name</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Phone Number</label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium">Payment Type</label>
            <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Items</h3>
            <div className="space-y-3">
              {items.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.products?.name || item.product?.name}
                        </p>
                        {(item.products?.brand || item.product?.brand) && (
                          <p className="text-xs text-muted-foreground">
                            {item.products?.brand || item.product?.brand}
                          </p>
                        )}
                      </div>
                      <div className="w-24">
                        <label className="text-xs text-muted-foreground">Qty</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="text-center"
                        />
                      </div>
                      <div className="w-32">
                        <label className="text-xs text-muted-foreground">Price</label>
                        <Input
                          type="number"
                          min="0"
                          value={item.selling_price}
                          onChange={(e) => handleUpdateItem(index, 'selling_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold">
                          {(item.quantity * item.selling_price).toLocaleString()} RWF
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* New Total */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">New Total</p>
                <p className="text-2xl font-black">
                  {items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0).toLocaleString()} RWF
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmDialog({
  transaction,
  isOpen,
  onClose,
  onConfirm,
}: {
  transaction: EnhancedStockTransaction
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!reason.trim()) {
      return
    }

    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Transaction?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              You are about to delete transaction{" "}
              <span className="font-bold">
                #{transaction.invoice_number || transaction.id.slice(0, 8)}
              </span>{" "}
              for <span className="font-bold">{transaction.total_amount.toLocaleString()} RWF</span>.
            </p>
            <p className="text-destructive font-semibold">
              This will restore the stock quantities and cannot be undone.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for deletion (required)</label>
              <Input
                placeholder="e.g., Wrong customer, incorrect items..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!reason.trim() || loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete Transaction"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
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
        product_id: '',
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

export function RecentStockOut({ transactions, onTransactionUpdated }: RecentStockOutProps) {
  const { toast } = useToast()
  const [selectedTransaction, setSelectedTransaction] = useState<EnhancedStockTransaction | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<EnhancedStockTransaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<EnhancedStockTransaction | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "CASH" | "CREDIT">("ALL")
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = searchQuery === "" || 
        t.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPayment = paymentFilter === "ALL" || t.payment_type === paymentFilter

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

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTransactions, currentPage])

  const handleFilterChange = (setter: any, value: any) => {
    setter(value)
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!deletingTransaction) return

    try {
      await stockOutService.cancelStockOut(deletingTransaction.id, "User deleted transaction")
      
      toast({
        title: "Transaction Deleted",
        description: "The transaction has been cancelled and stock restored.",
      })
      
      setDeletingTransaction(null)
      onTransactionUpdated?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, invoice..."
                value={searchQuery}
                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                className="pl-10"
              />
            </div>

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

      {/* Results Count */}
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
              className="hover:shadow-md transition-all border-none shadow-sm group" 
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-full ${
                      t.payment_type === 'CASH' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {t.payment_type === 'CASH' ? <Banknote size={20}/> : <CreditCard size={20}/>}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm">{t.customers?.name || t.customer_name || "Walk-in Customer"}</p>
                     <Badge variant="outline" className="text-[10px] font-bold">
                          {t.invoice_number || t.id.slice(0, 8)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.created_at).toLocaleDateString()}
                        </span>
                        <span>
                          {t.stock_out_items?.length || 1} { (t.stock_out_items?.length || 1) === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right mr-4">
                      <p className="font-black text-sm">
                        {t.total_amount.toLocaleString()} RWF
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {t.payment_type}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setSelectedTransaction(t)}>
                          <Eye className="mr-2 h-4 w-4" /> View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingTransaction(t)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Sale
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingTransaction(t)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Sale
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Modals & Dialogs */}
      {selectedTransaction && (
        <InvoiceModal
          transaction={selectedTransaction}
          isOpen={!!selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null)
            onTransactionUpdated?.()
          }}
        />
      )}

      {deletingTransaction && (
        <DeleteConfirmDialog
          transaction={deletingTransaction}
          isOpen={!!deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}