# 🐻 EurekaCub — 小科学家的发现之旅

> **不教公式，玩着理解本质。**
> Don't teach formulas — let kids understand concepts through play.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-513%20passed-brightgreen.svg)](#testing)
[![i18n](https://img.shields.io/badge/i18n-5%20languages-blue.svg)](#internationalization)

EurekaCub 是一个**开源儿童互动科学探索平台**，让 6-12 岁的小朋友通过动手操作来理解数学与科学的本质——对称、分数、几何、导数、方程、矩阵、序列、概率。

**不是传统做题 App。** 没有公式、没有分数排名、没有倒计时压力。孩子们通过切披萨理解分数、通过天平理解方程、通过画镜像理解对称。

[English](#english) | [快速开始](#quick-start) | [贡献指南](#contributing)

---

## ✨ Features

### 🎮 8 个互动模块

| 模块 | 名称 | 核心玩法 | 适合年龄 |
|------|------|----------|---------|
| 🪞 M1 | 对称之美 | 镜像画布 — 画出对称图形 | 🌱 6+ |
| 🍕 M2 | 分数奇趣 | 披萨切割大师 — 切出正确分数 | 🌱 6+ |
| 🔺 M3 | 几何探索 | 七巧板拼图 — 拖拽旋转拼合 | 🌱 6+ |
| 📈 M4 | 微积分启蒙 | 速度控制器 — 画曲线理解变化率 | 🚀 9+ |
| ⚖️ M5 | 方程冒险 | 天平求解器 — 平衡两边解方程 | 🚀 9+ |
| 🎨 M6 | 矩阵世界 | 像素变换工坊 — 旋转/翻转理解矩阵 | 🚀 9+ |
| 🔢 M7 | 序列密码 | 模式探测器 — 发现数列规律 | 🌟 共享 |
| 🎲 M8 | 概率乐园 | 幸运实验室 — 抛硬币理解概率 | 🌟 共享 |

### 🏕️ 冒险模式

17 个故事驱动的冒险（已实装 6 个），将多个模块串成叙事：
- 🧑‍🍳 **厨房科学家** — 跟小熊一起做蛋糕，切面团学分数
- 🌻 **花园探险家** — 种花发现数列规律
- 🔐 **密码破译师** — 用矩阵变换解密
- 🚀 **太空领航员** — 用导数控制飞船速度
- ⚽ **运动数据家** — 用概率分析足球比赛
- 🧪 **化学实验室** — 用方程平衡化学反应

### 👨‍👩‍👧 家长面板

- 查看学习时间和完成进度
- 设置每日时间限制
- **无焦虑设计**：不显示分数、排名、对错率
- 切换语言和音效

---

## <a name="quick-start"></a>🚀 Quick Start

### 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9

### 安装 & 启动

```bash
# 克隆项目
git clone https://github.com/mypinseeker/eurekacub.git
cd eurekacub

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173` 即可使用。

### 构建生产版本

```bash
npm run build
npm run preview   # 预览构建结果
```

---

## 📜 Scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | TypeScript 编译 + Vite 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行 Vitest 单元测试 |
| `npm run test:e2e` | 运行 Playwright E2E 测试 |
| `npm run test:e2e:ui` | Playwright UI 模式 |
| `npm run lint` | ESLint 代码检查 |
| `npm run validate-content` | 校验 puzzle JSON schema |

---

## <a name="testing"></a>🧪 Testing

```bash
# 单元测试（434 tests, 20 suites）
npm run test

# E2E 测试（79 tests, 5 suites）
npm run test:e2e

# 全部一起跑
npm run test && npm run test:e2e
```

### 测试覆盖

| 类型 | 数量 | 框架 |
|------|------|------|
| Unit tests | 434 | Vitest |
| E2E tests | 79 | Playwright (Chromium) |
| **Total** | **513** | — |

所有测试用例均追溯到 PRD 需求编号 (FR-xx / NFR-xx)，详见 `docs/TEST_CHECKLIST.md`。

---

## 🏗️ Tech Stack

| 层 | 技术 |
|----|------|
| **UI 框架** | React 19 + TypeScript 5 |
| **构建工具** | Vite 5 |
| **样式** | Tailwind CSS 4 |
| **动画** | Framer Motion |
| **路由** | React Router v7 |
| **后端** | Supabase (可选，用于内容热更新) |
| **离线缓存** | IndexedDB (idb-keyval) |
| **国际化** | i18next |
| **测试** | Vitest + Playwright |
| **CI** | GitHub Actions |

---

## 📁 Project Structure

```
eurekacub/
├── src/
│   ├── pages/            # 页面组件 (Home, Module, Puzzle, Adventure, Parent)
│   ├── renderers/        # 8 个互动渲染器（核心玩法）
│   │   ├── symmetry/     #   镜像画布
│   │   ├── fraction/     #   披萨切割
│   │   ├── geometry/     #   七巧板
│   │   ├── derivative/   #   速度曲线
│   │   ├── equation/     #   天平方程
│   │   ├── matrix/       #   像素变换
│   │   ├── sequence/     #   数列火车
│   │   └── probability/  #   概率实验
│   ├── components/       # 通用 UI 组件
│   ├── hooks/            # React hooks
│   ├── engine/           # 业务逻辑 (进度、反馈、难度调节)
│   ├── i18n/             # 5 语言翻译文件
│   └── api/              # Supabase 接口
├── content/
│   ├── puzzles/          # 8 模块的 puzzle JSON 文件
│   └── adventures/       # 冒险叙事 JSON
├── e2e/                  # Playwright E2E 测试
├── tests/                # Vitest 单元测试
├── docs/                 # PRD + 测试清单
├── CONTRIBUTING.md       # 贡献指南（三级模型）
└── CLAUDE.md             # AI 开发规则
```

---

## <a name="internationalization"></a>🌍 Internationalization

EurekaCub 支持 5 种语言：

| 语言 | 代码 | 状态 |
|------|------|------|
| 🇨🇳 中文 | `zh` | ✅ 默认语言 |
| 🇺🇸 English | `en` | ✅ 完整 |
| 🇪🇸 Español | `es` | ✅ 完整 |
| 🇫🇷 Français | `fr` | ✅ 完整 |
| 🇩🇪 Deutsch | `de` | ✅ 完整 |

在设置中一键切换，或在家长面板的语言下拉菜单中选择。

---

## <a name="contributing"></a>🤝 Contributing

EurekaCub 采用**三级开源贡献模型**，让不同技能的人都能参与：

### 🟢 L1: 出题者（零编码）

添加 JSON 格式的 puzzle 文件，不需要写任何代码：

```json
{
  "id": "my-new-puzzle",
  "module": "fraction",
  "level": "L1",
  "difficulty": 2,
  "renderer": "PizzaCutter",
  "task": {
    "zh": "把披萨切成 3 等份",
    "en": "Cut the pizza into 3 equal pieces"
  },
  "data": {
    "targetSlices": 3,
    "tolerance": 5
  },
  "hints": [
    {
      "zh": "试试画 Y 形的切割线？",
      "en": "Try drawing Y-shaped cuts?"
    }
  ]
}
```

放入 `content/puzzles/<module>/` 目录，提交 PR 即可。

### 🟡 L2: 故事家（YAML/JSON 叙事）

编写冒险剧情，把多个 puzzle 串成故事。详见 `content/adventures/` 中的示例。

### 🔴 L3: 开发者（React 组件）

构建新的渲染器组件。每个渲染器实现 `RendererProps` 接口：

```tsx
export default function MyRenderer({ puzzle, onCorrect, onError, onAha, onComplete }: RendererProps) {
  // 你的互动逻辑
}
```

注册到 `src/renderers/registry.ts` 即可。

详细指南请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 📚 Educational Foundation

EurekaCub 的设计基于 10 大教育心理学理论：

| 理论 | 在 EurekaCub 中的体现 |
|------|----------------------|
| **Piaget** 建构主义 | 孩子通过操作自己建构理解 |
| **Vygotsky** 脚手架 | 渐进式难度 + 提示系统 |
| **Bruner** 螺旋课程 | L1→L2→L3 三级递进 |
| **Montessori** 感官学习 | 触觉交互（拖拽、滑动、点击） |
| **Papert** 建造主义 | 孩子创造作品（画对称图、拼七巧板） |
| **Flow** 心流 | 难度自适应，保持挑战与技能平衡 |
| **Dweck** 成长型思维 | 无惩罚、鼓励试错、"再试一次"而非"错了" |
| **Gardner** 多元智能 | 视觉/逻辑/空间/动觉多通道 |
| **探究式学习** | 提问式提示而非直接告诉答案 |
| **自我决定论** | 自由选择模块，无强制顺序 |

---

## 🛡️ Child Safety Design

- ❌ **零惩罚**: 没有 ❌ 符号、没有扣分、没有负面反馈
- ⏰ **零计时器**: 概念关卡无倒计时，消除时间压力
- 📊 **零排名**: 不显示分数、排名、正确率
- 🔒 **零外部链接**: 不连接任何外部网站或广告
- 👨‍👩‍👧 **家长专属面板**: 进度只对家长可见，孩子看不到分析数据

---

## <a name="english"></a>🌐 English Overview

**EurekaCub** is an open-source interactive platform for children aged 6-12 to explore math and science concepts through play. Instead of drilling formulas, kids learn by doing — cutting pizzas to understand fractions, balancing scales to solve equations, drawing mirror images to grasp symmetry.

**Key features:**
- 8 interactive modules (Symmetry, Fractions, Geometry, Derivatives, Equations, Matrices, Sequences, Probability)
- 17 story-driven adventures linking modules into narratives
- Parent panel with learning insights (no scores, no rankings)
- 5 languages (Chinese, English, Spanish, French, German)
- 513 automated tests (434 unit + 79 E2E)
- Zero-anxiety design: no timers, no punishments, no competitive pressure

**Quick start:**
```bash
git clone https://github.com/mypinseeker/eurekacub.git
cd eurekacub && npm install && npm run dev
```

---

## 📄 License

[MIT](LICENSE) © 2026 EurekaCub Contributors
