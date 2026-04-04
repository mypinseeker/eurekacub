import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language

  const switchTo = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('eurekacub:lang', lng)
  }

  return (
    <div className="inline-flex rounded-2xl border-2 border-orange-200 overflow-hidden bg-white">
      <motion.button
        onClick={() => switchTo('zh')}
        whileTap={{ scale: 0.95 }}
        className={`px-4 py-2 text-sm font-bold transition-all duration-200 ${
          current === 'zh'
            ? 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white'
            : 'text-gray-500 hover:bg-orange-50'
        }`}
        aria-label="Switch to Chinese"
      >
        🇨🇳 中文
      </motion.button>
      <motion.button
        onClick={() => switchTo('en')}
        whileTap={{ scale: 0.95 }}
        className={`px-4 py-2 text-sm font-bold transition-all duration-200 ${
          current === 'en'
            ? 'bg-gradient-to-r from-[#4E7CFF] to-[#7C5CFC] text-white'
            : 'text-gray-500 hover:bg-blue-50'
        }`}
        aria-label="Switch to English"
      >
        🇺🇸 EN
      </motion.button>
    </div>
  )
}
