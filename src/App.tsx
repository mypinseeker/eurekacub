import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import HomePage from './pages/HomePage'
import ModulePage from './pages/ModulePage'
import PuzzlePage from './pages/PuzzlePage'
import AdventurePage from './pages/AdventurePage'
import AdventurePlayPage from './pages/AdventurePlayPage'
import ParentPanel from './pages/ParentPanel'
import SettingsDrawer from './components/SettingsDrawer'

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5EB] via-[#FFF0E0] to-[#FFE8D0]">
      {/* Top nav — playful bar on sub-pages */}
      {!isHome && (
        <nav className="sticky top-0 z-30 w-full px-4 py-3 glass border-b border-orange-100/60 flex items-center justify-between">
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-2xl bg-white shadow-md shadow-orange-100 flex items-center justify-center"
          >
            <span className="text-orange-400 text-xl font-bold">{'\u2190'}</span>
          </motion.button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5"
          >
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {'\uD83D\uDC3B'}
            </motion.span>
            <span className="text-lg font-extrabold bg-gradient-to-r from-[#FF6B6B] via-[#FF8C42] to-[#FFB627] bg-clip-text text-transparent">
              EurekaCub
            </span>
          </button>

          <motion.button
            onClick={() => setSettingsOpen(true)}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-2xl bg-white shadow-md shadow-orange-100 flex items-center justify-center"
          >
            <span className="text-lg">{'\u2699\uFE0F'}</span>
          </motion.button>
        </nav>
      )}

      {children}

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="text-7xl mb-6"
      >
        {icon}
      </motion.div>
      <h1 className="text-2xl font-extrabold text-gray-700 mb-2">{title}</h1>
      <p className="text-gray-400 text-sm">{'\uD83D\uDEA7'} Coming soon!</p>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/module/:moduleId" element={<ModulePage />} />
          <Route path="/module/:moduleId/play/:levelId?" element={<PuzzlePage />} />
          <Route path="/adventures" element={<AdventurePage />} />
          <Route path="/adventure/:adventureId" element={<AdventurePlayPage />} />
          <Route path="/adventure/:adventureId/stage/:stageId" element={<AdventurePlayPage />} />
          <Route path="/parent" element={<ParentPanel />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
