import { useRef, useEffect, useState, useCallback, ReactNode } from 'react'
import { PanelPosition } from '@/types'

interface DraggablePanelProps {
  children: ReactNode
  id: string
  initialPosition?: { left?: string; top?: string; right?: string }
  initialSize?: { width?: string; height?: string }
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }
  isPositioning?: boolean
  className?: string
  savedPosition?: PanelPosition
  resizeDirections?: string[]
  positioningHint?: string
  onPositionChange?: (position: { left: string; top: string; width: string; height: string }) => void
}

export function DraggablePanel({
  children,
  id,
  initialPosition = { left: '50%', top: '50%' },
  initialSize = { width: '400px', height: '300px' },
  minSize = { width: 280, height: 200 },
  maxSize = { width: 600, height: 700 },
  isPositioning = false,
  className = '',
  savedPosition,
  resizeDirections = ['w', 'e'],
  positioningHint,
  onPositionChange
}: DraggablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDir, setResizeDir] = useState('')
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 })

  useEffect(() => {
    if (savedPosition && panelRef.current) {
      const el = panelRef.current
      if (savedPosition.left) el.style.left = savedPosition.left
      if (savedPosition.top) el.style.top = savedPosition.top
      if (savedPosition.right) el.style.right = savedPosition.right
      if (savedPosition.width) el.style.width = savedPosition.width
      if (savedPosition.height) el.style.height = savedPosition.height
      el.style.transform = 'none'
    }
  }, [savedPosition])

  const savePosition = useCallback(() => {
    if (panelRef.current) {
      const style = panelRef.current.style
      const position = {
        left: style.left,
        top: style.top,
        width: style.width,
        height: style.height
      }
      onPositionChange?.(position)
    }
  }, [onPositionChange])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isPositioning || !panelRef.current) return
    if ((e.target as HTMLElement).closest('.resize-handle')) return

    setIsDragging(true)
    const rect = panelRef.current.getBoundingClientRect()
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    e.preventDefault()
  }, [isPositioning])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    if (!isPositioning || !panelRef.current) return

    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeDir(direction)

    const rect = panelRef.current.getBoundingClientRect()
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top
    }
  }, [isPositioning])

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && panelRef.current) {
        const newLeft = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - panelRef.current.offsetWidth))
        const newTop = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - panelRef.current.offsetHeight))
        panelRef.current.style.left = `${newLeft}px`
        panelRef.current.style.top = `${newTop}px`
        panelRef.current.style.right = 'auto'
        panelRef.current.style.transform = 'none'
      }

      if (isResizing && panelRef.current) {
        const deltaX = e.clientX - resizeStart.current.x
        const deltaY = e.clientY - resizeStart.current.y
        let newWidth = resizeStart.current.width
        let newHeight = resizeStart.current.height
        let newLeft = resizeStart.current.left
        let newTop = resizeStart.current.top

        if (resizeDir.includes('e')) {
          newWidth = Math.max(minSize.width, Math.min(maxSize.width, resizeStart.current.width + deltaX))
        }
        if (resizeDir.includes('w')) {
          newWidth = Math.max(minSize.width, Math.min(maxSize.width, resizeStart.current.width - deltaX))
          newLeft = resizeStart.current.left + (resizeStart.current.width - newWidth)
        }
        if (resizeDir.includes('s')) {
          newHeight = Math.max(minSize.height, Math.min(maxSize.height, resizeStart.current.height + deltaY))
        }
        if (resizeDir.includes('n')) {
          newHeight = Math.max(minSize.height, Math.min(maxSize.height, resizeStart.current.height - deltaY))
          newTop = resizeStart.current.top + (resizeStart.current.height - newHeight)
        }

        panelRef.current.style.width = `${newWidth}px`
        panelRef.current.style.height = `${newHeight}px`
        panelRef.current.style.left = `${Math.max(0, newLeft)}px`
        panelRef.current.style.top = `${Math.max(0, newTop)}px`
        panelRef.current.style.right = 'auto'
        panelRef.current.style.transform = 'none'
      }
    }

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        savePosition()
      }
      setIsDragging(false)
      setIsResizing(false)
      setResizeDir('')
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, resizeDir, minSize, maxSize, savePosition])

  return (
    <div
      ref={panelRef}
      id={id}
      className={`fixed ${isPositioning ? 'positioning' : ''} ${className}`}
      style={{
        left: initialPosition.left,
        top: initialPosition.top,
        right: initialPosition.right,
        width: initialSize.width,
        height: initialSize.height,
        transform: initialPosition.left === '50%' && initialPosition.top === '50%' ? 'translate(-50%, -50%)' : 'none',
        '--positioning-hint': positioningHint ? `'${positioningHint}'` : undefined
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
    >
      {isPositioning && (
        <>
          {resizeDirections.map(dir => (
            <div key={dir} className={`resize-handle resize-${dir}`} onMouseDown={(e) => handleResizeMouseDown(e, dir)} />
          ))}
        </>
      )}
      {children}
    </div>
  )
}
