"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { BarChart3 } from "lucide-react"

export function HomePageHeader() {
  const { t } = useLanguage()

  return (
    <header className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
          <BarChart3 className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">KQS LTD</h1>
          <p className="text-sm text-muted-foreground">{t("common", "tagline")}</p>
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <Link href="/auth/login">
          <Button variant="outline" size="lg" className="text-lg px-6 bg-transparent">
            {t("auth", "login")}
          </Button>
        </Link>
        <Link href="/auth/sign-up">
          <Button size="lg" className="text-lg px-6 bg-primary hover:bg-primary/90">
            {t("auth", "signUp")}
          </Button>
        </Link>
      </div>
    </header>
  )
}
