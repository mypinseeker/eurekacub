import { useRef, useEffect, useCallback } from 'react'

interface CanvasBaseProps {
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void
  onPointerDown?: (x: number, y: number) => void
  onPointerMove?: (x: number, y: number) => void
  onPointerUp?: (x: number, y: number) => void
  className?: string
}

/**
 * Auto-resizing canvas wrapper with requestAnimationFrame loop
 * and unified pointer events (mouse + touch).
 */
export default function CanvasBase({
  draw,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className = '',
}: CanvasBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
    })

    resizeObserver.observe(container)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function loop(time: number) {
      const { width, height } = container!.getBoundingClientRect()
      ctx!.clearRect(0, 0, width, height)
      draw(ctx!, width, height, time)
      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          const { x, y } = getPos(e)
          onPointerDown?.(x, y)
        }}
        onPointerMove={(e) => {
          const { x, y } = getPos(e)
          onPointerMove?.(x, y)
        }}
        onPointerUp={(e) => {
          const { x, y } = getPos(e)
          onPointerUp?.(x, y)
        }}
      />
    </div>
  )
}
