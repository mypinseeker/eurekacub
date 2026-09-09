# PRD — 内容覆盖缺口补全 v1

| 项 | 值 |
|---|---|
| **状态** | 🟡 **GATE-1 待审批**（用户说 "approved/批准" 后方可进 GATE-2） |
| **提出日期** | 2026-09-05 |
| **依据** | `~/Workspace/ai-think-tank/engagements/2026-09-05-marble-taxonomy-fit/R3/gap_audit_8modules.md` |
| **方法** | 用 Marble Skill Taxonomy 的 `centrality`（图中心度）做外部参照，反向审计本项目 41 道 puzzle 的覆盖盲区。**只读该数据集的数值，不导入其数据、不复用其文本** → 零许可证风险 |
| **前置 PRD** | `docs/PRD-kids-math-v1.md` (v1.1) —— 本 PRD 为其增量，不替代 |

---

## 一、问题陈述

### 1.1 核心发现（实测，2026-09-05）

**41 道 puzzle = 8 种交互形态。每个模块只有一个 renderer，模块内部零形态多样性。**

| 模块 | 题数 | renderer | 模块内唯一变量 |
|---|---|---|---|
| `fraction` | 6 | `pizza-cutter` ×6 | 份数 N = 2/3/4/5/6/8 |
| `geometry` | 5 | `tangram` ×5 | 目标图案 |
| `equation` | 5 | `balance-scale` ×5 | 天平配置 |
| `sequence` | 5 | `number-train` ×5 | 数列规则 |
| `probability` | 5 | `coin-flip` ×5 | **抛掷次数 10/20/30/50/100** |
| `symmetry` | 5 | `mirror-canvas` ×5 | 目标图形（均为 `mirrorAxis`） |
| `matrix` | 5 | `pixel-art` ×5 | 变换类型 |
| `derivative` | 5 | `speed-controller` ×5 | 速度曲线 |

### 1.2 为什么现有 QA 没能发现

`CLAUDE.md` 的 **QA-10（去重/差异性）** 要求"同一组件复用时输入数据必须实质不同"。
现状是"同 renderer + 参数变化"，**尚未触线但已贴线**。
更关键的是：**QA-1..QA-10 全部是"对照 PRD 检查有没有做错"，没有一条能回答"有没有该做而没做的"。**
覆盖盲区是**沉默的**——458 个单测全绿也照不出来。本 PRD 即为填补这个盲区而设。

### 1.3 三个已证实的严重缺口

| 缺口 | 实测证据 |
|---|---|
| **概率恒等于 0.5** | 5 道题 `data.type` **全部为 `coin`**。无骰子(1/6)、无转盘、无摸球。孩子从未见过非等概率事件 |
| **等值分数零覆盖** | Marble `Fractions` 域 centrality TOP15 中"等值分数"占 **4 席**、"分数数轴"占 **3 席**，本项目均为 0 |
| **对称只有镜像** | 5 道题全部只用 `mirrorAxis` 参数。**平移(translation)与旋转对称零覆盖** |

---

## 二、目标与非目标

### 2.1 目标
让每个模块从"一种交互形态"扩展到"覆盖该概念的核心认知动作"，**在不违背"不教公式、玩着理解本质"理念的前提下**。

### 2.2 非目标（明确排除）
- ❌ **不引入 Marble 的任何数据**（topics/dependencies/standards 三张表一律不导入）
- ❌ **不做课标锚定**，不引入 `ageRangeStart`/`standards` 字段
- ❌ **不动 `equation` 模块** —— 审计发现 Marble 该域重心在 11–14 岁，与本项目 6–9 岁定位错位，
  天平模型对目标年龄已经到位。**这是一个刻意的"不做"决定，不是遗漏**
- ❌ **不动 `matrix` / `derivative`** —— Marble 零覆盖（关键词命中 0），无参照可用；
  且这两个模块正是"超越年龄"理念的最强体现，不应被任何课标体系拉回
- ❌ 本 PRD 不含西班牙语本地化（见 `docs/PRD-i18n-spanish-v1.md`，另行提出）
- ❌ 3-D 几何另立项（需新 renderer，成本高于本 PRD 范围）

---

## 三、功能需求（FR）

> 按性价比排序。**FR-1 / FR-2 为本迭代建议范围；FR-3 / FR-4 可拆到下一迭代。**

### FR-1 `fraction` 新增"等值分数"模式 【最高优先级】

