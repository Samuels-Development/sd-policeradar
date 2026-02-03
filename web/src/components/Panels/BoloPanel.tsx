import { useState, useCallback } from 'react'
import { useRadarStore } from '@/store/useRadarStore'
import { DraggablePanel } from '@/components/common/DraggablePanel'
import { fetchNui } from '@/hooks/useNuiCallback'

interface BoloPanelProps {
  onAddBolo: () => void
}

export function BoloPanel({ onAddBolo }: BoloPanelProps) {
  const [isPositioning, setIsPositioning] = useState(false)

  const {
    showBolo,
    boloPlates,
    toggleBolo,
    removeBoloPlate,
    positions
  } = useRadarStore()

  const handlePositionChange = useCallback((position: { left: string; top: string; width: string; height: string }) => {
    fetchNui('savePositions', { bolo: position })
  }, [])

  if (!showBolo) return null

  return (
    <DraggablePanel
      id="bolo-panel"
      initialPosition={{ right: '20px', top: '20px' }}
      initialSize={{ width: '280px', height: '350px' }}
      minSize={{ width: 250, height: 200 }}
      maxSize={{ width: 450, height: 500 }}
      isPositioning={isPositioning}
      savedPosition={positions.bolo}
      resizeDirections={['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']}
      positioningHint="DRAG TO MOVE  \2022  DRAG EDGES TO RESIZE"
      onPositionChange={handlePositionChange}
      className="z-40"
    >
      <div className="radar-panel w-full h-full flex flex-col">
        <div className="radar-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-medium text-zinc-300 tracking-wider">
              {isPositioning ? 'POSITIONING' : 'BOLO PLATES'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className={`control-btn ${isPositioning ? 'active' : ''}`}
              onClick={() => setIsPositioning(prev => !prev)}
              title="Position"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              className="control-btn"
              onClick={onAddBolo}
              title="Add BOLO"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              className="control-btn"
              onClick={toggleBolo}
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 p-3 overflow-y-auto">
          {boloPlates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm">No BOLO plates</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {boloPlates.map((plate) => (
                <div
                  key={plate}
                  className="flex items-center justify-between p-3 bg-zinc-900 rounded border border-zinc-700 hover:border-amber-500/50 transition-colors"
                >
                  <span className="text-sm font-bold text-amber-400 font-mono tracking-widest">
                    {plate}
                  </span>
                  <button
                    className="control-btn"
                    onClick={() => removeBoloPlate(plate)}
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DraggablePanel>
  )
}
