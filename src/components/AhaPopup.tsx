import { useEffect, useState } from 'react'

interface AhaPopupProps {
  visible: boolean
  message?: string
  onClose: () => void
}

export default function AhaPopup({
  visible,
  message = '\u592a\u68d2\u4e86\uff01\u4f60\u53d1\u73b0\u4e86\uff01 Amazing discovery!',
  onClose,
}: AhaPopupProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 400)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  if (!visible && !show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Popup — fun celebration card */}
      <div
        className={`
          relative pointer-events-auto
          bg-gradient-to-br from-yellow-100 via-amber-50 to-orange-100
          border-4 border-yellow-300 rounded-[28px] shadow-2xl shadow-orange-200/40
          px-8 py-10 mx-4 max-w-sm text-center
          transition-all duration-500
          ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
        `}
      >
        {/* Celebration emoji */}
        <div className="text-6xl mb-4 animate-bounce drop-shadow-lg">{'\ud83c\udf1f'}</div>

        {/* Aha text */}
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#FF6B6B] to-[#FFB627] bg-clip-text text-transparent mb-2">Aha!</h2>
        <p className="text-base text-amber-800 leading-relaxed font-medium">{message}</p>

        {/* Sparkles decoration */}
        <div className="absolute -top-3 -left-3 text-2xl animate-spin" style={{ animationDuration: '3s' }}>
          {'\u2728'}
        </div>
        <div className="absolute -top-3 -right-3 text-2xl animate-spin" style={{ animationDuration: '2s' }}>
          {'\u2728'}
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-2xl animate-pulse">{'\ud83c\udf89'}</div>
      </div>
    </div>
  )
}
