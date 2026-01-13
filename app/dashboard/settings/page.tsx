import { createClient } from "@/lib/supabase/server"
import { SettingsForm } from "@/components/settings/settings-form"
import { Settings } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const userMetadata = user.user_metadata as { full_name?: string; role?: string }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          Igenamiterere (Settings)
        </h1>
        <p className="text-muted-foreground">Hindura amakuru y'konti yawe</p>
      </div>

      {/* Settings Form */}
      <SettingsForm
        email={user.email || ""}
        fullName={userMetadata?.full_name || ""}
        role={userMetadata?.role || "USER"}
      />
    </div>
  )
}
