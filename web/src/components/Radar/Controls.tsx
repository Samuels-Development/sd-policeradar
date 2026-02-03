import { memo } from 'react'
import { useRadarStore } from '@/store/useRadarStore'

interface ControlsProps {
  onToggleLock: () => void
  onToggleLog: () => void
  onToggleBolo: () => void
  onToggleKeybinds: () => void
  onSaveReading: () => void
  onOpenSpeedLock: () => void
  onTogglePositioning: () => void
  isPositioning: boolean
}

export const Controls = memo(function Controls({
  onToggleLock,
  onToggleLog,
  onToggleBolo,
  onToggleKeybinds,
  onSaveReading,
  onOpenSpeedLock,
  onTogglePositioning,
  isPositioning
}: ControlsProps) {
  const isSpeedLocked = useRadarStore((state) => state.isSpeedLocked)
  const isPlateLocked = useRadarStore((state) => state.isPlateLocked)
  const isFullLocked = isSpeedLocked && isPlateLocked
  const showLog = useRadarStore((state) => state.showLog)
  const showBolo = useRadarStore((state) => state.showBolo)
  const showKeybinds = useRadarStore((state) => state.showKeybinds)

  return (
    <div className="flex items-center gap-1 bg-zinc-900 rounded px-1 py-1 border border-zinc-700">
      <button
        className={`control-btn ${showKeybinds ? 'active' : ''}`}
        onClick={onToggleKeybinds}
        title="Keybinds"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      <button
        className={`control-btn ${showBolo ? 'active' : ''}`}
        onClick={onToggleBolo}
        title="BOLO List"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </button>

      <button
        className={`control-btn ${showLog ? 'active' : ''}`}
        onClick={onToggleLog}
        title="Log"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <button
        className="control-btn"
        onClick={onOpenSpeedLock}
        title="Speed Lock Threshold"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      <button
        className={`control-btn ${isPositioning ? 'active' : ''}`}
        onClick={onTogglePositioning}
        title="Position"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      <button
        className={`control-btn ${isFullLocked ? 'active' : ''}`}
        onClick={onToggleLock}
        title={isFullLocked ? 'Unlock All' : 'Lock All'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isFullLocked ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          )}
        </svg>
      </button>

      <button
        className="control-btn"
        onClick={onSaveReading}
        title="Save Reading"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      </button>
    </div>
  )
})
