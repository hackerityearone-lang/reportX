"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import {
  Package,
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  FileText,
  Settings,
  Beer,
} from "lucide-react"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { t, language } = useLanguage()

  const navigation = [
    {
      name: t("nav", "dashboard"),
      nameAlt: language === "rw" ? "Dashboard" : "Ikibaho",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: t("nav", "products"),
      nameAlt: language === "rw" ? "Products" : "Ibicuruzwa",
      href: "/dashboard/products",
      icon: Beer,
    },
    {
      name: t("nav", "stockIn"),
      nameAlt: language === "rw" ? "Stock In" : "Ibyinjiye",
      href: "/dashboard/stock-in",
      icon: ArrowDownToLine,
    },
    {
      name: t("nav", "stockOut"),
      nameAlt: language === "rw" ? "Stock Out" : "Ibisohotse",
      href: "/dashboard/stock-out",
      icon: ArrowUpFromLine,
    },
    {
      name: t("nav", "credits"),
      nameAlt: language === "rw" ? "Credits" : "Amadeni",
      href: "/dashboard/credits",
      icon: CreditCard,
    },
    {
      name: t("nav", "reports"),
      nameAlt: language === "rw" ? "Reports" : "Raporo",
      href: "/dashboard/reports",
      icon: FileText,
    },
    {
      name: t("nav", "settings"),
      nameAlt: language === "rw" ? "Settings" : "Igenamiterere",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">ReportX Stock</h1>
              <p className="text-xs text-muted-foreground">{t("common", "tagline")}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex gap-x-3 rounded-xl p-3 text-sm font-medium leading-6 transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary hover:text-secondary-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground group-hover:text-inherit">
                        {item.nameAlt}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <nav className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
