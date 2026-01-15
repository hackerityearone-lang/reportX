"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Banknote, 
  CreditCard, 
  Printer,
  Receipt
} from "lucide-react"
import { useState } from "react"
import type { StockTransaction, Product, Customer } from "@/lib/types"

interface StockOutItem {
  id: string
  product_id: string
  quantity: number
  selling_price: number
  products?: { name: string; brand?: string }
  product?: { name: string; brand?: string }
}

interface EnhancedStockTransaction extends StockTransaction {
  stock_out_items?: StockOutItem[]
  customers?: Customer | null
  product?: Product | null 
}

interface RecentStockOutProps {
  transactions: EnhancedStockTransaction[]
}

function InvoiceModal({ 
  transaction, 
  isOpen, 
  onClose 
}: { 
  transaction: EnhancedStockTransaction
  isOpen: boolean
  onClose: () => void
}) {
  const date = new Date(transaction.created_at)
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const items = (transaction.stock_out_items && transaction.stock_out_items.length > 0) 
    ? transaction.stock_out_items 
    : transaction.product ? [{
        id: 'legacy',
        quantity: transaction.quantity || 1,
        selling_price: transaction.selling_price || (transaction.total_amount / (transaction.quantity || 1)),
        product: transaction.product,
        products: transaction.product
      }] : [];

  const handlePrint = () => {
    const printContents = document.getElementById('printable-invoice')?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${transaction.invoice_number || transaction.id.slice(0,8).toUpperCase()}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 20px;
              background: white;
            }
            @media print {
              body { padding: 0; }
              @page { margin: 0.5in; size: A4; }
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Official Invoice</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button 
            onClick={handlePrint} 
            className="gap-2 bg-slate-900 text-white"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>

        <div id="printable-invoice" style={{
          backgroundColor: 'white',
          color: 'black',
          padding: '40px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '4px solid black',
            paddingBottom: '24px',
            marginBottom: '32px'
          }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '4px' }}>INVOICE</h1>
              <p style={{ 
                fontFamily: 'monospace', 
                fontSize: '14px', 
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                #{transaction.invoice_number || transaction.id.slice(0,8).toUpperCase()}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{formattedDate}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>
                Kivu Quality Sheet Ltd
              </h2>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#4b5563' }}>Kigali, Rwanda</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>+250 788 000 000</p>
            </div>
          </div>

          {/* Customer */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{ 
              fontSize: '10px', 
              fontWeight: '900', 
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '4px'
            }}>
              Bill To:
            </p>
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {transaction.customers?.name || "Cash Customer"}
            </p>
            {transaction.customers?.phone && (
              <p style={{ fontSize: '14px', color: '#4b5563' }}>{transaction.customers.phone}</p>
            )}
          </div>

          {/* Table */}
          <table style={{ width: '100%', marginBottom: '40px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid black',
                textAlign: 'left'
              }}>
                <th style={{ 
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase'
                }}>
                  Product Description
                </th>
                <th style={{ 
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  textAlign: 'center'
                }}>
                  Qty
                </th>
                <th style={{ 
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  textAlign: 'right'
                }}>
                  Price
                </th>
                <th style={{ 
                  padding: '8px 0',
                  fontSize: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  textAlign: 'right'
                }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px 0' }}>
                    <p style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {item.products?.name || item.product?.name || transaction.product?.name || "Product"}
                    </p>
                    {(item.products?.brand || item.product?.brand) && (
                      <p style={{ fontSize: '10px', color: '#9ca3af' }}>
                        {item.products?.brand || item.product?.brand}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'center', fontWeight: '500' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right' }}>
                    {(item.selling_price || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: '900' }}>
                    {((item.quantity || 0) * (item.selling_price || 0)).toLocaleString()} RWF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            paddingTop: '24px',
            borderTop: '4px solid black'
          }}>
            <div style={{ width: '256px' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '24px',
                fontWeight: '900'
              }}>
                <span>TOTAL:</span>
                <span>{(transaction.total_amount || 0).toLocaleString()} RWF</span>
              </div>
              <p style={{ 
                textAlign: 'right',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#9ca3af',
                textTransform: 'uppercase',
                marginTop: '8px'
              }}>
                Payment Type: {transaction.payment_type}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            marginTop: '96px',
            paddingTop: '32px',
            borderTop: '1px dashed #d1d5db',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '12px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Kivu Quality Sheet Ltd
            </p>
            <p style={{ 
              fontSize: '9px',
              color: '#9ca3af',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Generated via ReportX Management System
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RecentStockOut({ transactions }: RecentStockOutProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<EnhancedStockTransaction | null>(null)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Receipt className="text-primary"/> Recent Sales
      </h2>
      <div className="grid gap-3">
        {transactions.map((t) => (
          <Card 
            key={t.id} 
            className="hover:bg-slate-50 cursor-pointer transition-all border-none shadow-sm" 
            onClick={() => setSelectedTransaction(t)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  t.payment_type === 'CASH' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  {t.payment_type === 'CASH' ? <Banknote size={20}/> : <CreditCard size={20}/>}
                </div>
                <div>
                  <p className="font-bold text-sm">{t.customers?.name || "Walk-in Customer"}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="font-black text-slate-900">
                {t.total_amount.toLocaleString()} RWF
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTransaction && (
        <InvoiceModal 
          transaction={selectedTransaction} 
          isOpen={!!selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}
    </div>
  )
}