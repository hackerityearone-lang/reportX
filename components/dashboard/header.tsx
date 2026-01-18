"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
import { Bell, LogOut, Menu, User, Crown, Package, Search } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  FileText,
  Settings,
  Users,
} from "lucide-react"

interface DashboardHeaderProps {
  userName: string
  userRole: string
}

export function DashboardHeader({ userName, userRole }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/dashboard/products", icon: Package },
    { name: "Stock In", href: "/dashboard/stock-in", icon: ArrowDownToLine },
    { name: "Stock Out", href: "/dashboard/stock-out", icon: ArrowUpFromLine },
    { name: "Credits", href: "/dashboard/credits", icon: CreditCard },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Reports", href: "/dashboard/reports", icon: FileText },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  // Add User Management for BOSS only
  if (userRole === "BOSS") {
    navigation.splice(6, 0, {
      name: "Users",
      href: "/dashboard/users",
      icon: Crown,
    })
  }

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

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentNav = navigation.find(nav => nav.href === pathname)
    return currentNav?.name || "Stock Manager"
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-emerald-200 dark:border-slate-800 shadow-sm lg:sticky lg:left-auto lg:right-auto">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden hover:bg-emerald-50 dark:hover:bg-slate-800">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-emerald-50 to-white dark:from-slate-950 dark:to-slate-900">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-emerald-200 dark:border-slate-800">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  {userRole === "BOSS" && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                      <Crown className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Stock Manager
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Inventory System</p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="px-6 pt-4 pb-2">
                <div className={cn(
                  "px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-all",
                  userRole === "BOSS" 
                    ? "bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20" 
                    : "bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20"
                )}>
                  {userRole === "BOSS" ? (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Role</p>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-500">Administrator</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Role</p>
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-500">Manager</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 overflow-y-auto">
                <ul className="flex flex-col gap-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                            isActive
                              ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                              : "text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5 transition-transform group-hover:scale-110",
                            isActive && "drop-shadow-sm"
                          )} />
                          <span>{item.name}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-emerald-200 dark:border-slate-800">
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group disabled:opacity-50"
                >
                  <LogOut className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="font-medium">{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Page Title - Shows current page */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {getCurrentPageTitle()}
            </h2>
            {userRole === "BOSS" && (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-lg">
                <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-500">Admin</span>
              </span>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search Button - Desktop only */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Search className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 px-2 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Avatar className="h-9 w-9 ring-2 ring-emerald-500/20">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {userRole === "BOSS" && <Crown className="h-3 w-3" />}
                    {userRole === "BOSS" ? "Administrator" : "Manager"}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-emerald-200 dark:border-slate-800">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white">{userName}</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    {userRole === "BOSS" && <Crown className="h-3 w-3" />}
                    {userRole === "BOSS" ? "Administrator" : "Manager"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-emerald-200 dark:bg-slate-800" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800">
                  <User className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-emerald-200 dark:bg-slate-800" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader