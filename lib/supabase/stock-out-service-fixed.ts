import { createClient } from './client'
import type { Product, StockTransaction } from '@/lib/types'

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

/**
 * Convert quantity to pieces for consistent stock calculations
 */
function convertToPieces(quantity: number, unitType: 'box' | 'piece', piecesPerBox: number): number {
  return unitType === 'box' ? quantity * piecesPerBox : quantity
}

/**
 * Validate stock availability using quantity as single source of truth
 */
async function validateStockAvailability(items: StockOutItem[]): Promise<void> {
  const productIds = items.map(item => item.product_id)
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, quantity, pieces_per_box, allow_retail_sales')
    .in('id', productIds)

  if (error) throw error
  if (!products || products.length !== productIds.length) {
    throw new Error('Some products not found')
  }

  for (const item of items) {
    const product = products.find(p => p.id === item.product_id)
    if (!product) throw new Error(`Product ${item.product_id} not found`)

    // Check retail sales permission
    if (item.unit_type === 'piece' && !product.allow_retail_sales) {
      throw new Error(`Retail sales not allowed for ${product.name}`)
    }

    // Convert requested quantity to pieces
    const requestedPieces = convertToPieces(item.quantity, item.unit_type, product.pieces_per_box)
    
    // Check against total available pieces (quantity is source of truth)
    if (requestedPieces > product.quantity) {
      const availableBoxes = Math.floor(product.quantity / product.pieces_per_box)
      const availablePieces = product.quantity % product.pieces_per_box
      throw new Error(
        `Insufficient stock for ${product.name}. ` +
        `Available: ${product.quantity} pieces (${availableBoxes} boxes + ${availablePieces} pieces), ` +
        `Requested: ${requestedPieces} pieces`
      )
    }
  }
}

/**
 * Update product stock using atomic function
 */
async function updateProductStock(productId: string, quantityChange: number, unitType: 'box' | 'piece'): Promise<void> {
  const { error } = await supabase.rpc('update_product_stock', {
    p_product_id: productId,
    p_quantity_change: -quantityChange, // negative for stock out
    p_unit_type: unitType
  })

  if (error) throw error
}

export async function processStockOut(data: StockOutData) {
  try {
    // Step 1: Validate stock availability
    await validateStockAvailability(data.items)

    // Step 2: Create transaction record
    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0)
    
    const { data: transaction, error: transactionError } = await supabase
      .from('stock_transactions')
      .insert({
        customer_name: data.customer_name,
        phone: data.customer_phone,
        total_amount: totalAmount,
        payment_type: data.payment_method.toUpperCase(),
        type: 'OUT', // Use 'type' instead of 'transaction_type'
        notes: data.notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (transactionError) throw transactionError

    // Step 3: Process each item atomically
    for (const item of data.items) {
      // Get product details for pricing
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('buy_price_per_box, buy_price_per_piece, pieces_per_box')
        .eq('id', item.product_id)
        .single()

      if (productError) throw productError

      // Calculate buying price based on unit type
      const buyingPrice = item.unit_type === 'box' 
        ? product.buy_price_per_box 
        : product.buy_price_per_piece

      // Insert transaction item
      const { error: itemError } = await supabase
        .from('stock_out_items')
        .insert({
          transaction_id: transaction.id,
          product_id: item.product_id,
          quantity: item.quantity,
          selling_price: item.selling_price,
          buying_price: buyingPrice
        })

      if (itemError) throw itemError

      // Update stock using atomic function
      await updateProductStock(item.product_id, item.quantity, item.unit_type)
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

  createAdvancedStockOut: async (data: {
    customer_id?: string
    customer?: any
    phone?: string | null
    payment_type: 'CASH' | 'CREDIT'
    items: Array<{
      product_id: string
      quantity: number
      unit_type: 'piece' | 'box'
      selling_price: number
      buying_price: number
    }>
    notes?: string
  }) => {
    try {
      // Validate stock first
      const stockItems: StockOutItem[] = data.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_type: item.unit_type as 'box' | 'piece',
        selling_price: item.selling_price
      }))
      
      await validateStockAvailability(stockItems)

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`
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

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('stock_transactions')
        .insert({
          customer_id: customerId,
          customer_name: data.customer?.name,
          phone: data.phone,
          quantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: totalAmount,
          payment_type: data.payment_type,
          type: 'OUT',
          invoice_number: invoiceNumber,
          notes: data.notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // Process items and update stock
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

        // Update stock atomically
        await updateProductStock(item.product_id, item.quantity, item.unit_type)
      }

      // Create credit record if needed
      if (data.payment_type === 'CREDIT' && customerId) {
        const { error: creditError } = await supabase
          .from('credits')
          .insert({
            customer_id: customerId,
            customer_name: data.customer?.name,
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

      // Restore stock for each item using atomic function
      for (const item of transaction.stock_out_items || []) {
        // Determine unit type from transaction or default to piece
        const unitType = transaction.unit_sold || 'piece'
        
        // Restore stock (positive quantity change)
        await updateProductStock(item.product_id, item.quantity, unitType as 'box' | 'piece')
      }

      // Delete related records
      await supabase.from('credits').delete().eq('transaction_id', transactionId)
      await supabase.from('stock_out_items').delete().eq('transaction_id', transactionId)
      
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
  },

  // Utility function to check stock consistency
  validateStockConsistency: async () => {
    const { data, error } = await supabase.rpc('validate_stock_consistency')
    if (error) throw error
    return data
  }
}