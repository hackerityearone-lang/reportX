import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Clock, CheckCircle } from "lucide-react"

interface CreditsStatsProps {
  stats: {
    totalOwed: number
    pendingCount: number
    paidCount: number
    totalCredits: number
  }
}

export function CreditsStats({ stats }: CreditsStatsProps) {
  const statCards = [
    {
      title: "Amadeni Yose",
      value: `${stats.totalOwed.toLocaleString()} RWF`,
      icon: CreditCard,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Bitegereje",
      value: stats.pendingCount.toString(),
      subtitle: "Pending",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Yishyuwe",
      value: stats.paidCount.toString(),
      subtitle: "Paid",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
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
