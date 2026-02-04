import { memo } from 'react'
import { useRadarStore } from '@/store/useRadarStore'

interface SevenSegmentProps {
  value: number
  digits?: number
  color?: 'cyan' | 'amber' | 'red' | 'green'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  xs: 'text-xl',
  sm: 'text-3xl',
  md: 'text-4xl',
  lg: 'text-5xl'
}

const colorClasses = {
  cyan: 'led-cyan',
  amber: 'led-amber',
  red: 'led-red',
  green: 'led-green'
}

const dimmedColorClasses = {
  cyan: 'text-cyan-950',
  amber: 'text-amber-950',
  red: 'text-red-950',
  green: 'text-green-950'
}

export const SevenSegment = memo(function SevenSegment({
  value,
  digits = 3,
  color = 'cyan',
  size = 'md'
}: SevenSegmentProps) {
  const ledGlow = useRadarStore((s) => s.ledGlow)
  const paddedValue = String(Math.min(Math.max(0, Math.floor(value)), Math.pow(10, digits) - 1)).padStart(digits, '0')
  const fullSegment = '8'.repeat(digits)
  const noGlow = ledGlow ? '' : ' no-glow'

  return (
    <div className={`segment-display relative ${sizeClasses[size]} font-bold tracking-wider`}>
      <span className={`${dimmedColorClasses[color]} led-dimmed`}>
        {fullSegment}
      </span>
      <span className={`absolute inset-0 ${colorClasses[color]}${noGlow}`}>
        {paddedValue}
      </span>
    </div>
  )
})
