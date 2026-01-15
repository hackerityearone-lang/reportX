"use client"

import { CustomersManager } from "@/components/customers/customers-manager"
import { Users } from "lucide-react"

export default function CustomersPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          Customers
        </h1>
        <p className="text-muted-foreground">Manage customer records and credit tracking</p>
      </div>

      <div className="grid gap-6">
        {/* Customers Manager */}
        <CustomersManager />
      </div>
    </div>
  )
}
