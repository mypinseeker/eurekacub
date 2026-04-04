import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Module } from '../api/types'
import ModuleCard from '../components/ModuleCard'
import SettingsDrawer from '../components/SettingsDrawer'

// Module data per PRD: Explorer (6+) and Challenger (9+) tracks
const MODULES: Module[] = [
  { id: 'm1', name_zh: '\u5BF9\u79F0\u4E4B\u7F8E', name_en: 'Symmetry', icon: '\uD83E\uDE9E', group_tag: 'explorer', sort_order: 1, is_active: true, description_zh: '\u53D1\u73B0\u81EA\u7136\u548C\u827A\u672F\u4E2D\u7684\u5BF9\u79F0\u4E16\u754C' },
  { id: 'm2', name_zh: '\u5206\u6570\u5947\u8C6B', name_en: 'Fractions', icon: '\uD83C\uDF55', group_tag: 'explorer', sort_order: 2, is_active: true, description_zh: '\u7528\u62AB\u8428\u548C\u5DE7\u514B\u529B\u7406\u89E3\u5206\u6570' },
  { id: 'm3', name_zh: '\u51E0\u4F55\u63A2\u7D22', name_en: 'Geometry', icon: '\uD83D\uDD3A', group_tag: 'challenger', sort_order: 3, is_active: true, description_zh: '\u7528\u56FE\u5F62\u4E0E\u7A7A\u95F4\u601D\u7EF4\u7834\u89E3\u8C1C\u9898' },
  { id: 'm4', name_zh: '\u5FAE\u79EF\u5206\u542F\u8499', name_en: 'Derivatives', icon: '\uD83D\uDCC8', group_tag: 'challenger', sort_order: 4, is_active: true, description_zh: '\u7528\u76F4\u89C9\u611F\u53D7\u53D8\u5316\u7387\u7684\u9B54\u529B' },
  { id: 'm5', name_zh: '\u65B9\u7A0B\u5192\u9669', name_en: 'Equations', icon: '\u2696\uFE0F', group_tag: 'challenger', sort_order: 5, is_active: true, description_zh: '\u50CF\u4FA6\u63A2\u4E00\u6837\u89E3\u5F00\u672A\u77E5\u6570' },
  { id: 'm6', name_zh: '\u77E9\u9635\u4E16\u754C', name_en: 'Matrix', icon: '\uD83E\uDDF1', group_tag: 'challenger', sort_order: 6, is_active: true, description_zh: '\u7528\u884C\u5217\u89E3\u9501\u6570\u636E\u7684\u79D8\u5BC6' },
  { id: 'm7', name_zh: '\u5E8F\u5217\u5BC6\u7801', name_en: 'Sequences', icon: '\uD83D\uDD22', group_tag: 'shared', sort_order: 7, is_active: true, description_zh: '\u53D1\u73B0\u6570\u5B57\u4E2D\u7684\u9690\u85CF\u89C4\u5F8B' },
  { id: 'm8', name_zh: '\u6982\u7387\u4E50\u56ED', name_en: 'Probability', icon: '\uD83C\uDFB2', group_tag: 'shared', sort_order: 8, is_active: true, description_zh: '\u7528\u6E38\u620F\u611F\u53D7\u968F\u673A\u4E0E\u786E\u5B9A' },
]

type Track = 'explorer' | 'challenger'