**理由**：`1/2 = 2/4 = 3/6` 是分数从"切东西"跃迁到"数"的关键一跳，
且**现有 `pizza-cutter` 切两次即可演示**，改造成本最低、概念价值最高。

| 编号 | 需求 |
|---|---|
| FR-1.1 | `pizza-cutter` renderer 支持 `mode: "equivalence"`：同时显示两个披萨，孩子分别切成 N 份和 2N 份，选出面积相等的份数组合 |
| FR-1.2 | 新增至少 3 道 puzzle：`1/2 = 2/4`、`1/3 = 2/6`、`2/4 = 4/8` |
| FR-1.3 | 答对时以动画叠合两个扇形，**视觉证明面积相同**（不出现公式） |
| FR-1.4 | 现有 6 道 `mode` 缺省题目行为**完全不变**（向后兼容） |

**验收标准**：孩子能在不被告知"约分"这个词的前提下，指出 `2/4` 和 `1/2` 是一样多。

### FR-2 `symmetry` 新增平移与旋转对称 【高优先级】

**理由**：`mirror-canvas` 已有画布与判定逻辑，属**参数级扩展**。

| 编号 | 需求 |
|---|---|
| FR-2.1 | `mirror-canvas` 支持 `transformType: "reflect" \| "translate" \| "rotate"`（缺省 `reflect`，向后兼容） |
| FR-2.2 | `translate`：给定图形与平移向量，孩子在目标位置画出平移后的图形 |
| FR-2.3 | `rotate`：支持旋转对称（`rotationalOrder: 2\|3\|4`），如风车、三叶草 |
| FR-2.4 | 每种新变换至少 2 道 puzzle |

### FR-3 `probability` 把 `coin-flip` 泛化为 `random-trial` 【高价值但成本较高】

**理由**：一次 renderer 泛化，直接补上 Marble 该域 centrality 前列的三个概念
（`The Probability Scale` 0–1 刻度、`Complementary events` 互补事件、`Probabilities Sum to One`）。

| 编号 | 需求 |
|---|---|
| FR-3.1 | 新 renderer `random-trial` 支持 `trialType: "coin" \| "dice" \| "spinner" \| "marbles"` |
| FR-3.2 | `spinner` 支持不等分扇区（如 3/4 红、1/4 蓝）→ 首次出现**非 0.5 概率** |
| FR-3.3 | `marbles` 支持自定义球数比例（如 7 红 3 蓝） |
| FR-3.4 | 界面显示 0–1 概率刻度条，实验结果实时在刻度上移动 |
| FR-3.5 | 至少 4 道新 puzzle，覆盖：非等概率、互补事件、概率和为 1、实验 vs 理论 |
| FR-3.6 | 现有 5 道 coin 题通过 `trialType: "coin"` **行为完全不变** |

### FR-4 `geometry` 在 tangram 上增加"角"的提示层 【中优先级】

| 编号 | 需求 |
|---|---|
| FR-4.1 | `tangram` 支持 `showAngles: boolean`，开启时在拼块顶点显示角度弧标记 |
| FR-4.2 | 至少 2 道 puzzle 引导发现"两个 45° 拼成 90°" |
| FR-4.3 | **不出现"度数"以外的任何公式或术语定义** |

---

## 四、非功能需求（NFR）

| 编号 | 需求 |
|---|---|
| NFR-1 | **向后兼容**：所有现有 41 道 puzzle 的 JSON 无需修改即可继续工作（新字段全部可选、有缺省值） |
| NFR-2 | **零焦虑设计不变**：新内容同样无计时器、无分数、无排名、无 ❌ 符号（遵循现有 Child Safety Design） |
| NFR-3 | **双语完整**：所有新增 `task`/`hints`/`narrative` 必须同时提供 `{zh, en}` |
| NFR-4 | **不引入外部数据依赖**：不得在运行时或构建时依赖 Marble 数据集 |
| NFR-5 | **模块形态多样性**：改造后，`fraction`/`symmetry`/`probability` 三个模块各自的 puzzle **不得再全部共用单一交互形态** |
| NFR-6 | **性能**：新 renderer 首次渲染 ≤ 现有 renderer 的 1.5 倍 |

---

## 五、验收标准

