import { useRadarStore } from '@/store/useRadarStore'

const formatKey = (key: string): string => {
  switch (key.toUpperCase()) {
    case 'LEFT': return '←'
    case 'RIGHT': return '→'
    case 'UP': return '↑'
    case 'DOWN': return '↓'
    default: return key.toUpperCase()
  }
}

const isValidKeybind = (key?: string): boolean => {
  return !!key && typeof key === 'string' && key.trim() !== ''
}

export function KeybindsPanel() {
  const { showKeybinds, keybinds } = useRadarStore()

  if (!showKeybinds) return null

  const keybindItems = [
    { label: 'Toggle Radar', key: keybinds.ToggleRadar },
    { label: 'Interact with Radar', key: keybinds.Interact },
    { label: 'Save Reading', key: keybinds.SaveReading },
    { label: 'Lock/Unlock All', key: keybinds.LockRadar },
    { label: 'Lock/Unlock Speed', key: keybinds.LockSpeed },
    { label: 'Lock/Unlock Plates', key: keybinds.LockPlate },
    { label: 'Toggle Log', key: keybinds.ToggleLog },
    { label: 'Toggle BOLO List', key: keybinds.ToggleBolo },
    { label: 'Show/Hide Keybinds', key: keybinds.ToggleKeybinds },
    { label: 'Speed Lock Threshold', key: keybinds.SpeedLockThreshold },
    { label: 'Move Radar', key: keybinds.MoveRadar },
    { label: 'Move Log', key: keybinds.MoveLog },
    { label: 'Move BOLO', key: keybinds.MoveBolo },
  ].filter(item => isValidKeybind(item.key))

  return (
    <div className="fixed top-6 left-6 w-72 z-50">
      <div className="radar-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-xs font-medium text-zinc-300 tracking-wider">KEYBOARD SHORTCUTS</span>
        </div>

        <div className="flex flex-col gap-3">
          {keybindItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">{item.label}</span>
              <span className="px-2 py-1 text-[10px] font-bold text-zinc-200 bg-zinc-800 rounded border border-zinc-600 font-mono">
                {formatKey(item.key!)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