export default function HomePage() {
  const [activeTrack, setActiveTrack] = useState<Track>('explorer')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const trackModules = MODULES.filter((m) => m.group_tag === activeTrack)
  const sharedModules = MODULES.filter((m) => m.group_tag === 'shared')

  return (
    <div className="min-h-screen pb-28">
      {/* Header — bright and fun */}
      <header className="relative px-5 pt-8 pb-4">
        {/* Settings */}
        <motion.button
          onClick={() => setSettingsOpen(true)}
          whileTap={{ scale: 0.85, rotate: 30 }}
          className="absolute top-4 right-4 w-11 h-11 rounded-2xl bg-white shadow-md shadow-orange-100 flex items-center justify-center"
          aria-label={t('a11y.settingsButton')}
        >
          <span className="text-xl">{'\u2699\uFE0F'}</span>
        </motion.button>

        {/* Parent panel */}
        <motion.button
          onClick={() => navigate('/parent')}
          whileTap={{ scale: 0.85 }}
          className="absolute top-4 left-4 w-11 h-11 rounded-2xl bg-white shadow-md shadow-orange-100 flex items-center justify-center"
          aria-label={t('a11y.parentButton')}
        >
          <span className="text-lg">{'\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67'}</span>
        </motion.button>

        {/* Title area */}
        <div className="text-center mt-6 mb-4">
          <motion.div
            className="text-6xl mb-2 drop-shadow-lg"
            animate={{ y: [0, -10, 0], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {'\uD83D\uDC3B'}
          </motion.div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFB627] bg-clip-text text-transparent drop-shadow-sm">
            {t('app.title')}
          </h1>
          <p className="text-sm text-amber-600/70 mt-1 font-semibold">
            {t('app.tagline')}
          </p>
        </div>
      </header>

      {/* Track selector — colorful pills */}
      <div className="flex justify-center gap-3 px-4 mb-6">
        <TrackTab
          active={activeTrack === 'explorer'}
          onClick={() => setActiveTrack('explorer')}
          icon={'\uD83C\uDF31'}
          label={t('app.explorer')}
          sublabel={t('app.explorerSublabel')}
          color="emerald"
        />
        <TrackTab
          active={activeTrack === 'challenger'}
          onClick={() => setActiveTrack('challenger')}
          icon={'\uD83D\uDE80'}
          label={t('app.challenger')}
          sublabel={t('app.challengerSublabel')}
          color="violet"
        />
      </div>

      {/* Track modules — animated grid */}
      <div className="px-4 mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTrack}
            initial={{ opacity: 0, x: activeTrack === 'explorer' ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTrack === 'explorer' ? 40 : -40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {trackModules.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.35, type: 'spring', stiffness: 200 }}
                >
                  <ModuleCard module={mod} progress={0} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Shared section */}
      <div className="px-4 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <motion.span
            className="text-xl"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {'\uD83C\uDF1F'}
          </motion.span>
          <h2 className="text-sm font-extrabold text-amber-700/60 uppercase tracking-wider">
            {t('app.shared')}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-300/40 to-transparent" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sharedModules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.08 + 0.2, duration: 0.35, type: 'spring', stiffness: 200 }}
            >
              <ModuleCard module={mod} progress={0} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom nav — floating colorful bar */}
      <div className="fixed bottom-0 left-0 right-0 pb-5 pt-3">
        <div className="flex justify-center">
          <div className="inline-flex gap-2 bg-white rounded-full px-3 py-2 shadow-xl shadow-orange-200/40 border border-orange-100">
            <NavDot icon={'\uD83C\uDFE0'} label={t('app.home')} active activeColor="bg-[#FF6B6B]" />
            <NavDot icon={'\uD83C\uDFD5\uFE0F'} label={t('app.adventures')} activeColor="bg-[#4E7CFF]" onClick={() => navigate('/adventures')} />
            <NavDot icon={'\uD83D\uDCCA'} label={t('app.parent')} activeColor="bg-[#7C5CFC]" onClick={() => navigate('/parent')} />
          </div>
        </div>
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function TrackTab({
  active,
  onClick,
  icon,
  label,
  sublabel,
  color,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
  sublabel: string
  color: 'emerald' | 'violet'
}) {
  const activeStyles =
    color === 'emerald'
      ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-200/60'
      : 'bg-gradient-to-r from-violet-400 to-purple-500 text-white shadow-lg shadow-violet-200/60'
  const inactiveStyles = 'bg-white text-gray-500 hover:bg-gray-50 shadow-md shadow-orange-100/30'

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      whileHover={{ scale: 1.03 }}
      className={`
        relative flex-1 max-w-[180px] py-3 px-4 rounded-2xl font-bold text-sm
        transition-all duration-300
        ${active ? activeStyles : inactiveStyles}
      `}
    >
      {active && (
        <motion.div
          layoutId="trackIndicator"
          className="absolute inset-0 rounded-2xl"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">
        <span className="text-xl mr-1">{icon}</span>
        <span>{label}</span>
        <span className="block text-xs font-medium opacity-80 mt-0.5">{sublabel}</span>
      </span>
    </motion.button>
  )
}

function NavDot({
  icon,
  label,
  active,
  activeColor,
  onClick,
}: {
  icon: string
  label: string
  active?: boolean
  activeColor: string
  onClick?: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all duration-200 ${
        active ? 'bg-orange-50' : ''
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className={`text-[10px] font-bold ${active ? 'text-[#FF6B6B]' : 'text-gray-400'}`}>
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="navDot"
          className={`w-1.5 h-1.5 rounded-full ${activeColor}`}
        />
      )}
    </motion.button>
  )
}