| # | 标准 | 验证方式 |
|---|---|---|
| A1 | FR-1..FR-4 中被批准纳入本迭代的项，全部实现 | 逐条对照 |
| A2 | 现有 458 个单测 + E2E 全绿，**无回归** | `npm run test && npm run test:e2e` |
| A3 | 每个新 FR 至少有 1 个对应测试用例，且标注 FR 编号（**QA-1**） | `docs/TEST_CHECKLIST.md` |
| A4 | `TEST_CHECKLIST.md` 中 ❌ 未覆盖项 = 0（**QA-7**） | 清单审查 |
| A5 | 新 puzzle 的 `data` 字段非 fallback 默认值（**QA-9**） | 内容完整性测试 |
| A6 | 三个改造模块的 renderer/形态不再单一（**QA-10**、NFR-5） | 内容多样性测试 |
| A7 | **真机验收**：由目标用户（9 岁 + 6 岁）实际操作，能在无大人解释的情况下完成 FR-1.1 | 用户亲自确认 |

> ⚠️ **A7 遵循全局 VERIFY-真机协议**：测试全绿、构建成功、部署完成均为**必要条件而非完成**。
> 唯一完成标准是孩子在屏幕上真的玩通了。

---

## 六、风险与开放问题

| 风险 | 说明 | 处置 |
|---|---|---|
| **审计方法本身的局限** | Marble 的 centrality 反映**英美课标体系内**的枢纽地位，高中心度 ≠ 本项目该补。`equation` 模块即是反例 | 已在"非目标"中显式排除 equation；**缺口表是分诊工具不是判决书** |
| 模块→domain 映射为人工设定 | 换一种映射，排序会变（如 `sequence` → Algebra + Mathematical Thinking 是我的判断） | 标注为推断；FR 优先级由人工复核而非机械照搬 |
| FR-3 需新建 renderer | 成本明显高于 FR-1/FR-2 | 建议拆到下一迭代，本迭代先做 FR-1 + FR-2 |
| 3-D 几何未覆盖 | 它是 Marble `Geometry` 域 centrality **第 1 名**（0.234），本项目零覆盖 | **已知缺口，本 PRD 明确不做**，另立项 |

### 开放问题（需用户裁定）
1. **本迭代范围**：只做 FR-1 + FR-2（低成本、快见效），还是含 FR-3（需新 renderer）？
2. **A7 真机验收**由谁、何时进行？
3. 3-D 几何是否要现在立项？

---

## 附录 A — 写本 PRD 期间发现并已修复的严重缺陷（2026-09-07）

> ⚠️ **这些不是内容缺口，是已上线的 bug。**本 PRD 的审计过程顺带把它们挖了出来，
> 修复已直接落盘（不占本 PRD 的 FR 范围），此处仅留痕。

### A.1 八个 renderer 全部白屏 —— 孩子点「开始挑战」就玩不了

**根因**：commit `05a9878` 给 8 个 renderer 加了 `PuzzleIntro` 引导页，写法是在组件内部提前 `return`：

```tsx
const [showIntro, setShowIntro] = useState(true)
if (showIntro) { return <PuzzleIntro ... /> }   // ← 早返回
const config = useMemo(...)                      // ← 其余 5~17 个 hook 在早返回之后
```

点「开始挑战」后 `showIntro` 变 false，后面的 hook 才首次执行 → 两次渲染的 hook 数量不一致
→ React 抛 `Rendered more hooks than during the previous render.` → **整页白屏**。

**证据（对照组）**：`eslint react-hooks/rules-of-hooks` 在修复前后的计数

| 文件 | 修复前 | 修复后 |
|---|---|---|
| SpeedController / BalanceScale / PizzaCutter / Tangram / PixelArt / CoinFlip / NumberTrain / MirrorCanvas | **128** | **0** |

**修法**：把引导页提到一个只含单个 hook 的外层 wrapper，内层 `XxxInner` 保持 hook 顺序恒定。

### A.2 `PUZZLE_CONFIGS` 与 renderer 契约长期脱节

`src/pages/PuzzlePage.tsx` 里的关卡配置表，字段名和 renderer 实际读取的字段对不上。
**renderer 对未知字段一律静默忽略、对缺失字段回退默认值**，所以写错不报错，只是让三个难度变成同一道题。

| 模块 | 表里写的 | 代码要的 | 后果 |
|---|---|---|---|
| `equation` | `rightSide: 8`（标量） | `number[]` | **崩溃**（`[...rightSide]`）；且漏 `options`，答案不在选项里 |
| `sequence` | `blanks: 1`（标量） | 索引数组 | **崩溃**（`new Set(blanks)`） |
| `symmetry` | `complexity`/`showGrid` | `targetPoints` | 目标图形**全空**，三关都没东西可镜像 |
| `derivative` | `maxSpeed`/`curveType` | `targetCurve` | 三关都画 renderer 内置那条默认曲线 |
| `matrix` | `operations` | `allowedTransforms` | L1 就把 4 个变换全开，难度阶梯不存在 |
| `probability` | `flipsPerExperiment` | `totalFlips` | 「抛 50 次」挑战关从未存在 |

