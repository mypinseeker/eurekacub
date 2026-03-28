import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// Level data with age targets per PRD
const LEVELS = [
  { id: 'L1', num: 1, title_zh: '\u63A2\u7D22\u5165\u95E8', title_en: 'Explorer', age: '6-7', stars: 0, maxStars: 3 },
  { id: 'L2', num: 2, title_zh: '\u6807\u51C6\u8FDB\u9636', title_en: 'Standard', age: '8-9', stars: 0, maxStars: 3 },
  { id: 'L3', num: 3, title_zh: '\u6311\u6218\u5927\u5E08', title_en: 'Challenge', age: '10+', stars: 0, maxStars: 3 },
]

const MODULE_INFO: Record<string, { zh: string; en: string; icon: string; desc: string; gradient: string }> = {
  m1: { zh: '\u5BF9\u79F0\u4E4B\u7F8E', en: 'Symmetry', icon: '\uD83E\uDE9E', desc: '\u53D1\u73B0\u81EA\u7136\u548C\u827A\u672F\u4E2D\u7684\u5BF9\u79F0\u4E16\u754C\uFF0C\u50CF\u84DD\u8776\u7FC5\u8180\u4E00\u6837\u7CBE\u786E\u800C\u7F8E\u4E3D\u3002', gradient: 'from-emerald-400 to-teal-500' },
  m2: { zh: '\u5206\u6570\u5947\u8C6B', en: 'Fractions', icon: '\uD83C\uDF55', desc: '\u7528\u62AB\u8428\u548C\u5DE7\u514B\u529B\u7406\u89E3\u5206\u6570\uFF0C\u8BA9\u6570\u5B66\u53D8\u5F97\u7F8E\u5473\u53EF\u53E3\u3002', gradient: 'from-orange-400 to-red-400' },
  m3: { zh: '\u51E0\u4F55\u63A2\u7D22', en: 'Geometry', icon: '\uD83D\uDD3A', desc: '\u7528\u56FE\u5F62\u4E0E\u7A7A\u95F4\u601D\u7EF4\u7834\u89E3\u8C1C\u9898\uFF0C\u8BA4\u8BC6\u5F62\u72B6\u7684\u5965\u79D8\u3002', gradient: 'from-blue-400 to-indigo-500' },
  m4: { zh: '\u5FAE\u79EF\u5206\u542F\u8499', en: 'Derivatives', icon: '\uD83D\uDCC8', desc: '\u7528\u76F4\u89C9\u611F\u53D7\u53D8\u5316\u7387\u7684\u9B54\u529B\uFF0C\u63A2\u7D22\u8FD0\u52A8\u4E0E\u589E\u957F\u3002', gradient: 'from-violet-400 to-purple-500' },
  m5: { zh: '\u65B9\u7A0B\u5192\u9669', en: 'Equations', icon: '\u2696\uFE0F', desc: '\u50CF\u4FA6\u63A2\u4E00\u6837\u89E3\u5F00\u672A\u77E5\u6570\uFF0C\u5E73\u8861\u4E24\u8FB9\u7684\u5929\u5E73\u3002', gradient: 'from-cyan-400 to-blue-500' },
  m6: { zh: '\u77E9\u9635\u4E16\u754C', en: 'Matrix', icon: '\uD83E\uDDF1', desc: '\u7528\u884C\u5217\u89E3\u9501\u6570\u636E\u7684\u79D8\u5BC6\uFF0C\u8FDB\u5165\u77E9\u9635\u7684\u5947\u5999\u4E16\u754C\u3002', gradient: 'from-pink-400 to-rose-500' },
  m7: { zh: '\u5E8F\u5217\u5BC6\u7801', en: 'Sequences', icon: '\uD83D\uDD22', desc: '\u53D1\u73B0\u6570\u5B57\u4E2D\u7684\u9690\u85CF\u89C4\u5F8B\uFF0C\u7834\u89E3\u5E8F\u5217\u5BC6\u7801\u3002', gradient: 'from-amber-400 to-orange-500' },
  m8: { zh: '\u6982\u7387\u4E50\u56ED', en: 'Probability', icon: '\uD83C\uDFB2', desc: '\u7528\u6E38\u620F\u611F\u53D7\u968F\u673A\u4E0E\u786E\u5B9A\uFF0C\u63A2\u7D22\u6982\u7387\u7684\u4E16\u754C\u3002', gradient: 'from-yellow-400 to-amber-500' },
}

const levelGradients = [
  'from-green-100 to-emerald-50 border-green-200 hover:border-green-400',
  'from-blue-100 to-sky-50 border-blue-200 hover:border-blue-400',
  'from-purple-100 to-violet-50 border-purple-200 hover:border-purple-400',
]

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const mod = MODULE_INFO[moduleId ?? ''] ?? { zh: '\u6A21\u5757', en: 'Module', icon: '\uD83D\uDCDA', desc: '', gradient: 'from-gray-400 to-gray-500' }

  return (
    <div className="min-h-screen">
      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Module header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="text-6xl mb-3"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {mod.icon}
          </motion.div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-1">{mod.zh}</h1>
          <p className="text-sm text-gray-500 mb-1">{mod.en}</p>
          <div className={`inline-block mt-2 px-3 py-1 rounded-full bg-gradient-to-r ${mod.gradient} text-white text-xs font-bold`}>
            Module {moduleId?.toUpperCase()}
          </div>
          <p className="text-sm text-gray-600 mt-4 leading-relaxed max-w-xs mx-auto">{mod.desc}</p>
        </motion.div>

        {/* Level cards */}
        <div className="space-y-4">
          {LEVELS.map((level, i) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/module/${moduleId}/play/${level.id}`)}
              className={`
                w-full p-5 rounded-2xl border-2 bg-gradient-to-br
                ${levelGradients[i]}
                shadow-md hover:shadow-lg
                transition-all duration-200 text-left
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700 px-2 py-0.5 rounded-full">
                      L{level.num}
                    </span>
                    <span className="text-base font-bold text-gray-800">
                      {level.title_zh}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 ml-1">{level.title_en}</p>
                  <p className="text-xs text-gray-400 ml-1 mt-1">
                    {'\uD83C\uDF82'} {level.age} {'\u5C81'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {/* Star rating */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: level.maxStars }, (_, si) => (
                      <span key={si} className={`text-xl ${si < level.stars ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {si < level.stars ? '\u2B50' : '\u2606'}
                      </span>
                    ))}
                  </div>
                  {/* No lock — all unlocked per PRD P8 */}
                  <span className="text-2xl text-gray-300">{'\u203A'}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
