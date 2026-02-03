import { create } from 'zustand'
import { RadarState, Direction, SpeedUnit, NotificationType, Keybinds, SavedPositions, SavedReading } from '@/types'
import { fetchNui } from '@/hooks/useNuiCallback'

interface RadarActions {
  setVisible: (visible: boolean) => void
  toggleFullLock: () => void
  toggleSpeedLock: () => void
  togglePlateLock: () => void
  updateSpeeds: (front: number, rear: number, patrol?: number) => void
  updatePlates: (front: string, rear: string, frontIndex?: number, rearIndex?: number) => void
  updateApproaching: (frontApproaching: boolean, rearApproaching: boolean) => void
  setSelectedDirection: (direction: Direction) => void
  setSpeedUnit: (unit: SpeedUnit) => void
  setNotificationType: (type: NotificationType) => void
  setKeybinds: (keybinds: Keybinds) => void
  addBoloPlate: (plate: string) => void
  removeBoloPlate: (plate: string) => void
  setBoloPlates: (plates: string[]) => void
  addSavedReading: (reading: Omit<SavedReading, 'id'>) => void
  removeSavedReading: (id: number) => void
  toggleLog: () => void
  toggleBolo: () => void
  toggleKeybinds: () => void
  setSpeedLockThreshold: (threshold: number) => void
  setSpeedLockEnabled: (enabled: boolean) => void
  setPositions: (positions: SavedPositions) => void
  clearLocked: () => void
  toggleFrontMode: () => void
  toggleRearMode: () => void
  toggleFrontXmit: () => void
  toggleRearXmit: () => void
  reset: () => void
}

const initialState: RadarState = {
  isVisible: false,
  isSpeedLocked: false,
  isPlateLocked: false,
  frontSpeed: 0,
  rearSpeed: 0,
  patrolSpeed: 0,
  lockedFrontSpeed: 0,
  lockedRearSpeed: 0,
  frontPlate: '',
  rearPlate: '',
  lockedFrontPlate: '',
  lockedRearPlate: '',
  frontPlateIndex: 0,
  rearPlateIndex: 0,
  lockedFrontPlateIndex: 0,
  lockedRearPlateIndex: 0,
  frontMode: 'same',
  rearMode: 'opp',
  frontApproaching: false,
  rearApproaching: false,
  frontXmit: true,
  rearXmit: true,
  selectedDirection: 'Front',
  speedUnit: 'MPH',
  notificationType: 'native',
  keybinds: {},
  boloPlates: [],
  savedReadings: [],
  showLog: false,
  showBolo: false,
  showKeybinds: false,
  speedLockThreshold: 80,
  speedLockEnabled: false,
  positions: {},
}


let readingIdCounter = 1

