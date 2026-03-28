interface LevelBadgeProps {
  level: number // 1, 2, or 3
  title: string
  isCompleted?: boolean
  isCurrent?: boolean
}

const starColors = ['text-yellow-400', 'text-orange-400', 'text-red-400']

export default function LevelBadge({ level, title, isCompleted, isCurrent }: LevelBadgeProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all
        ${isCurrent ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200 bg-white'}
        ${isCompleted ? 'opacity-80' : ''}
      `}
    >
      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: level }, (_, i) => (
          <span key={i} className={`text-lg ${starColors[i] ?? 'text-yellow-400'}`}>
            {isCompleted ? '\u2605' : '\u2606'}
          </span>
        ))}
      </div>

      {/* Title */}
      <span className="text-sm font-medium text-gray-700">{title}</span>

      {/* Completed check */}
      {isCompleted && <span className="ml-auto text-green-500 text-lg">\u2713</span>}
    </div>
  )
}
