import { useNavigate } from 'react-router-dom'
import type { Module } from '../api/types'

interface ModuleCardProps {
  module: Module
  progress?: number // 0-100
}

const tagColors: Record<string, { bg: string; border: string; glow: string }> = {
  explorer: {
    bg: 'from-emerald-50 to-green-100',
    border: 'border-emerald-200 hover:border-emerald-400',
    glow: 'hover:shadow-emerald-200/60',
  },
  challenger: {
    bg: 'from-violet-50 to-purple-100',
    border: 'border-violet-200 hover:border-violet-400',
    glow: 'hover:shadow-violet-200/60',
  },
  shared: {
    bg: 'from-amber-50 to-orange-100',
    border: 'border-amber-200 hover:border-amber-400',
    glow: 'hover:shadow-amber-200/60',
  },
}

export default function ModuleCard({ module, progress = 0 }: ModuleCardProps) {
  const navigate = useNavigate()
  const colors = tagColors[module.group_tag] ?? tagColors.shared

  return (
    <button
      onClick={() => navigate(`/module/${module.id}`)}
      className={`
        relative w-full p-5 rounded-2xl border-2 text-left
        bg-gradient-to-br ${colors.bg} ${colors.border}
        shadow-md ${colors.glow} hover:shadow-xl
        transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]
        cursor-pointer group
      `}
    >
      {/* Icon */}
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
        {module.icon}
      </div>

      {/* Name */}
      <h3 className="text-base font-bold text-gray-800 leading-tight mb-1">
        {module.name_zh}
      </h3>
      <p className="text-xs text-gray-500 mb-3">{module.name_en}</p>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress label */}
      {progress > 0 && (
        <span className="absolute top-3 right-3 text-xs font-semibold text-gray-400">
          {progress}%
        </span>
      )}
    </button>
  )
}
