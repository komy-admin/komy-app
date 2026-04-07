import axios from 'axios'

export interface ApiErrorInfo {
  code: string | null
  message: string
  details?: any
  isNetwork: boolean
  isValidation: boolean
  silent: boolean
  status: number | null
}

/** True if the error was already handled globally (e.g. session expiry redirect) */
function isSilent(error: unknown): boolean {
  return !!(error as any)?.silent
}

/**
 * Extract structured error info from any API error.
 * Supports both the new standardized format and legacy formats.
 */
export function extractApiError(error: unknown): ApiErrorInfo {
  // 0. Silent errors (already handled globally, e.g. session expiry)
  if (isSilent(error)) {
    return {
      code: null,
      message: '',
      isNetwork: false,
      isValidation: false,
      silent: true,
      status: null,
    }
  }

  // 1. Cancelled request (e.g. session expired in request interceptor)
  if (axios.isCancel(error)) {
    return {
      code: null,
      message: '',
      isNetwork: false,
      isValidation: false,
      silent: true,
      status: null,
    }
  }

  // 2. Network error (no response from server)
  if (axios.isAxiosError(error) && !error.response) {
    return {
      code: null,
      message: 'Erreur de connexion au serveur',
      isNetwork: true,
      isValidation: false,
      silent: false,
      status: null,
    }
  }

  // 3. API response available
  const response = (error as any)?.response
  const data = response?.data
  const status = response?.status || null

  // 3a. New standardized format: { success: false, error: { code, message, details? } }
  if (data?.error?.code) {
    return {
      code: data.error.code,
      message: data.error.message,
      details: data.error.details,
      isNetwork: false,
      isValidation: data.error.code === 'VALIDATION_ERROR',
      silent: false,
      status,
    }
  }

  // 3b. Legacy format: { message: '...' } or { error: '...' }
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
    silent: false,
    status,
  }
}

/**
 * Show an API error as a toast notification.
 * Silent errors (session expiry) are skipped — already handled globally.
 */
/**
 * Extract field-level validation errors from an API error.
 * Returns a map of field -> { message, rule } or null if not a validation error.
 */
export function extractValidationErrors(
  error: unknown
): Record<string, { message: string; rule?: string }> | null {
  const info = extractApiError(error)
  if (!info.isValidation || !Array.isArray(info.details)) return null

  const errors: Record<string, { message: string; rule?: string }> = {}
  for (const detail of info.details) {
    if (detail.field && detail.message) {
      errors[detail.field] = { message: detail.message, rule: detail.rule }
    }
  }
  return Object.keys(errors).length > 0 ? errors : null
}

export function showApiError(
  error: unknown,
  showToast: (message: string, type: 'error') => void,
  fallbackMessage?: string
) {
  if (isSilent(error)) return
  const info = extractApiError(error)
  if (info.silent) return
  showToast(info.message || fallbackMessage || 'Une erreur est survenue', 'error')
}
