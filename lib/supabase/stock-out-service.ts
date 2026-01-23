import { createClient } from './client'
import type { Product, StockOutTransaction } from '@/lib/types'

const supabase = createClient()

export interface StockOutItem {
  product_id: string
  quantity: number
  unit_type: 'box' | 'piece'
  selling_price: number
}

export interface StockOutData {
  customer_name?: string
  customer_phone?: string
  items: StockOutItem[]
  payment_method: 'cash' | 'credit'
  notes?: string
}

export async function processStockOut(data: StockOutData) {
  try {
    // Get all products for validation
    const productIds = data.items.map(item => item.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)

    if (productsError) throw productsError
    if (!products || products.length !== productIds.length) {
      throw new Error('Some products not found')
    }

    // Validate stock availability using new logic
    for (const item of data.items) {
      const product = products.find(p => p.id === item.product_id)
      if (!product) throw new Error(`Product ${item.product_id} not found`)

      if (item.unit_type === 'box') {
        // WHOLESALE: Only check boxes_in_stock
        if (product.boxes_in_stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.boxes_in_stock} boxes`)
        }
      } else {
        // RETAIL: Check available pieces (open + boxes that can be opened)
        const availablePieces = product.open_box_pieces + (product.boxes_in_stock * product.pieces_per_box)
        if (availablePieces < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${availablePieces} pieces`)
        }
      }
    }

    // Process transaction using stock_transactions table
    const { data: transaction, error: transactionError } = await supabase
      .from('stock_transactions')
      .insert({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        total_amount: data.items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0),
        payment_method: data.payment_method,
        type: 'OUT',
        notes: data.notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Process each item with new stock logic
    for (const item of data.items) {
      const product = products.find(p => p.id === item.product_id)!
      
      // Insert transaction item
      const { error: itemError } = await supabase
        .from('stock_out_items')
        .insert({
          transaction_id: transaction.id,
          product_id: item.product_id,
          quantity: item.quantity,
          selling_price: item.selling_price,
          buying_price: item.unit_type === 'box' ? product.buy_price_per_box : product.buy_price_per_piece
        })

      if (itemError) throw itemError

      // Update product stock using new logic
      let newBoxesInStock = product.boxes_in_stock
      let newOpenBoxPieces = product.open_box_pieces

      if (item.unit_type === 'box') {
        // WHOLESALE: Only deduct boxes
        newBoxesInStock -= item.quantity
        // open_box_pieces unchanged
      } else {
        // RETAIL: Deduct pieces with box opening logic
        let piecesToDeduct = item.quantity
        
        if (newOpenBoxPieces >= piecesToDeduct) {
          // Case A: Enough open pieces
          newOpenBoxPieces -= piecesToDeduct
        } else {
          // Case B: Not enough open pieces
          const remaining = piecesToDeduct - newOpenBoxPieces
          
          // Use remaining open pieces
          newOpenBoxPieces = 0
          
          // Open ONE new box
          if (newBoxesInStock > 0) {
            newBoxesInStock -= 1
            newOpenBoxPieces = product.pieces_per_box
            
            // Deduct remaining pieces
            newOpenBoxPieces -= remaining
          } else {
            throw new Error(`Cannot open box - no boxes in stock for ${product.name}`)
          }
        }
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({
          boxes_in_stock: newBoxesInStock,
          open_box_pieces: newOpenBoxPieces
        })
        .eq('id', item.product_id)

      if (updateError) throw updateError
    }

    return { success: true, transaction }
  } catch (error) {
    console.error('Stock out error:', error)
    throw error
  }
}

