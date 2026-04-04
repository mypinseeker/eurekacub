import { useEffect, useState } from 'react'

interface FeedbackToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
  onHide: () => void
  duration?: number
}

const toastStyles = {
  success: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-emerald-200/60',
  error: 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-red-200/60',
  info: 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sky-200/60',
}

export default function FeedbackToast({
  message,
  type,
  visible,
  onHide,
  duration = 2000,
}: FeedbackToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(onHide, 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onHide])

  if (!visible && !show) return null

  return (
    <div
      className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 z-50
        px-6 py-3 rounded-2xl shadow-lg
        ${toastStyles[type]}
        transition-all duration-300
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <span className="font-bold text-sm">{message}</span>
    </div>
  )
}
