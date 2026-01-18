"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { BarChart3 } from "lucide-react"
import InstallAppPrompt from "./InstallAppPrompt"

export function HomePageHeader() {
  const { t } = useLanguage()

  return (
    <>
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative h-14 px-4 bg-card border border-border/50 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
              <img 
                src="/logo.png" 
                alt="ReportX Stock Logo" 
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              ReportX <span className="text-primary">Stock</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {t("common", "tagline") || "Advanced Inventory Management System"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Link href="/auth/login" className="flex-1 sm:flex-none">
            <Button 
              size="lg" 
              className="w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {t("auth", "login")}
            </Button>
          </Link>
        </div>
      </header>
      
      {/* Install prompt floats over the page */}
      <InstallAppPrompt />
    </>
  )
}