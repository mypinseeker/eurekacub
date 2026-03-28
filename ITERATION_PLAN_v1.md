# ITERATION PLAN: EurekaCub 🐻 v1.0 — 框架 + 首批 4 模块

> **关联 PRD**: PRD-EUREKACUB-001 (状态: ✅ Approved v1.1)
> **Author**: User + Claude
> **Date**: 2026-03-28
> **Base Commit**: 无（新项目）
> **预估总工时**: ~48h（4 个迭代）
> **当前状态**: ✅ **v1.0.0 — 全部 4 迭代完成**

> ⚠️ **GATE-2**: 本文档必须经用户确认后，才可开始编写代码。确认记录见下方。

---

## 0. 用户确认

| 确认项 | 状态 | 日期 |
|--------|------|------|
| PRD 已 Approved | ✅ | 2026-03-28 |
| ITERATION_PLAN 已 Review | ✅ | 2026-03-28 |
| 用户说"开始开发" | ✅ | 2026-03-28 |

---

## 🏆 交付总结 (2026-03-28)

| 迭代 | 目标 | 交付物 | Commit |
|------|------|--------|--------|
| **Iter 0** | 🏗 框架搭建 | 教育引擎 + 渲染器注册表 + DB Schema + 内容验证 + 开源基建 | `47b36ef` |
| **Iter 1** | 🌱 6岁能玩 | M1对称 + M2分数 + M7数列 + M8概率 + 22 puzzles + CI + Vercel | `ec5e7aa` |
| **Iter 2** | 🚀 9岁进阶 | M4导数 + M5方程 + M6矩阵 + M3几何 + 20 puzzles = 8模块全开 | `e79e448` |
| **Iter 3** | 🌍 社区就绪 | 冒险模式 + 家长面板 + i18n中英 + CODEOWNERS + 6冒险故事 | (final) |

**质量指标**: 84+ tests, 42+ content files validated, 0 TS errors, 8 module renderers, MIT license

---

## 1. 架构设计

### 1.1 整体架构：前端渲染 + 后端内容分发

