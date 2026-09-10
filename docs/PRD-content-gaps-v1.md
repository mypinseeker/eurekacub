# PRD — 内容覆盖缺口补全 v1

| 项 | 值 |
|---|---|
| **状态** | ✅ **GATE-1 已批准**（2026-09-10）→ 🟡 **GATE-2 迭代计划待确认**：`ITERATION_PLAN_content-gaps-v1.md` |
| **提出日期** | 2026-09-05 |
| **最后更新** | 2026-09-10 —— 附录 A 的缺陷修复 + CI 修复已合并到 `main`（当前 `a6abad4`），**GitHub CI 连续 3 次全绿**；但**尚未部署到线上**（阻塞于 Vercel 凭证），见 A.9 |
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

> **注（2026-09-10）**：本表统计的是 `content/puzzles/` 下的 41 个 JSON。后来查明**这些文件从不被运行时加载**（见 A.11），
> 孩子实际玩到的是 `puzzleConfigs.ts` 中每个模块的 L1–L3，加上冒险模式里内联的关卡。
> 不过「一个模块一种交互形态」这个核心判断**对线上内容同样成立**，所以本 PRD 的立论不受影响；受影响的只是题数口径。

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
  > 注（2026-09-10）：附录 A.7 改了 `matrix` 三关的配置，A 系列 lint 清理修了 `derivative` 的换主题 bug。
  > 这两处是**修缺陷**（关卡不可解 / 画错背景），不扩展内容覆盖，**不违反本条非目标**
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
| FR-1.1 | `pizza-cutter` renderer 支持 `mode: "equivalence"`：同时显示两个披萨。左边**已切成 N 份并涂好 a 份**，孩子把右边切成 M 份（M 是 N 的倍数，有引导线），再点选扇形，涂出**和左边一样多**的份数（答案为 a·M/N）。<br>*（2026-09-10 按 GATE-2 决策 D-2 修订。原文是「孩子分别切成 N 份和 2N 份」，照做的话 `2/4=4/8` 一轮要切 12 刀；本关要教的是「一样多」，不是「切得准」）* |
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
| NFR-1 | **向后兼容**：所有现有 41 道 puzzle 的 JSON 无需修改即可继续工作（新字段全部可选、有缺省值）。「现有」指**附录 A 修复之后**的基线：`sequence/*.json` 的 `-1` 哨兵已换成真值（A.6），`matrix` 配置已重写（A.7） |
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
| A2 | 现有单测 + E2E 全绿，**无回归**。基线（2026-09-10 实测）：单测 **562 / 24 suites**（Node 20 与 22 均通过），E2E **79**；GitHub CI 四项全绿 | `npm run test && npm run test:e2e`，并确认 `main` 上的 CI run 为 `success` |
| A3 | 每个新 FR 至少有 1 个对应测试用例，且标注 FR 编号（**QA-1**） | `docs/TEST_CHECKLIST.md` |
| A4 | `TEST_CHECKLIST.md` 中 ❌ 未覆盖项 = 0（**QA-7**） | 清单审查 |
| A5 | 新 puzzle 的 `data` 字段非 fallback 默认值（**QA-9**） | 内容完整性测试 |
| A6 | 三个改造模块的 renderer/形态不再单一（**QA-10**、NFR-5） | 内容多样性测试 |
| A7 | **真机验收**：由目标用户（9 岁 + 6 岁）实际操作，能在无大人解释的情况下完成 FR-1.1 | 用户亲自确认 |

> ⚠️ **A7 遵循全局 VERIFY-真机协议**：测试全绿、构建成功、部署完成均为**必要条件而非完成**。
> 唯一完成标准是孩子在屏幕上真的玩通了。
>
> ⛔ **A7 当前的前置阻塞**：EurekaCub 目前**没有可访问的线上版本**（见 A.9）。在完成 Vercel 部署、
> 并用 bundle 特征字符串确认线上就是 `main` 的版本之前，孩子拿不到任何修复，A7 无从开始。

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
4. **部署**（2026-09-10 新增，阻塞 A7）：需用户在服务器上执行一次 `vercel login`（需浏览器确认，
   agent 无法代办）。EurekaCub 可能从未部署过，是否沿用某个已有的 Vercel 项目，要用户在后台确认
5. **是否接上 Vercel 的 GitHub 集成**（2026-09-10 新增）：接上后合并到 `main` 自动部署，
   不接则每次都得手动 `vercel --prod`，「合并了但没上线」会再次悄悄发生

---

## 附录 A — 写本 PRD 期间发现并已修复的严重缺陷（2026-09-07 ～ 2026-09-10）

