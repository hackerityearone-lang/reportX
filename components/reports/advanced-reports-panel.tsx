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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 p-4">
      {/* 1. TOP UI BAR - HIDDEN ON PRINT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Intelligence Reports</h1>
          <p className="text-slate-500 mt-2 font-medium">Verify your business performance and inventory health</p>
        </div>
        <Button 
          size="lg"
          className="rounded-full px-8 shadow-xl bg-primary hover:bg-primary/90 transition-all" 
          onClick={() => window.print()} 
          disabled={!dailyReport && !weeklyReport && !monthlyReport}
        >
          <Printer className="h-5 w-5 mr-2" /> Print Official PDF
        </Button>
      </div>

      {/* 2. TAB CONTROLS - HIDDEN ON PRINT */}
      <div className="print:hidden space-y-6">
        <Tabs defaultValue="daily" className="w-full" onValueChange={setReportType}>
          <TabsList className="bg-slate-100 p-1 rounded-full w-full max-w-md mx-auto grid grid-cols-3">
            <TabsTrigger value="daily" className="rounded-full">Daily Audit</TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-full">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-full">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="pt-6 space-y-4">
            {/* Manager Selector - Only show for BOSS */}
            {currentUserRole === 'BOSS' && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Select Manager
                </Label>
                <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
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

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">
                  Select Date {reportType !== "daily" && `(Any date in the ${reportType === "weekly" ? "week" : "month"})`}
                </Label>
                <Input type="date" value={reportDate} className="rounded-xl" onChange={(e) => setReportDate(e.target.value)} />
              </div>
              <Button onClick={handleGenerateAudit} disabled={isLoading} className="rounded-xl px-8 h-11">
                {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
              <SummaryCard title="Cash Income" value={dailyReport.total_cash_income} icon={<DollarSign />} color="bg-emerald-500" />
              <SummaryCard title="Net Profit" value={dailyReport.total_profit} icon={<TrendingUp />} color="bg-blue-500" />
              <SummaryCard title="Units Sold" value={dailyReport.total_units_sold} icon={<Package />} color="bg-slate-800" isCurrency={false} />
              <SummaryCard title="Low Stock" value={detailedLog?.lowStock?.length || 0} icon={<AlertTriangle />} color="bg-rose-500" isCurrency={false} />
            </div>

            {/* Payment Summary */}
            {detailedLog?.sales && (
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
                    <SummaryCard title="Income (Total)" value={totalRevenue} icon={<Receipt />} color="bg-sky-600" />
                    <SummaryCard title="Cash" value={cashTotal} icon={<DollarSign />} color="bg-emerald-500" />
                    <SummaryCard title="Paid Credit" value={paidCreditTotal} icon={<CheckCircle2 />} color="bg-green-600" />
                    <SummaryCard title="Unpaid Credit" value={unpaidCreditTotal} icon={<AlertTriangle />} color="bg-amber-500" />
                  </div>
                )
              })()
            )}

          {/* THE ACTUAL PRINTABLE DOCUMENT */}
          <div id="printable-report" className="bg-white border shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:border-none">
            
            {/* DOCUMENT HEADER */}
            <div className="bg-slate-900 text-white p-12 text-center space-y-4 print:bg-slate-900 print:p-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Kivu Quality Sheet Ltd</h2>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                <Receipt className="h-3 w-3" /> Daily Operations Audit
              </div>
              <p className="text-slate-400 font-mono text-sm">Date: {reportDate}</p>
              {currentUserRole === 'BOSS' && selectedManagerId !== "all" && (
                <p className="text-slate-400 font-mono text-sm">Manager: {selectedManagerName}</p>
              )}
              {currentUserRole === 'BOSS' && selectedManagerId === "all" && (
                <p className="text-slate-400 font-mono text-sm">All Managers Combined</p>
              )}
            </div>

            <div className="p-8 md:p-12 space-y-12">
              
              {/* SECTION: SALES LOG WITH PAYMENT TYPE */}
              <section className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-4">
                  <Clock className="h-5 w-5 text-primary" /> Sales Dispatch Log
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase text-[10px] text-left border-b">
                      <th className="pb-4">Time</th>
                      <th className="pb-4">Customer</th>
                      <th className="pb-4">Items Detailed</th>
                      <th className="pb-4 text-center">Payment</th>
                      <th className="pb-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailedLog?.sales?.map((s: any, idx: number) => (
                      <tr
                        key={idx}
                        className="transition-colors hover:bg-slate-50 cursor-pointer print:cursor-default"
                      >
                        <td className="py-4 font-mono text-xs text-slate-500">
                           {new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="py-4 font-bold">
                          {s.customers?.id ? (
                            <button
                              onClick={() => {
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
                        <td className="py-4">
                          <div className="flex flex-col text-sm">
                            {s.stock_out_items?.map((item: any, i: number) => (
                              <div key={i} className="py-1">
                                {item.products?.name} x{item.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          {s.payment_type === 'CASH' ? (
                            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">CASH</Badge>
                          ) : s.is_credit_paid ? (
                            <Badge className="bg-green-600 text-white hover:bg-green-700">credit paid</Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white hover:bg-amber-600">CREDIT</Badge>
                          )}
                        </td>
                        <td className="py-4 text-right font-black">{formatAmount(s.total_amount)} RWF</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-right min-w-[220px]">
                            <div className="text-xs text-slate-500">Received (Cash + Paid Credit)</div>
                            <div className="text-lg font-black">{formatAmount(paymentTotals.received)} RWF</div>
                          </div>

                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-right min-w-[220px]">
                            <div className="text-xs text-amber-700">Unpaid Credit</div>
                            <div className="text-lg font-black text-amber-700">{formatAmount(paymentTotals.unpaid)} RWF</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </section>

              {/* SECTION: STOCK UPDATES */}
              <div className="grid grid-cols-2 gap-12 pt-6 border-t">
                {/* STOCK IN */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600">
                    <ArrowDownToLine className="h-5 w-5" /> Inventory Inbound
                  </h3>
                  {detailedLog?.additions?.map((a: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm">
                      <span className="font-bold">{a.products?.name}</span>
                      <span className="font-black text-emerald-700">+{a.quantity}</span>
                    </div>
                  ))}
                  {detailedLog?.additions?.length === 0 && <p className="text-slate-400 text-xs italic text-center">No restocks today</p>}
                </div>

                {/* LOW STOCK */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-rose-600">
                    <AlertTriangle className="h-5 w-5" /> Restock Urgently
                  </h3>
                  {detailedLog?.lowStock?.map((p: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm">
                      <span className="font-bold">{p.name}</span>
                      <Badge variant="destructive" className="font-black">{p.quantity} LEFT</Badge>
                    </div>
                  ))}
                  {detailedLog?.lowStock?.length === 0 && <p className="text-slate-400 text-xs italic text-center">All stock levels healthy</p>}
                </div>
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
          
          <CustomerDetailsDialog customerId={selectedCustomerId} open={dialogOpen} onOpenChange={(o) => { if (!o) setSelectedCustomerId(null); setDialogOpen(o) }} />
        </>
      )}

      {/* WEEKLY REPORT */}
      {weeklyReport && (
        <div id="printable-report" className="bg-white border shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:border-none">
          <div className="bg-slate-900 text-white p-12 text-center space-y-4 print:bg-slate-900 print:p-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Kivu Quality Sheet Ltd</h2>
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
                <p className="text-3xl font-black">{formatAmount(weeklyReport.totalCash)} RWF</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
                <p className="text-xs font-bold text-amber-600 uppercase mb-2">Total Credit</p>
                <p className="text-3xl font-black">{formatAmount(weeklyReport.totalCredit)} RWF</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Net Profit</p>
                <p className="text-3xl font-black">{formatAmount(weeklyReport.totalProfit)} RWF</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                <p className="text-xs font-bold text-purple-600 uppercase mb-2">Units Sold</p>
                <p className="text-3xl font-black">{weeklyReport.totalUnits}</p>
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
                <p className="text-3xl font-black">{formatAmount(monthlyReport.totalCash)} RWF</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-xl border-2 border-amber-200">
                <p className="text-xs font-bold text-amber-600 uppercase mb-2">Total Credit</p>
                <p className="text-3xl font-black">{formatAmount(monthlyReport.totalCredit)} RWF</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                <p className="text-xs font-bold text-blue-600 uppercase mb-2">Net Profit</p>
                <p className="text-3xl font-black">{formatAmount(monthlyReport.totalProfit)} RWF</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
                <p className="text-xs font-bold text-purple-600 uppercase mb-2">Units Sold</p>
                <p className="text-3xl font-black">{monthlyReport.totalUnits}</p>
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
  )
}

function SummaryCard({ title, value, icon, color, isCurrency = true }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
      <div className={`p-2 w-fit rounded-2xl ${color} text-white mb-4`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 leading-none flex items-center">
        {isCurrency ? (value || 0).toLocaleString() : value}
        {isCurrency && <span className="text-sm font-medium text-slate-400 ml-1">RWF</span>}
      </p>
    </div>
  )
}