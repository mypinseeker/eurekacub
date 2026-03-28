import { useState, useEffect } from 'react'

interface Settings {
  language: 'zh' | 'en'
  sound: boolean
  haptic: boolean
}

const DEFAULT_SETTINGS: Settings = { language: 'zh', sound: true, haptic: true }

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

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const toggle = (key: 'sound' | 'haptic') => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleLang = () => {
    setSettings((prev) => ({ ...prev, language: prev.language === 'zh' ? 'en' : 'zh' }))
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
          fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-800">
              {'\u2699\ufe0f'} {settings.language === 'zh' ? '\u8bbe\u7f6e' : 'Settings'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              {'\u2715'}
            </button>
          </div>

          {/* Language toggle */}
          <div className="mb-6">
            <label className="text-sm text-gray-500 mb-2 block">
              {settings.language === 'zh' ? '\u8bed\u8a00 / Language' : 'Language / \u8bed\u8a00'}
            </label>
            <button
              onClick={toggleLang}
              className="w-full py-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 text-sm font-medium transition-colors"
            >
              {settings.language === 'zh' ? '\u4e2d\u6587 \u2192 English' : 'English \u2192 \u4e2d\u6587'}
            </button>
          </div>

          {/* Sound toggle */}
          <ToggleRow
            label={settings.language === 'zh' ? '\u97f3\u6548 / Sound' : 'Sound / \u97f3\u6548'}
            icon={'\ud83d\udd0a'}
            enabled={settings.sound}
            onToggle={() => toggle('sound')}
          />

          {/* Haptic toggle */}
          <ToggleRow
            label={settings.language === 'zh' ? '\u632f\u52a8 / Haptic' : 'Haptic / \u632f\u52a8'}
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
      <span className="text-sm text-gray-700">
        {icon} {label}
      </span>
      <button
        onClick={onToggle}
        className={`
          w-12 h-6 rounded-full transition-colors duration-200 relative
          ${enabled ? 'bg-green-400' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
            ${enabled ? 'translate-x-6' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  )
}
