export type PrinterType = 'kitchen' | 'bar' | 'cashier'

export type PrintJobStatus =
  | 'pending'
  | 'sent'
  | 'acked'
  | 'failed'
  | 'dead'
  | 'cancelled'

export interface Printer {
  id: string
  accountId: string
  name: string
  type: PrinterType
  zone: string | null
  ip: string
  port: number
  width: number
  isActive: boolean
  lastSeenAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface PrintHub {
  id: string
  deviceFingerprint: string
  deviceName: string | null
  devicePlatform: string | null
  lastIp: string | null
  lastUsedAt: string | null
  createdAt: string
  online: boolean
}

export interface PrintHubCreationResult {
  hub: {
    id: string
    deviceFingerprint: string
    deviceName: string | null
    devicePlatform: string | null
  }
  deviceToken: string
}

export interface PrintJob {
  id: string
  accountId: string
  printerId: string
  hubDeviceId: string | null
  orderId: string | null
  paymentId: string | null
  idempotencyKey: string
  payload: string
  status: PrintJobStatus
  attempts: number
  sentAt: string | null
  ackedAt: string | null
  nextRetryAt: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string | null
  printer?: Printer
}

export interface PrintJobsFilters {
  status?: PrintJobStatus
  printerId?: string
  orderId?: string
  paymentId?: string
  fromDate?: string
  toDate?: string
  limit?: number
  offset?: number
}

export interface PrintJobsPage {
  items: PrintJob[]
  limit: number
  offset: number
}

export interface PrinterCreateInput {
  name: string
  type: PrinterType
  zone?: string
  ip: string
  port?: number
  width?: number
  isActive?: boolean
}

export type PrinterUpdateInput = Partial<PrinterCreateInput>

export interface PrintHubCreateInput {
  deviceFingerprint: string
  deviceName?: string
  devicePlatform?: string
}
