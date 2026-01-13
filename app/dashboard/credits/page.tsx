import { createClient } from "@/lib/supabase/server"
import { CreditsList } from "@/components/credits/credits-list"
import { CreditsStats } from "@/components/credits/credits-stats"
import { CreditCard } from "lucide-react"

export default async function CreditsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: credits } = await supabase
    .from("credits")
    .select("*, transaction:stock_transactions(*, product:products(*))")
    .order("created_at", { ascending: false })

  const unpaidCredits = credits?.filter((c) => !c.is_paid) || []
  const paidCredits = credits?.filter((c) => c.is_paid) || []
  const totalOwed = unpaidCredits.reduce((sum, c) => sum + c.amount, 0)

  const stats = {
    totalOwed,
    pendingCount: unpaidCredits.length,
    paidCount: paidCredits.length,
    totalCredits: credits?.length || 0,
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-primary" />
          Amadeni (Credits)
        </h1>
        <p className="text-muted-foreground">Manage customer credits</p>
      </div>

      {/* Stats */}
      <CreditsStats stats={stats} />

      {/* Credits List */}
      <CreditsList credits={credits || []} />
    </div>
  )
}
