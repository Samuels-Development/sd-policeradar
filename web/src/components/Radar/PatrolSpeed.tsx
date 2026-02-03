import { memo } from 'react'
import { SevenSegment } from '@/components/common/SevenSegment'
import { useRadarStore } from '@/store/useRadarStore'

export const PatrolSpeed = memo(function PatrolSpeed() {
  const patrolSpeed = useRadarStore((state) => state.patrolSpeed)
  const speedUnit = useRadarStore((state) => state.speedUnit)

  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] text-zinc-500 font-medium tracking-widest mb-1">
        PATROL
      </div>
      <div className="speed-section flex items-center gap-2 px-3 py-2">
        <SevenSegment value={patrolSpeed} digits={3} color="red" size="sm" />
        <span className="text-[10px] text-zinc-500">{speedUnit}</span>
      </div>
    </div>
  )
})
