import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const MODULE_KEYS: Record<string, { nameKey: string; descKey: string; icon: string; gradient: string; light: string }> = {
  m1: { nameKey: 'symmetry', descKey: 'symmetryDesc', icon: '\uD83E\uDE9E', gradient: 'from-pink-400 to-rose-500', light: 'bg-pink-50 text-pink-600 border-pink-200' },
  m2: { nameKey: 'fraction', descKey: 'fractionDesc', icon: '\uD83C\uDF55', gradient: 'from-orange-400 to-amber-500', light: 'bg-orange-50 text-orange-600 border-orange-200' },
  m3: { nameKey: 'geometry', descKey: 'geometryDesc', icon: '\uD83D\uDD3A', gradient: 'from-teal-400 to-cyan-500', light: 'bg-teal-50 text-teal-600 border-teal-200' },
  m4: { nameKey: 'derivative', descKey: 'derivativeDesc', icon: '\uD83D\uDCC8', gradient: 'from-violet-400 to-purple-500', light: 'bg-violet-50 text-violet-600 border-violet-200' },
  m5: { nameKey: 'equation', descKey: 'equationDesc', icon: '\u2696\uFE0F', gradient: 'from-sky-400 to-blue-500', light: 'bg-sky-50 text-sky-600 border-sky-200' },
  m6: { nameKey: 'matrix', descKey: 'matrixDesc', icon: '\uD83E\uDDF1', gradient: 'from-red-400 to-rose-500', light: 'bg-red-50 text-red-600 border-red-200' },
  m7: { nameKey: 'sequence', descKey: 'sequenceDesc', icon: '\uD83D\uDD22', gradient: 'from-yellow-400 to-amber-500', light: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  m8: { nameKey: 'probability', descKey: 'probabilityDesc', icon: '\uD83C\uDFB2', gradient: 'from-emerald-400 to-green-500', light: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
}

const LEVELS = [
  { id: 'L1', num: 1, titleKey: 'level.explorer', ageKey: 'level.age7', stars: 0, maxStars: 3 },
  { id: 'L2', num: 2, titleKey: 'level.standard', ageKey: 'level.age8', stars: 0, maxStars: 3 },
  { id: 'L3', num: 3, titleKey: 'level.challenge', ageKey: 'level.age10', stars: 0, maxStars: 3 },
]

const levelColors = [
  { bg: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-200/60', emoji: '\uD83C\uDF31' },
  { bg: 'from-sky-400 to-blue-500', shadow: 'shadow-sky-200/60', emoji: '\u2B50' },
  { bg: 'from-purple-400 to-violet-500', shadow: 'shadow-purple-200/60', emoji: '\uD83D\uDD25' },
]

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const modInfo = MODULE_KEYS[moduleId ?? ''] ?? { nameKey: 'defaultName', descKey: '', icon: '\uD83D\uDCDA', gradient: 'from-gray-400 to-gray-500', light: 'bg-gray-50 text-gray-600 border-gray-200' }
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
            className="text-7xl mb-3 drop-shadow-lg"
            animate={{ rotate: [0, -6, 6, 0], y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {modInfo.icon}
          </motion.div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-1">{t(fullNameKey)}</h1>
          <p className="text-sm text-gray-500 mb-2">{t(shortNameKey)}</p>
          <div className={`inline-block mt-1 px-4 py-1.5 rounded-full border text-xs font-bold ${modInfo.light}`}>
            {t('module.label')} {moduleId?.toUpperCase()}
          </div>
          {descKey && (
            <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xs mx-auto">{t(descKey)}</p>
          )}
        </motion.div>

        {/* Level cards — colorful and inviting */}
        <div className="space-y-3">
          {LEVELS.map((level, i) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12, duration: 0.35, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.03, x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/module/${moduleId}/play/${level.id}`)}
              aria-label={t('a11y.levelCard', { level: t(level.titleKey) })}
              className={`
                w-full p-5 rounded-3xl bg-gradient-to-r ${levelColors[i].bg}
                shadow-lg ${levelColors[i].shadow}
                transition-all duration-200 text-left text-white
                overflow-hidden relative
              `}
            >
              {/* Decorative circles */}
              <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-white/8" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{levelColors[i].emoji}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold bg-white/25 px-2 py-0.5 rounded-full">
                        L{level.num}
                      </span>
                      <span className="text-base font-extrabold drop-shadow-sm">
                        {t(level.titleKey)}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 font-medium">
                      {'\uD83C\uDF82'} {t(level.ageKey)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {/* Star rating */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: level.maxStars }, (_, si) => (
                      <span key={si} className={`text-lg ${si < level.stars ? 'drop-shadow-md' : 'opacity-40'}`}>
                        {si < level.stars ? '\u2B50' : '\u2606'}
                      </span>
                    ))}
                  </div>
                  <span className="text-xl text-white/60">{'\u203A'}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
