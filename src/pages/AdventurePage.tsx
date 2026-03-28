import { motion } from 'framer-motion'
import AdventureCard from '../components/AdventureCard'
import { ADVENTURES, CATEGORY_META } from '../data/adventures'
import type { AdventureCategory } from '../api/types'

const CATEGORY_ORDER: AdventureCategory[] = ['life', 'challenger', 'ultimate', 'sports', 'science']

export default function AdventurePage() {
  return (
    <div className="min-h-screen pb-16">
      {/* Hero header */}
      <div className="px-4 pt-6 pb-4 text-center">
        <motion.div
          className="text-5xl mb-2"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {'\uD83C\uDFD5\uFE0F'}
        </motion.div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
          {'\u5192\u9669\u6A21\u5F0F'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Adventure Mode — {'\u7528\u6570\u5B66\u89E3\u5F00\u6545\u4E8B\u7684\u8C1C\u9898'}
        </p>
      </div>

      {/* Category sections */}
      {CATEGORY_ORDER.map((catKey) => {
        const meta = CATEGORY_META[catKey]
        const adventures = ADVENTURES.filter((a) => a.category === catKey)
        if (!meta || adventures.length === 0) return null

        return (
          <section key={catKey} className="mb-6 px-4">
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{meta.icon}</span>
              <div>
                <h2 className="text-sm font-bold text-gray-700 leading-tight">
                  {meta.label_zh}
                </h2>
                <p className="text-[11px] text-gray-400">{meta.label_en}</p>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
            </div>

            {/* Horizontal scroll of adventure cards */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {adventures.map((adv, i) => (
                <div key={adv.id} className="flex-shrink-0 w-[170px]">
                  <AdventureCard
                    adventure={adv}
                    categoryMeta={meta}
                    index={i}
                  />
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
