"use client"

import { createClient } from "@/lib/supabase/client"
import type { Credit, CreditPayment } from "@/lib/types"

const supabase = createClient()

export const creditService = {
  /**
   * Get all credits for current user
   */
  async getCredits(filters?: { status?: string; customerId?: string }): Promise<Credit[]> {
    // First try with relationships, fallback to simple query if relationships don't exist
    try {
      let query = supabase
        .from("credits")
        .select(
          `
        *,
        customers (
          id,
          name,
          phone
        ),
        stock_transactions (
          id,
          invoice_number,
          total_amount
        ),
        credit_payments (
          id,
          amount,
          payment_date
        )
      `
        )
        .eq("is_active", true)

      if (filters?.status) {
        query = query.eq("status", filters.status)
      }

      if (filters?.customerId) {
        query = query.eq("customer_id", filters.customerId)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        // If relationship error, try simple query
        if (error.message.includes("relationship") || error.message.includes("schema cache")) {
          return this.getCreditsSimple(filters)
        }
        throw new Error(error.message)
      }
      return data || []
    } catch (err: any) {
      // Fallback to simple query
      if (err.message?.includes("relationship") || err.message?.includes("schema cache")) {
        return this.getCreditsSimple(filters)
      }
      throw err
    }
  },

  /**
   * Simple credits query without relationships
   */
  async getCreditsSimple(filters?: { status?: string; customerId?: string }): Promise<Credit[]> {
    let query = supabase
      .from("credits")
      .select("*")
      .eq("is_active", true)

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.customerId) {
      query = query.eq("customer_id", filters.customerId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get credit by ID
   */
  async getCreditById(id: string): Promise<Credit | null> {
    const { data, error } = await supabase
      .from("credits")
      .select(
        `
      *,
      customers (
        id,
        name,
        phone
      ),
      stock_transactions (
        id,
        invoice_number,
        total_amount,
        created_at
      ),
      credit_payments (
        id,
        amount,
        payment_date,
        notes
      )
    `
      )
      .eq("id", id)
      .single()

    if (error && error.code !== "PGRST116") throw new Error(error.message)
    return data
  },

  /**
   * Get customer credits
   */
  async getCustomerCredits(customerId: string): Promise<Credit[]> {
    const { data, error } = await supabase
      .from("credits")
      .select(
        `
      *,
      credit_payments (
        id,
        amount,
        payment_date,
        notes
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
   * Record partial credit payment
   */
  async recordCreditPayment(
    creditId: string,
    amount: number,
    notes?: string
  ): Promise<{ payment: CreditPayment | null; updatedCredit: Credit }> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Get current credit
    const { data: credit, error: creditError } = await supabase
      .from("credits")
      .select("*")
      .eq("id", creditId)
      .single()

    if (creditError) throw new Error(creditError.message)

    // Get amount_owed - handle both old and new schema
    const amountOwed = credit.amount_owed || credit.amount || 0
    const amountPaid = credit.amount_paid || 0

    // Validate payment amount
    const remainingBalance = amountOwed - amountPaid
    if (amount > remainingBalance) {
      throw new Error(`Payment exceeds remaining balance. Remaining: ${remainingBalance}`)
    }

    // Calculate new amounts
    const newAmountPaid = amountPaid + amount
    const newStatus = newAmountPaid >= amountOwed ? "PAID" : newAmountPaid > 0 ? "PARTIAL" : "PENDING"

    // Try to create payment record (may fail if table doesn't exist)
    let payment = null
    try {
      const { data: paymentData, error: paymentError } = await supabase
        .from("credit_payments")
        .insert({
          user_id: user.id,
          credit_id: creditId,
          customer_id: credit.customer_id,
          amount: amount,
          payment_date: new Date().toISOString(),
          notes: notes || null,
        })
        .select()
        .single()

      if (!paymentError) {
        payment = paymentData
      }
    } catch (err) {
      // credit_payments table might not exist, continue with direct update
      console.warn("credit_payments table not available, updating credit directly")
    }

    // Update credit directly (in case triggers don't exist)
    const { error: updateError } = await supabase
      .from("credits")
      .update({
        amount_paid: newAmountPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creditId)

    if (updateError) throw new Error(updateError.message)

    // Get updated credit
    const { data: updatedCredit, error: fetchError } = await supabase
      .from("credits")
      .select("*")
      .eq("id", creditId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    return { payment, updatedCredit }
  },

  /**
   * Pay all remaining balance for a credit
   */
  async payAllCredit(creditId: string, notes?: string): Promise<Credit> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Get current credit
    const { data: credit, error: creditError } = await supabase
      .from("credits")
      .select("*")
      .eq("id", creditId)
      .single()

    if (creditError) throw new Error(creditError.message)

    // Get amount_owed - handle both old and new schema
    const amountOwed = credit.amount_owed || credit.amount || 0
    const amountPaid = credit.amount_paid || 0
    const remainingBalance = amountOwed - amountPaid

    if (remainingBalance <= 0) {
      throw new Error("Credit is already fully paid")
    }

    // Record the full remaining payment
    const { updatedCredit } = await this.recordCreditPayment(creditId, remainingBalance, notes || "Full payment")

    return updatedCredit
  },

  /**
   * Get payment history for a credit
   */
  async getCreditPaymentHistory(creditId: string): Promise<CreditPayment[]> {
    const { data, error } = await supabase
      .from("credit_payments")
      .select("*")
      .eq("credit_id", creditId)
      .order("payment_date", { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get customer's total credit balance
   */
  async getCustomerTotalCredit(customerId: string): Promise<{
    totalOwed: number
    totalPaid: number
    remainingBalance: number
    credits: Credit[]
  }> {
    const credits = await this.getCustomerCredits(customerId)

    let totalOwed = 0
    let totalPaid = 0

    for (const credit of credits) {
      totalOwed += credit.amount_owed || 0
      totalPaid += credit.amount_paid || 0
    }

    return {
      totalOwed,
      totalPaid,
      remainingBalance: totalOwed - totalPaid,
      credits,
    }
  },

  /**
   * Get credit statistics
   */
  async getCreditStats(): Promise<{
    totalPending: number
    totalPartial: number
    totalPaid: number
    totalOutstanding: number
    averagePaymentTime: number
  }> {
    const { data, error } = await supabase
      .from("credits")
      .select("status, amount_owed, amount_paid, created_at, updated_at")
      .eq("is_active", true)

    if (error) throw new Error(error.message)

    const stats = {
      totalPending: 0,
      totalPartial: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      averagePaymentTime: 0,
    }

    const paymentTimes: number[] = []

    for (const credit of data || []) {
      switch (credit.status) {
        case "PENDING":
          stats.totalPending += credit.amount_owed
          break
        case "PARTIAL":
          stats.totalPartial += credit.amount_owed - credit.amount_paid
          break
        case "PAID":
          stats.totalPaid += credit.amount_owed
          break
      }

      stats.totalOutstanding += credit.amount_owed - credit.amount_paid

      if (credit.status === "PAID" && credit.created_at && credit.updated_at) {
        const createdDate = new Date(credit.created_at).getTime()
        const updatedDate = new Date(credit.updated_at).getTime()
        paymentTimes.push((updatedDate - createdDate) / (1000 * 60 * 60 * 24)) // days
      }
    }

    if (paymentTimes.length > 0) {
      stats.averagePaymentTime = paymentTimes.reduce((a, b) => a + b, 0) / paymentTimes.length
    }

    return stats
  },

  /**
   * Settle/close a credit
   */
  async settleCredit(creditId: string): Promise<void> {
    const { data: credit, error: fetchError } = await supabase
      .from("credits")
      .select("*")
      .eq("id", creditId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    // Check if fully paid
    if (credit.amount_paid < credit.amount_owed) {
      throw new Error("Cannot settle partially paid credit. Record remaining payment first.")
    }

    // Mark as inactive
    const { error: updateError } = await supabase
      .from("credits")
      .update({
        is_active: false,
        status: "PAID",
        updated_at: new Date().toISOString(),
      })
      .eq("id", creditId)

    if (updateError) throw new Error(updateError.message)
  },

  /**
   * Get overdue credits
   */
  async getOverdueCredits(): Promise<Credit[]> {
    const { data, error } = await supabase
      .from("credits")
      .select("*")
      .eq("is_active", true)
      .neq("status", "PAID")
      .lt("payment_due_date", new Date().toISOString())

    if (error) throw new Error(error.message)
    return data || []
  },
}

export default creditService
