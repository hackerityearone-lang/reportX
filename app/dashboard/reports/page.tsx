"use client"

import { AdvancedReportsPanel } from "@/components/reports/advanced-reports-panel"
import { BarChart3 } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-primary" />
          Raporo (Reports)
        </h1>
        <p className="text-muted-foreground">Generate daily, weekly, and monthly reports</p>
      </div>

      <div className="grid gap-6">
        {/* Advanced Reports Panel */}
        <AdvancedReportsPanel />
      </div>
    </div>
  )
}
