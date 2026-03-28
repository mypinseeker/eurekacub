interface TaskBarProps {
  title: string
  subtitle?: string
  onBack?: () => void
}

export default function TaskBar({ title, subtitle, onBack }: TaskBarProps) {
  return (
    <div className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <span className="text-gray-600 text-lg">\u2190</span>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-gray-800 truncate">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
    </div>
  )
}
