import { BaseApiService } from './base.api'
import type {
  Printer,
  PrintHub,
  PrintHubCreateInput,
  PrintHubCreationResult,
  PrintJob,
  PrintJobsFilters,
  PrintJobsPage,
  PrinterCreateInput,
  PrinterUpdateInput,
} from '~/types/printer.types'

class PrinterApiService extends BaseApiService<Printer> {
  protected endpoint = '/printers'

  async list(): Promise<Printer[]> {
    const response = await this.axiosInstance.get<Printer[]>(this.endpoint)
    return response.data
  }

  async getById(id: string): Promise<Printer> {
    const response = await this.axiosInstance.get<Printer>(`${this.endpoint}/${id}`)
    return response.data
  }

  async create(payload: PrinterCreateInput): Promise<Printer> {
    const response = await this.axiosInstance.post<Printer>(this.endpoint, payload)
    return response.data
  }

  async update(id: string, payload: PrinterUpdateInput): Promise<Printer> {
    const response = await this.axiosInstance.patch<Printer>(
      `${this.endpoint}/${id}`,
      payload
    )
    return response.data
  }

  async remove(id: string): Promise<void> {
    await this.axiosInstance.delete(`${this.endpoint}/${id}`)
  }
}

class PrintHubApiService extends BaseApiService<PrintHub> {
  protected endpoint = '/print-hubs'

  async list(): Promise<PrintHub[]> {
    const response = await this.axiosInstance.get<PrintHub[]>(this.endpoint)
    return response.data
  }

  async register(payload: PrintHubCreateInput): Promise<PrintHubCreationResult> {
    const response = await this.axiosInstance.post<PrintHubCreationResult>(
      this.endpoint,
      payload
    )
    return response.data
  }

  async revoke(id: string): Promise<void> {
    await this.axiosInstance.post(`${this.endpoint}/${id}/revoke`)
  }

  async listTokens(id: string): Promise<
    Array<{
      id: string
      createdAt: string
      lastUsedAt: string | null
      expiresAt: string | null
      revokedAt: string | null
    }>
  > {
    const response = await this.axiosInstance.get(`${this.endpoint}/${id}/tokens`)
    return response.data
  }
}

class PrintJobApiService extends BaseApiService<PrintJob> {
  protected endpoint = '/print-jobs'

  async list(filters: PrintJobsFilters = {}): Promise<PrintJobsPage> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const response = await this.axiosInstance.get<PrintJobsPage>(
      `${this.endpoint}?${params.toString()}`
    )
    return response.data
  }

  async getById(id: string): Promise<PrintJob> {
    const response = await this.axiosInstance.get<PrintJob>(`${this.endpoint}/${id}`)
    return response.data
  }

  async cancel(id: string): Promise<PrintJob> {
    const response = await this.axiosInstance.post<PrintJob>(
      `${this.endpoint}/${id}/cancel`
    )
    return response.data
  }

  async retry(id: string): Promise<PrintJob> {
    const response = await this.axiosInstance.post<PrintJob>(
      `${this.endpoint}/${id}/retry`
    )
    return response.data
  }
}

export const printerApi = new PrinterApiService()
export const printHubApi = new PrintHubApiService()
export const printJobApi = new PrintJobApiService()
