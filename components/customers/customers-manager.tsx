"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Phone, User, DollarSign, Loader2, Search, Mail, X } from "lucide-react"
import type { Customer } from "@/lib/types"
import { customerService } from "@/lib/supabase/customer-service"
import { CustomerDetailsDialog } from "./customer-details"

export function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Form state
  const [formData, setFormData] = useState({ name: "", phone: "", tin_number: "" })
  const [editingId, setEditingId] = useState<string | null>(null)

  // Load customers
  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await customerService.getCustomers({ archived: false })
      setCustomers(data)
    } catch (err: any) {
      setError(err.message || "Failed to load customers")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    setError(null)

    try {
      if (editingId) {
        await customerService.updateCustomer(editingId, {
          name: formData.name,
          phone: formData.phone,
          tin_number: formData.tin_number,
        } as any)
      } else {
        await customerService.createCustomer({
          name: formData.name,
          phone: formData.phone || null,
          tin_number: formData.tin_number || null,
          total_credit: 0,
          is_archived: false,
        } as any)
      }

      setFormData({ name: "", phone: "", email: "" })
      setEditingId(null)
      setShowForm(false)
      await loadCustomers()
    } catch (err: any) {
      setError(err.message || "Failed to save customer")
    } finally {
      setIsAdding(false)
    }
  }

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      tin_number: customer.tin_number || "",
    })
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleArchive = async (id: string) => {
    if (confirm("Archive this customer?")) {
      try {
        await customerService.archiveCustomer(id)
        await loadCustomers()
      } catch (err: any) {
        setError(err.message || "Failed to archive customer")
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setFormData({ name: "", phone: "", email: "" })
    setEditingId(null)
  }

  const handleViewDetails = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setShowDetails(true)
  }

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.tin_number?.toLowerCase().includes(query)
    )
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl">Customers</CardTitle>
            <CardDescription>Manage customer records and credit status</CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add Customer
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Bar */}
          {customers.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, phone, or TIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Form */}
          {showForm && (
            <div className="p-6 rounded-xl bg-primary/5 border-2 border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">{editingId ? "Edit Customer" : "New Customer"}</h4>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">
                      Customer Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-11 mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+250 XXX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-11 mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tin_number" className="text-sm font-medium">
                    TIN Number
                  </Label>
                  <Input
                    id="tin_number"
                    placeholder="123456789"
                    value={formData.tin_number}
                    onChange={(e) => setFormData({ ...formData, tin_number: e.target.value })}
                    className="h-11 mt-1.5"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isAdding || !formData.name}
                    className="flex-1 h-11"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Customer"
                    )}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-between">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Customer List */}
          {filteredCustomers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => {
                const hasCredit = customer.total_credit > 0
                return (
                  <Card 
                    key={customer.id} 
                    className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => handleViewDetails(customer.id)}
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Header with name and credit status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base truncate">{customer.name}</p>
                              {hasCredit ? (
                                <Badge variant="destructive" className="mt-1.5 gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {customer.total_credit.toLocaleString()} RWF
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="mt-1.5 bg-success/10 text-success border-success/20">
                                  All Paid
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contact info */}
                        <div className="space-y-2 text-sm">
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{customer.phone}</span>
                            </div>
                          )}
                          {customer.tin_number && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">TIN: {customer.tin_number}</span>
                            </div>
                          )}
                          {!customer.phone && !customer.tin_number && (
                            <p className="text-muted-foreground text-xs">No contact info</p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(customer)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleArchive(customer.id)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : customers.length > 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No customers match "{searchQuery}"</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No customers yet</p>
              <p className="text-muted-foreground mb-4">Start by adding your first customer</p>
              <Button variant="outline" onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Customer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <CustomerDetailsDialog
        customerId={selectedCustomerId}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  )
}

export default CustomersManager