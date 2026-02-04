import { useState, useEffect, useCallback } from 'react'
import { Radar } from '@/components/Radar/Radar'
import { LogPanel } from '@/components/Panels/LogPanel'
import { BoloPanel } from '@/components/Panels/BoloPanel'
import { KeybindsPanel } from '@/components/Panels/KeybindsPanel'
import { SpeedLockModal } from '@/components/Modals/SpeedLockModal'
import { BoloModal } from '@/components/Modals/BoloModal'
import { useNuiEvent } from '@/hooks/useNuiEvent'
import { useRadarStore } from '@/store/useRadarStore'
import { debugData, isEnvBrowser } from '@/utils/misc'
import type { NuiMessage, UpdateMessage, SpeedLockTriggeredMessage, Keybinds, SavedPositions } from '@/types'

function Notification({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onHide, 3000)
    return () => clearTimeout(timer)
  }, [onHide])

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1001] notification">
      <div className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg text-sm font-medium">
        {message}
      </div>
    </div>
  )
}

let notifCounter = 0

export default function App() {
  const [notification, setNotification] = useState<{ message: string; key: number } | null>(null)
  const [speedLockModalOpen, setSpeedLockModalOpen] = useState(false)
  const [boloModalOpen, setBoloModalOpen] = useState(false)

  const {
    isVisible,
    notificationType,
    setVisible,
    toggleFullLock,
    toggleSpeedLock,
    togglePlateLock,
    updateSpeeds,
    updatePlates,
    setSpeedUnit,
    setNotificationType,
    setKeybinds,
    setBoloPlates,
    setPositions,
    toggleLog,
    toggleBolo,
    toggleKeybinds,
    addSavedReading,
    setSpeedLockEnabled,
    updateApproaching,
    setLedGlow
  } = useRadarStore()

  const showNotification = useCallback((message: string) => {
    if (notificationType === 'native') {
      setNotification({ message, key: ++notifCounter })
    }
  }, [notificationType])

  useNuiEvent<NuiMessage>('open', () => {
    setVisible(true)
  })

  useNuiEvent<NuiMessage>('close', () => {
    setVisible(false)
  })

  useNuiEvent<UpdateMessage>('update', (data) => {
    if (data.frontSpeed !== undefined || data.rearSpeed !== undefined) {
      updateSpeeds(data.frontSpeed ?? 0, data.rearSpeed ?? 0, data.patrolSpeed)
    }
    if (data.frontPlate !== undefined || data.rearPlate !== undefined) {
      updatePlates(data.frontPlate ?? '', data.rearPlate ?? '', data.frontPlateIndex, data.rearPlateIndex)
    }
    if (data.frontApproaching !== undefined || data.rearApproaching !== undefined) {
      updateApproaching(data.frontApproaching ?? false, data.rearApproaching ?? false)
    }
  })

  useNuiEvent<{ cam: string; plate: string; plateIndex: number }>('plateUpdate', (data) => {
    const state = useRadarStore.getState()
    if (data.cam === 'front') {
      updatePlates(data.plate, state.rearPlate, data.plateIndex, state.rearPlateIndex)
    } else {
      updatePlates(state.frontPlate, data.plate, state.frontPlateIndex, data.plateIndex)
    }
  })

  useNuiEvent<{ keybinds: Keybinds }>('setKeybinds', (data) => {
    setKeybinds(data.keybinds)
  })

  useNuiEvent<{ notificationType: 'native' | 'custom' }>('setNotificationType', (data) => {
    setNotificationType(data.notificationType)
  })

  useNuiEvent<{ speedUnit: 'MPH' | 'KMH' }>('setSpeedUnit', (data) => {
    setSpeedUnit(data.speedUnit)
  })

  useNuiEvent<{ ledGlow: boolean }>('setLedGlow', (data) => {
    setLedGlow(data.ledGlow)
  })

  useNuiEvent<{ positions: SavedPositions }>('loadPositions', (data) => {
    setPositions(data.positions)
  })

  useNuiEvent<{ plates: string[] }>('updateBoloPlates', (data) => {
    setBoloPlates(data.plates)
  })

  useNuiEvent<NuiMessage>('saveReading', () => {
    const state = useRadarStore.getState()
    const now = new Date()
    addSavedReading({
      timestamp: `${now.toLocaleTimeString()} ${now.toLocaleDateString()}`,
      frontSpeed: state.frontSpeed,
      rearSpeed: state.rearSpeed,
      lockedFrontSpeed: state.lockedFrontSpeed,
      lockedRearSpeed: state.lockedRearSpeed,
      frontPlate: state.frontPlate,
      rearPlate: state.rearPlate,
      lockedFrontPlate: state.lockedFrontPlate,
      lockedRearPlate: state.lockedRearPlate
    })
    showNotification('Saved radar reading')
  })

  useNuiEvent<NuiMessage>('toggleLock', () => {
    toggleFullLock()
    const state = useRadarStore.getState()
    showNotification(`Radar ${state.isSpeedLocked && state.isPlateLocked ? 'locked' : 'unlocked'}`)
  })

  useNuiEvent<NuiMessage>('toggleSpeedLock', () => {
    toggleSpeedLock()
    const state = useRadarStore.getState()
    showNotification(`Speed ${state.isSpeedLocked ? 'locked' : 'unlocked'}`)
  })

  useNuiEvent<NuiMessage>('togglePlateLock', () => {
    togglePlateLock()
    const state = useRadarStore.getState()
    showNotification(`Plates ${state.isPlateLocked ? 'locked' : 'unlocked'}`)
  })


  useNuiEvent<NuiMessage>('toggleLog', () => {
    toggleLog()
    const state = useRadarStore.getState()
    showNotification(state.showLog ? 'Log opened' : 'Log closed')
  })

  useNuiEvent<NuiMessage>('toggleBolo', () => {
    toggleBolo()
    const state = useRadarStore.getState()
    showNotification(state.showBolo ? 'BOLO list opened' : 'BOLO list closed')
  })

  useNuiEvent<NuiMessage>('toggleKeybinds', () => {
    toggleKeybinds()
    const state = useRadarStore.getState()
    showNotification(state.showKeybinds ? 'Keybinds shown' : 'Keybinds hidden')
  })

  useNuiEvent<NuiMessage>('openSpeedLockModal', () => {
    setSpeedLockModalOpen(true)
  })

  useNuiEvent<SpeedLockTriggeredMessage>('speedLockTriggered', (data) => {
    const state = useRadarStore.getState()
    if (state.speedLockEnabled) {
      if (!state.isSpeedLocked || !state.isPlateLocked) {
        toggleFullLock()
      }
      setSpeedLockEnabled(false)
      const plateInfo = data.plate && data.plate !== '--------' ? ` (${data.plate})` : ''
      showNotification(
        `Auto-locked: ${data.direction} radar - ${data.speed} ${state.speedUnit}${plateInfo} exceeds ${state.speedLockThreshold} ${state.speedUnit} threshold`
      )
    }
  })

  useEffect(() => {
    if (isEnvBrowser()) {
      debugData([
        {
          action: 'open',
          data: {}
        },
        {
          action: 'setKeybinds',
          data: {
            keybinds: {
              ToggleRadar: 'F6',
              Interact: 'F7',
              SaveReading: 'J',
              LockRadar: 'F9',
              LockSpeed: 'N',
              LockPlate: 'M',
              ToggleLog: 'F10',
              ToggleBolo: 'F11',
              ToggleKeybinds: 'F12'
            }
          }
        },
        {
          action: 'setSpeedUnit',
          data: { speedUnit: 'MPH' }
        },
        {
          action: 'setNotificationType',
          data: { notificationType: 'native' }
        }
      ], 100)

      const interval = setInterval(() => {
        debugData([
          {
            action: 'update',
            data: {
              frontSpeed: Math.floor(Math.random() * 120),
              rearSpeed: Math.floor(Math.random() * 100),
              patrolSpeed: Math.floor(Math.random() * 80),
              frontPlate: 'ABC123',
              rearPlate: 'XYZ789'
            }
          }
        ], 0)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      if (e.key === 'Backspace') {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (!isVisible) return null

  return (
    <>
      {notification && (
        <Notification key={notification.key} message={notification.message} onHide={() => setNotification(null)} />
      )}

      <Radar onOpenSpeedLock={() => setSpeedLockModalOpen(true)} />

      <LogPanel />
      <BoloPanel onAddBolo={() => setBoloModalOpen(true)} />
      <KeybindsPanel />

      <SpeedLockModal
        isOpen={speedLockModalOpen}
        onClose={() => setSpeedLockModalOpen(false)}
      />

      <BoloModal
        isOpen={boloModalOpen}
        onClose={() => setBoloModalOpen(false)}
      />
    </>
  )
}