export const stockOutService = {
  processStockOut,
  getStockOuts: async (options?: { includeDeleted?: boolean }) => {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select(`
        *,
        customers(*),
        stock_out_items(
          *,
          products(name, brand)
        )
      `)
      .eq('type', 'OUT')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },
  getDailySalesSummary: async (date: Date) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .eq('type', 'OUT')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())

    if (error) throw error

    const transactions = data || []
    return {
      totalCash: transactions.filter(t => t.payment_method === 'cash').reduce((sum, t) => sum + (t.total_amount || 0), 0),
      totalCredit: transactions.filter(t => t.payment_method === 'credit').reduce((sum, t) => sum + (t.total_amount || 0), 0),
      totalProfit: 0,
      totalUnits: transactions.length,
      transactionCount: transactions.length
    }
  },
  createAdvancedStockOut: async (data: {
    customer_id?: string
    customer?: any
    phone?: string | null
    payment_type: 'CASH' | 'CREDIT'
    items: Array<{
      product_id: string
      quantity: number
      unit_type: 'pieces' | 'boxes'
      selling_price: number
      buying_price: number
    }>
    notes?: string
  }) => {
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`
      
      // Calculate total amount
      const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0)
      
      // Create customer if needed
      let customerId = data.customer_id
      if (!customerId && data.customer && data.customer.name) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: data.customer.name,
            phone: data.customer.phone,
            tin_number: data.customer.tin_number
          })
          .select()
          .single()
        
        if (customerError) throw customerError
        customerId = newCustomer.id
      }
      
      // Create transaction using stock_transactions table
      const { data: transaction, error: transactionError } = await supabase
        .from('stock_transactions')
        .insert({
          customer_id: customerId,
          customer_name: data.customer?.name,
          phone: data.phone,
          total_amount: totalAmount,
          payment_method: data.payment_type.toLowerCase(),
          payment_type: data.payment_type,
          type: 'OUT',
          invoice_number: invoiceNumber,
          notes: data.notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (transactionError) throw transactionError
      
      // Create transaction items and update stock
      for (const item of data.items) {
        // Insert transaction item
        const { error: itemError } = await supabase
          .from('stock_out_items')
          .insert({
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.quantity,
            selling_price: item.selling_price,
            buying_price: item.buying_price
          })
        
        if (itemError) throw itemError
        
        // Get product for stock update
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.product_id)
          .single()
        
        if (productError) throw productError
        
        // Update product stock using new logic
        let newBoxesInStock = product.boxes_in_stock
        let newOpenBoxPieces = product.open_box_pieces
        
        if (item.unit_type === 'boxes') {
          // WHOLESALE: Only deduct boxes
          newBoxesInStock -= item.quantity
          // open_box_pieces unchanged
        } else {
          // RETAIL: Deduct pieces with box opening logic
          let piecesToDeduct = item.quantity
          
          if (newOpenBoxPieces >= piecesToDeduct) {
            // Case A: Enough open pieces
            newOpenBoxPieces -= piecesToDeduct
          } else {
            // Case B: Not enough open pieces
            const remaining = piecesToDeduct - newOpenBoxPieces
            
            // Use remaining open pieces
            newOpenBoxPieces = 0
            
            // Open ONE new box
            if (newBoxesInStock > 0) {
              newBoxesInStock -= 1
              newOpenBoxPieces = product.pieces_per_box
              
              // Deduct remaining pieces
              newOpenBoxPieces -= remaining
            } else {
              throw new Error(`Cannot open box - no boxes in stock for ${product.name}`)
            }
          }
        }
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            boxes_in_stock: newBoxesInStock,
            open_box_pieces: newOpenBoxPieces
          })
          .eq('id', item.product_id)
        
        if (updateError) throw updateError
      }
      
      // Create credit record if payment type is CREDIT
      if (data.payment_type === 'CREDIT' && customerId) {
        const { error: creditError } = await supabase
          .from('credits')
          .insert({
            customer_id: customerId,
            customer_name: data.customer?.name,
            customer_phone: data.phone,
            amount_owed: totalAmount,
            amount_paid: 0,
            status: 'PENDING',
            transaction_id: transaction.id,
            is_active: true,
            created_at: new Date().toISOString()
          })
        
        if (creditError) throw creditError
      }
      
      return transaction
    } catch (error) {
      console.error('Advanced stock out error:', error)
      throw error
    }
  },
  safeDeleteTransaction: async (transactionId: string, reason: string) => {
    try {
      // Get transaction with items
      const { data: transaction, error: transactionError } = await supabase
        .from('stock_transactions')
        .select(`
          *,
          stock_out_items(*)
        `)
        .eq('id', transactionId)
        .single()
      
      if (transactionError) throw transactionError
      
      // Restore stock for each item
      for (const item of transaction.stock_out_items || []) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.product_id)
          .single()
        
        if (productError) continue // Skip if product not found
        
        let newBoxesInStock = product.boxes_in_stock
        let newRemainingPieces = product.remaining_pieces || 0
        
        // Restore stock (reverse the deduction logic)
        newRemainingPieces += item.quantity
        
        // Convert excess pieces to boxes if needed
        const piecesPerBox = product.pieces_per_box || 1
        if (newRemainingPieces >= piecesPerBox) {
          const boxesToAdd = Math.floor(newRemainingPieces / piecesPerBox)
          newBoxesInStock += boxesToAdd
          newRemainingPieces = newRemainingPieces % piecesPerBox
        }
        
        await supabase
          .from('products')
          .update({
            boxes_in_stock: newBoxesInStock,
            remaining_pieces: newRemainingPieces
          })
          .eq('id', item.product_id)
      }
      
      // Delete related credit if exists
      await supabase
        .from('credits')
        .delete()
        .eq('transaction_id', transactionId)
      
      // Delete transaction items
      await supabase
        .from('stock_out_items')
        .delete()
        .eq('transaction_id', transactionId)
      
      // Delete transaction
      const { error: deleteError } = await supabase
        .from('stock_transactions')
        .delete()
        .eq('id', transactionId)
      
      if (deleteError) throw deleteError
      
      return { success: true }
    } catch (error) {
      console.error('Delete transaction error:', error)
      throw error
    }
  }
}