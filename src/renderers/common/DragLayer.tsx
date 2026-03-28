import { useState, useCallback, type ReactNode } from 'react'

export interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  deltaX: number
  deltaY: number
}

interface DragLayerProps {
  onDragStart?: (x: number, y: number) => void
  onDragMove?: (x: number, y: number, dx: number, dy: number) => void
  onDragEnd?: (x: number, y: number) => void
  children: (dragState: DragState) => ReactNode
  className?: string
}

/**
 * Unified drag interaction layer (mouse + touch).
 * Prevents iOS scroll conflicts via touch-action: none.
 */
export default function DragLayer({
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
  className = '',
}: DragLayerProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
  })

  const getPos = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const { x, y } = getPos(e)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      setDragState({
        isDragging: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        deltaX: 0,
        deltaY: 0,
      })
      onDragStart?.(x, y)
    },
    [getPos, onDragStart],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.isDragging) return
      const { x, y } = getPos(e)
      const dx = x - dragState.startX
      const dy = y - dragState.startY
      setDragState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
        deltaX: dx,
        deltaY: dy,
      }))
      onDragMove?.(x, y, dx, dy)
    },
    [dragState.isDragging, dragState.startX, dragState.startY, getPos, onDragMove],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.isDragging) return
      const { x, y } = getPos(e)
      setDragState((prev) => ({ ...prev, isDragging: false }))
      onDragEnd?.(x, y)
    },
    [dragState.isDragging, getPos, onDragEnd],
  )

  return (
    <div
      className={`${className}`}
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children(dragState)}
    </div>
  )
}
