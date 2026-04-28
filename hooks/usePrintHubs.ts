import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { printersActions } from '~/store'
import type { RootState } from '~/store'
import { printHubApi } from '~/api/printer.api'
import type { PrintHub, PrintHubCreateInput } from '~/types/printer.types'

/**
 * Hook de gestion des hubs d'impression (Raspberry Pi).
 */
export const usePrintHubs = () => {
  const dispatch = useDispatch()
  const hubsRecord = useSelector((state: RootState) => state.printers.hubs)
  const isHubOnline = useSelector((state: RootState) => state.printers.isHubOnline)
  const lastRevealedToken = useSelector(
    (state: RootState) => state.printers.lastRevealedToken
  )

  const hubs = useMemo<PrintHub[]>(
    () =>
      Object.values(hubsRecord).sort(
        (a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? '')
      ),
    [hubsRecord]
  )

  const loadHubs = useCallback(async () => {
    const data = await printHubApi.list()
    dispatch(printersActions.setHubs(data))
    return data
  }, [dispatch])

  const createHub = useCallback(
    async (input: PrintHubCreateInput) => {
      const result = await printHubApi.register(input)
      dispatch(
        printersActions.upsertHub({
          id: result.hub.id,
          deviceFingerprint: result.hub.deviceFingerprint,
          deviceName: result.hub.deviceName,
          devicePlatform: result.hub.devicePlatform,
          lastIp: null,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
          online: false,
        })
      )
      dispatch(printersActions.setRevealedToken(result.deviceToken))
      return result
    },
    [dispatch]
  )

  const revokeHub = useCallback(
    async (id: string) => {
      await printHubApi.revoke(id)
      dispatch(printersActions.removeHub(id))
    },
    [dispatch]
  )

  const clearRevealedToken = useCallback(() => {
    dispatch(printersActions.setRevealedToken(null))
  }, [dispatch])

  return {
    hubs,
    isHubOnline,
    lastRevealedToken,
    loadHubs,
    createHub,
    revokeHub,
    clearRevealedToken,
  }
}