**实测确认**：修复前 `symmetry`/`derivative`/`matrix`/`probability` 的 L1 与 L3 页面文本
**逐字相同**，仅标题「第 1 关 / 第 3 关」有别。

### A.3 为什么 534 个单测一个都没照出来

单测拿**手写 fixture** 测 renderer，从不碰 app 真正发货的那张配置表；
E2E 又只断言「页面有没有东西」，不断言「难度是不是真的不同」。**中间这层没有任何测试。**

已补 `tests/puzzle-configs.test.ts`（76 个用例）作为契约测试，并做过**反向验证**：
把旧的错字段注入回去 → 6 个用例转红；还原 → 全绿。即该测试确实抓得住这类病。

### A.4 `content/adventures/` 是一套无人使用的平行数据

`AdventurePlayPage` 读的是 `src/data/adventures.ts`（**17 个冒险 / 45 个 stage**，硬编码）。
`content/adventures/*.json` 只有 6 个冒险 / 18 个 stage，字段名也对不上
（JSON 用 `puzzle_module` / `puzzle_id`，代码读 `stage.renderer_id`），叙事文本更是两套。
**它从未被加载过。** CONTRIBUTING.md 却仍指引贡献者往那里写故事——L2「故事家」贡献路径实际是断的。

> ⚠️ **我据此判错过一次，必须留痕。** 我先前把 README 的「17 个冒险」改成「已实装 6 个」，
> 依据正是数了 `content/adventures/` 里的 6 个 JSON 文件。实测 17 个冒险**逐个访问全部正常加载并挂载渲染器**（17/17），
> 其中 5 个默认解锁。即我用一份废弃数据去"纠正"了一句本来正确的话。
> 这是「别信文件里的数字」的变体：**文件存在 ≠ 文件被使用**。已按实测改回。

### A.5 E2E 长期把样式类当契约

修复前 14 个 E2E 失败中，有 **8 个**的根因是选择器写死了 Tailwind 工具类，
而 UI 改版 commit `097da05` 把类名换了：

| 选择器 | 改版前 | 改版后 |
|---|---|---|
| 开关（设置抽屉 / 家长面板） | `bg-green-400` / `bg-blue-500` | `bg-[#00C48C]` |
| 首页进度条 | `h-2` | `h-1.5` |
| 冒险进度条容器 | `bg-gray-100` | `bg-orange-100` |
| 冒险渲染器容器 | `bg-white/60 rounded-2xl` | `bg-white/80 rounded-3xl` |
| 关卡计数器文本 | `1 / 3` | `1/3` |

家长面板那条最糟：`button.bg-blue-500` 是**选择器**本身，类名一变它就静默改去断言别的灰色按钮。

**处置**：没有去追新类名，而是给控件补上本就该有的语义
（`role="switch"` + `aria-checked`、`role="progressbar"` + `aria-valuenow`、
`data-testid="stage-counter"` / `renderer-area"`），测试改断言语义。顺带这些控件对读屏软件也可用了——之前不可用。

同时发现三个「加载 XX 渲染器」的测试**从不验证加载的是哪个渲染器**，只看容器在不在；
已加 `data-renderer-id` 断言，标题与行为现在一致。

### A.6 尚未处理

- `matrix` 的 `initialGrid`/`targetGrid` 仍用 renderer 内置图案，三关**图案相同**（仅变换数与步数不同）
- A.2 中新造的 symmetry 图形 / derivative 曲线为**工程占位**，未经孩子实测，
  难度梯度是否合理需 A7 真机验收确认
- `content/puzzles/sequence/*.json` 在空格位填 `-1`，而 `NumberTrain` 以 `sequence[idx]` 为答案键
  → 该路径（冒险模式）下的数列题**可能同样不可通关**，尚未验证
- `react-hooks/refs` 13 处告警（`ref.current` 在 render 期间赋值）为既有代码，非本次引入，未处理

---

## 七、GATE-1 审批

- [ ] 用户审批（说 "approved" / "批准" 后进入 GATE-2 ITERATION_PLAN）
- [ ] 确认本迭代 FR 范围
- [ ] 确认 A7 真机验收安排
