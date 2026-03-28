import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language

  const switchTo = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('eurekacub:lang', lng)
  }

  return (
    <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => switchTo('zh')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          current === 'zh'
            ? 'bg-amber-500 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
        aria-label="Switch to Chinese"
      >
        🇨🇳 中文
      </button>
      <button
        onClick={() => switchTo('en')}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          current === 'en'
            ? 'bg-amber-500 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
        aria-label="Switch to English"
      >
        🇺🇸 EN
      </button>
    </div>
  )
}
