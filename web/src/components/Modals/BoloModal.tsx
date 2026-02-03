import { useState, useCallback, useEffect, useRef } from 'react'
import { useRadarStore } from '@/store/useRadarStore'
import { fetchNui } from '@/hooks/useNuiCallback'

interface BoloModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BoloModal({ isOpen, onClose }: BoloModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const { addBoloPlate } = useRadarStore()

  useEffect(() => {
    if (isOpen) {
      setValue('')
      fetchNui('inputActive', {})
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    fetchNui('inputInactive', {})
    onClose()
  }, [onClose])

  const handleAdd = useCallback(() => {
    const plate = value.trim().toUpperCase()
    if (plate) {
      addBoloPlate(plate)
      handleClose()
    }
  }, [value, addBoloPlate, handleClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    }
  }, [handleAdd, handleClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center modal-backdrop" onClick={handleClose}>
      <div className="radar-panel w-80" onClick={e => e.stopPropagation()}>
        <div className="radar-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-medium text-zinc-300 tracking-wider">ADD BOLO PLATE</span>
          </div>
          <button className="control-btn" onClick={handleClose}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Enter plate number"
            maxLength={8}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-600 rounded text-zinc-100 font-mono text-center text-lg tracking-widest uppercase focus:outline-none focus:border-amber-500"
          />

          <button
            onClick={handleAdd}
            className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add BOLO
          </button>
        </div>
      </div>
    </div>
  )
}
