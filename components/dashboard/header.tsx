"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, LogOut, User, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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

interface DashboardHeaderProps {
  userName: string
  userRole: string
}

export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: t("nav", "dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav", "products"), href: "/dashboard/products", icon: Beer },
    { name: t("nav", "stockIn"), href: "/dashboard/stock-in", icon: ArrowDownToLine },
    { name: t("nav", "stockOut"), href: "/dashboard/stock-out", icon: ArrowUpFromLine },
    { name: t("nav", "credits"), href: "/dashboard/credits", icon: CreditCard },
    { name: t("nav", "reports"), href: "/dashboard/reports", icon: FileText },
    { name: t("nav", "settings"), href: "/dashboard/settings", icon: Settings },
  ]

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-border">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">ReportX Stock</h1>
                  <p className="text-xs text-muted-foreground">{t("common", "appName")}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4">
                <ul className="flex flex-col gap-y-2">
                  {navigation.map((item) => {
                    const isActive =
                      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex gap-x-3 rounded-xl p-3 text-sm font-medium leading-6 transition-colors",
                            isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary",
                          )}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Page Title - Shows current page */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground lg:hidden">ReportX Stock</h2>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {userRole === "STOCK_BOSS" ? t("auth", "stockBoss") : t("auth", "user")}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {userRole === "STOCK_BOSS" ? t("auth", "stockBoss") : t("auth", "user")}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  {t("nav", "settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? t("common", "loading") : t("auth", "logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
