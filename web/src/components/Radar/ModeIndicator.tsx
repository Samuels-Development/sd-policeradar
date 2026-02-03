import { memo } from 'react'

interface ModeIndicatorProps {
  label: string
  isActive: boolean
  color?: 'green' | 'red' | 'amber' | 'cyan'
}

const colorClasses = {
  green: {
    active: 'text-green-400 text-shadow-green',
    inactive: 'text-green-950'
  },
  red: {
    active: 'text-red-400 text-shadow-red',
    inactive: 'text-red-950'
  },
  amber: {
    active: 'text-amber-400 text-shadow-amber',
    inactive: 'text-amber-950'
  },
  cyan: {
    active: 'text-cyan-400 text-shadow-cyan',
    inactive: 'text-cyan-950'
  }
}

export const ModeIndicator = memo(function ModeIndicator({
  label,
  isActive,
  color = 'green'
}: ModeIndicatorProps) {
  const classes = colorClasses[color]

  return (
    <span
      className={`mode-indicator ${isActive ? classes.active : classes.inactive} ${isActive ? 'mode-active' : 'mode-inactive'}`}
    >
      {label}
    </span>
  )
})
