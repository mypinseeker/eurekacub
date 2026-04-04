import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import LanguageSwitcher from './LanguageSwitcher'

interface Settings {
  sound: boolean
  haptic: boolean
}

const DEFAULT_SETTINGS: Settings = { sound: true, haptic: true }

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('eurekacub:settings')
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(s: Settings) {
  localStorage.setItem('eurekacub:settings', JSON.stringify(s))
}

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
}

export default function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const { t } = useTranslation()

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const toggle = (key: 'sound' | 'haptic') => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 transition-opacity" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 z-50 h-full w-72 bg-gradient-to-b from-white to-orange-50 shadow-2xl
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-extrabold text-gray-800">
              {'\u2699\ufe0f'} {t('settings.title')}
            </h2>
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.85, rotate: 90 }}
              className="w-9 h-9 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              aria-label={t('a11y.closeDrawer')}
            >
              <span className="text-gray-500 font-bold">{'\u2715'}</span>
            </motion.button>
          </div>

          {/* Language toggle */}
          <div className="mb-7">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
              {t('settings.language')}
            </label>
            <LanguageSwitcher />
          </div>

          {/* Sound toggle */}
          <ToggleRow
            label={t('settings.sound')}
            icon={'\ud83d\udd0a'}
            enabled={settings.sound}
            onToggle={() => toggle('sound')}
          />

          {/* Haptic toggle */}
          <ToggleRow
            label={t('settings.haptic')}
            icon={'\ud83d\udcf3'}
            enabled={settings.haptic}
            onToggle={() => toggle('haptic')}
          />
        </div>
      </div>
    </>
  )
}

function ToggleRow({
  label,
  icon,
  enabled,
  onToggle,
}: {
  label: string
  icon: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <span className="text-sm font-medium text-gray-700">
        {icon} {label}
      </span>
      <button
        onClick={onToggle}
        className={`
          w-12 h-7 rounded-full transition-colors duration-200 relative
          ${enabled ? 'bg-[#00C48C]' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200
            ${enabled ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  )
}
