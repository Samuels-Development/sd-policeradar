import { useCallback, useEffect } from 'react'
import { useRadarStore } from '@/store/useRadarStore'
import { SevenSegment } from '@/components/common/SevenSegment'
import { DraggablePanel } from '@/components/common/DraggablePanel'
import { PlateImage } from './PlateImage'
import { ModeIndicator } from './ModeIndicator'
import { fetchNui } from '@/hooks/useNuiCallback'

interface RadarProps {
  onOpenSpeedLock?: () => void
}

export function Radar({ onOpenSpeedLock }: RadarProps) {
  const {
    positioningRadar: isPositioning,
    togglePositioningRadar,
    isSpeedLocked,
    isPlateLocked,
    frontSpeed,
    rearSpeed,
    patrolSpeed,
    lockedFrontSpeed,
    lockedRearSpeed,
    frontPlate,
    rearPlate,
    lockedFrontPlate,
    lockedRearPlate,
    frontPlateIndex,
    rearPlateIndex,
    lockedFrontPlateIndex,
    lockedRearPlateIndex,
    boloPlates,
    frontApproaching,
    rearApproaching,
    frontXmit,
    rearXmit,
    toggleFullLock,
    toggleSpeedLock,
    togglePlateLock,
    toggleLog,
    toggleBolo,
    toggleKeybinds,
    addSavedReading,
    showLog,
    showBolo,
    showKeybinds,
    speedLockEnabled,
    positions
  } = useRadarStore()

  const isFullLocked = isSpeedLocked && isPlateLocked

  const isFrontBolo = frontPlate && boloPlates.some(p => p === frontPlate.toUpperCase().trim())
  const isRearBolo = rearPlate && boloPlates.some(p => p === rearPlate.toUpperCase().trim())

  useEffect(() => {
    if (isFrontBolo || isRearBolo) {
      fetchNui('boloAlert', {
        plate: isFrontBolo ? frontPlate : rearPlate,
        direction: isFrontBolo ? 'front' : 'rear'
      })
    }
  }, [isFrontBolo, isRearBolo, frontPlate, rearPlate])

  const handleSaveReading = useCallback(() => {
    const now = new Date()
    const timestamp = `${now.toLocaleTimeString()} ${now.toLocaleDateString()}`
    addSavedReading({
      timestamp,
      frontSpeed,
      rearSpeed,
      lockedFrontSpeed,
      lockedRearSpeed,
      frontPlate,
      rearPlate,
      lockedFrontPlate,
      lockedRearPlate
    })
  }, [frontSpeed, rearSpeed, lockedFrontSpeed, lockedRearSpeed, frontPlate, rearPlate, lockedFrontPlate, lockedRearPlate, addSavedReading])

  const handleTogglePositioning = useCallback(() => {
    togglePositioningRadar()
  }, [togglePositioningRadar])

  const handlePositionChange = useCallback((position: { left: string; top: string; width: string; height: string }) => {
    fetchNui('savePositions', { radar: position })
  }, [])

  return (
    <DraggablePanel
      id="radar-panel"
      initialPosition={{ left: '50%', top: '50%' }}
      initialSize={{ width: '500px', height: 'auto' }}
      minSize={{ width: 500, height: 160 }}
      maxSize={{ width: 800, height: 300 }}
      isPositioning={isPositioning}
      savedPosition={positions.radar}
      onPositionChange={handlePositionChange}
      className="z-50"
    >
      <div className="radar-unit">
        <div className="radar-housing">
          <div className="radar-top-section">
            <div className="antenna-section front-section">
              <div className="speed-displays-row">
                <div className="speed-column">
                  <div className="mode-indicators-mini">
                    <ModeIndicator label="XMIT" isActive={frontXmit && frontSpeed > 0} color="green" />
                    <ModeIndicator label="APCH" isActive={frontApproaching && frontSpeed > 0} color="green" />
                    <ModeIndicator label="AWAY" isActive={!frontApproaching && frontSpeed > 0} color="cyan" />
                  </div>
                  <div className="led-display led-green-bg">
                    <SevenSegment value={frontXmit ? frontSpeed : 0} digits={3} color="green" size="sm" />
                  </div>
                </div>

                <div className="speed-column">
                  <div className="mode-indicators-mini">
                    <ModeIndicator label="LOCK" isActive={lockedFrontSpeed > 0} color="red" />
                    <ModeIndicator label="HLD" isActive={isSpeedLocked} color="red" />
                  </div>
                  <div className="led-display led-red-bg">
                    <SevenSegment value={lockedFrontSpeed} digits={3} color="red" size="sm" />
                  </div>
                </div>
              </div>

              <div className="section-label">FRONT</div>
            </div>

            <div className="section-divider" />

            <div className="antenna-section rear-section">
              <div className="speed-displays-row">
                <div className="speed-column">
                  <div className="mode-indicators-mini">
                    <ModeIndicator label="XMIT" isActive={rearXmit && rearSpeed > 0} color="red" />
                    <ModeIndicator label="APCH" isActive={rearApproaching && rearSpeed > 0} color="red" />
                    <ModeIndicator label="AWAY" isActive={!rearApproaching && rearSpeed > 0} color="cyan" />
                  </div>
                  <div className="led-display led-red-bg">
                    <SevenSegment value={rearXmit ? rearSpeed : 0} digits={3} color="red" size="sm" />
                  </div>
                </div>

                <div className="speed-column">
                  <div className="mode-indicators-mini">
                    <ModeIndicator label="LOCK" isActive={lockedRearSpeed > 0} color="amber" />
                    <ModeIndicator label="HLD" isActive={isSpeedLocked} color="amber" />
                  </div>
                  <div className="led-display led-amber-bg">
                    <SevenSegment value={lockedRearSpeed} digits={3} color="amber" size="sm" />
                  </div>
                </div>
              </div>

              <div className="section-label">REAR</div>
            </div>
          </div>

          <div className="radar-bottom-section">
            <div className="plates-section">
              <div className="plates-lock-indicator">
                <ModeIndicator label="LOCK" isActive={isPlateLocked} color="red" />
              </div>
              <div className="plates-row">
                <PlateImage
                  plate={isPlateLocked ? lockedFrontPlate : frontPlate}
                  plateIndex={isPlateLocked ? lockedFrontPlateIndex : frontPlateIndex}
                  isBolo={!!isFrontBolo}
                  label="FRONT"
                />
                <PlateImage
                  plate={isPlateLocked ? lockedRearPlate : rearPlate}
                  plateIndex={isPlateLocked ? lockedRearPlateIndex : rearPlateIndex}
                  isBolo={!!isRearBolo}
                  label="REAR"
                />
              </div>
            </div>

            <div className="patrol-section">
              <div className="patrol-display">
                <div className="led-display led-red-bg patrol-led">
                  <SevenSegment value={patrolSpeed} digits={3} color="red" size="sm" />
                </div>
              </div>
              <div className="patrol-label">PATROL SPEED</div>
            </div>

            <div className="controls-section">
              <button
                className={`radar-btn ${isPositioning ? 'active' : ''}`}
                onClick={handleTogglePositioning}
                title="Position"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
              </button>
              <button
                className={`radar-btn ${showKeybinds ? 'active' : ''}`}
                onClick={toggleKeybinds}
                title="Keybinds"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>
                </svg>
              </button>
              <button
                className={`radar-btn ${showLog ? 'active' : ''}`}
                onClick={toggleLog}
                title="Log"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </button>
              <button
                className={`radar-btn ${showBolo ? 'active' : ''}`}
                onClick={toggleBolo}
                title="BOLO"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96l-7-12a2 2 0 00-3.5 0l-7 12A2 2 0 005.07 19z"/>
                </svg>
              </button>
              <button
                className={`radar-btn ${speedLockEnabled ? 'active' : ''}`}
                onClick={onOpenSpeedLock}
                title="Speed Lock Threshold"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </button>
              <button
                className="radar-btn"
                onClick={handleSaveReading}
                title="Save Reading"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <path d="M17 21v-8H7v8M7 3v5h8"/>
                </svg>
              </button>

              <div className="lock-divider" />

              <button
                className={`radar-btn ${isFullLocked ? 'active' : ''}`}
                onClick={toggleFullLock}
                title={isFullLocked ? 'Unlock All' : 'Lock All'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isFullLocked ? (
                    <path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4"/>
                  ) : (
                    <path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM17 11V7a5 5 0 00-9.9-1"/>
                  )}
                </svg>
              </button>
              <button
                className={`radar-btn ${isSpeedLocked ? 'active' : ''}`}
                onClick={toggleSpeedLock}
                title={isSpeedLocked ? 'Unlock Speed' : 'Lock Speed'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="14" r="8"/>
                  <path d="M12 14l3-5"/>
                  <path d="M8 8l1 1M16 8l-1 1M12 6v1"/>
                </svg>
              </button>
              <button
                className={`radar-btn ${isPlateLocked ? 'active' : ''}`}
                onClick={togglePlateLock}
                title={isPlateLocked ? 'Unlock Plates' : 'Lock Plates'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="10" rx="2"/>
                  <path d="M6 12h2M10 12h4M16 12h2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DraggablePanel>
  )
}
