import { Card, CardContent } from "@/components/ui/card"
import { Package, TrendingUp, AlertTriangle, CreditCard, Banknote, ShoppingCart } from "lucide-react"
import type { DashboardStats as StatsType } from "@/lib/types"

interface DashboardStatsProps {
  stats: StatsType
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Ibicuruzwa Byose",
      titleEn: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Stock Yose",
      titleEn: "Total Stock",
      value: stats.totalStock.toLocaleString(),
      icon: ShoppingCart,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Stock Nke",
      titleEn: "Low Stock",
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground",
      bgColor: stats.lowStockCount > 0 ? "bg-destructive/10" : "bg-muted/50",
    },
    {
      title: "Ibyagurishijwe Uyu munsi",
      titleEn: "Today's Sales",
      value: stats.todaySales.toString(),
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Amafaranga y'Uyu munsi",
      titleEn: "Today's Revenue",
      value: `${stats.todayRevenue.toLocaleString()} RWF`,
      icon: Banknote,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Amadeni Asigaye",
      titleEn: "Pending Credits",
      value: `${stats.pendingCreditsAmount.toLocaleString()} RWF`,
      subtitle: `${stats.totalCredits} customers`,
      icon: CreditCard,
      color: stats.pendingCreditsAmount > 0 ? "text-warning" : "text-muted-foreground",
      bgColor: stats.pendingCreditsAmount > 0 ? "bg-warning/10" : "bg-muted/50",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              {stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
