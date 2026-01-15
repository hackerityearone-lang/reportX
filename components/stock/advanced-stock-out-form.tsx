"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, Plus, DollarSign, Package, AlertTriangle, CheckCircle2, User } from "lucide-react"
import type { Product, Customer } from "@/lib/types"
import { stockOutService } from "@/lib/supabase/stock-out-service"
import { customerService } from "@/lib/supabase/customer-service"
import { createClient } from "@/lib/supabase/client"

interface AdvancedStockOutItem {
  id: string
  product_id: string
  quantity: number
  selling_price: number
  buying_price: number
  subtotal: number
  profit: number
}

export function AdvancedStockOutForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const router = useRouter()

  // Form state
  const [paymentType, setPaymentType] = useState<"CASH" | "CREDIT">("CASH")
  const [items, setItems] = useState<AdvancedStockOutItem[]>([
    { id: "1", product_id: "", quantity: 0, selling_price: 0, buying_price: 0, subtotal: 0, profit: 0 },
  ])
  const [notes, setNotes] = useState("")

  // Customer state (now used for both CASH and CREDIT)
  const [includeCustomer, setIncludeCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("name")
        
        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error("Failed to load products:", err)
        setError("Failed to load products")
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [])

  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await customerService.getCustomers()
        setCustomers(data)
      } catch (err) {
        console.error("Failed to load customers:", err)
        setCustomers([])
      }
    }

    if (includeCustomer || paymentType === "CREDIT") {
      loadCustomers()
    }
  }, [includeCustomer, paymentType])

  // Auto-enable customer for CREDIT
  useEffect(() => {
    if (paymentType === "CREDIT") {
      setIncludeCustomer(true)
    }
  }, [paymentType])

  // Search customers
  useEffect(() => {
    const searchCustomers = async () => {
      if (searchQuery.length > 2) {
        try {
          const results = await customerService.searchCustomers(searchQuery)
          setCustomers(results)
        } catch (err) {
          console.error("Search failed:", err)
        }
      }
    }

    const timer = setTimeout(searchCustomers, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addItem = () => {
    const newId = (Math.max(...items.map((i) => parseInt(i.id) || 0), 0) + 1).toString()
    setItems([
      ...items,
      { id: newId, product_id: "", quantity: 0, selling_price: 0, buying_price: 0, subtotal: 0, profit: 0 },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, updates: Partial<AdvancedStockOutItem>) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item

        const product = products.find((p) => p.id === (updates.product_id || item.product_id))
        const quantity = updates.quantity !== undefined ? updates.quantity : item.quantity
        const sellingPrice = updates.selling_price !== undefined ? updates.selling_price : item.selling_price
        const buyingPrice =
          updates.buying_price !== undefined ? updates.buying_price : updates.product_id ? product?.price || 0 : item.buying_price

        const subtotal = quantity * sellingPrice
        const profit = quantity * (sellingPrice - buyingPrice)

        return {
          ...item,
          ...updates,
          buying_price: buyingPrice,
          subtotal,
          profit,
        }
      })
    )
  }

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId)
    updateItem(itemId, {
      product_id: productId,
      buying_price: product?.price || 0,
    })
  }

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalProfit = items.reduce((sum, item) => sum + item.profit, 0)
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)

  // Validate form
  const isFormValid =
    items.every((item) => item.product_id && item.quantity > 0 && item.selling_price > 0) &&
    (!includeCustomer || (selectedCustomer || (newCustomerName && newCustomerPhone)))

  // Check stock availability
  const stockErrors = items.map((item) => {
    const product = products.find((p) => p.id === item.product_id)
    if (product && item.quantity > product.quantity) {
      return `${product.name}: need ${item.quantity}, have ${product.quantity}`
    }
    return null
  })

  const hasStockErrors = stockErrors.some((error) => error !== null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (hasStockErrors) {
      setError("Insufficient stock for some items")
      setIsLoading(false)
      return
    }

    try {
      // Prepare customer object (for both CASH and CREDIT if customer info is provided)
      let customer = selectedCustomer
      if (!customer && includeCustomer && newCustomerName) {
        customer = {
          id: "", // Will be ignored for creation
          user_id: "",
          name: newCustomerName,
          phone: newCustomerPhone || null,
          email: newCustomerEmail || null,
          total_credit: 0,
          created_at: "",
          updated_at: "",
          is_archived: false,
        }
      }

      // Prepare items for API
      const apiItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        selling_price: item.selling_price,
        buying_price: item.buying_price,
      }))

      // Call service
      const transaction = await stockOutService.createAdvancedStockOut({
        customer_id: selectedCustomer?.id,
        customer: customer,
        phone: selectedCustomer?.phone || newCustomerPhone || null,
        payment_type: paymentType,
        items: apiItems,
        notes: notes || undefined,
      })

      setInvoiceNumber(transaction.invoice_number)
      setSuccess(true)

      // Reset form
      setItems([
        { id: "1", product_id: "", quantity: 0, selling_price: 0, buying_price: 0, subtotal: 0, profit: 0 },
      ])
      setNotes("")
      setSelectedCustomer(null)
      setNewCustomerName("")
      setNewCustomerPhone("")
      setNewCustomerEmail("")
      setIncludeCustomer(false)
      setPaymentType("CASH")

      // Refresh page after 2 seconds
      setTimeout(() => router.refresh(), 2000)
    } catch (err: any) {
      setError(err.message || "Failed to create stock out")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Advanced Stock Out (Invoice)
        </CardTitle>
        <CardDescription>Create invoice with multiple products, track profit, manage credit</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Invoice Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Items Table */}
            <div className="space-y-3 bg-secondary/20 rounded-lg p-4">
              {items.map((item, index) => {
                const product = products.find((p) => p.id === item.product_id)
                const hasError = product && item.quantity > product.quantity

                return (
                  <div
                    key={item.id}
                    className={`space-y-3 p-4 rounded-lg border-2 transition-colors ${
                      hasError ? "border-destructive/50 bg-destructive/5" : "border-border bg-background"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Product *</Label>
                            <Select
                              value={item.product_id}
                              onValueChange={(value) => handleProductSelect(item.id, value)}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <div className="flex gap-2">
                                      <span>{p.name}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {p.quantity}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm">Quantity *</Label>
                            <Input
                              type="number"
                              min="1"
                              max={product?.quantity || 999}
                              value={item.quantity || ""}
                              onChange={(e) =>
                                updateItem(item.id, { quantity: Number.parseInt(e.target.value) || 0 })
                              }
                              className="h-10"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <Label className="text-sm">Selling Price *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.selling_price || ""}
                              onChange={(e) =>
                                updateItem(item.id, { selling_price: Number.parseFloat(e.target.value) || 0 })
                              }
                              className="h-10"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label className="text-sm">Buying Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.buying_price}
                              disabled
                              className="h-10 bg-muted"
                            />
                          </div>
                        </div>

                        {hasError && (
                          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded border border-destructive/30">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-sm text-destructive">
                              Insufficient stock: {product?.quantity || 0} available
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 pt-8">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="font-semibold">{item.subtotal.toLocaleString()} RWF</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Profit</p>
                          <p className="font-semibold text-success">{item.profit.toLocaleString()} RWF</p>
                        </div>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive mt-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{totalUnits}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{totalAmount.toLocaleString()} RWF</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className="text-2xl font-bold text-success">{totalProfit.toLocaleString()} RWF</p>
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-3">
            <Label>Payment Method *</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(value: any) => setPaymentType(value)}
              className="grid grid-cols-2 gap-4"
            >
              <Label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                paymentType === "CASH"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}>
                <RadioGroupItem value="CASH" />
                <DollarSign className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Cash</p>
                  <p className="text-xs text-muted-foreground">Immediate payment</p>
                </div>
              </Label>
              <Label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                paymentType === "CREDIT"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}>
                <RadioGroupItem value="CREDIT" />
                <Package className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">Credit (IDENI)</p>
                  <p className="text-xs text-muted-foreground">Payment later</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Customer Information Toggle (for CASH) */}
          {paymentType === "CASH" && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/20 border border-border">
              <input
                type="checkbox"
                id="includeCustomer"
                checked={includeCustomer}
                onChange={(e) => setIncludeCustomer(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="includeCustomer" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Record customer information (optional)</span>
              </label>
            </div>
          )}

          {/* Customer Selection (for credit OR when includeCustomer is checked) */}
          {(paymentType === "CREDIT" || includeCustomer) && (
            <div className={`space-y-3 p-4 rounded-lg border ${
              paymentType === "CREDIT" 
                ? "bg-warning/5 border-warning/20" 
                : "bg-secondary/10 border-border"
            }`}>
              <h4 className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information {paymentType === "CREDIT" && "*"}
              </h4>

              {selectedCustomer ? (
                <div className="p-3 rounded-lg bg-background border border-border flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>}
                    {selectedCustomer.email && <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">Select Existing Customer</Label>
                    <div className="relative">
                      <Input
                        placeholder="Search customer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowCustomerSearch(true)}
                        className="h-10"
                      />
                      {showCustomerSearch && customers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 max-h-40 overflow-auto">
                          {customers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setSearchQuery("")
                                setShowCustomerSearch(false)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors"
                            >
                              <p className="font-medium">{customer.name}</p>
                              {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">OR</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Create New Customer</Label>
                    <Input
                      placeholder="Customer name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="h-10"
                    />
                    <Input
                      placeholder="Phone number"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="h-10"
                    />
                    <Input
                      placeholder="Email (optional)"
                      type="email"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for this sale..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              <div>
                <p className="text-sm text-success font-medium">Sale recorded successfully!</p>
                {invoiceNumber && <p className="text-xs text-success/80">Invoice: {invoiceNumber}</p>}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-lg"
            disabled={isLoading || !isFormValid || hasStockErrors}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Complete Sale
              </>
            )}
          </Button>
        </form>
        )}
      </CardContent>
    </Card>
  )
}

export default AdvancedStockOutForm