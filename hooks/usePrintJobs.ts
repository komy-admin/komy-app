import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { printersActions } from '~/store'
import type { RootState } from '~/store'
import { printJobApi } from '~/api/printer.api'
import type { PrintJob, PrintJobsFilters } from '~/types/printer.types'

/**
 * Hook de gestion des jobs d'impression pour l'ecran de monitoring.
 */
export const usePrintJobs = () => {
  const dispatch = useDispatch()
  const jobsRecord = useSelector((state: RootState) => state.printers.jobs)

  const jobs = useMemo<PrintJob[]>(
    () =>
      Object.values(jobsRecord).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      ),
    [jobsRecord]
  )

  const loadJobs = useCallback(
    async (filters: PrintJobsFilters = {}) => {
      const page = await printJobApi.list(filters)
      dispatch(printersActions.setJobs(page.items))
      return page
    },
    [dispatch]
  )

  const cancelJob = useCallback(
    async (id: string) => {
      const updated = await printJobApi.cancel(id)
      dispatch(printersActions.upsertJob(updated))
      return updated
    },
    [dispatch]
  )

  const retryJob = useCallback(
    async (id: string) => {
      const updated = await printJobApi.retry(id)
      dispatch(printersActions.upsertJob(updated))
      return updated
    },
    [dispatch]
  )

  const getJobById = useCallback(
    (id: string): PrintJob | undefined => jobsRecord[id],
    [jobsRecord]
  )

  const jobsByPrinter = useMemo(() => {
    const map: Record<string, PrintJob[]> = {}
    for (const job of jobs) {
      if (!map[job.printerId]) map[job.printerId] = []
      map[job.printerId].push(job)
    }
    return map
  }, [jobs])

  const counts = useMemo(() => {
    const base = {
      pending: 0,
      sent: 0,
      acked: 0,
      failed: 0,
      dead: 0,
      cancelled: 0,
    }
    for (const job of jobs) base[job.status]++
    return base
  }, [jobs])

  return {
    jobs,
    jobsByPrinter,
    counts,
    loadJobs,
    cancelJob,
    retryJob,
    getJobById,
  }
}