export const useRadarStore = create<RadarState & RadarActions>((set, get) => ({
  ...initialState,

  setVisible: (visible) => set({ isVisible: visible }),

  toggleFullLock: () => {
    const state = get()
    const anyLocked = state.isSpeedLocked || state.isPlateLocked

    if (!anyLocked) {
      set({
        isSpeedLocked: true,
        isPlateLocked: true,
        lockedFrontSpeed: state.frontSpeed,
        lockedRearSpeed: state.rearSpeed,
        lockedFrontPlate: state.frontPlate,
        lockedRearPlate: state.rearPlate,
        lockedFrontPlateIndex: state.frontPlateIndex,
        lockedRearPlateIndex: state.rearPlateIndex
      })
    } else {
      set({ isSpeedLocked: false, isPlateLocked: false })

      if (state.speedLockThreshold > 0) {
        fetchNui('setSpeedLockThreshold', {
          threshold: state.speedLockThreshold,
          enabled: true
        })
      }
    }
  },

  toggleSpeedLock: () => {
    const state = get()
    const newLocked = !state.isSpeedLocked

    if (newLocked) {
      set({
        isSpeedLocked: true,
        lockedFrontSpeed: state.frontSpeed,
        lockedRearSpeed: state.rearSpeed
      })
    } else {
      set({ isSpeedLocked: false })

      if (state.speedLockThreshold > 0) {
        fetchNui('setSpeedLockThreshold', {
          threshold: state.speedLockThreshold,
          enabled: true
        })
      }
    }
  },

  togglePlateLock: () => {
    const state = get()
    const newLocked = !state.isPlateLocked

    if (newLocked) {
      set({
        isPlateLocked: true,
        lockedFrontPlate: state.frontPlate,
        lockedRearPlate: state.rearPlate,
        lockedFrontPlateIndex: state.frontPlateIndex,
        lockedRearPlateIndex: state.rearPlateIndex
      })
    } else {
      set({ isPlateLocked: false })
    }
  },

  updateSpeeds: (front, rear, patrol) => set({
    frontSpeed: front,
    rearSpeed: rear,
    ...(patrol !== undefined && { patrolSpeed: patrol })
  }),

  updatePlates: (front, rear, frontIndex, rearIndex) => set({
    frontPlate: front,
    rearPlate: rear,
    ...(frontIndex !== undefined && { frontPlateIndex: frontIndex }),
    ...(rearIndex !== undefined && { rearPlateIndex: rearIndex })
  }),

  updateApproaching: (frontApproaching, rearApproaching) => set({
    frontApproaching,
    rearApproaching
  }),

  setSelectedDirection: (direction) => set({ selectedDirection: direction }),

  setSpeedUnit: (unit) => set({ speedUnit: unit }),

  setNotificationType: (type) => set({ notificationType: type }),

  setKeybinds: (keybinds) => set({ keybinds }),

  addBoloPlate: (plate) => {
    const upperPlate = plate.toUpperCase().trim()
    set((state) => {
      if (state.boloPlates.includes(upperPlate)) return state
      return { boloPlates: [...state.boloPlates, upperPlate] }
    })
    fetchNui('addBoloPlate', { plate: upperPlate })
  },

  removeBoloPlate: (plate) => {
    set((state) => ({
      boloPlates: state.boloPlates.filter((p) => p !== plate)
    }))
    fetchNui('removeBoloPlate', { plate })
  },

  setBoloPlates: (plates) => set({ boloPlates: plates }),

  addSavedReading: (reading) => {
    const newReading: SavedReading = {
      ...reading,
      id: readingIdCounter++
    }
    set((state) => ({
      savedReadings: [newReading, ...state.savedReadings]
    }))
  },

  removeSavedReading: (id) => {
    set((state) => ({
      savedReadings: state.savedReadings.filter((r) => r.id !== id)
    }))
  },

  toggleLog: () => set((state) => ({ showLog: !state.showLog })),

  toggleBolo: () => set((state) => ({ showBolo: !state.showBolo })),

  toggleKeybinds: () => set((state) => ({ showKeybinds: !state.showKeybinds })),

  setSpeedLockThreshold: (threshold) => set({ speedLockThreshold: threshold }),

  setSpeedLockEnabled: (enabled) => set({ speedLockEnabled: enabled }),

  setPositions: (positions) => set({ positions }),

  clearLocked: () => set({
    isSpeedLocked: false,
    isPlateLocked: false,
    lockedFrontSpeed: 0,
    lockedRearSpeed: 0,
    lockedFrontPlate: '',
    lockedRearPlate: '',
    lockedFrontPlateIndex: 0,
    lockedRearPlateIndex: 0
  }),

  toggleFrontMode: () => set((state) => ({
    frontMode: state.frontMode === 'same' ? 'opp' : 'same'
  })),

  toggleRearMode: () => set((state) => ({
    rearMode: state.rearMode === 'opp' ? 'same' : 'opp'
  })),

  toggleFrontXmit: () => set((state) => ({
    frontXmit: !state.frontXmit
  })),

  toggleRearXmit: () => set((state) => ({
    rearXmit: !state.rearXmit
  })),

  reset: () => set(initialState)
}))
