"use client"

import { createClient } from "@/lib/supabase/client"
import type { StockTransaction, StockOutItem, Customer } from "@/lib/types"

const supabase = createClient()

export interface StockOutItemInput {
  product_id: string
  quantity: number
  unit_type: 'pieces' | 'boxes'
  selling_price: number
  buying_price?: number
}

export interface CreateStockOutRequest {
  customer?: Partial<Customer> | null
  customer_id?: string | null
  phone?: string | null
  payment_type: "CASH" | "CREDIT"
  items: StockOutItemInput[]
  notes?: string
}

export const stockOutService = {
  /**
   * Create advanced stock out (invoice with multiple items)
   */
  async createAdvancedStockOut(request: CreateStockOutRequest): Promise<StockTransaction> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Get all products to calculate totals
    const productIds = request.items.map((item) => item.product_id)
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, quantity, price, unit_type, pieces_per_box, remaining_pieces")
      .in("id", productIds)

    if (productError) throw new Error(productError.message)

    const productMap = new Map(products?.map((p) => [p.id, p]) || [])

    // Validate stock availability
    for (const item of request.items) {
      const product = productMap.get(item.product_id)
      if (!product) throw new Error(`Product not found: ${item.product_id}`)
      
      // For box products, check based on unit type
      if (product.unit_type === 'box' && product.pieces_per_box) {
        if (item.unit_type === 'pieces') {
          // Selling pieces - check total available pieces
          const totalPieces = (product.quantity * product.pieces_per_box) + (product.remaining_pieces || 0)
          if (item.quantity > totalPieces) {
            throw new Error(
              `Insufficient stock for ${product.id}. Available: ${totalPieces} pieces, Requested: ${item.quantity} pieces`
            )
          }
        } else {
          // Selling boxes - check box quantity
          if (item.quantity > product.quantity) {
            throw new Error(
              `Insufficient stock for ${product.id}. Available: ${product.quantity} boxes, Requested: ${item.quantity} boxes`
            )
          }
        }
      } else {
        // Regular product - check quantity
        if (item.quantity > product.quantity) {
          throw new Error(
            `Insufficient stock for ${product.id}. Available: ${product.quantity}, Requested: ${item.quantity}`
          )
        }
      }
    }

    // Create or use existing customer (for BOTH cash and credit now)
    let customerId = request.customer_id
    if (!customerId && request.customer && (request.customer.name || request.customer.phone)) {
      // Try to find existing customer by phone
      if (request.customer.phone) {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", request.customer.phone)
          .maybeSingle()

        if (existingCustomer) {
          customerId = existingCustomer.id
        }
      }

      // Create new customer if not found
      if (!customerId && request.customer.name) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            name: request.customer.name,
            phone: request.customer.phone || null,
            tin_number: request.customer.tin_number || null,
            total_credit: 0,
            is_archived: false,
          })
          .select()
          .single()

        if (customerError) throw new Error(customerError.message)
        customerId = newCustomer.id
      }
    }

    // Calculate totals
    let totalAmount = 0
    let totalProfit = 0

    for (const item of request.items) {
      const product = productMap.get(item.product_id)
      const buyingPrice = item.buying_price || (product?.price || 0)
      const subtotal = item.quantity * item.selling_price
      
      // Calculate profit based on unit type
      let profit = 0
      if (product?.unit_type === 'box' && product.pieces_per_box && item.unit_type === 'pieces') {
        // Selling pieces - use per-piece buying price
        const buyingPricePerPiece = buyingPrice / product.pieces_per_box
        profit = item.quantity * (item.selling_price - buyingPricePerPiece)
      } else {
        // Selling boxes or regular products - use full buying price
        profit = item.quantity * (item.selling_price - buyingPrice)
      }

      totalAmount += subtotal
      totalProfit += profit
    }

    // Create stock transaction (with customer for both CASH and CREDIT)
    const { data: transaction, error: transactionError } = await supabase
      .from("stock_transactions")
      .insert({
        user_id: user.id,
        customer_id: customerId || null,
        phone: request.phone || null,
        type: "OUT",
        payment_type: request.payment_type,
        total_amount: totalAmount,
        total_profit: totalProfit,
        notes: request.notes || null,
        is_cancelled: false,
        quantity: request.items.reduce((sum, item) => sum + item.quantity, 0),
      })
      .select()
      .single()

    if (transactionError) throw new Error(transactionError.message)

    // Create stock out items
    const itemsToInsert = request.items.map((item) => {
      const product = productMap.get(item.product_id)
      const baseBuyingPrice = item.buying_price || (product?.price || 0)
      
      // Calculate per-unit buying price based on unit type
      let buyingPricePerUnit = baseBuyingPrice
      if (product?.unit_type === 'box' && product.pieces_per_box && item.unit_type === 'pieces') {
        buyingPricePerUnit = baseBuyingPrice / product.pieces_per_box
      }
      
      return {
        transaction_id: transaction.id,
        product_id: item.product_id,
        quantity: item.quantity,
        selling_price: item.selling_price,
        buying_price: buyingPricePerUnit,
      }
    })

    const { error: itemsError } = await supabase.from("stock_out_items").insert(itemsToInsert)

    if (itemsError) throw new Error(itemsError.message)

    // Deduct stock from products
    for (const item of request.items) {
      const product = productMap.get(item.product_id)
      
      if (product?.unit_type === 'box' && product.pieces_per_box && item.unit_type === 'pieces') {
        // Selling pieces from box product
        const currentRemaining = product.remaining_pieces || 0
        let piecesFromRemaining = Math.min(item.quantity, currentRemaining)
        let piecesStillNeeded = item.quantity - piecesFromRemaining
        let boxesToOpen = piecesStillNeeded > 0 ? Math.ceil(piecesStillNeeded / product.pieces_per_box) : 0
        let finalRemainingPieces = currentRemaining - piecesFromRemaining
        
        if (boxesToOpen > 0) {
          finalRemainingPieces += (boxesToOpen * product.pieces_per_box) - piecesStillNeeded
        }
        
        const newBoxQuantity = product.quantity - boxesToOpen
        
        await supabase.from("products").update({ 
          quantity: newBoxQuantity,
          remaining_pieces: finalRemainingPieces
        }).eq("id", item.product_id)
      } else {
        // Regular product or selling whole boxes
        const newQuantity = (product?.quantity || 0) - item.quantity
        await supabase.from("products").update({ quantity: newQuantity }).eq("id", item.product_id)
      }
    }

    // Create credit record ONLY if payment type is CREDIT
    if (request.payment_type === "CREDIT" && customerId) {
      const { error: creditError } = await supabase.from("credits").insert({
        user_id: user.id,
        customer_id: customerId,
        customer_name: request.customer?.name || "Unknown",
        transaction_id: transaction.id,
        amount: totalAmount,
        amount_owed: totalAmount,
        amount_paid: 0,
        status: "PENDING",
        is_active: true,
        payment_due_date: null,
      })

      if (creditError) throw new Error(creditError.message)
    }

    return transaction
  },

  /**
   * Get all stock out transactions - FIXED WITH PROPER PRODUCT JOINS
   */
  async getStockOuts(filters?: { startDate?: Date; endDate?: Date; customerId?: string; includeDeleted?: boolean }): Promise<StockTransaction[]> {
    let query = supabase
      .from("stock_transactions")
      .select(
        `
      *,
      stock_out_items (
        id,
        product_id,
        quantity,
        selling_price,
        buying_price,
        profit_per_unit,
        subtotal,
        subtotal_profit,
        products (
          id,
          name,
          brand
        )
      ),
      customers (
        id,
        name,
        phone,
        tin_number
      ),
      products (
        id,
        name,
        brand
      )
    `
      )
      .eq("type", "OUT")
      .eq("is_deleted", filters?.includeDeleted || false)

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate.toISOString())
    }

    if (filters?.customerId) {
      query = query.eq("customer_id", filters.customerId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get stock out by ID with all items
   */
  async getStockOutById(id: string): Promise<StockTransaction | null> {
    const { data, error } = await supabase
      .from("stock_transactions")
      .select(
        `
      *,
      stock_out_items (
        id,
        product_id,
        quantity,
        selling_price,
        buying_price,
        profit_per_unit,
        subtotal,
        subtotal_profit,
        products (
          id,
          name,
          brand
        )
      ),
      customers (
        id,
        name,
        phone,
        tin_number
      )
    `
      )
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw new Error(error.message)
    return data
  },

  /**
   * Update existing stock out transaction
   */
  async updateStockOut(request: {
    transactionId: string
    customer?: Partial<Customer>
    payment_type: "CASH" | "CREDIT"
    items: StockOutItemInput[]
  }): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Get the original transaction
    const { data: originalTransaction, error: fetchError } = await supabase
      .from("stock_transactions")
      .select(`
        *,
        stock_out_items (
          id,
          product_id,
          quantity
        )
      `)
      .eq("id", request.transactionId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    // Restore stock from original transaction
    for (const item of originalTransaction.stock_out_items || []) {
      const { data: product } = await supabase
        .from("products")
        .select("quantity")
        .eq("id", item.product_id)
        .single()

      const restoredQuantity = (product?.quantity || 0) + item.quantity
      await supabase
        .from("products")
        .update({ quantity: restoredQuantity })
        .eq("id", item.product_id)
    }

    // Handle customer update/creation
    let customerId = originalTransaction.customer_id

    if (request.customer && request.customer.name) {
      // Try to find existing customer by phone
      if (request.customer.phone) {
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", request.customer.phone)
          .maybeSingle()

        if (existingCustomer) {
          customerId = existingCustomer.id
        }
      }

      // Create new customer if not found and name provided
      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            name: request.customer.name,
            phone: request.customer.phone || null,
            tin_number: request.customer.tin_number || null,
            total_credit: 0,
            is_archived: false,
          })
          .select()
          .single()

        if (customerError) throw new Error(customerError.message)
        customerId = newCustomer.id
      }
    }

    // Get product prices for calculations
    const productIds = request.items.map((item) => item.product_id)
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, quantity, price, unit_type, pieces_per_box, remaining_pieces")
      .in("id", productIds)

    if (productError) throw new Error(productError.message)
    const productMap = new Map(products?.map((p) => [p.id, p]) || [])

    // Validate stock availability for new quantities
    for (const item of request.items) {
      const product = productMap.get(item.product_id)
      if (!product) throw new Error(`Product not found: ${item.product_id}`)
      
      // For box products, check based on unit type
      if (product.unit_type === 'box' && product.pieces_per_box) {
        if (item.unit_type === 'pieces') {
          // Selling pieces - check total available pieces
          const totalPieces = (product.quantity * product.pieces_per_box) + (product.remaining_pieces || 0)
          if (item.quantity > totalPieces) {
            throw new Error(
              `Insufficient stock for ${product.id}. Available: ${totalPieces} pieces, Requested: ${item.quantity} pieces`
            )
          }
        } else {
          // Selling boxes - check box quantity
          if (item.quantity > product.quantity) {
            throw new Error(
              `Insufficient stock for ${product.id}. Available: ${product.quantity} boxes, Requested: ${item.quantity} boxes`
            )
          }
        }
      } else {
        // Regular product - check quantity
        if (item.quantity > product.quantity) {
          throw new Error(
            `Insufficient stock for ${product.id}. Available: ${product.quantity}, Requested: ${item.quantity}`
          )
        }
      }
    }

    // Calculate new totals
    let totalAmount = 0
    let totalProfit = 0

    for (const item of request.items) {
      const product = productMap.get(item.product_id)
      const buyingPrice = item.buying_price || (product?.price || 0)
      const subtotal = item.quantity * item.selling_price
      
      // Calculate profit based on unit type
      let profit = 0
      if (product?.unit_type === 'box' && product.pieces_per_box && item.unit_type === 'pieces') {
        // Selling pieces - use per-piece buying price
        const buyingPricePerPiece = buyingPrice / product.pieces_per_box
        profit = item.quantity * (item.selling_price - buyingPricePerPiece)
      } else {
        // Selling boxes or regular products - use full buying price
        profit = item.quantity * (item.selling_price - buyingPrice)
      }

      totalAmount += subtotal
      totalProfit += profit
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from("stock_transactions")
      .update({
        customer_id: customerId || null,
        payment_type: request.payment_type,
        total_amount: totalAmount,
        total_profit: totalProfit,
        quantity: request.items.reduce((sum, item) => sum + item.quantity, 0),
      })
      .eq("id", request.transactionId)

    if (updateError) throw new Error(updateError.message)

    // Delete old stock out items
    await supabase
      .from("stock_out_items")
      .delete()
      .eq("transaction_id", request.transactionId)

    // Create new stock out items
    const itemsToInsert = request.items.map((item) => {
      const product = productMap.get(item.product_id)
      const baseBuyingPrice = item.buying_price || (product?.price || 0)
      
      // Calculate per-unit buying price based on unit type
      let buyingPricePerUnit = baseBuyingPrice
      if (product?.unit_type === 'box' && product.pieces_per_box && item.unit_type === 'pieces') {
        buyingPricePerUnit = baseBuyingPrice / product.pieces_per_box
      }
      
      return {
        transaction_id: request.transactionId,
        product_id: item.product_id,
        quantity: item.quantity,
        selling_price: item.selling_price,
        buying_price: buyingPricePerUnit,
      }
    })

    const { error: itemsError } = await supabase.from("stock_out_items").insert(itemsToInsert)
    if (itemsError) throw new Error(itemsError.message)

    // Deduct new stock quantities
    for (const item of request.items) {
      const product = productMap.get(item.product_id)
      
      if (product?.unit_type === 'box' && product.pieces_per_box && item.unit_type === 'pieces') {
        // Selling pieces from box product
        const currentRemaining = product.remaining_pieces || 0
        let piecesFromRemaining = Math.min(item.quantity, currentRemaining)
        let piecesStillNeeded = item.quantity - piecesFromRemaining
        let boxesToOpen = piecesStillNeeded > 0 ? Math.ceil(piecesStillNeeded / product.pieces_per_box) : 0
        let finalRemainingPieces = currentRemaining - piecesFromRemaining
        
        if (boxesToOpen > 0) {
          finalRemainingPieces += (boxesToOpen * product.pieces_per_box) - piecesStillNeeded
        }
        
        const newBoxQuantity = product.quantity - boxesToOpen
        
        await supabase
          .from("products")
          .update({ 
            quantity: newBoxQuantity,
            remaining_pieces: finalRemainingPieces
          })
          .eq("id", item.product_id)
      } else {
        // Regular product or selling whole boxes
        const newQuantity = (product?.quantity || 0) - item.quantity
        await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .eq("id", item.product_id)
      }
    }

    // Update credit record if payment type changed or amount changed
    if (request.payment_type === "CREDIT" && customerId) {
      const { data: existingCredit } = await supabase
        .from("credits")
        .select("id")
        .eq("transaction_id", request.transactionId)
        .maybeSingle()

      if (existingCredit) {
        // Update existing credit
        await supabase
          .from("credits")
          .update({
            amount: totalAmount,
            amount_owed: totalAmount,
          })
          .eq("id", existingCredit.id)
      } else {
        // Create new credit if it didn't exist
        await supabase.from("credits").insert({
          user_id: user.id,
          customer_id: customerId,
          customer_name: request.customer?.name || "Unknown",
          transaction_id: request.transactionId,
          amount: totalAmount,
          amount_owed: totalAmount,
          amount_paid: 0,
          status: "PENDING",
          is_active: true,
          payment_due_date: null,
        })
      }
    } else if (request.payment_type === "CASH") {
      // Deactivate credit if payment type changed to CASH
      await supabase
        .from("credits")
        .update({ is_active: false })
        .eq("transaction_id", request.transactionId)
    }
  },

  /**
   * Safe delete transaction with proper stock restoration
   */
  async safeDeleteTransaction(transactionId: string, reason: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Get transaction with all items for proper stock restoration
    const { data: transaction, error: fetchError } = await supabase
      .from("stock_transactions")
      .select(`
        *,
        stock_out_items (
          id,
          product_id,
          quantity,
          products (
            id,
            unit_type,
            pieces_per_box,
            quantity,
            remaining_pieces
          )
        )
      `)
      .eq("id", transactionId)
      .eq("is_deleted", false)
      .single()

    if (fetchError) throw new Error(fetchError.message)
    if (!transaction) throw new Error("Transaction not found or already deleted")

    // Restore stock for all items with proper box/piece logic
    for (const item of transaction.stock_out_items || []) {
      const product = item.products
      if (!product) continue

      if (product.unit_type === 'box' && product.pieces_per_box) {
        // For box products, restore pieces to remaining_pieces first
        const currentRemaining = product.remaining_pieces || 0
        const newRemainingPieces = currentRemaining + item.quantity
        
        // Convert excess pieces back to boxes if we have a full box worth
        const boxesToAdd = Math.floor(newRemainingPieces / product.pieces_per_box)
        const finalRemainingPieces = newRemainingPieces % product.pieces_per_box
        
        await supabase
          .from("products")
          .update({ 
            quantity: product.quantity + boxesToAdd,
            remaining_pieces: finalRemainingPieces
          })
          .eq("id", item.product_id)
      } else {
        // Regular product - simple quantity restoration
        await supabase
          .from("products")
          .update({ quantity: product.quantity + item.quantity })
          .eq("id", item.product_id)
      }
    }

    // Soft delete the transaction
    const { error: updateError } = await supabase
      .from("stock_transactions")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        cancelled_reason: reason,
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", transactionId)

    if (updateError) throw new Error(updateError.message)

    // Deactivate related credits
    if (transaction.customer_id && transaction.payment_type === "CREDIT") {
      await supabase
        .from("credits")
        .delete()
        .eq("transaction_id", transactionId)
    }
  },

  /**
   * Cancel stock out transaction (legacy method - kept for compatibility)
   */
  async cancelStockOut(transactionId: string, reason: string): Promise<void> {
    return this.safeDeleteTransaction(transactionId, reason)
  },

  /**
   * Get daily sales summary
   */
  async getDailySalesSummary(date: Date): Promise<{
    totalCash: number
    totalCredit: number
    totalProfit: number
    totalUnits: number
    transactionCount: number
  }> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from("stock_transactions")
      .select("payment_type, total_amount, total_profit, quantity")
      .eq("type", "OUT")
      .eq("is_deleted", false)
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString())

    if (error) throw new Error(error.message)

    const summary = {
      totalCash: 0,
      totalCredit: 0,
      totalProfit: 0,
      totalUnits: 0,
      transactionCount: data?.length || 0,
    }

    for (const record of data || []) {
      summary.totalProfit += record.total_profit || 0
      summary.totalUnits += record.quantity || 0

      if (record.payment_type === "CASH") {
        summary.totalCash += record.total_amount || 0
      } else {
        summary.totalCredit += record.total_amount || 0
      }
    }

    return summary
  },
}

export default stockOutService