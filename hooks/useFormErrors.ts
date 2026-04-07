import { useState, useCallback, useRef } from 'react'
import { extractValidationErrors, showApiError } from '~/lib/apiErrorHandler'

interface FieldError {
  message: string
  rule?: string
}

export interface UseFormErrorsReturn {
  errors: Record<string, FieldError>
  getError: (field: string) => string | undefined
  hasError: (field: string) => boolean
  clearError: (field: string) => void
  clearAll: () => void
  setError: (field: string, message: string) => void
  handleError: (
    error: unknown,
    showToast: (message: string, type: 'error') => void,
    fallbackMessage?: string
  ) => void
}

/**
 * Hook for managing form field validation errors from backend API responses.
 *
 * @param fieldMap Optional mapping from backend dot-notation fields to local field names.
 *                 e.g. { 'menu.name': 'name', 'menu.basePrice': 'basePrice' }
 */
export function useFormErrors(fieldMap?: Record<string, string>): UseFormErrorsReturn {
  const [errors, setErrors] = useState<Record<string, FieldError>>({})
  const fieldMapRef = useRef(fieldMap)
  fieldMapRef.current = fieldMap

  const mapField = useCallback((backendField: string): string => {
    const map = fieldMapRef.current
    if (!map) return backendField

    // Exact match first
    if (map[backendField]) return map[backendField]

    // Prefix match: find longest matching prefix in fieldMap
    let bestMatch = ''
    let bestReplacement = ''
    for (const [key, value] of Object.entries(map)) {
      if (backendField.startsWith(key) && key.length > bestMatch.length) {
        bestMatch = key
        bestReplacement = value
      }
    }

    if (bestMatch) {
      const suffix = backendField.slice(bestMatch.length)
      return bestReplacement + suffix
    }

    return backendField
  }, [])

  const getError = useCallback(
    (field: string): string | undefined => {
      // Exact match
      if (errors[field]) return errors[field].message

      // Prefix match: return first error whose key starts with field
      const prefix = field + '.'
      for (const key of Object.keys(errors)) {
        if (key.startsWith(prefix)) return errors[key].message
      }

      return undefined
    },
    [errors]
  )

  const hasError = useCallback(
    (field: string): boolean => {
      if (errors[field]) return true

      const prefix = field + '.'
      return Object.keys(errors).some((key) => key.startsWith(prefix))
    },
    [errors]
  )

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]

      // Also clear nested errors
      const prefix = field + '.'
      for (const key of Object.keys(next)) {
        if (key.startsWith(prefix)) delete next[key]
      }

      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setErrors({})
  }, [])

  const setError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: { message } }))
  }, [])

  const handleError = useCallback(
    (
      error: unknown,
      showToast: (message: string, type: 'error') => void,
      fallbackMessage?: string
    ) => {
      const validationErrors = extractValidationErrors(error)

      if (validationErrors) {
        // Map backend fields to local fields and set errors
        const mapped: Record<string, FieldError> = {}
        for (const [field, err] of Object.entries(validationErrors)) {
          mapped[mapField(field)] = err
        }
        setErrors(mapped)
        showToast('Erreur de validation', 'error')
      } else {
        // Non-validation error: fallback to toast
        showApiError(error, showToast, fallbackMessage)
      }
    },
    [mapField]
  )

  return { errors, getError, hasError, clearError, clearAll, setError, handleError }
}
