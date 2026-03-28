import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { loadProgress, type AllProgress, type LevelProgress } from '../engine/progress'
import ProgressRing from '../components/ProgressRing'

// ─── Module metadata (mirrors HomePage MODULES) ───────────────────────
const MODULES = [
  { id: 'm1', name_zh: '对称之美', name_en: 'Symmetry', icon: '🪞' },
  { id: 'm2', name_zh: '分数奇趣', name_en: 'Fractions', icon: '🍕' },
  { id: 'm3', name_zh: '几何探索', name_en: 'Geometry', icon: '🔺' },
  { id: 'm4', name_zh: '微积分启蒙', name_en: 'Derivatives', icon: '📈' },
  { id: 'm5', name_zh: '方程冒险', name_en: 'Equations', icon: '⚖️' },
  { id: 'm6', name_zh: '矩阵世界', name_en: 'Matrix', icon: '🧱' },
  { id: 'm7', name_zh: '序列密码', name_en: 'Sequences', icon: '🔢' },
  { id: 'm8', name_zh: '概率乐园', name_en: 'Probability', icon: '🎲' },
] as const

// ─── Settings helpers (shared key with SettingsDrawer) ─────────────────
interface ParentSettings {
  language: 'zh' | 'en'
  sound: boolean
  haptic: boolean
  dailyLimitMin: number | null // null = unlimited
}

const SETTINGS_KEY = 'eurekacub:settings'

function loadSettings(): ParentSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const base = raw ? JSON.parse(raw) : {}
    return {
      language: base.language ?? 'zh',
      sound: base.sound ?? true,
      haptic: base.haptic ?? true,
      dailyLimitMin: base.dailyLimitMin ?? null,
    }
  } catch {
    return { language: 'zh', sound: true, haptic: true, dailyLimitMin: null }
  }
}

