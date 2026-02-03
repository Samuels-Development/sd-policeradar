import { memo, useCallback } from 'react'

const darkPlates = [1, 2]

interface PlateImageProps {
  plate: string
  plateIndex?: number
  isBolo?: boolean
  label: string
}

export const PlateImage = memo(function PlateImage({
  plate,
  plateIndex = 0,
  isBolo = false,
  label
}: PlateImageProps) {
  const displayPlate = plate || '--------'
  const hasPlate = plate && plate !== '--------' && plate.trim() !== ''
  const plateImg = `./plates/${plateIndex}.png`
  const isDarkPlate = darkPlates.includes(plateIndex)

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasPlate) {
      const ta = document.createElement('textarea')
      ta.value = plate
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }, [plate, hasPlate])

  return (
    <div className="plate-image-column">
      <div className={`plate-image-container ${isBolo ? 'bolo-hit' : ''}`}>
        <img
          src={plateImg}
          alt="License Plate"
          className="plate-background-img"
          draggable={false}
        />

        <div className="plate-text-overlay">
          <span className="plate-text-shadow">{displayPlate}</span>
          <span className={`plate-text-main ${isDarkPlate ? 'plate-text-yellow' : 'plate-text-blue'}`}>
            {displayPlate}
          </span>
          <span className="plate-text-highlight">{displayPlate}</span>
        </div>

        {hasPlate && (
          <button
            className="plate-copy-btn"
            onClick={handleCopy}
            title="Copy plate to clipboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
        )}
      </div>
      <div className="plate-image-label">{label}</div>
    </div>
  )
})
