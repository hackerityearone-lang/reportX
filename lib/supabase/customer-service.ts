"use client"

import { createClient } from "@/lib/supabase/client"
import type { Customer } from "@/lib/types"

const supabase = createClient()

export const customerService = {
  /**
   * Get all customers for current user
   */
  async getCustomers(filters?: { archived?: boolean }): Promise<Customer[]> {
    let query = supabase.from("customers").select("*")

    if (filters?.archived !== undefined) {
      query = query.eq("is_archived", filters.archived)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      // If table doesn't exist, return empty array with helpful message
      if (error.message?.includes("Could not find the table")) {
        console.warn("⚠️ Customers table not found. Please apply database migration: scripts/002_enhance_advanced_features.sql")
        return []
      }
      throw new Error(error.message)
    }
    return data || []
  },

  /**
   * Get single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).single()

    if (error && error.code !== "PGRST116") throw new Error(error.message)
    return data
  },

  /**
   * Search customers by name or phone
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .eq("is_archived", false)
      .limit(10)

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Create new customer
   */
  async createCustomer(customer: Omit<Customer, "id" | "created_at" | "updated_at" | "user_id">): Promise<Customer> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id: user.id,
        name: customer.name,
        phone: customer.phone || null,
        email: customer.email || null,
        total_credit: 0,
        is_archived: false,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Update customer
   */
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: updates.name,
        phone: updates.phone,
        email: updates.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Archive customer (soft delete)
   */
  async archiveCustomer(id: string): Promise<void> {
    const { error } = await supabase.from("customers").update({ is_archived: true }).eq("id", id)

    if (error) throw new Error(error.message)
  },

  /**
   * Get customer's total credit balance
   */
  async getCustomerCreditBalance(customerId: string): Promise<number> {
    const { data, error } = await supabase
      .from("credits")
      .select("amount_owed, amount_paid")
      .eq("customer_id", customerId)
      .eq("is_active", true)
      .eq("status", "!=", "PAID")

    if (error) throw new Error(error.message)

    const totalOwed = (data || []).reduce((sum, credit) => sum + (credit.amount_owed || 0), 0)
    const totalPaid = (data || []).reduce((sum, credit) => sum + (credit.amount_paid || 0), 0)

    return totalOwed - totalPaid
  },

  /**
   * Get customer's credit history
   */
  async getCustomerCreditHistory(customerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("credits")
      .select(
        `
      id,
      amount_owed,
      amount_paid,
      status,
      created_at,
      credit_payments (
        id,
        amount,
        payment_date
      ),
      stock_transactions (
        id,
        invoice_number,
        total_amount,
        created_at
      )
    `
      )
      .eq("customer_id", customerId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get customer's transactions with item and product details
   */
  async getCustomerTransactions(customerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("stock_transactions")
      .select(`
        id,
        invoice_number,
        created_at,
        payment_type,
        total_amount,
        stock_out_items (
          id,
          quantity,
          selling_price,
          subtotal,
          products(id, name)
        )
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },
}

export default customerService
