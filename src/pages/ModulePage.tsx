import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

// Map module IDs to i18n keys and visual data
const MODULE_KEYS: Record<string, { nameKey: string; descKey: string; icon: string; gradient: string }> = {
  m1: { nameKey: 'symmetry', descKey: 'symmetryDesc', icon: '\uD83E\uDE9E', gradient: 'from-emerald-400 to-teal-500' },
  m2: { nameKey: 'fraction', descKey: 'fractionDesc', icon: '\uD83C\uDF55', gradient: 'from-orange-400 to-red-400' },
  m3: { nameKey: 'geometry', descKey: 'geometryDesc', icon: '\uD83D\uDD3A', gradient: 'from-blue-400 to-indigo-500' },
  m4: { nameKey: 'derivative', descKey: 'derivativeDesc', icon: '\uD83D\uDCC8', gradient: 'from-violet-400 to-purple-500' },
  m5: { nameKey: 'equation', descKey: 'equationDesc', icon: '\u2696\uFE0F', gradient: 'from-cyan-400 to-blue-500' },
  m6: { nameKey: 'matrix', descKey: 'matrixDesc', icon: '\uD83E\uDDF1', gradient: 'from-pink-400 to-rose-500' },
  m7: { nameKey: 'sequence', descKey: 'sequenceDesc', icon: '\uD83D\uDD22', gradient: 'from-amber-400 to-orange-500' },
  m8: { nameKey: 'probability', descKey: 'probabilityDesc', icon: '\uD83C\uDFB2', gradient: 'from-yellow-400 to-amber-500' },
}

// Level data with i18n keys
const LEVELS = [
  { id: 'L1', num: 1, titleKey: 'level.explorer', ageKey: 'level.age7', stars: 0, maxStars: 3 },
  { id: 'L2', num: 2, titleKey: 'level.standard', ageKey: 'level.age8', stars: 0, maxStars: 3 },
  { id: 'L3', num: 3, titleKey: 'level.challenge', ageKey: 'level.age10', stars: 0, maxStars: 3 },
]

const levelGradients = [
  'from-green-100 to-emerald-50 border-green-200 hover:border-green-400',
  'from-blue-100 to-sky-50 border-blue-200 hover:border-blue-400',
  'from-purple-100 to-violet-50 border-purple-200 hover:border-purple-400',
]

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const modInfo = MODULE_KEYS[moduleId ?? ''] ?? { nameKey: 'defaultName', descKey: '', icon: '\uD83D\uDCDA', gradient: 'from-gray-400 to-gray-500' }
  const fullNameKey = `module.${modInfo.nameKey}Full`
  const shortNameKey = `module.${modInfo.nameKey}`
  const descKey = modInfo.descKey ? `module.${modInfo.descKey}` : ''

  return (
    <div className="min-h-screen">
      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Module header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="text-6xl mb-3"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {modInfo.icon}
          </motion.div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-1">{t(fullNameKey)}</h1>
          <p className="text-sm text-gray-500 mb-1">{t(shortNameKey)}</p>
          <div className={`inline-block mt-2 px-3 py-1 rounded-full bg-gradient-to-r ${modInfo.gradient} text-white text-xs font-bold`}>
            {t('module.label')} {moduleId?.toUpperCase()}
          </div>
          {descKey && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed max-w-xs mx-auto">{t(descKey)}</p>
          )}
        </motion.div>

        {/* Level cards */}
        <div className="space-y-4">
          {LEVELS.map((level, i) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/module/${moduleId}/play/${level.id}`)}
              aria-label={t('a11y.levelCard', { level: t(level.titleKey) })}
              className={`
                w-full p-5 rounded-2xl border-2 bg-gradient-to-br
                ${levelGradients[i]}
                shadow-md hover:shadow-lg
                transition-all duration-200 text-left
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700 px-2 py-0.5 rounded-full">
                      L{level.num}
                    </span>
                    <span className="text-base font-bold text-gray-800">
                      {t(level.titleKey)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 ml-1 mt-1">
                    {'\uD83C\uDF82'} {t(level.ageKey)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {/* Star rating */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: level.maxStars }, (_, si) => (
                      <span key={si} className={`text-xl ${si < level.stars ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {si < level.stars ? '\u2B50' : '\u2606'}
                      </span>
                    ))}
                  </div>
                  {/* No lock — all unlocked per PRD P8 */}
                  <span className="text-2xl text-gray-300">{'\u203A'}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
