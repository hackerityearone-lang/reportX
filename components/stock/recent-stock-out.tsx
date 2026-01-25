"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useState, useMemo, useEffect } from "react"
import { stockOutService } from "@/lib/supabase/stock-out-service"
import { createClient } from "@/lib/supabase/client"
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

function DeleteConfirmDialog({
  transaction,
  isOpen,
  onClose,
  onConfirm,
}: {
  transaction: EnhancedStockTransaction
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!reason.trim()) {
      return
    }

    setLoading(true)
    try {
      await onConfirm(reason)
      onClose()
      setReason("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setReason("")
        onClose()
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Transaction?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete transaction{" "}
            <span className="font-bold">
              #{transaction.invoice_number || transaction.id.slice(0, 8)}
            </span>{" "}
            for <span className="font-bold">{transaction.total_amount.toLocaleString()} RWF</span>.
            <br /><br />
            <span className="text-destructive font-semibold">
              This will restore the stock quantities and cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="delete-reason" className="text-sm font-medium">
              Reason for deletion (required)
            </Label>
            <Input
              id="delete-reason"
              placeholder="e.g., Wrong customer, incorrect items..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>
        </div>

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



function EditTransactionDialog({
  transaction,
  isOpen,
  onClose,
  onSuccess,
}: {
  transaction: EnhancedStockTransaction
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    customer_name: transaction.customers?.name || transaction.customer_name || "",
    customer_phone: transaction.customers?.phone || "",
    payment_type: transaction.payment_type,
    notes: ""
  })
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Load products and customers on open
  useEffect(() => {
    if (isOpen) {
      loadData()
      initializeItems()
    }
  }, [isOpen, transaction])

  const initializeItems = () => {
    if (transaction.stock_out_items?.length) {
      // New transaction structure
      setItems(transaction.stock_out_items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        selling_price: Number(item.selling_price),
        unit_sold: "piece",
        product: item.products || item.product
      })))
    } else if (transaction.product) {
      // Old transaction structure
      setItems([{
        id: 'legacy',
        product_id: transaction.product.id,
        quantity: transaction.quantity || 1,
        selling_price: Number(transaction.selling_price || 0),
        unit_sold: "piece",
        product: transaction.product
      }])
    } else {
      // Fallback: create empty item
      setItems([{
        id: `new-${Date.now()}`,
        product_id: '',
        quantity: 1,
        selling_price: 0,
        unit_sold: 'piece',
        product: null
      }])
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()
      
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('name')
      
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('name')
      
      setProducts(productsData || [])
      setCustomers(customersData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const addItem = () => {
    setItems([...items, {
      id: `new-${Date.now()}`,
      product_id: '',
      quantity: 1,
      selling_price: 0,
      unit_sold: 'piece',
      product: null
    }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      newItems[index].product = product
      newItems[index].selling_price = product?.selling_price || 0
    }
    
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0)
  }

  const handleSave = async () => {
    if (items.some(item => !item.product_id || item.quantity <= 0 || item.selling_price <= 0)) {
      toast({ title: "Error", description: "All items must have valid product, quantity and price", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      console.log('[EDIT TX] Starting save for transaction:', transaction.id)
      
      // Update transaction basic info
      console.log('[EDIT TX] Step 1: Updating transaction basic info')
      const updateData: any = {
        customer_name: formData.customer_name || "Cash Customer",
        payment_type: formData.payment_type,
        notes: formData.notes
      }
      console.log('[EDIT TX] Update payload:', updateData)
      
      const { error: updateError } = await supabase
        .from('stock_transactions')
        .update(updateData)
        .eq('id', transaction.id)
      
      if (updateError) {
        console.error('[EDIT TX] Step 1 failed:', updateError)
        throw updateError
      }
      console.log('[EDIT TX] Step 1 success')
      
      // Delete old items
      console.log('[EDIT TX] Step 2: Deleting old items')
      const { error: deleteItemsError } = await supabase
        .from('stock_out_items')
        .delete()
        .eq('transaction_id', transaction.id)
      
      if (deleteItemsError) {
        console.error('[EDIT TX] Step 2 failed:', deleteItemsError)
        throw deleteItemsError
      }
      console.log('[EDIT TX] Step 2 success')
      
      // Insert new items
      console.log('[EDIT TX] Step 3: Inserting new items, count:', items.length)
      for (const item of items) {
        const { error: insertError } = await supabase
          .from('stock_out_items')
          .insert({
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.quantity,
            selling_price: item.selling_price,
            buying_price: item.selling_price * 0.5
          })
        
        if (insertError) {
          console.error('[EDIT TX] Step 3 failed for item:', item, 'error:', insertError)
          throw insertError
        }
      }
      console.log('[EDIT TX] Step 3 success')
      
      // Update transaction total amount
      console.log('[EDIT TX] Step 4: Calculating and updating total')
      const newTotal = calculateTotal()
      console.log('[EDIT TX] New total:', newTotal)
      const { error: totalError } = await supabase
        .from('stock_transactions')
        .update({
          total_amount: newTotal
        })
        .eq('id', transaction.id)
      
      if (totalError) {
        console.error('[EDIT TX] Step 4 failed:', totalError)
        throw totalError
      }
      console.log('[EDIT TX] Step 4 success')
      
      // Handle credit if payment type is CREDIT
      console.log('[EDIT TX] Step 5: Handling credit, payment_type:', formData.payment_type)
      if (formData.payment_type === 'CREDIT') {
        // Check if credit already exists (without .single() which throws on no match)
        console.log('[EDIT TX] Step 5a: Checking for existing credit')
        const { data: existingCredits, error: creditCheckError } = await supabase
          .from('credits')
          .select('id')
          .eq('transaction_id', transaction.id)
        
        if (creditCheckError) {
          console.error('[EDIT TX] Step 5a failed - credit check error:', creditCheckError)
        } else if (!existingCredits || existingCredits.length === 0) {
          // Create new credit record
          console.log('[EDIT TX] Step 5b: Creating new credit record')
          const { error: creditError } = await supabase
            .from('credits')
            .insert({
              customer_name: formData.customer_name || 'Cash Customer',
              amount_owed: newTotal,
              amount_paid: 0,
              status: 'PENDING',
              transaction_id: transaction.id,
              is_active: true,
              created_at: new Date().toISOString()
            })
          
          if (creditError) {
            console.error('[EDIT TX] Step 5b failed - credit insert error:', creditError)
          } else {
            console.log('[EDIT TX] Step 5b success')
          }
        } else {
          // Update existing credit amount
          console.log('[EDIT TX] Step 5c: Updating existing credit record')
          const { error: updateCreditError } = await supabase
            .from('credits')
            .update({
              amount_owed: newTotal
            })
            .eq('transaction_id', transaction.id)
          
          if (updateCreditError) {
            console.error('[EDIT TX] Step 5c failed - credit update error:', updateCreditError)
          } else {
            console.log('[EDIT TX] Step 5c success')
          }
        }
      } else {
        // If changing from CREDIT to CASH, delete the credit record
        console.log('[EDIT TX] Step 5d: Payment type is not CREDIT, checking if need to delete old credit')
        if (transaction.payment_type === 'CREDIT') {
          console.log('[EDIT TX] Step 5d: Deleting old credit record')
          const { error: deleteCreditError } = await supabase
            .from('credits')
            .delete()
            .eq('transaction_id', transaction.id)
          
          if (deleteCreditError) {
            console.error('[EDIT TX] Step 5d failed - credit delete error:', deleteCreditError)
          } else {
            console.log('[EDIT TX] Step 5d success')
          }
        }
      }
      console.log('[EDIT TX] Step 5 completed')
      
      console.log('[EDIT TX] All steps completed successfully')
      toast({ title: "Success", description: "Transaction updated successfully", variant: "default" })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('[EDIT TX] CATCH BLOCK - Save error:', error)
      console.error('[EDIT TX] Error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        toString: error?.toString(),
        JSON: JSON.stringify(error, null, 2)
      })
      toast({ title: "Error", description: error?.message || "Failed to save transaction", variant: "destructive" })
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
            Edit Transaction #{transaction.invoice_number || transaction.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription>
            Modify transaction items, customer and payment details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Select value={formData.customer_name || "cash_customer"} onValueChange={(value) => {
                  if (value === "cash_customer") {
                    setFormData({ ...formData, customer_name: "", customer_phone: "" })
                  } else {
                    const customer = customers.find(c => c.name === value)
                    setFormData({ ...formData, customer_name: value, customer_phone: customer?.phone || "" })
                  }
                }} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash_customer">Cash Customer</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.name}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  placeholder="Customer phone"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Transaction Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                Add Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs">Product</Label>
                      <Select 
                        value={item.product_id} 
                        onValueChange={(value) => updateItem(index, 'product_id', value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        className="h-9"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.selling_price}
                        onChange={(e) => updateItem(index, 'selling_price', Number(e.target.value))}
                        className="h-9"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="h-9 px-3 py-2 bg-muted rounded text-sm">
                        {(item.quantity * item.selling_price).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Payment Information</h3>
            <div>
              <Label>Payment Type</Label>
              <Select value={formData.payment_type} onValueChange={(value: "CASH" | "CREDIT") => 
                setFormData({...formData, payment_type: value})
              } disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash Payment</SelectItem>
                  <SelectItem value="CREDIT">Credit (IDENI)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes for this transaction..."
              rows={3}
              disabled={loading}
            />
          </div>
          
          {/* Transaction Summary */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-medium text-sm mb-2">Transaction Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <p className="font-medium">{formData.customer_name || "Cash Customer"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment:</span>
                <p className="font-medium">{formData.payment_type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Items:</span>
                <p className="font-medium">{items.length} items</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <p className="font-bold text-lg">{calculateTotal().toLocaleString()} RWF</p>
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

function InvoiceModal({ 
  transaction, 
  isOpen, 
  onClose 
}: { 
  transaction: EnhancedStockTransaction
  isOpen: boolean
  onClose: () => void
}) {
  if (!transaction) return null
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
            {transaction.customers?.tin_number && (
              <p style={{ fontSize: '14px', color: '#4b5563' }}>TIN: {transaction.customers.tin_number}</p>
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
                        <DropdownMenuItem 
                          onClick={() => {
                            console.log('Transaction data:', t)
                            setEditingTransaction(t)
                          }}
                        >
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
          onConfirm={async (reason) => {
            try {
              await stockOutService.safeDeleteTransaction(deletingTransaction.id, reason)
              toast({
                title: "Transaction Deleted",
                description: "The transaction has been safely deleted and stock restored.",
              })
              onTransactionUpdated?.()
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
              })
            }
          }}
        />
      )}
    </div>
  )
}
 