import { useRef, useCallback, type ReactNode } from 'react'

interface SvgBaseProps {
  viewWidth?: number
  viewHeight?: number
  onPointerDown?: (x: number, y: number) => void
  onPointerMove?: (x: number, y: number) => void
  onPointerUp?: (x: number, y: number) => void
  className?: string
  children: ReactNode
}

/**
 * Responsive SVG wrapper with auto viewBox and unified pointer events.
 */
export default function SvgBase({
  viewWidth = 400,
  viewHeight = 400,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className = '',
  children,
}: SvgBaseProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  const getSvgPoint = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * viewWidth
      const y = ((e.clientY - rect.top) / rect.height) * viewHeight
      return { x, y }
    },
    [viewWidth, viewHeight],
  )

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className={`w-full h-full ${className}`}
      style={{ touchAction: 'none' }}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={(e) => {
        const { x, y } = getSvgPoint(e)
        onPointerDown?.(x, y)
      }}
      onPointerMove={(e) => {
        const { x, y } = getSvgPoint(e)
        onPointerMove?.(x, y)
      }}
      onPointerUp={(e) => {
        const { x, y } = getSvgPoint(e)
        onPointerUp?.(x, y)
      }}
    >
      {children}
    </svg>
  )
}
