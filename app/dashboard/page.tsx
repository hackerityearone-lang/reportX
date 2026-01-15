"use client"

import { AdvancedDashboardStats } from "@/components/dashboard/advanced-dashboard-stats"

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Advanced Dashboard with real-time stats and charts */}
      <AdvancedDashboardStats />
    </div>
  )
}
