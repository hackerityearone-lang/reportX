"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, Printer, Loader2, TrendingUp, 
  Package, DollarSign, Clock, AlertTriangle, Receipt, ArrowDownToLine, CheckCircle2, Users
} from "lucide-react"
import type { DailyReport } from "@/lib/types"
import { reportsService } from "@/lib/supabase/reports-service"
import CustomerDetailsDialog from "@/components/customers/customer-details"
import { createClient } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface Manager {
  id: string
  full_name: string
  role: string
}

export function AdvancedReportsPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [reportType, setReportType] = useState("daily")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0])
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [weeklyReport, setWeeklyReport] = useState<any>(null)
  const [monthlyReport, setMonthlyReport] = useState<any>(null)
  const [detailedLog, setDetailedLog] = useState<any>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  
  // Manager selector states
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<string>("all")

  // Fetch user role and managers on mount
  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current user's role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      setCurrentUserRole(profile?.role || 'MANAGER')

      // If BOSS, fetch all managers
      if (profile?.role === 'BOSS') {
        const { data: managersList } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('status', 'APPROVED')
          .order('full_name')
        
        setManagers(managersList || [])
      }
    }
    
    fetchUserData()
  }, [])

  const handleGenerateAudit = async () => {
    setIsLoading(true)
    try {
      const date = new Date(reportDate)
      const managerId = selectedManagerId === "all" ? null : selectedManagerId

      if (reportType === "daily") {
        const report = await reportsService.getDailyReport(date, managerId)
        const audit = await reportsService.getDetailedDailyLog(date, managerId)
        setDailyReport(report)
        setDetailedLog(audit)
        setWeeklyReport(null)
        setMonthlyReport(null)
      } else if (reportType === "weekly") {
        // Get start of week (Sunday) for the selected date
        const startOfWeek = new Date(date)
        const day = startOfWeek.getDay()
        startOfWeek.setDate(startOfWeek.getDate() - day)
        startOfWeek.setHours(0, 0, 0, 0)
        
        const report = await reportsService.getWeeklyReport(startOfWeek, managerId)
        setWeeklyReport(report)
        setDailyReport(null)
        setDetailedLog(null)
        setMonthlyReport(null)
      } else if (reportType === "monthly") {
        // Get start of month for the selected date
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        
        const report = await reportsService.getMonthlyReport(startOfMonth, managerId)
        setMonthlyReport(report)
        setDailyReport(null)
        setDetailedLog(null)
        setWeeklyReport(null)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAmount = (amt: any) => {
    const n = Number(amt || 0)
    const hasDecimal = Math.round(n) !== n
    return hasDecimal
      ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : n.toLocaleString()
  }

  const paymentTotals = useMemo(() => {
    const totals = { cash: 0, paid: 0, unpaid: 0, received: 0 }
    ;(detailedLog?.sales || []).forEach((s: any) => {
      const amt = Number(s.total_amount || 0)
      if (s.payment_type === 'CASH') totals.cash += amt
      else if (s.is_credit_paid) totals.paid += amt
      else totals.unpaid += amt
    })
    totals.received = totals.cash + totals.paid
    return totals
  }, [detailedLog])

  const selectedManagerName = useMemo(() => {
    if (selectedManagerId === "all") return "All Managers"
    const manager = managers.find(m => m.id === selectedManagerId)
    return manager?.full_name || "Unknown Manager"
  }, [selectedManagerId, managers])

  const exportToCSV = () => {
    if (!dailyReport && !weeklyReport && !monthlyReport) return

    let csvContent = ""
    let filename = ""

    if (dailyReport && detailedLog) {
      filename = `daily-report-${reportDate}.csv`
      csvContent = "Daily Report - Kivu Quality Sheet Ltd\n"
      csvContent += `Date: ${reportDate}\n\n`
      
      // Summary
      csvContent += "SUMMARY\n"
      csvContent += "Metric,Amount\n"
      csvContent += `Cash Income,${dailyReport.total_cash_income}\n`
      csvContent += `Net Profit,${dailyReport.total_profit}\n`
      csvContent += `Units Sold,${dailyReport.total_units_sold}\n`
      csvContent += `Low Stock Items,${detailedLog?.lowStock?.length || 0}\n\n`
      
      // Sales Log - Detailed
      csvContent += "SALES LOG - DETAILED\n"
      csvContent += "Time,Customer,Product,Quantity,Unit Price,Subtotal,Payment Type,Invoice\n"
      detailedLog?.sales?.forEach((s: any) => {
        const time = new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        const customer = s.customers?.name || s.customer_name || "Cash Customer"
        const invoiceNum = s.invoice_number || s.id?.slice(0, 8) || "N/A"
        const paymentType = s.payment_type === 'CASH' ? 'CASH' : (s.is_credit_paid ? 'PAID CREDIT' : 'CREDIT')
        
        if (s.stock_out_items && s.stock_out_items.length > 0) {
          // Add one row per item - show customer and payment on EVERY row for clarity
          s.stock_out_items.forEach((item: any) => {
            const productName = item.products?.name || item.product?.name || "Unknown Product"
            const quantity = item.quantity || 0
            const unitPrice = item.selling_price || 0
            const subtotal = quantity * unitPrice
            
            csvContent += `${time},"${customer}","${productName}",${quantity},${unitPrice},${subtotal},"${paymentType}",${invoiceNum}\n`
          })
        } else {
          csvContent += `${time},"${customer}","No items",0,0,0,"${paymentType}",${invoiceNum}\n`
        }
      })
      
      // Low Stock
      csvContent += "\nLOW STOCK ITEMS\n"
      csvContent += "Product Name,Quantity Left\n"
      detailedLog?.lowStock?.forEach((p: any) => {
        csvContent += `"${p.name}",${p.quantity}\n`
      })
    } else if (weeklyReport) {
      filename = `weekly-report-${reportDate}.csv`
      csvContent = "Weekly Report - Kivu Quality Sheet Ltd\n"
      csvContent += `Period: ${weeklyReport.startDate} to ${weeklyReport.endDate}\n\n`
      
      csvContent += "SUMMARY\n"
      csvContent += "Metric,Amount\n"
      csvContent += `Total Cash,${weeklyReport.totalCash}\n`
      csvContent += `Total Credit,${weeklyReport.totalCredit}\n`
      csvContent += `Net Profit,${weeklyReport.totalProfit}\n`
      csvContent += `Units Sold,${weeklyReport.totalUnits}\n\n`
      
      csvContent += "DAILY BREAKDOWN\n"
      csvContent += "Day,Cash,Credit,Profit,Units,Total\n"
      weeklyReport.dayBreakdown.forEach((day: any) => {
        csvContent += `${day.date},${day.cash},${day.credit},${day.profit},${day.units},${day.total}\n`
      })
    } else if (monthlyReport) {
      filename = `monthly-report-${reportDate}.csv`
      csvContent = "Monthly Report - Kivu Quality Sheet Ltd\n"
      csvContent += `Period: ${monthlyReport.startDate} to ${monthlyReport.endDate}\n\n`
      
      csvContent += "SUMMARY\n"
      csvContent += "Metric,Amount\n"
      csvContent += `Total Cash,${monthlyReport.totalCash}\n`
      csvContent += `Total Credit,${monthlyReport.totalCredit}\n`
      csvContent += `Net Profit,${monthlyReport.totalProfit}\n`
      csvContent += `Units Sold,${monthlyReport.totalUnits}\n\n`
      
      csvContent += "WEEKLY BREAKDOWN\n"
      csvContent += "Week,Cash,Credit,Profit,Units,Total\n"
      monthlyReport.weekBreakdown.forEach((week: any) => {
        csvContent += `${week.weekLabel},${week.cash},${week.credit},${week.profit},${week.units},${week.total}\n`
      })
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 lg:p-6">
        {/* 1. TOP UI BAR - HIDDEN ON PRINT */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Intelligence Reports
                </h1>
                <p className="text-slate-600 font-medium text-lg">Verify your business performance and inventory health</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            size="lg"
            className="rounded-2xl px-8 py-4 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 text-white font-bold" 
            onClick={() => window.print()} 
            disabled={!dailyReport && !weeklyReport && !monthlyReport}
          >
            <Printer className="h-5 w-5 mr-2" /> Print Official PDF
          </Button>
          <Button 
            size="lg"
            className="rounded-2xl px-8 py-4 shadow-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 text-white font-bold" 
            onClick={exportToCSV} 
            disabled={!dailyReport && !weeklyReport && !monthlyReport}
          >
            <ArrowDownToLine className="h-5 w-5 mr-2" /> Export CSV
          </Button>
          </div>
        </div>

        {/* 2. TAB CONTROLS - HIDDEN ON PRINT */}
        <div className="print:hidden space-y-6">
          <Tabs defaultValue="daily" className="w-full" onValueChange={setReportType}>
            <TabsList className="bg-white/80 backdrop-blur-sm p-2 rounded-2xl w-full max-w-md mx-auto grid grid-cols-3 shadow-lg border border-white/20">
              <TabsTrigger value="daily" className="rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                Daily Audit
              </TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-6">
              {/* Manager Selector - Only show for BOSS */}
              {currentUserRole === 'BOSS' && (
                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase text-slate-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Manager
                  </Label>
                  <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                    <SelectTrigger className="rounded-xl h-12 border-2 border-slate-200 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Managers (Combined)</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.full_name} ({manager.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1 space-y-3">
                  <Label className="text-sm font-bold uppercase text-slate-600">
                    Select Date {reportType !== "daily" && `(Any date in the ${reportType === "weekly" ? "week" : "month"})`}
                  </Label>
                  <Input 
                    type="date" 
                    value={reportDate} 
                    className="rounded-xl h-12 border-2 border-slate-200 focus:border-blue-500 transition-colors" 
                    onChange={(e) => setReportDate(e.target.value)} 
                  />
                </div>
                <Button 
                  onClick={handleGenerateAudit} 
                  disabled={isLoading} 
                  className="rounded-xl px-8 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg transform hover:scale-105 transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <TrendingUp className="h-5 w-5 mr-2" />}
                  Generate {reportType} Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* DAILY REPORT */}
      {dailyReport && detailedLog && (
        <>
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 print:hidden">
              <SummaryCard title="Cash Income" value={(!detailedLog?.sales || detailedLog.sales.length === 0) ? 0 : dailyReport.total_cash_income} icon={<DollarSign />} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
              <SummaryCard title="Net Profit" value={(!detailedLog?.sales || detailedLog.sales.length === 0) ? 0 : dailyReport.total_profit} icon={<TrendingUp />} color="bg-gradient-to-br from-blue-500 to-indigo-600" />
              <SummaryCard title="Units Sold" value={(!detailedLog?.sales || detailedLog.sales.length === 0) ? 0 : dailyReport.total_units_sold} icon={<Package />} color="bg-gradient-to-br from-slate-700 to-slate-900" isCurrency={false} />
              <SummaryCard title="Low Stock" value={detailedLog?.lowStock?.length || 0} icon={<AlertTriangle />} color="bg-gradient-to-br from-rose-500 to-pink-600" isCurrency={false} />
            </div>

            {/* Payment Summary */}
            {detailedLog?.sales && detailedLog.sales.length > 0 && (
              (() => {
                const { totalRevenue, cashTotal, paidCreditTotal, unpaidCreditTotal } = (detailedLog?.sales || []).reduce(
                  (acc: any, s: any) => {
                    const amt = Number(s.total_amount || 0)
                    acc.totalRevenue += amt
                    if (s.payment_type === 'CASH') acc.cashTotal += amt
                    else if (s.is_credit_paid) acc.paidCreditTotal += amt
                    else acc.unpaidCreditTotal += amt
                    return acc
                  },
                  { totalRevenue: 0, cashTotal: 0, paidCreditTotal: 0, unpaidCreditTotal: 0 }
                )

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 print:hidden">
                    <SummaryCard title="Income (Total)" value={totalRevenue} icon={<Receipt />} color="bg-gradient-to-br from-sky-500 to-blue-600" />
                    <SummaryCard title="Cash" value={cashTotal} icon={<DollarSign />} color="bg-gradient-to-br from-emerald-500 to-green-600" />
                    <SummaryCard title="Paid Credit" value={paidCreditTotal} icon={<CheckCircle2 />} color="bg-gradient-to-br from-green-500 to-emerald-600" />
                    <SummaryCard title="Unpaid Credit" value={unpaidCreditTotal} icon={<AlertTriangle />} color="bg-gradient-to-br from-amber-500 to-orange-600" />
                  </div>
                )
              })()
            )}

          {/* THE ACTUAL PRINTABLE DOCUMENT */}
          <div id="printable-report" className="bg-white border-2 border-slate-200 shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:border-none">
            
            {/* DOCUMENT HEADER */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 lg:p-12 text-center space-y-4 print:bg-slate-900 print:p-8">
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter">Kivu Quality Sheet Ltd</h2>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                <Receipt className="h-3 w-3" /> Daily Operations Audit
              </div>
              <p className="text-slate-300 font-mono text-sm">Date: {reportDate}</p>
              {currentUserRole === 'BOSS' && selectedManagerId !== "all" && (
                <p className="text-slate-300 font-mono text-sm">Manager: {selectedManagerName}</p>
              )}
              {currentUserRole === 'BOSS' && selectedManagerId === "all" && (
                <p className="text-slate-300 font-mono text-sm">All Managers Combined</p>
              )}
            </div>

            <div className="p-6 lg:p-12 space-y-8 lg:space-y-12">
              
              {/* SECTION: SALES LOG WITH PAYMENT TYPE */}
              <section className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 border-b-2 border-slate-200 pb-4">
                  <Clock className="h-5 w-5 text-primary" /> Sales Dispatch Log
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase text-[8px] text-left border-b-2 border-slate-100">
                        <th className="pb-4 px-2">Time</th>
                        <th className="pb-4 px-2">Customer</th>
                        <th className="pb-4 px-2">Items Detailed</th>
                        <th className="pb-4 px-2 text-center">Payment</th>
                        <th className="pb-4 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(!detailedLog?.sales || detailedLog.sales.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-4 text-slate-400">
                              <Receipt className="h-12 w-12" />
                              <p className="text-lg font-medium">No transactions found</p>
                              <p className="text-sm">All transactions have been deleted or no sales recorded for this date</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        detailedLog.sales.map((s: any, idx: number) => (
                          <tr
                            key={idx}
                            className="transition-colors hover:bg-slate-100 cursor-pointer print:cursor-default"
                            onClick={() => {
                              setSelectedTransaction(s)
                              setTransactionDialogOpen(true)
                            }}
                          >
                            <td className="py-4 px-2 font-mono text-xs text-slate-500">
                               {new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="py-4 px-2 font-bold">
                              {s.customers?.id ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedCustomerId(s.customers.id)
                                    setDialogOpen(true)
                                  }}
                                  className="text-primary hover:underline cursor-pointer print:pointer-events-none"
                                >
                                  {s.customers?.name || "Cash Customer"}
                                </button>
                              ) : (
                                <span>{s.customers?.name || "Cash Customer"}</span>
                              )}
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex flex-col text-sm space-y-1">
                                {s.stock_out_items?.map((item: any, i: number) => (
                                  <div key={i} className="py-1">
                                    <span className="font-medium">{item.product?.name || item.products?.name}</span> 
                                    <span className="text-slate-500">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center">
                              {s.payment_type === 'CASH' ? (
                                <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold">CASH</Badge>
                              ) : s.is_credit_paid ? (
                                <Badge className="bg-green-600 text-white hover:bg-green-700 font-bold">PAID</Badge>
                              ) : (
                                <Badge className="bg-amber-500 text-white hover:bg-amber-600 font-bold">CREDIT</Badge>
                              )}
                            </td>
                            <td className="py-4 px-2 text-right font-black text-lg">{formatAmount(s.total_amount)} RWF</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {detailedLog?.sales && detailedLog.sales.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={5} className="pt-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
                              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border-2 border-emerald-200 text-right min-w-[220px]">
                                <div className="text-xs text-emerald-700 font-bold uppercase">Received (Cash + Paid Credit)</div>
                                <div className="text-xl font-black text-emerald-800">{formatAmount(paymentTotals.received)} RWF</div>
                              </div>

                              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border-2 border-amber-200 text-right min-w-[220px]">
                                <div className="text-xs text-amber-700 font-bold uppercase">Unpaid Credit</div>
                                <div className="text-xl font-black text-amber-800">{formatAmount(paymentTotals.unpaid)} RWF</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </section>

              {/* SECTION: STOCK UPDATES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t">
                {/* STOCK IN TABLE */}
                <section className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600">
                    <ArrowDownToLine className="h-5 w-5" /> Inventory Inbound
                  </h3>
                  {detailedLog?.additions && detailedLog.additions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-emerald-700 font-bold uppercase text-xs text-left border-b-2 border-emerald-200">
                            <th className="pb-3 px-2">Product</th>
                            <th className="pb-3 px-2">Brand</th>
                            <th className="pb-3 px-2 text-right">Quantity Added</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100">
                          {detailedLog.additions.map((a: any, idx: number) => (
                            <tr key={idx} className="hover:bg-emerald-50 transition-colors">
                              <td className="py-3 px-2 font-bold">{a.products?.name || 'Unknown Product'}</td>
                              <td className="py-3 px-2 text-slate-600">{a.products?.brand || 'N/A'}</td>
                              <td className="py-3 px-2 text-right font-black text-emerald-700">+{a.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ArrowDownToLine className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-medium">No restocks today</p>
                    </div>
                  )}
                </section>

                {/* LOW STOCK TABLE */}
                <section className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="h-5 w-5" /> Restock Urgently
                  </h3>
                  {detailedLog?.lowStock && detailedLog.lowStock.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-rose-700 font-bold uppercase text-xs text-left border-b-2 border-rose-200">
                            <th className="pb-3 px-2">Product</th>
                            <th className="pb-3 px-2">Brand</th>
                            <th className="pb-3 px-2 text-right">Stock Left</th>
                            <th className="pb-3 px-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100">
                          {detailedLog.lowStock.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-rose-50 transition-colors">
                              <td className="py-3 px-2 font-bold">{p.name}</td>
                              <td className="py-3 px-2 text-slate-600">{p.brand || 'N/A'}</td>
                              <td className="py-3 px-2 text-right font-black text-rose-700">{p.quantity}</td>
                              <td className="py-3 px-2 text-center">
                                <Badge 
                                  variant={p.quantity === 0 ? "destructive" : "secondary"} 
                                  className={`font-black text-xs ${
                                    p.quantity === 0 
                                      ? "bg-red-600 text-white" 
                                      : "bg-amber-500 text-white"
                                  }`}
                                >
                                  {p.quantity === 0 ? "OUT" : "LOW"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-medium">All stock levels healthy</p>
                    </div>
                  )}
                </section>
              </div>

              {/* SIGNATURES */}
              <div className="pt-24 grid grid-cols-2 gap-20 text-center">
                <div className="space-y-4">
                  <div className="h-px bg-slate-200 w-full"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Manager</p>
                </div>
                <div className="space-y-4">
                  <div className="h-px bg-slate-200 w-full"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Proprietor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
          
          {/* Transaction Details Dialog */}
          <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Transaction Details
                </DialogTitle>
                <DialogDescription>
                  Complete information about this transaction
                </DialogDescription>
              </DialogHeader>
              
              {selectedTransaction && (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Date & Time</p>
                      <p className="text-lg font-bold">
                        {new Date(selectedTransaction.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Invoice #</p>
                      <p className="text-lg font-bold">{selectedTransaction.invoice_number || selectedTransaction.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Customer</p>
                    <p className="text-lg font-bold">{selectedTransaction.customers?.name || "Cash Customer"}</p>
                    {selectedTransaction.customers?.phone && (
                      <p className="text-sm text-muted-foreground">{selectedTransaction.customers.phone}</p>
                    )}
                    {selectedTransaction.customers?.tin_number && (
                      <p className="text-sm text-muted-foreground">TIN: {selectedTransaction.customers.tin_number}</p>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-3">Items</p>
                    <div className="space-y-2">
                      {selectedTransaction.stock_out_items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <p className="font-medium">{item.product?.name || item.products?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.product?.brand || item.products?.brand}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">Qty: <span className="font-bold">{item.quantity}</span></p>
                            <p className="text-sm">Price: <span className="font-bold">{formatAmount(item.selling_price)} RWF</span></p>
                            <p className="text-sm font-bold text-primary">
                              {formatAmount((item.quantity || 0) * (item.selling_price || 0))} RWF
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Totals */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Payment Type</p>
                      <div className="mt-2">
                        {selectedTransaction.payment_type === 'CASH' ? (
                          <Badge className="bg-emerald-500 text-white font-bold">CASH</Badge>
                        ) : selectedTransaction.is_credit_paid ? (
                          <Badge className="bg-green-600 text-white font-bold">PAID CREDIT</Badge>
                        ) : (
                          <Badge className="bg-amber-500 text-white font-bold">CREDIT</Badge>
                        )}
                      </div>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Total Amount</p>
                      <p className="text-2xl font-black text-primary mt-2">{formatAmount(selectedTransaction.total_amount)} RWF</p>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedTransaction.notes && (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <p className="text-xs text-muted-foreground font-semibold uppercase mb-2">Notes</p>
                      <p className="text-sm">{selectedTransaction.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <CustomerDetailsDialog customerId={selectedCustomerId} open={dialogOpen} onOpenChange={(o) => { if (!o) setSelectedCustomerId(null); setDialogOpen(o) }} />
        </>
      )}

      {/* WEEKLY REPORT */}
      {weeklyReport && (
        <div id="printable-report" className="bg-white border shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:border-none">
          <div className="bg-slate-900 text-white p-12 text-center space-y-4 print:bg-slate-900 print:p-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Kivu Quality Sheet Ltd</h2>
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <Receipt className="h-3 w-3" /> Weekly Operations Report
            </div>
            <p className="text-slate-400 font-mono text-sm">
              {weeklyReport.startDate} to {weeklyReport.endDate}
            </p>
            {currentUserRole === 'BOSS' && selectedManagerId !== "all" && (
              <p className="text-slate-400 font-mono text-sm">Manager: {selectedManagerName}</p>
            )}
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {/* Weekly Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-emerald-50 p-6 rounded-xl border-2 border-emerald-200">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Total Cash</p>
                <p className="text-lg font-black">{formatAmount(weeklyReport.totalCash)} RWF</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
                <p className="text-xs font-bold text-amber-600 uppercase mb-2">Total Credit</p>
                <p className="text-lg font-black">{formatAmount(weeklyReport.totalCredit)} RWF</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Net Profit</p>
                <p className="text-lg font-black">{formatAmount(weeklyReport.totalProfit)} RWF</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                <p className="text-xs font-bold text-purple-600 uppercase mb-2">Units Sold</p>
                <p className="text-lg font-black">{weeklyReport.totalUnits}</p>
              </div>
            </div>

            {/* Daily Breakdown */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-4">
                <Calendar className="h-5 w-5 text-primary" /> Daily Breakdown
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-xs text-left border-b">
                    <th className="pb-4">Day</th>
                    <th className="pb-4 text-right">Cash</th>
                    <th className="pb-4 text-right">Credit</th>
                    <th className="pb-4 text-right">Profit</th>
                    <th className="pb-4 text-right">Units</th>
                    <th className="pb-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyReport.dayBreakdown.map((day: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-4 font-bold">{day.date}</td>
                      <td className="py-4 text-right text-emerald-600">{formatAmount(day.cash)}</td>
                      <td className="py-4 text-right text-amber-600">{formatAmount(day.credit)}</td>
                      <td className="py-4 text-right text-blue-600">{formatAmount(day.profit)}</td>
                      <td className="py-4 text-right">{day.units}</td>
                      <td className="py-4 text-right font-black">{formatAmount(day.total)} RWF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT */}
      {monthlyReport && (
        <div id="printable-report" className="bg-white border shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:border-none">
          <div className="bg-slate-900 text-white p-12 text-center space-y-4 print:bg-slate-900 print:p-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Kivu Quality Sheet Ltd</h2>
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              <Receipt className="h-3 w-3" /> Monthly Operations Report
            </div>
            <p className="text-slate-400 font-mono text-sm">
              {monthlyReport.startDate} to {monthlyReport.endDate}
            </p>
            {currentUserRole === 'BOSS' && selectedManagerId !== "all" && (
              <p className="text-slate-400 font-mono text-sm">Manager: {selectedManagerName}</p>
            )}
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {/* Monthly Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-emerald-50 p-6 rounded-xl border-2 border-emerald-200">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Total Cash</p>
                <p className="text-xl font-black">{formatAmount(monthlyReport.totalCash)} RWF</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
                <p className="text-xs font-bold text-amber-600 uppercase mb-2">Total Credit</p>
                <p className="text-xl font-black">{formatAmount(monthlyReport.totalCredit)} RWF</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Net Profit</p>
                <p className="text-xl font-black">{formatAmount(monthlyReport.totalProfit)} RWF</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                <p className="text-xs font-bold text-purple-600 uppercase mb-2">Units Sold</p>
                <p className="text-xl font-black">{monthlyReport.totalUnits}</p>
              </div>
            </div>

            {/* Weekly Breakdown */}
            <section className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-4">
                <Calendar className="h-5 w-5 text-primary" /> Weekly Breakdown
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-xs text-left border-b">
                    <th className="pb-4">Week</th>
                    <th className="pb-4 text-right">Cash</th>
                    <th className="pb-4 text-right">Credit</th>
                    <th className="pb-4 text-right">Profit</th>
                    <th className="pb-4 text-right">Units</th>
                    <th className="pb-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyReport.weekBreakdown.map((week: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-4 font-bold">{week.weekLabel}</td>
                      <td className="py-4 text-right text-emerald-600">{formatAmount(week.cash)}</td>
                      <td className="py-4 text-right text-amber-600">{formatAmount(week.credit)}</td>
                      <td className="py-4 text-right text-blue-600">{formatAmount(week.profit)}</td>
                      <td className="py-4 text-right">{week.units}</td>
                      <td className="py-4 text-right font-black">{formatAmount(week.total)} RWF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      )}

      {/* THE PRINT ENGINE */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #printable-report, #printable-report * {
            visibility: visible !important;
          }

          #printable-report {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            z-index: 9999999 !important;
          }

          .bg-slate-900 {
            background-color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            color: white !important;
          }

          .bg-emerald-500, .bg-amber-500 {
            -webkit-print-color-adjust: exact !important;
          }

          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, icon, color, isCurrency = true }: any) {
  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border-2 border-white/20 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className={`p-3 w-fit rounded-2xl ${color} text-white mb-4 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{title}</p>
      <p className="text-2xl lg:text-3xl font-black text-slate-900 leading-none flex items-center">
        {isCurrency ? (value || 0).toLocaleString() : value}
        {isCurrency && <span className="text-sm font-medium text-slate-400 ml-2">RWF</span>}
      </p>
    </div>
  )
}