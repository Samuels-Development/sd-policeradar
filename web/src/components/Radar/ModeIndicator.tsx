import { memo } from 'react'
import { useRadarStore } from '@/store/useRadarStore'

interface ModeIndicatorProps {
  label: string
  isActive: boolean
  color?: 'green' | 'red' | 'amber' | 'cyan'
}

const colorClasses = {
  green: {
    active: 'text-green-400',
    inactive: 'text-green-950',
    glow: 'text-shadow-green',
  },
  red: {
    active: 'text-red-400',
    inactive: 'text-red-950',
    glow: 'text-shadow-red',
  },
  amber: {
    active: 'text-amber-400',
    inactive: 'text-amber-950',
    glow: 'text-shadow-amber',
  },
  cyan: {
    active: 'text-cyan-400',
    inactive: 'text-cyan-950',
    glow: 'text-shadow-cyan',
  }
}

export const ModeIndicator = memo(function ModeIndicator({
  label,
  isActive,
  color = 'green'
}: ModeIndicatorProps) {
  const ledGlow = useRadarStore((s) => s.ledGlow)
  const classes = colorClasses[color]
  const glowClass = ledGlow ? classes.glow : 'no-glow'

  return (
    <span
      className={`mode-indicator ${isActive ? classes.active : classes.inactive} ${isActive ? `mode-active ${glowClass}` : 'mode-inactive'}`}
    >
      {label}
    </span>
  )
})
