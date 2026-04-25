import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { printersActions } from '~/store'
import type { RootState } from '~/store'
import { printerApi } from '~/api/printer.api'
import type {
  Printer,
  PrinterCreateInput,
  PrinterUpdateInput,
  PrinterType,
} from '~/types/printer.types'

/**
 * Hook de gestion des imprimantes configurees pour le restaurant.
 */
export const usePrinters = () => {
  const dispatch = useDispatch()
  const printersRecord = useSelector(
    (state: RootState) => state.printers.printers
  )

  const printers = useMemo<Printer[]>(
    () => Object.values(printersRecord).sort((a, b) => a.name.localeCompare(b.name)),
    [printersRecord]
  )

  const getPrintersByType = useCallback(
    (type: PrinterType) => printers.filter((p) => p.type === type && p.isActive),
    [printers]
  )

  const loadPrinters = useCallback(async () => {
    const data = await printerApi.list()
    dispatch(printersActions.setPrinters(data))
    return data
  }, [dispatch])

  const createPrinter = useCallback(
    async (input: PrinterCreateInput) => {
      const created = await printerApi.create(input)
      dispatch(printersActions.upsertPrinter(created))
      return created
    },
    [dispatch]
  )

  const updatePrinter = useCallback(
    async (id: string, input: PrinterUpdateInput) => {
      const updated = await printerApi.update(id, input)
      dispatch(printersActions.upsertPrinter(updated))
      return updated
    },
    [dispatch]
  )

  const deletePrinter = useCallback(
    async (id: string) => {
      await printerApi.remove(id)
      dispatch(printersActions.removePrinter(id))
    },
    [dispatch]
  )

  return {
    printers,
    getPrintersByType,
    loadPrinters,
    createPrinter,
    updatePrinter,
    deletePrinter,
  }
}
