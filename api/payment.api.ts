import { randomUUID } from 'expo-crypto'
import { BaseApiService } from './base.api'
import type { PaymentHistoryFilters, OrderWithPayments } from '~/types/payment-history.types'
import type { Payment, LedgerEvent } from '~/types/payment.types'

class PaymentApiService extends BaseApiService<Payment> {
  protected endpoint = '/payment'

  /**
   * Get all orders with at least one payment
   */
  async getOrdersWithPayments(filters: PaymentHistoryFilters): Promise<OrderWithPayments[]> {
    const queryParams = new URLSearchParams()

    if (filters.period) queryParams.append('period', filters.period)
    if (filters.startDate) queryParams.append('startDate', filters.startDate)
    if (filters.endDate) queryParams.append('endDate', filters.endDate)
    if (filters.serverId) queryParams.append('serverId', filters.serverId)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.searchQuery) queryParams.append('searchQuery', filters.searchQuery)

    const response = await this.axiosInstance.get<OrderWithPayments[]>(
      `/order/with-payments?${queryParams.toString()}`
    )
    return response.data
  }

  /**
   * Get all payments for a specific order
   */
  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const response = await this.axiosInstance.get<Payment[]>(`${this.endpoint}/order/${orderId}`)
    return response.data
  }

  /**
   * Get all payments for a specific order (alias for compatibility)
   */
  async getByOrder(orderId: string): Promise<Payment[]> {
    return this.getPaymentsByOrder(orderId)
  }

  /**
   * Get a single payment by ID
   */
  async getById(paymentId: string): Promise<Payment> {
    const response = await this.axiosInstance.get<Payment>(`${this.endpoint}/${paymentId}`)
    return response.data
  }

  /**
   * Get audit logs for a payment (NF525 compliance)
   */
  async getAuditLogs(paymentId: string): Promise<LedgerEvent[]> {
    const response = await this.axiosInstance.get<LedgerEvent[]>(
      `${this.endpoint}/${paymentId}/audit-logs`
    )
    return response.data
  }

  /**
   * Create a new payment
   */
  async createPayment(data: {
    orderId: string
    amount: number
    paymentMethod: Payment['paymentMethod']
    tipAmount?: number
    transactionReference?: string
    metadata?: any
    notes?: string
    allocations: Array<{
      orderLineId: string
      quantityFraction: number
    }>
  }): Promise<Payment> {
    // Générer un UUID v4 pour l'idempotence
    const response = await this.axiosInstance.post<Payment>(this.endpoint, data, {
      headers: {
        'idempotency-key': randomUUID(),
      },
    })
    return response.data
  }

  /**
   * Print ticket for a payment
   */
  async printTicket(paymentId: string): Promise<void> {
    await this.axiosInstance.post(`${this.endpoint}/${paymentId}/print-ticket`)
  }

  /**
   * Get journal entries (business-oriented payment view)
   */
  async getJournal(params: {
    startDate?: string
    endDate?: string
    paymentMethod?: string
    status?: string
    userId?: string
    searchQuery?: string
    limit?: number
    cursor?: string
  }) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const response = await this.axiosInstance.get(
      `${this.endpoint}/journal?${queryParams.toString()}`
    )
    return response.data
  }

  /**
   * Refund a payment
   * @returns Object with refundPayment and originalPayment
   */
  async refundPayment(paymentId: string, data: {
    amount?: number
    reason: string
    refundMethod?: 'original' | 'cash'
  }): Promise<{ refundPayment: Payment; originalPayment: Payment }> {
    const generateUUIDv4 = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    const response = await this.axiosInstance.post(
      `${this.endpoint}/${paymentId}/refund`,
      data,
      {
        headers: {
          'idempotency-key': generateUUIDv4(),
        },
      }
    )
    return response.data.data
  }
}

export const paymentApiService = new PaymentApiService()
export const paymentApi = paymentApiService
