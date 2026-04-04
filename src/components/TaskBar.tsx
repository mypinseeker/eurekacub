interface TaskBarProps {
  title: string
  subtitle?: string
  onBack?: () => void
}

export default function TaskBar({ title, subtitle, onBack }: TaskBarProps) {
  return (
    <div className="w-full px-4 py-3 glass border-b border-orange-100/60 flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-2xl bg-white shadow-md shadow-orange-100 hover:shadow-lg flex items-center justify-center transition-all active:scale-90"
        >
          <span className="text-orange-400 text-lg font-bold">{'\u2190'}</span>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-extrabold text-gray-800 truncate">{title}</h2>
        {subtitle && <p className="text-[11px] text-gray-400 truncate font-medium">{subtitle}</p>}
      </div>
    </div>
  )
}
