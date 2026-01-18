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
    
    // Use the correct property: status === "PAID" instead of is_paid
    const isPaid = credit.status === "PAID"
    
    const matchesFilter =
      filter === "all" || 
      (filter === "pending" && !isPaid) || 
      (filter === "paid" && isPaid)
      
    return matchesSearch && matchesFilter
  })

  const handleMarkAsPaid = async (creditId: string) => {
    setLoadingId(creditId)
    const supabase = createClient()

    // Update to use status instead of is_paid
    const credit = credits.find(c => c.id === creditId)
    if (!credit) return

    await supabase
      .from("credits")
      .update({
        status: "PAID",
        amount_paid: credit.amount_owed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creditId)

    router.refresh()
    setLoadingId(null)
  }

  const getStatusBadge = (status: string) => {
    if (status === "PAID") {
      return <Badge className="bg-success/20 text-success border-success/30">Yishyuwe</Badge>
    }
    if (status === "PARTIAL") {
      return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Igice</Badge>
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
          <CardTitle className="text-lg">Urutonde rw&apos;Amadeni</CardTitle>
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

            {/* Filter */}
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
            
            const isPaid = credit.status === "PAID"
            const remainingAmount = credit.amount_owed - credit.amount_paid

            return (
              <div
                key={credit.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-secondary/30 border"
              >
                {/* Customer Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{credit.customer_name}</p>
                    {getStatusBadge(credit.status)}
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

                {/* Amount Info */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {credit.status === "PARTIAL" ? "Ibisigaye" : "Ideni"}
                    </p>
                    <p className={`font-bold text-lg ${isPaid ? "text-success" : "text-warning"}`}>
                      {(credit.status === "PARTIAL" ? remainingAmount : credit.amount_owed).toLocaleString()} RWF
                    </p>
                    {credit.status === "PARTIAL" && (
                      <p className="text-xs text-muted-foreground">
                        Yishyuwe: {credit.amount_paid.toLocaleString()} RWF
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {!isPaid && (
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
              <p className="text-muted-foreground">Nta madeni ahuye n&apos;ibyo ushakisha</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}