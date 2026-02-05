import { useCallback } from 'react'
import { useRadarStore } from '@/store/useRadarStore'
import { DraggablePanel } from '@/components/common/DraggablePanel'
import { fetchNui } from '@/hooks/useNuiCallback'

export function LogPanel() {
  const {
    positioningLog: isPositioning,
    togglePositioningLog,
    showLog,
    savedReadings,
    speedUnit,
    toggleLog,
    removeSavedReading,
    positions
  } = useRadarStore()

  const handlePositionChange = useCallback((position: { left: string; top: string; width: string; height: string }) => {
    fetchNui('savePositions', { log: position })
  }, [])

  if (!showLog) return null

  return (
    <DraggablePanel
      id="log-panel"
      initialPosition={{ left: '20px', top: '50%' }}
      initialSize={{ width: '320px', height: '400px' }}
      minSize={{ width: 280, height: 200 }}
      maxSize={{ width: 500, height: 600 }}
      isPositioning={isPositioning}
      savedPosition={positions.log}
      resizeDirections={['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']}
      positioningHint="DRAG TO MOVE  \2022  DRAG EDGES TO RESIZE"
      onPositionChange={handlePositionChange}
      className="z-40"
    >
      <div className="radar-panel w-full h-full flex flex-col">
        <div className="radar-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-zinc-300 tracking-wider">
              {isPositioning ? 'POSITIONING' : 'RADAR LOG'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className={`control-btn ${isPositioning ? 'active' : ''}`}
              onClick={() => togglePositioningLog()}
              title="Position"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              className="control-btn"
              onClick={toggleLog}
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 p-3 overflow-y-auto">
          {savedReadings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm">No saved readings</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {savedReadings.map((reading) => (
                <div
                  key={reading.id}
                  className="p-3 bg-zinc-900 rounded border border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Front</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-green-400">{reading.frontSpeed}</span>
                          <span className="text-[10px] text-zinc-500">{speedUnit.toLowerCase()}</span>
                        </div>
                        {reading.lockedFrontSpeed > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500">LOCK</span>
                            <span className="text-xs font-bold text-red-400">{reading.lockedFrontSpeed}</span>
                          </div>
                        )}
                        <div className="text-xs text-zinc-300 font-mono tracking-wider">
                          {(reading.lockedFrontPlate || reading.frontPlate) || '--------'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase">Rear</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold text-red-400">{reading.rearSpeed}</span>
                          <span className="text-[10px] text-zinc-500">{speedUnit.toLowerCase()}</span>
                        </div>
                        {reading.lockedRearSpeed > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-500">LOCK</span>
                            <span className="text-xs font-bold text-amber-400">{reading.lockedRearSpeed}</span>
                          </div>
                        )}
                        <div className="text-xs text-zinc-300 font-mono tracking-wider">
                          {(reading.lockedRearPlate || reading.rearPlate) || '--------'}
                        </div>
                      </div>
                    </div>
                    <button
                      className="control-btn"
                      onClick={() => removeSavedReading(reading.id)}
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-2">{reading.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DraggablePanel>
  )
}