> ⚠️ **这些不是内容缺口，是 v1.0.0 代码里的 bug。**本 PRD 的审计过程顺带把它们挖了出来，
> 修复已合并到 `main`（不占本 PRD 的 FR 范围），此处仅留痕。
>
> 更正（2026-09-10）：本段原写「已上线的 bug」。但调查发现 EurekaCub 可能**从未部署过**（A.9），
> 「已上线」没有证据，已改为「v1.0.0 代码里的 bug」。

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

### A.6 原「尚未处理」项的结局

| 原记录 | 结局 | 证据 |
|---|---|---|
| `matrix` 三关图案相同 | ✅ 已修，且比原记录**更严重** | 见 A.7 |
| symmetry 图形 / derivative 曲线为工程占位 | ⏳ 仍未验，需 A7 真机 | 无法用测试替代 |
| `sequence/*.json` 的 `-1` 可能导致冒险模式不可通关 | ✅ 已修并已验 | `-1` 哨兵已全部替换为真值；`tests/content-winnability.test.ts` 12 项全绿，且 grep 全仓已无残留 |
| `react-hooks/refs` 13 处告警 | ✅ 已修 | 改 `useLayoutEffect`；lint 45 → 0 |

### A.7 matrix：原记录低估了严重程度

原以为只是「三关图案相同」（体验差但能玩）。用渲染器**自己的** `applyTransform` 做 BFS 后，
实际结论是三关**没有一关是正常可玩的**：

| 关卡 | 允许变换 | maxSteps | 真实最短解 |
|---|---|---|---|
| L1 | rotate90 | 3 | **无解**（转回原样需 4 次，上限 3）|
| L2 | + flipH | 5 | **1 步**（内置图案左右对称，flipH 是空操作）|
| L3 | + flipV/transpose | 8 | **1 步** |

根因仍是 A.2 那条「静默回落」：配置两个网格都没给，`parsePuzzle()` 把
`initialGrid` 和 `targetGrid` **双双**默认成同一张 `DEFAULT_GRID`，于是谜题一加载就已在目标上。

**顺带纠正一个设计错误**：这四个变换构成 8 阶二面体群，任何目标距起点**最多 3 步**，
所以原来 3/5/8 的 `maxSteps` 阶梯**根本没有在度量难度**——它度量的是一个不存在的深度。
现在难度改由「分支因子↑（1→2→4）+ 冗余步数↓（2→1→1）」承担。

**真机验收（2026-09-10，Chromium）**：BFS 算出的解序列在浏览器里逐关点通 —
L1 `rotate90`、L2 `flipH→rotate90→rotate90`、L3 `flipH→rotate90` 均出现通关反馈；
三组阴性对照（L1 不点、L2 走 `R,R,R`、L3 走 `V,V`）均**不**通关，证明成功检测不是恒真；
三关页面错误均为 0。按钮数实测 1 / 2 / 4，与配置一致。

**留痕之二**：我第一次在浏览器里试 L2 时随手猜了 `rotate→flipH→rotate`，没通关。
差一点就报成「L2 仍然坏了」——真实解是 `flipH→rotate90→rotate90`，**错的是我的探针，不是应用**。
教训与 A.7 第一条同源：拿自己脑补的东西当判据，和拿文件名当证据是同一个毛病。

**留痕**：我第一次写这个可解性证明时，是在测试里**重新实现**了四个变换函数。
那样证明的是我那份模型的性质，不是游戏的性质——改名 `rotate90` 的语义，测试会继续绿。
已改为 import 真实 `applyTransform`。这是「文件名不是证据」的同类：**自己写的对照实现也不是证据**。

### A.8 `content/adventures/` 死路径：比「没被使用」更糟

A.4 记录过这 6 个 JSON 从不被加载。本轮补查了一件更关键的事：它们与应用**结构不兼容**。

| | 死 JSON | 应用实际读取（`src/data/adventures.ts` → `AdventurePlayPage`）|
|---|---|---|
| 关卡字段 | `puzzle_module` + `puzzle_id` | `renderer_id` + 内联 `puzzle` 对象 |
| id 类型 | 字符串 `adv-01-kitchen-scientist` | 数字 `1` |

即**接一个 loader 也加载不了**，必须先做字段迁移。这已属架构级改动（3+ 核心文件），
按 4-Gate 需用户批准，本轮未做。

同时核实并纠正了 `CONTRIBUTING.md` L2 节的三处错误声明：仓库内**不存在任何 YAML 文件**；
`stages` 是扁平数组、`branch`/`choice`/`next_stage` 全仓零命中，**没有分支路径**；
该路径也**不通向线上**。已改为明确标注「暂未开放」并说明现状。

已加绊线测试：有人再往 `content/adventures/` 放文件就会变红并指向 CONTRIBUTING，
避免又一个「PR 合了但什么也没发生」。

