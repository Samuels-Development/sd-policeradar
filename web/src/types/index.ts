export type SpeedUnit = 'MPH' | 'KMH'
export type NotificationType = 'native' | 'custom'
export type Direction = 'Front' | 'Rear'

export interface Keybinds {
  ToggleRadar?: string
  Interact?: string
  SaveReading?: string
  LockRadar?: string
  LockSpeed?: string
  LockPlate?: string
  ToggleLog?: string
  ToggleBolo?: string
  ToggleKeybinds?: string
  SpeedLockThreshold?: string
  MoveRadar?: string
  MoveLog?: string
  MoveBolo?: string
}

export interface PanelPosition {
  left?: string
  top?: string
  right?: string
  width?: string
  height?: string
}

export interface SavedPositions {
  radar?: PanelPosition
  log?: PanelPosition
  bolo?: PanelPosition
}

export interface SavedReading {
  id: number
  timestamp: string
  frontSpeed: number
  rearSpeed: number
  lockedFrontSpeed: number
  lockedRearSpeed: number
  frontPlate: string
  rearPlate: string
  lockedFrontPlate: string
  lockedRearPlate: string
}

export type RadarMode = 'same' | 'opp' | 'xmit'

export interface RadarState {
  isVisible: boolean
  isSpeedLocked: boolean
  isPlateLocked: boolean
  frontSpeed: number
  rearSpeed: number
  patrolSpeed: number
  lockedFrontSpeed: number
  lockedRearSpeed: number
  frontPlate: string
  rearPlate: string
  lockedFrontPlate: string
  lockedRearPlate: string
  frontPlateIndex: number
  rearPlateIndex: number
  lockedFrontPlateIndex: number
  lockedRearPlateIndex: number
  frontMode: RadarMode
  rearMode: RadarMode
  frontApproaching: boolean
  rearApproaching: boolean
  frontXmit: boolean
  rearXmit: boolean
  selectedDirection: Direction
  speedUnit: SpeedUnit
  notificationType: NotificationType
  keybinds: Keybinds
  boloPlates: string[]
  savedReadings: SavedReading[]
  showLog: boolean
  showBolo: boolean
  showKeybinds: boolean
  positioningRadar: boolean
  positioningLog: boolean
  positioningBolo: boolean
  speedLockThreshold: number
  speedLockEnabled: boolean
  ledGlow: boolean
  positions: SavedPositions
}

export interface NuiMessage {
  type?: string
  [key: string]: unknown
}

export interface UpdateMessage extends NuiMessage {
  type: 'update'
  frontSpeed?: number
  rearSpeed?: number
  patrolSpeed?: number
  frontPlate?: string
  rearPlate?: string
  frontPlateIndex?: number
  rearPlateIndex?: number
  frontApproaching?: boolean
  rearApproaching?: boolean
}

export interface SpeedLockTriggeredMessage extends NuiMessage {
  type: 'speedLockTriggered'
  speed: number
  plate: string
  direction: string
}
