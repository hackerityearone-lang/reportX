"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image" // 1. Import the Image component
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, 
  CreditCard, FileText, Settings, Users, Crown, LogOut
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SidebarProps {
  userRole?: string
}

export function DashboardSidebar({ userRole }: SidebarProps) {
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (userRole) {
      setCurrentRole(userRole)
    } else {
      const fetchRole = async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .single()
            
            if (profile) {
              setCurrentRole(profile.role)
            }
          }
        } catch (error) {
          console.error("Error fetching role:", error)
        }
      }
      fetchRole()
    }
  }, [userRole])

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

  if (currentRole === "BOSS") {
    const usersNav = { name: "Users", href: "/dashboard/users", icon: Crown }
    if (!navigation.find(item => item.href === "/dashboard/users")) {
      navigation.splice(6, 0, usersNav)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-emerald-50 to-white dark:from-slate-950 dark:to-slate-900 border-r border-emerald-200 dark:border-slate-800">
        <div className="flex flex-col w-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-emerald-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* 2. Replaced the Icon Div with the Image component */}
                <div className="w-12 h-12 relative flex items-center justify-center">
                  <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    width={48} 
                    height={48} 
                    className="rounded-xl object-contain"
                    priority // Ensures the logo loads immediately
                  />
                </div>
                
                {currentRole === "BOSS" && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-md">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                 KIVU Quality SHEET ltd
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inventory System
                </p>
              </div>
            </div>
          </div>

          {/* Role Badge */}
          {currentRole && (
            <div className="px-6 pt-4 pb-2">
              <div className={cn(
                "px-4 py-2.5 rounded-xl flex items-center gap-2.5 transition-all",
                currentRole === "BOSS" 
                  ? "bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20" 
                  : "bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20"
              )}>
                {currentRole === "BOSS" ? (
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
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30"
                      : "hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isActive && "drop-shadow-sm"
                  )} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-emerald-200 dark:border-slate-800">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group">
              <LogOut className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Icons Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 dark:bg-slate-950/98 backdrop-blur-lg border-t border-emerald-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {/* First Row - 4 items */}
        <div className="grid grid-cols-4 gap-1 px-2 pt-2">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-center p-3 rounded-xl transition-all relative",
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-600 dark:text-slate-400 active:bg-emerald-50 dark:active:bg-slate-800"
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6",
                  isActive && "drop-shadow-sm"
                )} />
                {isActive && (
                  <span className="absolute -top-0.5 right-1/2 translate-x-1/2 w-8 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
        
        {/* Second Row - remaining items */}
        <div className="grid grid-cols-4 gap-1 px-2 pb-2 pt-1">
          {navigation.slice(4).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-center p-3 rounded-xl transition-all relative",
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-600 dark:text-slate-400 active:bg-emerald-50 dark:active:bg-slate-800"
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6",
                  isActive && "drop-shadow-sm"
                )} />
                {isActive && (
                  <span className="absolute -top-0.5 right-1/2 translate-x-1/2 w-8 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default DashboardSidebar