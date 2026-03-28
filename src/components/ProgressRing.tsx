interface ProgressRingProps {
  /** 0-100 */
  value: number
  /** px, defaults to 80 */
  size?: number
  /** px, defaults to 6 */
  strokeWidth?: number
  /** Tailwind-compatible color string for the filled arc */
  color?: string
  /** Show percentage text in center */
  showLabel?: boolean
  children?: React.ReactNode
}

export default function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  color = '#3b82f6',
  showLabel = true,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (showLabel && (
          <span className="text-sm font-semibold text-gray-700">{Math.round(value)}%</span>
        ))}
      </div>
    </div>
  )
}