### A.9 合并到 `main` 与 CI 的真实状态（2026-09-10）

附录 A 的 9 个 commit 已按用户指示**快进**合并到 `main`：`5a35d4d → c7fbbb3`，远端经 `ls-remote` 复核。
快进意味着合并后的树与本地实测的树完全相同，没有合并提交会引入差异。

**`main` 上的 CI 从 2026-03-29 起连续红**（可查到的最近 5 次 push 全部 `failure`），没人发现。

合并后的第一次 CI（run `34480092893`）：

| Job | 合并前（`5a35d4d`） | 合并后（`c7fbbb3`） |
|---|---|---|
| lint-and-typecheck | ❌ | ✅（lint 45 → 0 的效果） |
| content-validate | ✅ | ✅ |
| test | ❌ | ❌ **仍红：18 个失败** |
| build | 跳过 | 跳过（依赖前两项） |

**test 为何仍红**：18 个失败全在 `haptic.test.ts` / `useFeedback.test.ts`，都报
`ReferenceError: navigator is not defined`。CI 用 **Node 20**，本机用 **Node 22**；
Node 从 v21 起才自带全局 `navigator`。测试写的是 `Object.defineProperty(navigator, …)`
——在本机能跑，只因为运行时恰好提供了这个全局。

- 本地用 Node 20 **复现**：修复前 18/18 红；同样两个文件在 Node 22 下 18/18 绿
- 修复：改为 `vi.stubGlobal('navigator', …)`，测试自己提供全局，不再赌运行时
- 修复后：Node 20 **562/562**、Node 22 **562/562**，tsc / lint exit 0
- 反向验证：把 `tap` 的 10ms 注入改成 11ms → 2 个测试红，报的是 `AssertionError`
  而不是 `ReferenceError`——证明换成 stub 之后测试仍能抓真 bug，没变成空转

**GitHub 上已确认**：修复合并到 `main`（`23acf87`）后，CI run `34484896911` **四项全绿**
——test / lint-and-typecheck / content-validate / build 均 `success`。这是 `main` 自有记录以来
（最早可查到 2026-03-29）**第一次全绿**；build 也第一次真正执行，而不是因前置失败被跳过。

> **推断，未证实**：旧 CI 的 test 失败很可能也是同一原因（CI 一直是 Node 20）。
> 但 3–4 月那几次 run 的日志已过期（GitHub 返回 HTTP 410），无法核对。

**留痕**：合并前我按 CI 的原命令本地跑了 tsc、lint、validate-content，然后告诉用户
「旧 CI 挂的两处正是这个分支修掉的」。这话**只对了一半**——lint 那处对；test 那处我
**根本没在 CI 的运行时上跑过**，只是拿本机 Node 22 的绿灯去代替 CI 的 Node 20。
教训：**本地绿 ≠ CI 绿，除非运行时一致**。「按 CI 的命令跑」不够，还得「按 CI 的环境跑」。

**已执行（用户批准）**：`ci.yml` / `content-validate.yml` 的 `node-version` 由 20 升到 22
（`23acf87`），CI 与开发环境一致。这与上面的测试修复**互相独立**：测试修复让测试不依赖任何运行时，
升级只是消除环境差——所以上面那次全绿**同时**验证了两者。

#### 部署：合并到 `main` ≠ 上线（2026-09-10 调查）

用户确认 EurekaCub 部署在 **Vercel**。调查结论是：**这次合并没有、也不会自动到达线上**。

| 检查项 | 结果 | 含义 |
|---|---|---|
| `main` 上的 commit status / check-runs（`c7fbbb3`、`5a35d4d`） | 只有 GitHub Actions，**零个 Vercel 条目** | Vercel 的 GitHub 集成**没有接到这个仓库**——push 不触发部署 |
| 仓库 webhooks | 空 | 同上 |
| 仓库内 `.vercel/project.json` | 不存在 | 本机从未 `vercel link` 过这个项目 |
| 本机 Vercel CLI 凭证 | `auth.json` 只有 3 字节（空对象），自 2026-06-11 起 | **已登出**，无法用 CLI 查询或部署 |
| Mac mini 构建机 Vercel CLI 凭证 | 有 token，但 Vercel 返回 `The specified token is not valid` | **已失效**。⚠️ CLI 在拒绝后**自动删除了** Mac 上的 `auth.json`（2026-09-10 由本次调查的 `vercel whoami` 触发）；因 token 本已无效，未损失可用凭证 |
| Mac mini 上的 `.vercel/project.json` | 只有 `sonora-app` 一个 | Mac 上**没有** EurekaCub 的克隆，也没 link 过 |
| 文档 / git 历史 / SecondBrain 笔记 | 零条 EurekaCub 部署记录；v1.0.0 commit 只写「Vercel-ready」 | 笔记里「Vercel 部署后待验证 BUG-1」**是 PinSeeker 的**（`GoalTrackerBadge`），不是本项目 |
| `eurekacub.vercel.app` 等 3 个候选地址 | `404 DEPLOYMENT_NOT_FOUND` | 不存在（阴性对照：随机子域名同样 404，探针有效） |
| `kids-math.vercel.app` | 200，但**不是本项目** | 见下 |

