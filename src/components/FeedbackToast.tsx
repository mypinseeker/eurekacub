import { useEffect, useState } from 'react'

interface FeedbackToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  visible: boolean
  onHide: () => void
  duration?: number
}

const toastStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-400 text-white',
  info: 'bg-blue-400 text-white',
}

const toastIcons = {
  success: '\ud83c\udf1f',
  error: '\ud83e\udd14',
  info: '\ud83d\udcad',
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
        setTimeout(onHide, 300) // wait for exit animation
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
      <span className="text-lg mr-2">{toastIcons[type]}</span>
      <span className="font-medium">{message}</span>
    </div>
  )
}
