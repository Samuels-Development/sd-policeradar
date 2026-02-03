import { memo } from 'react'

interface PlateDisplayProps {
  plate: string
  label: string
  isBolo?: boolean
}

export const PlateDisplay = memo(function PlateDisplay({
  plate,
  label,
  isBolo = false
}: PlateDisplayProps) {
  const displayPlate = plate || '--------'

  return (
    <div className="flex flex-col items-center">
      <div className="text-[9px] text-zinc-500 font-medium tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`plate-display px-3 py-1.5 text-sm tracking-widest text-center min-w-[100px] ${
          isBolo ? 'bolo-alert' : ''
        }`}
      >
        <span className={isBolo ? 'text-red-400' : 'text-green-400'}>
          {displayPlate}
        </span>
      </div>
    </div>
  )
})
