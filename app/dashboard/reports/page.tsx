"use client"

import { AdvancedReportsPanel } from "@/components/reports/advanced-reports-panel"
import { BarChart3 } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
     

      <div className="grid gap-6">
        {/* Advanced Reports Panel */}
        <AdvancedReportsPanel />
      </div>
    </div>
  )
}
