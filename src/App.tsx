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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      {/* Top nav - only show on non-home pages */}
      {!isHome && (
        <nav className="sticky top-0 z-30 w-full px-4 py-3 bg-white/80 backdrop-blur-md border-b border-amber-100 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors"
          >
            <span className="text-amber-700 text-lg font-bold">{'\u2190'}</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5"
          >
            <span className="text-2xl">{'\uD83D\uDC3B'}</span>
            <span className="text-lg font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              EurekaCub
            </span>
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors"
          >
            <span className="text-amber-700 text-lg">{'\u2699\uFE0F'}</span>
          </button>
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
        transition={{ type: 'spring', stiffness: 200 }}
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
