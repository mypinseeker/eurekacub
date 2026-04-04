import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Adventure } from '../api/types'
import type { CategoryMeta } from '../data/adventures'

interface AdventureCardProps {
  adventure: Adventure
  categoryMeta: CategoryMeta
  index: number
}

export default function AdventureCard({ adventure, categoryMeta, index }: AdventureCardProps) {
  const navigate = useNavigate()
  const { unlocked } = adventure

  const handleClick = () => {
    if (!unlocked) return
    navigate(`/adventure/${adventure.id}`)
  }

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, type: 'spring', stiffness: 200 }}
      whileHover={unlocked ? { scale: 1.05, y: -3 } : undefined}
      whileTap={unlocked ? { scale: 0.95 } : undefined}
      disabled={!unlocked}
      className={`
        relative w-full min-w-[160px] p-4 rounded-3xl border-2 text-left
        transition-all duration-300 overflow-hidden
        ${unlocked
          ? `bg-gradient-to-br ${categoryMeta.cardBg} ${categoryMeta.border} shadow-lg hover:shadow-xl cursor-pointer`
          : 'bg-gray-100 border-gray-200 grayscale opacity-50 cursor-not-allowed'
        }
      `}
    >
      {/* Decorative circle */}
      {unlocked && <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-white/10" />}

      {/* Lock overlay */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-3xl">
          <span className="text-3xl drop-shadow-md">{'\uD83D\uDD12'}</span>
        </div>
      )}

      {/* Icon */}
      <div className="text-3xl mb-2 drop-shadow-md">{adventure.icon}</div>

      {/* Title */}
      <h3 className="text-sm font-extrabold text-gray-800 leading-tight mb-0.5">
        {adventure.title_zh}
      </h3>
      <p className="text-[11px] text-gray-500 mb-2">{adventure.title_en}</p>

      {/* Difficulty stars */}
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-xs ${i < adventure.difficulty ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'}`}
          >
            {'\u2B50'}
          </span>
        ))}
      </div>

      {/* Module tags */}
      <div className="flex flex-wrap gap-1">
        {adventure.module_tags.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/60 text-gray-600 border border-white/80 font-bold"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stage count */}
      <div className="absolute top-3 right-3 text-[10px] font-bold text-gray-400 bg-white/40 px-1.5 py-0.5 rounded-full">
        {adventure.stages.length} stages
      </div>
    </motion.button>
  )
}
