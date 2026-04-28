import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type {
  Printer,
  PrintHub,
  PrintJob,
} from '~/types/printer.types'

export interface PrintersState {
  printers: Record<string, Printer>
  hubs: Record<string, PrintHub>
  jobs: Record<string, PrintJob>
  isHubOnline: boolean
  lastRevealedToken: string | null
}

const initialState: PrintersState = {
  printers: {},
  hubs: {},
  jobs: {},
  isHubOnline: false,
  lastRevealedToken: null,
}

const normalizeArray = <T extends { id: string }>(arr: T[]): Record<string, T> =>
  arr.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})

const printersSlice = createSlice({
  name: 'printers',
  initialState,
  reducers: {
    // Printers
    setPrinters(state, action: PayloadAction<Printer[]>) {
      state.printers = normalizeArray(action.payload)
    },
    upsertPrinter(state, action: PayloadAction<Printer>) {
      state.printers[action.payload.id] = action.payload
    },
    removePrinter(state, action: PayloadAction<string>) {
      delete state.printers[action.payload]
    },

    // Hubs
    setHubs(state, action: PayloadAction<PrintHub[]>) {
      state.hubs = normalizeArray(action.payload)
      state.isHubOnline = action.payload.some((h) => h.online)
    },
    upsertHub(state, action: PayloadAction<PrintHub>) {
      state.hubs[action.payload.id] = action.payload
      state.isHubOnline = Object.values(state.hubs).some((h) => h.online)
    },
    removeHub(state, action: PayloadAction<string>) {
      delete state.hubs[action.payload]
      state.isHubOnline = Object.values(state.hubs).some((h) => h.online)
    },
    setHubOnline(state, action: PayloadAction<{ id: string; online: boolean }>) {
      const hub = state.hubs[action.payload.id]
      if (hub) {
        hub.online = action.payload.online
      }
      state.isHubOnline = Object.values(state.hubs).some((h) => h.online)
    },

    // Jobs
    setJobs(state, action: PayloadAction<PrintJob[]>) {
      state.jobs = normalizeArray(action.payload)
    },
    upsertJobs(state, action: PayloadAction<PrintJob[]>) {
      for (const job of action.payload) {
        state.jobs[job.id] = job
      }
    },
    upsertJob(state, action: PayloadAction<PrintJob>) {
      state.jobs[action.payload.id] = action.payload
    },
    removeJob(state, action: PayloadAction<string>) {
      delete state.jobs[action.payload]
    },

    // Token reveal (shown only once after hub creation)
    setRevealedToken(state, action: PayloadAction<string | null>) {
      state.lastRevealedToken = action.payload
    },

    reset() {
      return initialState
    },
  },
})

export const printersActions = printersSlice.actions
export default printersSlice.reducer
