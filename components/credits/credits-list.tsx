// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { createClient } from "@/lib/supabase/client"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { CreditCard, Search, Calendar, CheckCircle, Loader2, Plus } from "lucide-react"
// import { AddCreditDialog } from "./add-credit-dialog"
// import type { Credit, StockTransaction, Product } from "@/lib/types"

// interface CreditsListProps {
//   credits: (Credit & {
//     transaction: (StockTransaction & { product: Product | null }) | null
//   })[]
// }

// export function CreditsList({ credits }: CreditsListProps) {
//   const [search, setSearch] = useState("")
//   const [filter, setFilter] = useState<"all" | "pending" | "paid">("all")
//   const [loadingId, setLoadingId] = useState<string | null>(null)
//   const [addCreditCustomer, setAddCreditCustomer] = useState<{ name: string; amount: number } | null>(null)
//   const router = useRouter()

//   const filteredCredits = credits.filter((credit) => {
//     const matchesSearch = credit.customer_name.toLowerCase().includes(search.toLowerCase())
    
//     const isPaid = credit.status === "PAID"
    
//     const matchesFilter =
//       filter === "all" || 
//       (filter === "pending" && !isPaid) || 
//       (filter === "paid" && isPaid)
      
//     return matchesSearch && matchesFilter
//   })

//   // Group credits by customer to calculate totals
//   const customerCredits = filteredCredits.reduce((acc, credit) => {
//     const customerName = credit.customer_name
//     if (!acc[customerName]) {
//       acc[customerName] = {
//         totalOwed: 0,
//         totalPaid: 0,
//         credits: []
//       }
//     }
//     acc[customerName].totalOwed += credit.amount_owed
//     acc[customerName].totalPaid += credit.amount_paid
//     acc[customerName].credits.push(credit)
//     return acc
//   }, {} as Record<string, { totalOwed: number; totalPaid: number; credits: typeof filteredCredits }>)

//   const handleMarkAsPaid = async (creditId: string) => {
//     setLoadingId(creditId)
//     const supabase = createClient()

//     const credit = credits.find(c => c.id === creditId)
//     if (!credit) return

//     await supabase
//       .from("credits")
//       .update({
//         status: "PAID",
//         amount_paid: credit.amount_owed,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", creditId)

//     router.refresh()
//     setLoadingId(null)
//   }

//   const getStatusBadge = (status: string) => {
//     if (status === "PAID") {
//       return <Badge className="bg-success/20 text-success border-success/30">Paid</Badge>
//     }
//     if (status === "PARTIAL") {
//       return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Partial</Badge>
//     }
//     return <Badge className="bg-warning/20 text-warning-foreground border-warning/30">Pending</Badge>
//   }

//   if (credits.length === 0) {
//     return (
//       <Card>
//         <CardContent className="py-12">
//           <div className="text-center">
//             <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
//             <h3 className="text-lg font-semibold text-foreground mb-2">No credits found</h3>
//             <p className="text-muted-foreground">Credits will appear here when you make credit sales</p>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   return (
//     <>
//       <Card>
//         <CardHeader className="pb-4">
//           <div className="flex flex-col sm:flex-row sm:items-center gap-4">
//             <CardTitle className="text-lg">Credits List</CardTitle>
//             <div className="flex-1 flex flex-col sm:flex-row gap-3">
//               {/* Search */}
//               <div className="relative flex-1 max-w-sm">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search customer..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>

