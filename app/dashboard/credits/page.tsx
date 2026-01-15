"use client"

import { CreditPaymentManager } from "@/components/credits/credit-payment-manager"
import { CreditCard } from "lucide-react"

export default function CreditsPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-primary" />
          Amadeni (Credits)
        </h1>
        <p className="text-muted-foreground">Manage credits and record payments</p>
      </div>

      <div className="grid gap-6">
        {/* Credit Payment Manager */}
        <CreditPaymentManager />
      </div>
    </div>
  )
}
