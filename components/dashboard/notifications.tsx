"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Bell, 
  Package, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  X,
  Settings
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  type: "low-stock" | "out-of-stock" | "overdue-credit" | "new-credit"
  title: string
  message: string
  href?: string
  timestamp: Date
  read: boolean
}

interface NotificationsProps {
  onNotificationCount?: (count: number) => void
}

export function Notifications({ onNotificationCount }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Load notifications
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const supabase = createClient()
      const newNotifications: Notification[] = []

      // Check for low stock products
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, brand, boxes_in_stock, pieces_per_box, min_stock_level')
      
      if (error || !products) {
        setLoading(false)
        return
      }

      products.forEach(product => {
        const totalStock = product.pieces_per_box 
          ? (product.boxes_in_stock * product.pieces_per_box)
          : product.boxes_in_stock
        
        const minLevel = product.pieces_per_box 
          ? product.min_stock_level * product.pieces_per_box 
          : product.min_stock_level

        if (totalStock === 0) {
          newNotifications.push({
            id: `out-of-stock-${product.id}`,
            type: "out-of-stock",
            title: "Product Out of Stock",
            message: `${product.name} (${product.brand}) is completely out of stock`,
            href: "/dashboard/products",
            timestamp: new Date(),
            read: false
          })
        } else if (totalStock <= minLevel) {
          newNotifications.push({
            id: `low-stock-${product.id}`,
            type: "low-stock",
            title: "Low Stock Alert",
            message: `${product.name} (${product.brand}) has only ${totalStock} units left (min: ${minLevel})`,
            href: "/dashboard/products",
            timestamp: new Date(),
            read: false
          })
        }
      })

      // Send browser notifications for new ones
      const existingIds = notifications.map(n => n.id)
      const newOnes = newNotifications.filter(n => !existingIds.includes(n.id))
      
      newOnes.forEach(notification => {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/favicon.ico",
            tag: notification.id
          })
        }
      })
      
      setNotifications(newNotifications)
      onNotificationCount?.(newNotifications.filter(n => !n.read).length)
    } catch (error) {
      // Silently handle errors - notifications will retry on next interval
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    onNotificationCount?.(0)
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.href) {
      router.push(notification.href)
    }
    setOpen(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "low-stock":
      case "out-of-stock":
        return <Package className="h-4 w-4" />
      case "overdue-credit":
      case "new-credit":
        return <CreditCard className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case "out-of-stock":
      case "overdue-credit":
        return "text-destructive"
      case "low-stock":
        return "text-warning"
      default:
        return "text-muted-foreground"
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${getColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start mb-2"
            onClick={() => {
              console.log('[NOTIFICATIONS] Manual refresh triggered')
              loadNotifications()
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Refresh Notifications
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => {
              setOpen(false)
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}