//               {/* Filter */}
//               <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
//                 <TabsList>
//                   <TabsTrigger value="all">All</TabsTrigger>
//                   <TabsTrigger value="pending">Pending</TabsTrigger>
//                   <TabsTrigger value="paid">Paid</TabsTrigger>
//                 </TabsList>
//               </Tabs>
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             {Object.entries(customerCredits).map(([customerName, customerData]) => {
//               const totalRemaining = customerData.totalOwed - customerData.totalPaid
//               const hasUnpaidCredits = totalRemaining > 0
              
//               return (
//                 <Card key={customerName} className="bg-secondary/20">
//                   <CardContent className="p-4">
//                     {/* Customer Header */}
//                     <div className="flex items-center justify-between mb-3">
//                       <div>
//                         <h3 className="font-semibold text-lg">{customerName}</h3>
//                         <p className="text-sm text-muted-foreground">
//                           {customerData.credits.length} credit{customerData.credits.length !== 1 ? 's' : ''}
//                         </p>
//                       </div>
//                       <div className="flex items-center gap-3">
//                         <div className="text-right">
//                           <p className="text-sm text-muted-foreground">Total Remaining</p>
//                           <p className={`text-xl font-bold ${hasUnpaidCredits ? 'text-warning' : 'text-success'}`}>
//                             {totalRemaining.toLocaleString()} RWF
//                           </p>
//                         </div>
//                         {hasUnpaidCredits && (
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => setAddCreditCustomer({ name: customerName, amount: totalRemaining })}
//                             className="gap-2"
//                           >
//                             <Plus className="h-4 w-4" />
//                             Add Credit
//                           </Button>
//                         )}
//                       </div>
//                     </div>

//                     {/* Individual Credits */}
//                     <div className="space-y-2">
//                       {customerData.credits.map((credit) => {
//                         const date = new Date(credit.created_at)
//                         const formattedDate = date.toLocaleDateString("en-GB", {
//                           day: "numeric",
//                           month: "short",
//                           year: "numeric",
//                         })
                        
//                         const isPaid = credit.status === "PAID"
//                         const remainingAmount = credit.amount_owed - credit.amount_paid

//                         return (
//                           <div
//                             key={credit.id}
//                             className="flex items-center justify-between p-3 rounded-lg bg-background/50 border"
//                           >
//                             <div className="flex-1">
//                               <div className="flex items-center gap-2">
//                                 {getStatusBadge(credit.status)}
//                                 <span className="text-sm text-muted-foreground flex items-center gap-1">
//                                   <Calendar className="h-3 w-3" />
//                                   {formattedDate}
//                                 </span>
//                               </div>
//                               {credit.transaction?.product && (
//                                 <p className="text-xs text-muted-foreground mt-1">
//                                   {credit.transaction.product.name} x{credit.transaction.quantity}
//                                 </p>
//                               )}
//                             </div>

//                             <div className="flex items-center gap-4">
//                               <div className="text-right">
//                                 <p className={`font-medium ${isPaid ? "text-success" : "text-warning"}`}>
//                                   {(credit.status === "PARTIAL" ? remainingAmount : credit.amount_owed).toLocaleString()} RWF
//                                 </p>
//                                 {credit.status === "PARTIAL" && (
//                                   <p className="text-xs text-muted-foreground">
//                                     Paid: {credit.amount_paid.toLocaleString()} RWF
//                                   </p>
//                                 )}
//                               </div>

//                               {!isPaid && (
//                                 <Button
//                                   variant="outline"
//                                   size="sm"
//                                   onClick={() => handleMarkAsPaid(credit.id)}
//                                   disabled={loadingId === credit.id}
//                                   className="shrink-0"
//                                 >
//                                   {loadingId === credit.id ? (
//                                     <Loader2 className="h-4 w-4 animate-spin" />
//                                   ) : (
//                                     <>
//                                       <CheckCircle className="h-4 w-4 mr-2" />
//                                       Mark Paid
//                                     </>
//                                   )}
//                                 </Button>
//                               )}
//                             </div>
//                           </div>
//                         )
//                       })}
//                     </div>
//                   </CardContent>
//                 </Card>
//               )
//             })}

//             {Object.keys(customerCredits).length === 0 && (
//               <div className="text-center py-8">
//                 <p className="text-muted-foreground">No credits match your search</p>
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Add Credit Dialog */}
//       <AddCreditDialog
//         customerName={addCreditCustomer?.name || ""}
//         existingCredits={addCreditCustomer?.amount || 0}
//         open={!!addCreditCustomer}
//         onOpenChange={() => setAddCreditCustomer(null)}
//       />
//     </>
//   )
// }