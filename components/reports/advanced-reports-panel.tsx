"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, Printer, Loader2, TrendingUp, 
  Package, DollarSign, Clock, AlertTriangle, Receipt, ArrowDownToLine
} from "lucide-react"
import type { DailyReport } from "@/lib/types"
import { reportsService } from "@/lib/supabase/reports-service"

export function AdvancedReportsPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [reportType, setReportType] = useState("daily")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0])
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [detailedLog, setDetailedLog] = useState<any>(null)

  const handleGenerateAudit = async () => {
    setIsLoading(true)
    try {
      const date = new Date(reportDate)
      const report = await reportsService.getDailyReport(date)
      const audit = await reportsService.getDetailedDailyLog(date)
      setDailyReport(report)
      setDetailedLog(audit)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

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
          disabled={!dailyReport}
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
          <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Select Date</Label>
              <Input type="date" value={reportDate} className="rounded-xl" onChange={(e) => setReportDate(e.target.value)} />
            </div>
            <Button onClick={handleGenerateAudit} disabled={isLoading} className="rounded-xl px-8 h-11">
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              Generate {reportType} Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {dailyReport && (
        <div className="space-y-8">
          {/* 3. SUMMARY CARDS - HIDDEN ON PRINT */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
            <SummaryCard title="Cash Income" value={dailyReport.total_cash_income} icon={<DollarSign />} color="bg-emerald-500" />
            <SummaryCard title="Net Profit" value={dailyReport.total_profit} icon={<TrendingUp />} color="bg-blue-500" />
            <SummaryCard title="Units Sold" value={dailyReport.total_units_sold} icon={<Package />} color="bg-slate-800" isCurrency={false} />
            <SummaryCard title="Low Stock" value={detailedLog?.lowStock?.length || 0} icon={<AlertTriangle />} color="bg-rose-500" isCurrency={false} />
          </div>

          {/* 4. THE ACTUAL PRINTABLE DOCUMENT */}
          <div id="printable-report" className="bg-white border shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:border-none">
            
            {/* DOCUMENT HEADER */}
            <div className="bg-slate-900 text-white p-12 text-center space-y-4 print:bg-slate-900 print:p-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter">Kivu Quality Sheet Ltd</h2>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                <Receipt className="h-3 w-3" /> {reportType} Operations Audit
              </div>
              <p className="text-slate-400 font-mono text-sm">Date: {reportDate}</p>
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
                      <tr key={idx}>
                        <td className="py-4 font-mono text-xs text-slate-500">
                           {new Date(s.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="py-4 font-bold">{s.customers?.name || "Cash Customer"}</td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1">
                            {s.stock_out_items?.map((item: any, i: number) => (
                              <span key={i} className="bg-slate-50 border px-2 py-0.5 rounded text-[10px]">
                                {item.products?.name} x{item.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          {s.payment_type === 'CASH' ? (
                            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">CASH</Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white hover:bg-amber-600">CREDIT</Badge>
                          )}
                        </td>
                        <td className="py-4 text-right font-black">{s.total_amount.toLocaleString()} RWF</td>
                      </tr>
                    ))}
                  </tbody>
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
      <p className="text-2xl font-black text-slate-900 leading-none">
        {isCurrency ? (value || 0).toLocaleString() : value}
        {isCurrency && <span className="text-xs font-medium text-slate-400 ml-1 text-sm">RWF</span>}
      </p>
    </div>
  )
}