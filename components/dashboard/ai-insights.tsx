import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, AlertTriangle, TrendingUp, Package, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AIInsight } from "@/lib/types"

interface AIInsightsPanelProps {
  insights: AIInsight[]
}

const insightIcons = {
  LOW_STOCK: AlertTriangle,
  CREDIT_RISK: CreditCard,
  RESTOCK: Package,
  SALES_TREND: TrendingUp,
  UNUSUAL_ACTIVITY: AlertTriangle,
}

const priorityColors = {
  HIGH: "bg-destructive/10 text-destructive border-destructive/30",
  MEDIUM: "bg-warning/10 text-warning-foreground border-warning/30",
  LOW: "bg-primary/10 text-primary border-primary/30",
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nta bimenyetso bishya</p>
            <p className="text-sm">No new insights at the moment</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Insights
          <Badge variant="secondary" className="ml-auto">
            {insights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const Icon = insightIcons[insight.type as keyof typeof insightIcons] || Sparkles
          return (
            <div key={insight.id} className={cn("p-3 rounded-xl border", priorityColors[insight.priority])}>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-background/50">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{insight.titleKy}</p>
                  <p className="text-xs mt-1 opacity-80">{insight.descriptionKy}</p>
                  {insight.value !== undefined && (
                    <p className="text-xs font-semibold mt-1">
                      {typeof insight.value === "number"
                        ? insight.value.toLocaleString() + (insight.type === "LOW_STOCK" ? " units" : " RWF")
                        : insight.value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
