"use client"

import { createClient } from "@/lib/supabase/client"
import type { StockTransaction, StockOutItem, Customer } from "@/lib/types"

const supabase = createClient()

export interface StockOutItemInput {
  product_id: string
  quantity: number
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
      .select("id, quantity, price")
      .in("id", productIds)

    if (productError) throw new Error(productError.message)

    const productMap = new Map(products?.map((p) => [p.id, p]) || [])

    // Validate stock availability
    for (const item of request.items) {
      const product = productMap.get(item.product_id)
      if (!product) throw new Error(`Product not found: ${item.product_id}`)
      if (product.quantity < item.quantity)
        throw new Error(
          `Insufficient stock for ${product.id}. Available: ${product.quantity}, Requested: ${item.quantity}`
        )
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
            email: request.customer.email || null,
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
      const buyingPrice = item.buying_price || (productMap.get(item.product_id)?.price || 0)
      const subtotal = item.quantity * item.selling_price
      const profit = item.quantity * (item.selling_price - buyingPrice)

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
    const itemsToInsert = request.items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      quantity: item.quantity,
      selling_price: item.selling_price,
      buying_price: item.buying_price || (productMap.get(item.product_id)?.price || 0),
    }))

    const { error: itemsError } = await supabase.from("stock_out_items").insert(itemsToInsert)

    if (itemsError) throw new Error(itemsError.message)

    // Deduct stock from products
    for (const item of request.items) {
      const product = productMap.get(item.product_id)
      const newQuantity = (product?.quantity || 0) - item.quantity

      await supabase.from("products").update({ quantity: newQuantity }).eq("id", item.product_id)
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
  async getStockOuts(filters?: { startDate?: Date; endDate?: Date; customerId?: string }): Promise<StockTransaction[]> {
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
        email
      ),
      products (
        id,
        name,
        brand
      )
    `
      )
      .eq("type", "OUT")

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
        email
      )
    `
      )
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw new Error(error.message)
    return data
  },

  /**
   * Cancel stock out transaction (soft delete)
   */
  async cancelStockOut(transactionId: string, reason: string): Promise<void> {
    const { data: transaction, error: fetchError } = await supabase
      .from("stock_transactions")
      .select("*")
      .eq("id", transactionId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    // Restore stock for all products
    const { data: items, error: itemsError } = await supabase
      .from("stock_out_items")
      .select("product_id, quantity")
      .eq("transaction_id", transactionId)

    if (itemsError) throw new Error(itemsError.message)

    for (const item of items || []) {
      const { data: product } = await supabase
        .from("products")
        .select("quantity")
        .eq("id", item.product_id)
        .single()

      const newQuantity = (product?.quantity || 0) + item.quantity
      await supabase.from("products").update({ quantity: newQuantity }).eq("id", item.product_id)
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from("stock_transactions")
      .update({
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
        cancelled_reason: reason,
      })
      .eq("id", transactionId)

    if (updateError) throw new Error(updateError.message)

    // Deactivate related credit (only if it was a credit transaction)
    if (transaction.customer_id && transaction.payment_type === "CREDIT") {
      await supabase
        .from("credits")
        .update({ is_active: false })
        .eq("transaction_id", transactionId)
    }
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
      .eq("is_cancelled", false)
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