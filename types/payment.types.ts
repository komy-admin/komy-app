/**
 * Payment types
 */
export interface Payment {
  id: string
  orderId: string
  accountId: string
  userId: string
  amount: number
  tipAmount?: number
  paymentMethod: 'card' | 'cash' | 'check' | 'ticket_resto'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transactionReference?: string
  metadata?: any
  notes?: string
  refundedAt?: string
  refundReason?: string
  createdAt: string
  updatedAt?: string
  user?: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
  order?: any
  allocations?: PaymentAllocation[]
}

export interface PaymentAllocation {
  id: string
  paymentId: string
  orderLineId: string
  quantityFraction: number
  allocatedAmount: number
  createdAt: string
  orderLine?: any
}

export interface LedgerEvent {
  id: string
  seq: number
  accountId: string
  eventType: string
  eventData: any
  hash: string
  previousHash: string | null
  timestamp: string
  hmacSignature?: string
}