function persistSettings(s: ParentSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

// ─── Helpers ───────────────────────────────────────────────────────────

function computeStats(progress: AllProgress) {
  let totalCompleted = 0
  let totalStars = 0
  const playedDates = new Set<string>()
  const modulesExplored = new Set<string>()
  let estimatedMinutes = 0

  for (const [moduleId, levels] of Object.entries(progress)) {
    modulesExplored.add(moduleId)
    for (const lp of Object.values(levels) as LevelProgress[]) {
      if (lp.completed) totalCompleted++
      totalStars += lp.stars
      if (lp.lastPlayedAt) {
        playedDates.add(lp.lastPlayedAt.slice(0, 10))
        // rough estimate: 3 min per completed puzzle
        estimatedMinutes += lp.completed ? 3 : 1
      }
    }
  }

  // streak: consecutive days ending today (or yesterday)
  const today = new Date()
  let streak = 0
  for (let d = 0; d < 365; d++) {
    const dt = new Date(today)
    dt.setDate(dt.getDate() - d)
    const key = dt.toISOString().slice(0, 10)
    if (playedDates.has(key)) {
      streak++
    } else if (d === 0) {
      // today not played yet, still allow
      continue
    } else {
      break
    }
  }

  return { totalCompleted, totalStars, estimatedMinutes, streak, modulesExplored: modulesExplored.size }
}

function moduleStats(progress: AllProgress, moduleId: string) {
  const mod = progress[moduleId]
  if (!mod) return { completion: 0, stars: 0, bestDifficulty: 0, levels: {} as Record<string, number> }

  const entries = Object.entries(mod) as [string, LevelProgress][]
  const completed = entries.filter(([, l]) => l.completed).length
  const total = entries.length || 1
  const stars = entries.reduce((s, [, l]) => s + l.stars, 0)
  const bestDifficulty = Math.max(0, ...entries.map(([, l]) => l.bestDifficulty))

  // Per-level completion for L1/L2/L3 bars
  const levels: Record<string, number> = {}
  for (const [lid, lp] of entries) {
    levels[lid] = lp.completed ? 100 : 0
  }

  return { completion: Math.round((completed / total) * 100), stars, bestDifficulty, levels }
}

function completionColor(pct: number): string {
  if (pct > 70) return '#22c55e'
  if (pct >= 30) return '#eab308'
  return '#9ca3af'
}

function completionBg(pct: number): string {
  if (pct > 70) return 'border-green-200 bg-green-50/40'
  if (pct >= 30) return 'border-yellow-200 bg-yellow-50/40'
  return 'border-gray-200 bg-gray-50/40'
}

// ─── Component ─────────────────────────────────────────────────────────

export default function ParentPanel() {
  const progress = useMemo(() => loadProgress(), [])
  const stats = useMemo(() => computeStats(progress), [progress])
  const [settings, setSettings] = useState<ParentSettings>(loadSettings)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)

  const isZh = settings.language === 'zh'

  const updateSetting = <K extends keyof ParentSettings>(key: K, value: ParentSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      persistSettings(next)
      return next
    })
  }

  // Learning insights
  const moduleScores = MODULES.map((m) => ({ ...m, ...moduleStats(progress, m.id) }))
  const strongest = moduleScores.reduce((a, b) => (b.stars > a.stars ? b : a), moduleScores[0])
  const weakest = moduleScores.reduce((a, b) => (b.completion < a.completion ? b : a), moduleScores[0])
  const suggested = moduleScores.find((m) => m.completion > 0 && m.completion < 100) || weakest

  const handleReportSubmit = () => {
    if (!reportText.trim()) return
    console.log('[EurekaCub] Content report submitted:', reportText)
    setReportSubmitted(true)
    setReportText('')
    setTimeout(() => {
      setReportSubmitted(false)
      setReportOpen(false)
    }, 2000)
  }

  const formatTime = (min: number) => {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-xl font-bold text-gray-800">
          {isZh ? '家长面板' : 'Parent Panel'}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isZh ? '了解孩子的学习进度' : "Monitor your child's learning"}
        </p>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* ── A. Overview Stats ─────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {isZh ? '总览' : 'Overview'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label={isZh ? '已完成' : 'Completed'}
              value={String(stats.totalCompleted)}
              sub={isZh ? '道题目' : 'puzzles'}
              accent="text-blue-600"
            />
            <StatCard
              label={isZh ? '学习时间' : 'Time Spent'}
              value={formatTime(stats.estimatedMinutes)}
              sub={isZh ? '估算' : 'estimated'}
              accent="text-emerald-600"
            />
            <StatCard
              label={isZh ? '连续天数' : 'Streak'}
              value={String(stats.streak)}
              sub={isZh ? '天' : 'days'}
              accent="text-amber-600"
            />
            <StatCard
              label={isZh ? '已探索' : 'Explored'}
              value={`${stats.modulesExplored}/8`}
              sub={isZh ? '模块' : 'modules'}
              accent="text-violet-600"
            />
          </div>
        </section>

        {/* ── B. Module Progress Grid ──────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {isZh ? '模块进度' : 'Module Progress'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {moduleScores.map((m, i) => {
              const levelKeys = Object.keys(m.levels).sort()
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={`rounded-xl border p-4 ${completionBg(m.completion)} transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    <ProgressRing
                      value={m.completion}
                      size={56}
                      strokeWidth={5}
                      color={completionColor(m.completion)}
                    >
                      <span className="text-lg">{m.icon}</span>
                    </ProgressRing>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800 truncate">
                          {isZh ? m.name_zh : m.name_en}
                        </h3>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">{m.completion}%</span>
                      </div>
                      {/* Level progress bars */}
                      <div className="mt-2 space-y-1">
                        {levelKeys.length > 0 ? (
                          levelKeys.slice(0, 3).map((lid, idx) => (
                            <div key={lid} className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-5">L{idx + 1}</span>
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${m.levels[lid]}%`,
                                    backgroundColor: completionColor(m.levels[lid]),
                                  }}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-gray-400 italic">
                            {isZh ? '尚未开始' : 'Not started'}
                          </p>
                        )}
                      </div>
                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        {m.bestDifficulty > 0 && (
                          <span>
                            {isZh ? '最高难度' : 'Best diff'}: {m.bestDifficulty}
                          </span>
                        )}
                        {m.stars > 0 && <span>{'★'.repeat(Math.min(m.stars, 5))} {m.stars}</span>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ── C. Learning Insights ─────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {isZh ? '学习洞察' : 'Learning Insights'}
          </h2>
          <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-3 shadow-sm">
            {stats.totalCompleted === 0 ? (
              <p className="text-sm text-gray-400 italic">
                {isZh
                  ? '孩子还没有完成任何题目，开始探索后这里会出现学习建议。'
                  : 'No activity yet. Learning insights will appear once your child starts exploring.'}
              </p>
            ) : (
              <>
                <InsightRow
                  icon="💪"
                  label={isZh ? '最强模块' : 'Strongest'}
                  value={`${isZh ? strongest.name_zh : strongest.name_en} (${strongest.stars}★)`}
                  color="text-green-700"
                />
                <InsightRow
                  icon="📚"
                  label={isZh ? '需要练习' : 'Needs Practice'}
                  value={isZh ? weakest.name_zh : weakest.name_en}
                  color="text-amber-700"
                />
                <InsightRow
                  icon="➡️"
                  label={isZh ? '建议下一步' : 'Suggested Next'}
                  value={isZh ? suggested.name_zh : suggested.name_en}
                  color="text-blue-700"
                />
              </>
            )}
          </div>
        </section>

        {/* ── D. Content Safety ─────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {isZh ? '内容安全' : 'Content Safety'}
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            {!reportOpen ? (
              <button
                onClick={() => setReportOpen(true)}
                className="w-full py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                {isZh ? '举报不当内容 / Report inappropriate content' : 'Report inappropriate content / 举报不当内容'}
              </button>
            ) : reportSubmitted ? (
              <p className="text-sm text-green-600 text-center py-2">
                {isZh ? '已提交，感谢您的反馈！' : 'Submitted. Thank you for your feedback!'}
              </p>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder={
                    isZh
                      ? '请描述您发现的不当内容...'
                      : 'Describe the inappropriate content...'
                  }
                  className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReportSubmit}
                    className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    {isZh ? '提交' : 'Submit'}
                  </button>
                  <button
                    onClick={() => {
                      setReportOpen(false)
                      setReportText('')
                    }}
                    className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isZh ? '取消' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── E. Settings ───────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {isZh ? '设置' : 'Settings'}
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            {/* Sound */}
            <ToggleRow
              label={isZh ? '音效 / Sound' : 'Sound / 音效'}
              enabled={settings.sound}
              onToggle={() => updateSetting('sound', !settings.sound)}
            />
            {/* Haptic */}
            <ToggleRow
              label={isZh ? '振动 / Haptic' : 'Haptic / 振动'}
              enabled={settings.haptic}
              onToggle={() => updateSetting('haptic', !settings.haptic)}
            />
            {/* Language */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{isZh ? '语言 / Language' : 'Language / 语言'}</span>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value as 'zh' | 'en')}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
            {/* Daily time limit */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {isZh ? '每日时间限制' : 'Daily Time Limit'}
              </span>
              <select
                value={settings.dailyLimitMin ?? 'unlimited'}
                onChange={(e) => {
                  const v = e.target.value
                  updateSetting('dailyLimitMin', v === 'unlimited' ? null : Number(v))
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="unlimited">{isZh ? '不限' : 'Unlimited'}</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
      <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function InsightRow({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <span className="text-xs text-gray-400 w-20 shrink-0">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  )
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${
          enabled ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
