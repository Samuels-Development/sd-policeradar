import { useState, useCallback, useEffect, useRef } from 'react'
import { useRadarStore } from '@/store/useRadarStore'
import { fetchNui } from '@/hooks/useNuiCallback'

interface SpeedLockModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SpeedLockModal({ isOpen, onClose }: SpeedLockModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { speedLockThreshold, speedUnit, setSpeedLockThreshold, setSpeedLockEnabled } = useRadarStore()
  const [value, setValue] = useState(String(speedLockThreshold))

  useEffect(() => {
    if (isOpen) {
      setValue(String(speedLockThreshold))
      fetchNui('inputActive', {})
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    }
  }, [isOpen, speedLockThreshold])

  const handleClose = useCallback(() => {
    fetchNui('inputInactive', {})
    onClose()
  }, [onClose])

  const handleSet = useCallback(() => {
    const threshold = parseInt(value)
    if (threshold && threshold > 0 && threshold <= 200) {
      setSpeedLockThreshold(threshold)
      setSpeedLockEnabled(true)
      fetchNui('setSpeedLockThreshold', { threshold, enabled: true })
      handleClose()
    }
  }, [value, setSpeedLockThreshold, setSpeedLockEnabled, handleClose])

  const handleDisable = useCallback(() => {
    setSpeedLockEnabled(false)
    fetchNui('setSpeedLockThreshold', { threshold: speedLockThreshold, enabled: false })
    handleClose()
  }, [speedLockThreshold, setSpeedLockEnabled, handleClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSet()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }, [handleSet, handleClose])

  const increment = useCallback(() => {
    setValue(prev => {
      const n = Math.max(1, Math.min(200, (parseInt(prev) || 0) + 5))
      return String(n)
    })
  }, [])

  const decrement = useCallback(() => {
    setValue(prev => {
      const n = Math.max(1, Math.min(200, (parseInt(prev) || 0) - 5))
      return String(n)
    })
  }, [])

  const startHold = useCallback((fn: () => void) => {
    fn()
    const id = setInterval(fn, 120)
    holdRef.current = id
  }, [])

  const stopHold = useCallback(() => {
    if (holdRef.current) {
      clearInterval(holdRef.current)
      holdRef.current = null
    }
  }, [])

  useEffect(() => {
    return stopHold
  }, [stopHold])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw === '') {
      setValue('')
    } else {
      const n = parseInt(raw)
      if (n > 200) {
        setValue('200')
      } else {
        setValue(raw)
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center modal-backdrop" onClick={handleClose}>
      <div className="radar-panel w-80" onClick={e => e.stopPropagation()}>
        <div className="radar-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-medium text-zinc-300 tracking-wider">SPEED LOCK THRESHOLD</span>
          </div>
          <button className="control-btn" onClick={handleClose}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-stretch gap-0 rounded overflow-hidden border border-zinc-600 focus-within:border-blue-500 transition-colors">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="flex-1 px-4 py-3 bg-zinc-900 text-zinc-100 font-mono text-center text-lg tracking-wider focus:outline-none border-none"
            />
            <div className="flex flex-col w-10 border-l border-zinc-600">
              <button
                type="button"
                onMouseDown={() => startHold(increment)}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                className="flex-1 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer border-b border-zinc-600"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                type="button"
                onMouseDown={() => startHold(decrement)}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                className="flex-1 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-zinc-500 -mt-2 tracking-wide">
            1 &ndash; 200 {speedUnit} &middot; step &plusmn;5
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDisable}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Disable
            </button>
            <button
              onClick={handleSet}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Set Threshold
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
