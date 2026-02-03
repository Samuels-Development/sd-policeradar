import { memo } from 'react'
import { SevenSegment } from '@/components/common/SevenSegment'

interface SpeedDisplayProps {
  label: string
  subLabel: string
  speed: number
  color: 'cyan' | 'amber'
  direction?: 'approaching' | 'departing' | 'same' | 'opp'
}

export const SpeedDisplay = memo(function SpeedDisplay({
  label,
  subLabel,
  speed,
  color,
  direction = 'same'
}: SpeedDisplayProps) {
  const directionArrow = direction === 'approaching' || direction === 'opp' ? '>' : '<'
  const showArrow = speed > 0

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] text-zinc-500 font-medium tracking-widest mb-1">
        {label}
      </div>

      <div className="speed-section flex flex-col items-center px-3 py-2">
        <div className="flex items-center gap-1 mb-1">
          {showArrow && (
            <span className={`text-xs ${color === 'cyan' ? 'led-cyan' : 'led-amber'}`}>
              {directionArrow}
            </span>
          )}
          <span className={`text-[10px] tracking-wider ${color === 'cyan' ? 'text-cyan-400' : 'text-amber-400'}`}>
            {subLabel}
          </span>
        </div>

        <SevenSegment value={speed} digits={3} color={color} size="md" />
      </div>
    </div>
  )
})
