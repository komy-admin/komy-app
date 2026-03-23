import axios from 'axios'

export interface ApiErrorInfo {
  code: string | null
  message: string
  details?: any
  isNetwork: boolean
  isValidation: boolean
  status: number | null
}

/**
 * Extract structured error info from any API error.
 * Supports both the new standardized format and legacy formats.
 */
export function extractApiError(error: unknown): ApiErrorInfo {
  // 1. Network error (no response from server)
  if (axios.isAxiosError(error) && !error.response) {
    return {
      code: null,
      message: 'Erreur de connexion au serveur',
      isNetwork: true,
      isValidation: false,
      status: null,
    }
  }

  // 2. API response available
  const response = (error as any)?.response
  const data = response?.data
  const status = response?.status || null

  // 2a. New standardized format: { success: false, error: { code, message, details? } }
  if (data?.error?.code) {
    return {
      code: data.error.code,
      message: data.error.message,
      details: data.error.details,
      isNetwork: false,
      isValidation: data.error.code === 'VALIDATION_ERROR',
      status,
    }
  }

  // 2b. Legacy format: { message: '...' } or { error: '...' }
  const message =
    data?.message ||
    data?.error ||
    (error instanceof Error ? error.message : null) ||
    'Une erreur est survenue'

  return {
    code: data?.code || null,
    message: typeof message === 'string' ? message : 'Une erreur est survenue',
    details: data?.details || data?.data,
    isNetwork: false,
    isValidation: status === 422,
    status,
  }
}

/**
 * Show an API error as a toast notification.
 * Uses the standardized error message from the backend when available.
 */
export function showApiError(
  error: unknown,
  showToast: (message: string, type: 'error') => void,
  fallbackMessage?: string
) {
  const info = extractApiError(error)
  showToast(info.message || fallbackMessage || 'Une erreur est survenue', 'error')
}