```
┌─────────────────────────────────────────────────────────────┐
│                     👦 孩子的浏览器                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           🐻 EurekaCub (React + Vite)                  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────────────────┐ │  │
│  │  │ App     │ │ Education│ │ Module Renderers       │ │  │
│  │  │ Shell + │ │ Engine   │ │ Canvas (对称/导数/概率) │ │  │
│  │  │ Router  │ │ DDA/脚手 │ │ SVG (分数/方程/几何/   │ │  │
│  │  │         │ │ 架/反馈  │ │     矩阵/数列)        │ │  │
│  │  └─────────┘ └──────────┘ └────────────────────────┘ │  │
│  │  ┌─────────────────────┐ ┌──────────────────────────┐│  │
│  │  │  ContentCache       │ │ ProgressStore            ││  │
│  │  │  (IndexedDB/LS)     │ │ (localStorage)           ││  │
│  │  │  离线题目缓存        │ │ 进度/设置/作品           ││  │
│  │  └──────────┬──────────┘ └──────────────────────────┘│  │
│  └─────────────┼────────────────────────────────────────┘  │
│                │ fetch on launch + periodic sync            │
└────────────────┼────────────────────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────────────────────┐
│              ☁️  Supabase (后端)                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL                         │   │
│  │  modules          → 8 个模块元数据                     │   │
│  │  levels           → L1/L2/L3 级别配置                  │   │
│  │  puzzles          → 每个关卡的具体题目数据              │   │
│  │  adventures       → 17 个冒险的剧本数据                │   │
│  │  feedback_messages → 措辞库 (中/英)                    │   │
│  │  achievements     → 徽章定义                           │   │
│  │  science_scenes   → 科学跨界素材                       │   │
│  │  content_version  → 内容版本号 (客户端比对是否有新内容)  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────┐                                       │
│  │  Edge Functions   │ → 未来可选：AI 辅助出题              │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心设计原则

| 原则 | 说明 | 实现方式 |
|------|------|---------|
| **内容与代码分离** | 新增题目/冒险 = 改数据库，不改代码 | 所有关卡数据从 Supabase 读取，前端只负责渲染 |
| **离线优先** | 首次加载后缓存内容，断网也能玩 | IndexedDB 缓存 + content_version 增量同步 |
| **免安装免升级** | Web App 打开即用，自动获取新内容 | Vercel 部署 + Supabase 内容热更新 |
| **渐进加载** | 不一次性下载全部内容 | 按模块懒加载：进入 M2 分数时才拉 M2 的题目 |
| **教育引擎客户端化** | DDA/脚手架/反馈全在浏览器运算 | 避免网络延迟影响交互体验 |

### 1.3 前后端分工

| 职责 | 前端 (React) | 后端 (Supabase) |
|------|-------------|----------------|
| **Canvas/SVG 渲染** | ✅ 画披萨、天平、曲线、像素画 | — |
| **教育引擎** | ✅ DDA + 脚手架 + 反馈 + EIS | — |
| **进度存储** | ✅ localStorage (v1) | 🔜 v2 云同步 |
| **题目/关卡数据** | 缓存 + 渲染 | ✅ 存储 + 分发 |
| **内容管理** | — | ✅ 增/删/改题目 |
| **内容版本控制** | 比对版本号，有新内容则拉取 | ✅ content_version 表 |
| **用户认证** | ❌ v1 不需要 | 🔜 v2 可选 |
| **分析统计** | 🔜 v2 匿名使用数据 | 🔜 v2 |

### 1.4 数据模型 (Supabase Schema)

```sql
-- 模块元数据
CREATE TABLE modules (
  id TEXT PRIMARY KEY,           -- 'symmetry', 'fraction', ...
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL,             -- emoji
  group_tag TEXT NOT NULL,        -- 'explorer' | 'challenger' | 'shared'
  sort_order INT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 级别配置
CREATE TABLE levels (
  id TEXT PRIMARY KEY,           -- 'symmetry-L1', 'fraction-L2'
  module_id TEXT REFERENCES modules(id),
  level_num INT NOT NULL,         -- 1, 2, 3
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  age_target TEXT,               -- '6+', '9+', 'all'
  renderer_type TEXT NOT NULL,    -- 'canvas-mirror', 'svg-pizza', 'canvas-curve'...
  config JSONB NOT NULL DEFAULT '{}'  -- 级别特定配置
);

-- 关卡/题目（核心内容表，持续增长）
CREATE TABLE puzzles (
  id SERIAL PRIMARY KEY,
  level_id TEXT REFERENCES levels(id),
  sort_order INT NOT NULL,
  difficulty INT DEFAULT 1,       -- 1-10, DDA 使用
  puzzle_type TEXT NOT NULL,      -- 'pizza-cut', 'find-axis', 'number-train'...
  data JSONB NOT NULL,            -- 题目具体数据（每种 type 不同 schema）
  hints JSONB DEFAULT '[]',       -- 三级提示 [hint1, hint2, hint3]
  aha_condition TEXT,             -- 啊哈触发条件表达式
  tags TEXT[] DEFAULT '{}',       -- ['sport', 'science', 'daily-life']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- puzzle.data 示例（分数切披萨）:
-- {
--   "cuts": 3,
--   "target_fraction": "1/4",
--   "character": "🐻",
--   "task_zh": "小熊想吃四分之一的披萨，帮它切吧！",
--   "task_en": "Bear wants 1/4 of the pizza. Help cut it!"
-- }

-- puzzle.data 示例（数列火车）:
-- {
--   "sequence": [2, 4, 6, 8],
--   "answer": 10,
--   "rule": "+2",
--   "visual": "train"
-- }

-- 冒险剧本
CREATE TABLE adventures (
  id TEXT PRIMARY KEY,           -- 'birthday-party', 'ski-math'
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  icon TEXT,
  group_tag TEXT NOT NULL,        -- 'explorer', 'challenger', 'ultimate', 'sport', 'science'
  unlock_condition JSONB,         -- {"modules_completed": ["symmetry-L1", "fraction-L1"]}
  sort_order INT,
  is_active BOOLEAN DEFAULT true
);

-- 冒险关卡
CREATE TABLE adventure_stages (
  id SERIAL PRIMARY KEY,
  adventure_id TEXT REFERENCES adventures(id),
  sort_order INT NOT NULL,
  scenario_zh TEXT NOT NULL,      -- 情境描述
  scenario_en TEXT,
  module_ids TEXT[],              -- 关联的数学模块
  puzzle_type TEXT NOT NULL,      -- 渲染器类型
  data JSONB NOT NULL,            -- 关卡数据
  age_target TEXT DEFAULT 'all'
);

-- 反馈措辞库
CREATE TABLE feedback_messages (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,         -- 'correct', 'error', 'hint', 'aha', 'encourage'
  context TEXT,                   -- 'first-try', 'after-struggle', 'streak'...
  message_zh TEXT NOT NULL,
  message_en TEXT NOT NULL,
  audio_url_zh TEXT,              -- 语音文件 URL (6 岁)
  audio_url_en TEXT
);

-- 内容版本（客户端同步用）
CREATE TABLE content_version (
  id INT PRIMARY KEY DEFAULT 1,
  version INT NOT NULL DEFAULT 1,  -- 每次改内容就 +1
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 成就/徽章
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,            -- 'party-planner', 'ski-mathematician'
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  icon TEXT,
  unlock_condition JSONB NOT NULL -- {"adventure_completed": "birthday-party"}
);
```

### 1.5 前端项目结构（v1.1 开源架构版）

```
eurekacub/
├── CLAUDE.md
├── CONTRIBUTING.md                  # 🆕 贡献指南（中英双语）
├── CODE_OF_CONDUCT.md               # 🆕 行为准则（儿童安全优先）
├── LICENSE                          # 🆕 MIT
├── docs/
│   └── PRD-kids-math-v1.md
├── ITERATION_PLAN_v1.md             ← 本文件
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
│
├── .github/                         # 🆕 GitHub 自动化
│   ├── workflows/
│   │   ├── content-validate.yml     # CI: 内容自动审核（3阶段）
│   │   └── sync-to-supabase.yml     # CD: 合并后同步到 Supabase
│   ├── PULL_REQUEST_TEMPLATE/
│   │   ├── content.md               # 内容 PR 审核清单
│   │   └── renderer.md              # 渲染器 PR 审核清单
│   ├── ISSUE_TEMPLATE/
│   │   └── new-puzzle-idea.md
│   └── CODEOWNERS
│
├── content/                         # 🆕 内容仓库（与代码分离）
│   ├── schema/                      # JSON Schema 格式定义
│   │   ├── puzzle.schema.json
│   │   ├── adventure.schema.json
│   │   └── feedback.schema.json
│   ├── puzzles/                     # 题目（按模块组织）
│   │   ├── symmetry/
│   │   ├── fraction/
│   │   ├── sequence/
│   │   ├── probability/
│   │   └── community/               # 社区贡献
│   ├── adventures/                  # 冒险剧本（YAML）
│   │   └── community/
│   ├── feedback/                    # 反馈措辞库
│   └── i18n/
│       ├── zh/
│       └── en/
│
├── scripts/                         # 🆕 工具脚本
│   └── validate-content.ts          # 本地内容验证
│
├── src/
│   ├── main.tsx                     # React 入口
│   ├── App.tsx                      # Router + Layout
│   │
│   ├── api/                         # Supabase 通信层
│   │   ├── supabase.ts
│   │   ├── contentSync.ts           # 内容版本比对 + 增量同步
│   │   └── types.ts
│   │
│   ├── cache/                       # 离线缓存层
│   │   ├── contentCache.ts          # IndexedDB 操作
│   │   └── useContentLoader.ts      # Hook: 缓存优先 + 后台同步
│   │
│   ├── engine/                      # 🧠 教育引擎（纯客户端）
│   │   ├── dda.ts
│   │   ├── scaffold.ts
│   │   ├── feedback.ts
│   │   ├── progress.ts
│   │   ├── eis.ts
│   │   └── useEducation.ts
│   │
│   ├── renderers/                   # 🔌 模块渲染器（插件化）
│   │   ├── registry.ts              # 🆕 渲染器注册表
│   │   ├── common/
│   │   │   ├── CanvasBase.tsx
│   │   │   ├── SvgBase.tsx
│   │   │   ├── DragLayer.tsx
│   │   │   └── AnimationLoop.ts
│   │   ├── symmetry/                # 🪞 M1
│   │   ├── fraction/                # 🍕 M2
│   │   ├── sequence/                # 🔍 M7
│   │   ├── probability/             # 🎲 M8
│   │   ├── derivative/              # 🚗 M4 (Iter 2)
│   │   ├── equation/                # ⚖️ M5 (Iter 2)
│   │   ├── matrix/                  # 🎨 M6 (Iter 2)
│   │   ├── geometry/                # 🔷 M3 (Iter 2)
│   │   └── community/               # 🆕 社区渲染器
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ModulePage.tsx
│   │   ├── PuzzlePage.tsx           # 读 registry 动态渲染
│   │   ├── AdventurePage.tsx
│   │   ├── ParentPanel.tsx          # 含举报按钮
│   │   └── CreationGallery.tsx
│   │
│   ├── components/
│   │   ├── ModuleCard.tsx
│   │   ├── LevelBadge.tsx
│   │   ├── TaskBar.tsx
│   │   ├── HintButton.tsx
│   │   ├── FeedbackToast.tsx
│   │   ├── AhaPopup.tsx
│   │   ├── ProgressMountain.tsx
│   │   └── SettingsDrawer.tsx
│   │
│   ├── i18n/
│   │   ├── zh.json
│   │   └── en.json
│   │
│   ├── hooks/
│   │   └── useFeedback.ts           # 🆕 三通道反馈 Hook
│   │
│   └── utils/
│       ├── math.ts
│       ├── geometry.ts
│       ├── random.ts
│       ├── audio.ts                 # 🆕 音效管理器
│       └── haptic.ts                # 🆕 Haptic 震动
│
├── public/
│   ├── sounds/                      # 🆕 音效资源
│   │   ├── ui/                      #   tap/snap/slide/toggle
│   │   ├── feedback/                #   correct/aha/celebrate (⚠无error)
│   │   ├── module/                  #   cut/brush/whistle/coin/dice/balance
│   │   └── ambient/                 #   背景音（默认关）
│   └── images/
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed/
│       ├── modules.sql
│       ├── levels.sql
│       ├── puzzles_symmetry.sql
│       ├── puzzles_fraction.sql
│       ├── puzzles_sequence.sql
│       ├── puzzles_probability.sql
│       ├── adventures.sql
│       └── feedback_messages.sql
│
└── tests/
    ├── engine/
    │   ├── dda.test.ts
    │   ├── scaffold.test.ts
    │   └── feedback.test.ts
    ├── renderers/
    └── utils/
```

### 1.6 内容更新流程（开源社区驱动）

```
贡献者想加一道新题目:

  ① Fork 仓库 → content/puzzles/ 下新建 JSON 文件
     (参照 CONTRIBUTING.md + content/schema/puzzle.schema.json)

  ② 本地验证:
     npm run validate-content
     → JSON Schema ✅  渲染器引用 ✅  i18n ✅  措辞合规 ✅

  ③ 提交 PR → GitHub Actions CI 自动验证 (content-validate.yml)
     Stage 1: 格式校验 ✅
     Stage 2: 内容安全（敏感词扫描）✅
     Stage 3: 教育合规（hints≥2、无否定措辞）✅
     → 全部通过 → 标记 ci-passed

  ④ Reviewer 按清单审核 → Approve + Merge

  ⑤ 合并触发 GitHub Action (sync-to-supabase.yml):
     → JSON → INSERT INTO Supabase puzzles 表
     → UPDATE content_version SET version = version + 1

  ⑥ 孩子下次打开 EurekaCub:
     App 启动 → fetch content_version
     → 发现 version > 本地缓存版本
     → 按模块增量拉取新 puzzles → 写入 IndexedDB
     → 新题目立即可玩 🎉

  离线场景:
     App 启动 → fetch 失败（无网络）
     → 使用 IndexedDB 缓存 → 照常可玩 ✅
     → 下次有网时自动同步
```

### 1.7 前端渲染器选型

| 模块 | 渲染技术 | 原因 |
|------|---------|------|
| M1 对称 — 镜像画板 | **Canvas 2D** | 高频画笔渲染（≥60fps），实时镜像计算 |
| M1 对称 — 找对称轴 | **SVG** | 拖拽线条交互，DOM 事件方便 |
| M2 分数 — 切披萨 | **SVG** | 扇形路径精确控制，点击分块交互 |
| M3 几何 — 七巧板 | **SVG** | 多边形拖拽旋转，碰撞检测 |
| M4 导数 — 速度控制器 | **Canvas 2D** | 实时曲线绘制+小车动画，高频重绘 |
| M5 方程 — 天平 | **SVG + Framer Motion** | 物理模拟动画（倾斜），拖拽物品 |
| M6 矩阵 — 像素画 | **Canvas 2D** | 8×8 像素网格+变换矩阵运算 |
| M7 数列 — 数字火车 | **SVG + Framer Motion** | 火车车厢动画，拖放数字 |
| M8 概率 — 抛硬币/骰子 | **Canvas 2D** | 物理模拟（旋转/弹跳），批量渲染 |
| M8 概率 — 统计图表 | **SVG** | 柱状图/饼图，实时更新 |

---

## 2. 迭代拆分总览

```
┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Iter 0        │   │    Iter 1        │   │    Iter 2        │   │    Iter 3        │
│   🏗 框架搭建    │──▶│  🌱 6岁能玩      │──▶│  🚀 9岁进阶      │──▶│  🌍 社区就绪     │
│   ~10h          │   │  ~14h            │   │  ~14h            │   │  ~10h            │
├─────────────────┤   ├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ • Vite + React  │   │ • M1 对称 L1-L3  │   │ • M4 导数 L1-L3  │   │ • 冒险 1-17      │
│ • Supabase 连接 │   │ • M2 分数 L1-L3  │   │ • M5 方程 L1-L3  │   │ • 运动+科学冒险  │
│ • DB Schema     │   │ • M7 数列 L1-L2  │   │ • M6 矩阵 L1-L3  │   │ • 数学魔术       │
│ • 教育引擎      │   │ • M8 概率 L1-L2  │   │ • M3 几何 L1-L3  │   │ • 家长面板+举报  │
│ • 内容缓存层    │   │ • content/ 种子  │   │ • 冒险 7-9       │   │ • 质量监控       │
│ • 渲染器注册表  │   │ • GitHub CI      │   │ • 认知冲突关卡   │   │ • i18n 英文      │
│ • JSON Schema   │   │ • Vercel 部署    │   │ • CODEOWNERS     │   │                  │
│ • 验证脚本      │   │                  │   │                  │   │                  │
│ • 开源基建      │   │                  │   │                  │   │                  │
├─────────────────┤   ├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ 🎯 空壳跑通     │   │ 🎯 6岁妹妹试玩  │   │ 🎯 9岁哥哥试玩   │   │ 🎯 开源社区      │
│  + 开源框架就绪  │   │   4 模块 + CI    │   │   8 模块全开     │   │   可接受贡献     │
└─────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 3. Iter 0 任务清单：🏗 框架搭建

### TASK-0-1: 项目初始化
- **优先级**: P0
- **类型**: Config
- **验收标准**: `npm run dev` 能打开空白页面，TS 编译 0 error
- **状态**: ⬜ TODO

```bash
npm create vite@latest eurekacub -- --template react-ts
cd eurekacub
npm install tailwindcss @tailwindcss/vite
npm install framer-motion react-router-dom
npm install @supabase/supabase-js idb-keyval
npm install -D vitest @testing-library/react ajv  # ajv 用于 JSON Schema 验证
```

---

### TASK-0-2: Supabase 项目创建 + Schema 迁移
- **优先级**: P0
- **类型**: Migration
- **验收标准**: 7 张表创建成功，可在 Dashboard 插入测试数据
- **状态**: ⬜ TODO

`supabase/migrations/001_initial_schema.sql` — 内容见 1.4 节

---

### TASK-0-3: Supabase 客户端 + 内容缓存层
- **优先级**: P0
- **类型**: Code
- **涉及文件**: `src/api/supabase.ts`, `src/api/types.ts`, `src/cache/contentCache.ts`, `src/cache/useContentLoader.ts`
- **验收标准**:
  - `useContentLoader('fraction')` 返回该模块的所有 puzzles
  - 首次从 Supabase 拉取 → 写入 IndexedDB
  - 第二次优先读缓存 → 后台检查版本号
  - 断网时从缓存读取成功
- **状态**: ⬜ TODO

---

### TASK-0-4: 教育引擎核心
- **优先级**: P0
- **类型**: Code + Test
- **涉及文件**: `src/engine/dda.ts`, `src/engine/scaffold.ts`, `src/engine/feedback.ts`, `src/engine/progress.ts`, `src/engine/useEducation.ts`
- **验收标准**:
  - DDA: 连对 3 → difficulty+1; 连错 2 → difficulty-1 + 触发 scaffold
  - Scaffold: 状态机 idle → hint1 → hint2 → demo → 回到 idle
  - Feedback: 根据 category + context 从缓存的措辞库选取文案
  - Progress: localStorage 读写 `{moduleId: {levelId: {completed: bool, stars: 0-3}}}`
  - 测试覆盖率 ≥ 90%
- **状态**: ⬜ TODO

---

### TASK-0-5: App Shell + 路由 + 双入口主菜单
- **优先级**: P0
- **类型**: Code
- **涉及文件**: `src/App.tsx`, `src/pages/HomePage.tsx`, `src/pages/ModulePage.tsx`, `src/pages/PuzzlePage.tsx`, `src/components/*`
- **验收标准**:
  - `/` → 主菜单（🌱 探索者 / 🚀 挑战者 切换）
  - `/module/:id` → 模块页（显示 L1/L2/L3）
  - `/module/:id/play` → 关卡页（渲染器容器）
  - 模块卡片从 Supabase modules 表读取，带缓存
  - 响应式布局 768px~1920px
- **状态**: ⬜ TODO

---

### TASK-0-6: 渲染器注册表 + 共享基类
- **优先级**: P0
- **类型**: Code
- **涉及文件**: `src/renderers/registry.ts`, `src/renderers/common/CanvasBase.tsx`, `src/renderers/common/SvgBase.tsx`, `src/renderers/common/DragLayer.tsx`
- **验收标准**:
  - `registry.ts`: `registerRenderer()` / `getRenderer()` 接口可用；PuzzlePage 通过 registry 动态加载渲染器
  - CanvasBase: 自动适配容器尺寸，提供 draw loop，触屏+鼠标事件统一
  - SvgBase: viewBox 自适应，提供拖拽/点击事件
  - DragLayer: 统一 pointer events（mouse + touch），防止 iOS 滚动冲突
- **状态**: ⬜ TODO

---

### TASK-0-7: i18n 框架 + 措辞库加载
- **优先级**: P1
- **类型**: Code
- **涉及文件**: `src/i18n/zh.json`, `src/i18n/en.json`, i18n 初始化
- **验收标准**: UI 静态文字中英文切换；措辞库从 Supabase feedback_messages 加载
- **状态**: ⬜ TODO

---

### TASK-0-8: 内容格式标准化 + 验证脚本
- **优先级**: P0
- **类型**: Code + Config
- **涉及文件**: `content/schema/puzzle.schema.json`, `content/schema/adventure.schema.json`, `content/schema/feedback.schema.json`, `scripts/validate-content.ts`
- **验收标准**:
  - JSON Schema 定义题目/冒险/措辞三种格式规范
  - `npm run validate-content` 可本地运行，检查：格式校验 + 敏感词扫描 + 教育合规（hints≥2、措辞合规、无计时/排名）
  - 验证脚本对不合格 JSON 给出具体错误信息和修复建议
- **状态**: ⬜ TODO

---

### TASK-0-9: 开源基建 (LICENSE / CONTRIBUTING / GitHub 模板)
- **优先级**: P1
- **类型**: Docs + Config
- **涉及文件**: `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.github/PULL_REQUEST_TEMPLATE/content.md`, `.github/PULL_REQUEST_TEMPLATE/renderer.md`, `.github/ISSUE_TEMPLATE/new-puzzle-idea.md`, `.github/CODEOWNERS`
- **验收标准**:
  - MIT LICENSE 文件
  - CONTRIBUTING.md 中英双语：5 分钟贡献第一道题的指南 + 教育原则速查
  - PR 模板含审核清单（内容 vs 渲染器两套）
  - Issue 模板可用
- **状态**: ⬜ TODO

---

## 4. Iter 1 任务清单：🌱 6 岁能玩

### TASK-1-1: M1 对称 — 镜像画板渲染器
- **优先级**: P0
- **类型**: Code
- **涉及文件**: `src/renderers/symmetry/MirrorCanvas.tsx`, `src/renderers/symmetry/AxisFinder.tsx`, `src/renderers/symmetry/Kaleidoscope.tsx`
- **验收标准**:
  - L1：左半边画笔→右半边实时镜像，延迟 ≤50ms
  - L2：给图片找对称轴，可拖线标记，判定正确/错误
  - L3：2/3/4/6 重对称万花筒模式
  - 触屏画笔流畅
- **状态**: ⬜ TODO

---

### TASK-1-2: M2 分数 — 切披萨渲染器
- **优先级**: P0
- **类型**: Code
- **涉及文件**: `src/renderers/fraction/PizzaCutter.tsx`, `src/renderers/fraction/FractionAdd.tsx`, `src/renderers/fraction/NumberLine.tsx`
- **验收标准**:
  - L1：手指/鼠标在圆上画切割线，切割动画，点击分块，分数标注
  - L2：两个不同切法的圆拖拽到一起→通分动画
  - L3：数轴 0→1，拖放分数标记到正确位置
  - 天平自纠错：切不等分时视觉可见
- **状态**: ⬜ TODO

---

### TASK-1-3: M7 数列 — 数字火车渲染器
- **优先级**: P0
- **类型**: Code
- **涉及文件**: `src/renderers/sequence/NumberTrain.tsx`, `src/renderers/sequence/RuleFactory.tsx`, `src/renderers/sequence/DotPattern.tsx`
- **验收标准**:
  - L1：彩色火车动画，拖入正确数字→火车开动+汽笛声
  - L2：工厂传送带动画，输入种子→看产出→猜规则
  - 答对反馈用成长型措辞（从 feedback_messages 加载）
- **状态**: ⬜ TODO

---

### TASK-1-4: M8 概率 — 幸运实验室渲染器
- **优先级**: P0
- **类型**: Code
- **涉及文件**: `src/renderers/probability/CoinFlip.tsx`, `src/renderers/probability/BallDraw.tsx`, `src/renderers/probability/MontyHall.tsx`, `src/renderers/probability/StatsPanel.tsx`
- **验收标准**:
  - L1：抛硬币物理动画，柱状图实时更新，10000 次模拟 ≤3 秒
  - L2：彩球袋配置器，摸球+记录+对比
  - L3：蒙提霍尔 3 门游戏，自动模拟 1000 次
  - 统计面板实时更新柱状图/饼图
- **状态**: ⬜ TODO

---

### TASK-1-5: 种子数据 — 首批 4 模块题目入库
- **优先级**: P0
- **类型**: Migration + Data
- **涉及文件**: `supabase/seed/puzzles_symmetry.sql`, `puzzles_fraction.sql`, `puzzles_sequence.sql`, `puzzles_probability.sql`, `feedback_messages.sql`
- **验收标准**:
  - PRD Appendix D 中 4 个模块的样例数据全部入库
  - 措辞库 C-2 的全部正面/错误反馈入库
  - App 启动后能拉到数据并渲染关卡
- **状态**: ⬜ TODO

---

### TASK-1-6: Vercel 部署 + 域名
- **优先级**: P1
- **类型**: Config
- **验收标准**: 公网可访问，HTTPS，Supabase 环境变量配置
- **状态**: ⬜ TODO

---

### TASK-1-7: 测试与 QA
- **优先级**: P0
- **类型**: Test
- **验收标准**:
  - [ ] 教育引擎测试 ≥ 20 个 cases
  - [ ] 每个渲染器至少 3 个 snapshot/交互测试
  - [ ] TS 0 errors
  - [ ] 6 岁孩子试玩 M1 L1 + M2 L1 能独立完成
- **状态**: ⬜ TODO

---

### TASK-1-8: GitHub Actions CI — 内容审核管线
- **优先级**: P0
- **类型**: Config
- **涉及文件**: `.github/workflows/content-validate.yml`, `.github/workflows/sync-to-supabase.yml`
- **验收标准**:
  - PR 提交 `content/` 下文件时自动触发 3 阶段检查（格式→安全→教育合规）
  - CI 失败时给出具体修复建议
  - PR 合并到 main 后触发 sync-to-supabase：自动 INSERT 新内容 + content_version +1
- **状态**: ⬜ TODO

---

### TASK-1-9: 首批内容文件 — content/ 目录填充
- **优先级**: P0
- **类型**: Data
- **涉及文件**: `content/puzzles/symmetry/*.json`, `content/puzzles/fraction/*.json`, `content/puzzles/sequence/*.json`, `content/puzzles/probability/*.json`, `content/feedback/*.json`
- **验收标准**:
  - PRD Appendix D 中 4 个模块的样例数据全部以 JSON 文件存在于 content/ 目录
  - 所有文件通过 `npm run validate-content` 校验
  - 措辞库 C-2 的反馈措辞以 JSON 文件存在于 content/feedback/
- **状态**: ⬜ TODO

---

## 5. Iter 2/3 概要（详细计划在 Iter 1 完成后输出）

### Iter 2：🚀 9 岁进阶（~14h）
- M4 导数渲染器（Canvas 曲线 + 小车动画）
- M5 方程渲染器（SVG 天平 + 物理模拟）
- M6 矩阵渲染器（Canvas 像素画 + 变换）
- M3 几何渲染器（SVG 七巧板 + 铺地砖）
- 冒险 7-9（终极冒险）种子数据
- 认知冲突关卡（A.4 的 8 个误区）
- GitHub→Supabase 自动同步完善 + CODEOWNERS 配置

### Iter 3：🌍 内容丰富 + 社区就绪（~10h）
- 生活冒险 1-6 + 运动冒险 10-14 + 科学冒险 15-17 种子数据
- 数学魔术 (F.1) 互动页面
- 无字证明 (F.2) 动画页面
- 家长面板 (FR-20) + 举报按钮 (FR-30)
- 运行时质量监控（匿名统计 + 阈值告警）(FR-31)
- i18n 英文完善
- 音效/语音资源

---

## 6. QA 门禁（GATE-3）

| 检查项 | 命令 | 预期结果 | 实际结果 |
|--------|------|---------|---------|
| 测试通过 | `npx vitest run` | 0 failures | ⬜ |
| TS 检查 | `npx tsc --noEmit` | 0 errors | ⬜ |
| 构建成功 | `npm run build` | dist/ 生成 | ⬜ |
| 内容校验 | `npm run validate-content` | 0 errors | ⬜ |
| CI 管线 | GitHub Actions | content PR 自动检查通过 | ⬜ |
| Lighthouse | Chrome DevTools | Performance ≥ 90 | ⬜ |
| 教育合规 | 手动检查 | P1-P10 铁律全部通过 | ⬜ |
| 离线可用 | 断网测试 | 已缓存模块可玩 | ⬜ |
| 6 岁试玩 | 真人测试 | M1 L1 + M2 L1 独立完成 | ⬜ |

---

## 7. 回滚方案

**如果上线后发现严重问题：**
1. Vercel 回滚到上一个部署版本（Dashboard 一键操作）
2. Supabase 数据问题：回滚 migration 或修复 seed 数据
3. 内容问题：在 puzzles 表将有问题的行 `is_active = false`

---

## 8. 交付清单

| 交付物 | Iter 0 | Iter 1 | Iter 2 | Iter 3 |
|--------|--------|--------|--------|--------|
| 代码提交 | ⬜ | ⬜ | ⬜ | ⬜ |
| 测试通过 | ⬜ | ⬜ | ⬜ | ⬜ |
| Vercel 部署 | — | ⬜ | ⬜ | ⬜ |
| 模块可玩数 | 0 | 4 | 8 | 8 |
| 冒险可玩数 | 0 | 0 | 3 | 17 |
| content/ JSON 文件 | schema 定义 | 4 模块种子 | 8 模块完整 | + 冒险 + 科学 |
| GitHub CI | — | ⬜ | ⬜ | ⬜ |
| CONTRIBUTING.md | ⬜ | — | — | — |
| CHANGELOG | ⬜ | ⬜ | ⬜ | ⬜ |
