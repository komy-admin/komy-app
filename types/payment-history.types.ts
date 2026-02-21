/**
 * Types pour l'historique des paiements (3 niveaux de navigation)
 */

export interface PaymentHistoryFilters {
  period: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'
  startDate: string | null
  endDate: string | null
  serverId: string | null
  status: 'all' | 'paid' | 'partial' | 'unpaid' | 'overpaid'
  searchQuery: string
}

export interface OrderWithPayments {
  id: string
  tableId: string
  table: {
    id: string
    name: string
    room: {
      name: string
    }
  }
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  refundedAmount?: number
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overpaid'
  paymentsCount: number
  createdAt: string
  user?: {
    firstName: string
    lastName: string
  }
}

export interface PaymentSummary {
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: 'unpaid' | 'partial' | 'paid' | 'overpaid'
}

export interface PeriodSummary {
  ordersCount: number
  totalAmount: number
  paymentsCount: number
}
