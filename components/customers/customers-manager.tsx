"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Phone, User, DollarSign, Loader2 } from "lucide-react"
import type { Customer } from "@/lib/types"
import { customerService } from "@/lib/supabase/customer-service"

export function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" })
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
          email: formData.email,
        } as any)
      } else {
        await customerService.createCustomer({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
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
      email: customer.email || "",
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Manage customer records and credit</CardDescription>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form */}
        {showForm && (
          <div className="p-4 rounded-lg bg-secondary/20 border border-border space-y-4">
            <h4 className="font-medium">{editingId ? "Edit Customer" : "New Customer"}</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm">
                  Customer Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm">
                  Phone
                </Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isAdding || !formData.name}
                  className="flex-1"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Customer List */}
        {customers.length > 0 ? (
          <div className="space-y-2">
            {customers.map((customer) => (
              <div key={customer.id} className="p-4 rounded-lg border border-border hover:bg-secondary/5 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{customer.name}</p>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.email && (
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {customer.total_credit > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <DollarSign className="h-3 w-3" />
                        {customer.total_credit.toLocaleString()} RWF
                      </Badge>
                    )}
                    {customer.total_credit === 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <DollarSign className="h-3 w-3" />
                        No credit
                      </Badge>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleArchive(customer.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No customers yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
              Add First Customer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CustomersManager
