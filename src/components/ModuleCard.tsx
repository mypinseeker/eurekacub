import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Module } from '../api/types'

interface ModuleCardProps {
  module: Module
  progress?: number // 0-100
}

/* Each module gets a unique vibrant color scheme */
const moduleColors: Record<string, { bg: string; glow: string; bar: string }> = {
  m1: { bg: 'from-pink-400 to-rose-500', glow: 'shadow-pink-200/60', bar: 'bg-pink-400' },
  m2: { bg: 'from-orange-400 to-amber-500', glow: 'shadow-orange-200/60', bar: 'bg-orange-400' },
  m3: { bg: 'from-teal-400 to-cyan-500', glow: 'shadow-teal-200/60', bar: 'bg-teal-400' },
  m4: { bg: 'from-violet-400 to-purple-500', glow: 'shadow-violet-200/60', bar: 'bg-violet-400' },
  m5: { bg: 'from-sky-400 to-blue-500', glow: 'shadow-sky-200/60', bar: 'bg-sky-400' },
  m6: { bg: 'from-red-400 to-rose-500', glow: 'shadow-red-200/60', bar: 'bg-red-400' },
  m7: { bg: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-200/60', bar: 'bg-yellow-400' },
  m8: { bg: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-200/60', bar: 'bg-emerald-400' },
}

export default function ModuleCard({ module, progress = 0 }: ModuleCardProps) {
  const navigate = useNavigate()
  const colors = moduleColors[module.id] ?? { bg: 'from-gray-400 to-gray-500', glow: 'shadow-gray-200/60', bar: 'bg-gray-400' }

  return (
    <motion.button
      onClick={() => navigate(`/module/${module.id}`)}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative w-full p-4 pb-3 rounded-3xl text-left overflow-hidden
        bg-gradient-to-br ${colors.bg}
        shadow-lg ${colors.glow}
        transition-shadow duration-300 hover:shadow-xl
        cursor-pointer group
      `}
    >
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-white/8" />

      {/* Icon */}
      <div className="relative text-4xl mb-2 drop-shadow-md group-hover:scale-110 transition-transform duration-300">
        {module.icon}
      </div>

      {/* Name */}
      <h3 className="relative text-sm font-extrabold text-white leading-tight mb-0.5 drop-shadow-sm">
        {module.name_zh}
      </h3>
      <p className="relative text-[11px] text-white/70 font-medium mb-2">{module.name_en}</p>

      {/* Progress bar */}
      <div className="relative w-full h-1.5 bg-white/25 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-white/80 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress label */}
      {progress > 0 && (
        <span className="absolute top-3 right-3 text-[10px] font-bold text-white/80 bg-white/20 px-1.5 py-0.5 rounded-full">
          {progress}%
        </span>
      )}
    </motion.button>
  )
}
