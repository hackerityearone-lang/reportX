"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Search, Calendar, CheckCircle, Loader2 } from "lucide-react"
import type { Credit, StockTransaction, Product } from "@/lib/types"

interface CreditsListProps {
  credits: (Credit & {
    transaction: (StockTransaction & { product: Product | null }) | null
  })[]
}

export function CreditsList({ credits }: CreditsListProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  const filteredCredits = credits.filter((credit) => {
    const matchesSearch = credit.customer_name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter =
      filter === "all" || (filter === "pending" && !credit.is_paid) || (filter === "paid" && credit.is_paid)
    return matchesSearch && matchesFilter
  })

  const handleMarkAsPaid = async (creditId: string) => {
    setLoadingId(creditId)
    const supabase = createClient()

    await supabase
      .from("credits")
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
      })
      .eq("id", creditId)

    router.refresh()
    setLoadingId(null)
  }

  const getStatusBadge = (isPaid: boolean) => {
    if (isPaid) {
      return <Badge className="bg-success/20 text-success border-success/30">Yishyuwe</Badge>
    }
    return <Badge className="bg-warning/20 text-warning-foreground border-warning/30">Bitegereje</Badge>
  }

  if (credits.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nta madeni ahari</h3>
            <p className="text-muted-foreground">Amadeni azagaragara hano iyo ugurishije ku ideni</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <CardTitle className="text-lg">Urutonde rw'Amadeni</CardTitle>
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Shakisha umukiriya..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter - Updated to use pending/paid instead of status values */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">Byose</TabsTrigger>
                <TabsTrigger value="pending">Bitegereje</TabsTrigger>
                <TabsTrigger value="paid">Yishyuwe</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredCredits.map((credit) => {
            const date = new Date(credit.created_at)
            const formattedDate = date.toLocaleDateString("rw-RW", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })

            return (
              <div
                key={credit.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-secondary/30 border"
              >
                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{credit.customer_name}</p>
                    {getStatusBadge(credit.is_paid)}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </p>
                  {credit.transaction?.product && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {credit.transaction.product.name} x{credit.transaction.quantity}
                    </p>
                  )}
                </div>

                {/* Amount Info - Simplified to just show amount */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Ideni</p>
                    <p className={`font-bold text-lg ${credit.is_paid ? "text-success" : "text-warning"}`}>
                      {credit.amount.toLocaleString()} RWF
                    </p>
                  </div>
                </div>

                {/* Action Button - Simple mark as paid button */}
                {!credit.is_paid && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsPaid(credit.id)}
                    disabled={loadingId === credit.id}
                    className="shrink-0 bg-transparent"
                  >
                    {loadingId === credit.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Yishyuwe
                      </>
                    )}
                  </Button>
                )}
              </div>
            )
          })}

          {filteredCredits.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nta madeni ahuye n'ibyo ushakisha</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