`kids-math.vercel.app` 名字对得上，但**不是 EurekaCub**：线上 bundle 中 `EurekaCub` 出现 **0** 次，
本地 `23acf87` 的构建产物中出现 **12** 次（阳性对照，证明这个特征字符串检测是有效的）；
页面标题也不同（线上 `Vite + React`，本项目 `eurekacub-init`）。它是另一个恰好同名的 Vercel 项目。

**结论**：EurekaCub 的线上地址和 Vercel 项目名**目前查不到**。两台机器上的 Vercel 凭证都不可用，
两台机器上都没有任何 EurekaCub 的部署痕迹。因为 GitHub 集成没接，如果之前部署过，应该是用 CLI
手动 `vercel --prod` 做的（推断，未证实）。**不排除 EurekaCub 从未部署过**：「Vercel-ready」只说明
配置就绪（推断，未证实——只有用户在 Vercel 后台能确认）。**附录 A 的全部修复现在只在 `main` 上，孩子
看到的仍是旧版**，直到有人手动部署一次。

### A.10 仍未处理

- **部署到 Vercel**（阻塞于凭证）：需要用户在本机执行 `vercel login`，或告知线上地址 /
  Vercel 项目名。之后：`vercel link` → `vercel --prod` → 用 bundle 特征字符串核对线上版本 → 真机验收
- **建议接上 Vercel 的 GitHub 集成**：否则每次都得手动部署，而且「合并了但没上线」会再次悄悄发生
- **SHIP 未做**：version bump、CHANGELOG、STATUS 都还没更新（`package.json` 版本仍是 `0.0.0`）
- symmetry / derivative 的难度梯度需 A7 真机验收（工程占位，测试替代不了孩子）
- `content/adventures/` 字段迁移 + loader（架构级，待批准）
- **正文 FR 范围**：FR-1 + FR-2 已进入 GATE-2（`ITERATION_PLAN_content-gaps-v1.md`，待用户确认后开工）；FR-3 / FR-4 放到下一迭代
- **`content/puzzles/` 同样是死路径**（见 A.11），处理方式待 GATE-2 的决策 D-3

### A.11 `content/puzzles/` 也是死路径（2026-09-10，写迭代计划时发现）

本 PRD 1.1 的「41 道 puzzle」统计的正是 `content/puzzles/**/*.json`。写 GATE-2 计划、确定「新题放在哪」时查明，
**这 41 个文件从不被运行时加载**，情况与 A.8 的 `content/adventures/` 相同：

| 检查 | 结果 | 对照 |
|---|---|---|
| `src/` 中对 `content/puzzles` / `import.meta.glob` 的引用 | 0 | 阳性对照：同一搜索能找到 `PuzzlePage.tsx` 对 `puzzleConfigs` 的 import |
| `src/api/contentSync.ts`（Supabase） | 没有任何文件 import 它 | 阳性对照：能找到它自己对 `./supabase` 的 import |
| `.env*`、`public/*.json`、种子脚本 | 都不存在 | — |

字段结构同样对不上：例如 `symmetry/L2-castle.json` 用 `targetShape` 和 `tolerance: 20`，渲染器读的是 `targetPoints` 和取值 0–1 的 `tolerance`。
CI 的 `content-validate` 每次校验这些文件、每次都是绿的，**这个绿灯并不代表孩子看到的内容没问题**。

**对本 PRD 的影响**：核心判断不变（1.1 的注里有说明）。但 FR-1.2「新增 ≥3 道 puzzle」如果照字面放进 `content/puzzles/`，孩子仍然看不到。
新题放在哪由迭代计划的决策 D-1 决定；这 41 个文件怎么处理由 D-3 决定。

---

## 七、GATE-1 审批

- [x] 用户审批（2026-09-10 用户说「批准PRD」）→ 进入 GATE-2 ITERATION_PLAN
- [x] 确认本迭代 FR 范围：**FR-1 + FR-2**。沿用第三节的建议，用户批准时没有另外指定；在 GATE-2 仍可调整
- [ ] 确认 A7 真机验收安排
- [ ] 完成 Vercel 部署并核对线上版本（A7 的前置条件，见开放问题 4、5）
