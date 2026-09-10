# ITERATION PLAN: EurekaCub — 内容缺口补全 v1（FR-1 等值分数 + FR-2 平移/旋转对称）

> **关联 PRD**: `docs/PRD-content-gaps-v1.md`（状态: ✅ Approved 2026-09-10）
> **Author**: Architect (Claude)
> **Date**: 2026-09-10
> **Base Commit**: `1ab196e`（`main`；git tag `v1.0.0` 指向 `f3693b9`，`package.json` 版本仍是 `0.0.0`）
> **预估工时**: ~24h（推断，按任务拆分估算，见第 4 节）
> **本迭代范围**: **FR-1 + FR-2**。按 PRD 第三节的建议；用户批准 PRD 时没有另外指定范围。FR-3 和 FR-4 放到下一迭代

> ⚠️ **GATE-2**: 本文档必须经用户确认（说「开始开发 / go」）后才可开始写代码。
> 第 3.1 节有 **3 个需要用户拍板的决策（D-1 ~ D-3）**，每个都附了推荐项。只说「go」就表示全部采用推荐项。

---

## 0. 用户确认

| 确认项 | 状态 | 日期 |
|--------|------|------|
| PRD 已 Approved | ✅ | 2026-09-10 |
| ITERATION_PLAN 已 Review | ⬜ | |
| D-1 / D-2 / D-3 决策 | ⬜（默认采用推荐项） | |
| 用户说「开始开发」 | ⬜ | |

---

## 1. 当前状态（开发前基线，2026-09-10 实测）

| 指标 | 值 |
|------|-----|
| 单测 | **562 passed / 24 suites**（Node 20、Node 22 都通过） |
| E2E | **79 passed**（Chromium） |
| tsc / lint | 0 / 0 |
| GitHub CI | `main` 连续 4 次全绿（最近一次 run `34491658010` @ `1ab196e`） |
| 线上部署 | **无可访问的线上版本**（见 PRD A.9）→ A7 真机验收被阻塞 |
| 孩子**实际能玩到**的分数内容 | `PUZZLE_CONFIGS.fraction` L1–L3 共 3 关，加上冒险模式中 6 个 `fraction` 关卡 |
| 孩子**实际能玩到**的对称内容 | `PUZZLE_CONFIGS.symmetry` L1–L3 共 3 关（都是 `vertical` 镜像），加上冒险模式中 4 个 `symmetry` 关卡 |

---

## 2. 问题分析

### 2.1 新发现：PRD 统计的「41 道 puzzle」孩子一道也玩不到

PRD 1.1 的「41 道 puzzle」统计的是 `content/puzzles/**/*.json`。本次核查发现，**这些文件从来不会被运行时加载**：

| 检查 | 结果 | 对照 |
|---|---|---|
| `src/` 中对 `content/puzzles` / `import.meta.glob` 的引用 | **0** | 阳性对照：同一搜索能找到 `PuzzlePage.tsx:11` 对 `puzzleConfigs` 的 import |
| `src/api/contentSync.ts`（Supabase 拉取） | **没有任何文件 import 它** | 阳性对照：同一搜索能找到它自己对 `./supabase` 的 import |
| `.env*`（Supabase URL） | 不存在 | — |
| `public/` 中的 JSON 拷贝 | 0 | — |
| `scripts/` 中写入 Supabase 的种子脚本 | 0（只有 `validate-content.ts`、`qa-adventure-integrity.ts`） | — |

实际的内容来源有两个：`src/pages/puzzleConfigs.ts` 提供关卡页的 L1–L3，`src/data/adventures.ts` 提供冒险模式的内联 puzzle。
这与 PRD A.8 中 `content/adventures/` 的情况**性质相同**，而且 schema 也对不上。例如
`symmetry/L2-castle.json` 用的是 `targetShape: "castle-half"`、`tolerance: 20`，渲染器读的却是 `targetPoints`、取值 0–1 的 `tolerance`。

**影响**：
- PRD 的核心判断**依然成立**，因为线上内容同样是「一个模块一种形态」。`MODULE_RENDERER_MAP` 是 1:1 映射；线上概率关卡只配了 `totalFlips`，渲染器缺省 `coin`；线上对称三关都是 `vertical`
- 但 **FR-1.2「新增至少 3 道 puzzle」没有说放在哪里**。如果照字面放进 `content/puzzles/`，孩子仍然看不到。这就是决策 D-1 要解决的问题
- CI 的 `content-validate` 每次都在校验这 41 个死文件，每次都是绿的，这会给人「内容没问题」的错觉

### 2.2 关卡页写死了三关

`ModulePage.tsx:16-26` 的 `LEVELS` 和 `levelColors` 都是写死的 3 项。`PuzzlePage.tsx:57-58` 按 `PUZZLE_CONFIGS[renderer][level]` 取配置，本身不限关卡数。
`tests/puzzle-configs.test.ts:25` 也写死了 `['L1','L2','L3']`。所以要在模块页新增关卡，这三处都得改。

### 2.3 渲染器的扩展点

| 渲染器 | 可复用 | 需要泛化 |
|---|---|---|
| `PizzaCutter` | `validateCuts`、`cutEndpoint`、扇形 path 的算法（`PizzaCutter.tsx:357-392`）、wrapper + Inner 的 hooks 结构 | 新增 `mode`，并在 wrapper 里按 mode 分派到不同的 Inner |
| `MirrorCanvas` | `checkMatch`（用覆盖率判定，与变换类型无关）、`strokeLength`、`CanvasBase` | `mirrorPoint` 泛化为 `transformPoint`；`targetToCanvas` 目前按「半幅」布局，平移和旋转需要全幅坐标 |
| 两者共有 | 都是 3 轮通关（`ROUNDS_TO_COMPLETE = 3`） | **3 轮用的是同一份数据**。新关卡需要每轮不同的题目，见 TASK-2 |

### 2.4 FR 编号冲突

`docs/TEST_CHECKLIST.md` 里的 `[FR-1]` 指的是**旧 PRD** 的 M1 对称，`[FR-2]` 指 M2 分数；而本 PRD 的 FR-1 是等值分数，FR-2 是平移/旋转。
为了不混淆，**本迭代的测试标签一律加前缀 `CG-`**，例如 `[CG-FR-1.1]`（CG = content-gaps）。

---

## 3. 方案设计

### 3.1 需要用户决策

#### D-1　新题放在哪里？（架构级：改动 ≥3 个核心文件）

| 选项 | 做法 | 优点 | 缺点 |
|---|---|---|---|
| **A（推荐）** | 关卡列表**改由数据驱动**：模块页从 `PUZZLE_CONFIGS` 的 key 生成卡片。分数新增 **L4「一样多」**，对称新增 **L4「平移」** 和 **L5「旋转」** | 孩子在模块页就能直接看到新玩法；FR-3/FR-4 以后可以直接复用；回滚只需删配置，卡片会自动消失 | 需要改 `ModulePage` / `puzzleConfigs` / i18n / 契约测试共 4 处 |
| B | 只加进冒险模式（新增故事关卡，puzzle 内联） | 不改结构 | 新玩法只能在故事里偶遇，模块页找不到；每关都要写叙事（QA-8） |
| C | 给 `content/puzzles/` 接上加载器 | 让 41 个 JSON 变成真内容 | 最重：41 个文件要做 schema 迁移，还要设计加载和缓存。**建议另开 PRD** |

**推荐 A**。已有的 L1–L3 配置**一个字节都不改**（满足 FR-1.4、FR-2.1、NFR-1）。

#### D-2　FR-1.1「等值分数」的交互方式

PRD 原文是「孩子分别切成 N 份和 2N 份，选出面积相等的份数组合」。照字面做的话，`2/4 = 4/8` 一轮要切 4 + 8 = **12 刀**，然后才开始选；任何一刀切歪都会整轮重来。
对 6 岁孩子来说负担太重，而这一关要教的是「一样多」，不是「切得准」（切的能力 L1–L3 已经练过）。

| 选项 | 做法 |
|---|---|
| **A（推荐）** | 左边的披萨**已经切好并涂好**（例如切成 2 份、涂了 1 份）。孩子把**右边**切成 2N 份（有引导线），再点选扇形涂色，涂到和左边一样多就对了。答对后右边涂色的扇形滑到左边上方重叠，**用画面证明面积相同**（FR-1.3） |
| B | 照 PRD 字面：两个披萨都由孩子来切，再选 |
| C | 两个都预切好，孩子只负责涂色（最简单，但和「切」的动作脱节） |

推荐 A。它保留了「切」这个动作，又把一轮的切割量减半，而且判定的核心仍是「面积相等」。**如果选 A，PRD 的 FR-1.1 文字要同步修改**。

#### D-3　`content/puzzles/` 这 41 个死文件怎么处理？

| 选项 | 做法 |
|---|---|
| **A（推荐）** | **本迭代不删、不接**：在 PRD 中记录（A.11）；加一个绊线测试，如果有人在 `src/` 里 import 它们会变红并提示去看 PRD；在 CONTRIBUTING 中注明「这里的 JSON 不会出现在应用里」 |
| B | 删除这 41 个文件和 `content-validate` |
| C | 接上加载器（即 D-1 的选项 C） |

推荐 A。删除属于不可逆操作，接入又太重；先让它不再误导人，要不要删留到下一个 PRD 再定。

### 3.2 数据契约（按推荐项）

```ts
// 分数 L4：每轮一道不同的题（3 轮 = FR-1.2 要求的 3 道）
fraction.L4 = {
  mode: 'equivalence',
  rounds: [
    { given: [1, 2], cutInto: 4 },   // 1/2 = ?/4
    { given: [1, 3], cutInto: 6 },   // 1/3 = ?/6
    { given: [2, 4], cutInto: 8 },   // 2/4 = ?/8
  ],
  showGuides: true,
  tolerance: 15,
}

// 对称 L4 平移 / L5 旋转（FR-2.4：每种变换至少 2 道）
symmetry.L4 = { transformType: 'translate', rounds: [ { targetPoints, vector: [dx, dy] }, ... ≥2 ], tolerance }
symmetry.L5 = { transformType: 'rotate',    rounds: [ { targetPoints, rotationalOrder: 2|3|4 }, ... 3 ], tolerance }
```

- 没有 `mode` 和 `transformType` 时，行为和现在**完全一致**（缺省分别是 `cut` 和 `reflect`）
- 没有 `rounds` 时，3 轮沿用同一份数据，这是现有行为；有 `rounds` 时，第 i 轮用 `rounds[i]`

### 3.3 涉及文件

| 文件 | 变更 | 说明 |
|---|---|---|
| `src/pages/ModulePage.tsx` | 修改 | 关卡卡片从配置生成；配色和元数据扩到 5 项 |
| `src/pages/puzzleConfigs.ts` | 修改 | 新增 `fraction.L4`、`symmetry.L4`、`symmetry.L5`，并导出 `levelIdsFor(renderer)` |
| `src/i18n/zh.json`、`en.json` | 修改 | `level.L4`、`level.L5`，新关卡的名称，新玩法的引导文案（NFR-3 双语） |
| `src/renderers/fraction/types.ts`、`fraction.utils.ts` | 修改 | 加 `mode`、`rounds` 类型；新增纯函数 `sliceIndexAt`、`isEquivalent`、`wedgePath` |
| `src/renderers/fraction/PizzaEquivalence.tsx` | **新增** | 等值模式的 Inner 组件（双披萨 + 重叠动画） |
| `src/renderers/fraction/PizzaCutter.tsx` | 修改 | wrapper 按 `mode` 分派，引导页文案按 mode 切换 |
| `src/renderers/symmetry/types.ts`、`symmetry.utils.ts` | 修改 | 加 `transformType` 等类型；新增 `translatePoint`、`rotatePoint`、`transformTarget`；`parsePuzzle` 保持向后兼容 |
| `src/renderers/symmetry/MirrorCanvas.tsx` | 修改 | 绘制按变换类型分派（平移画箭头，旋转画中心点和 k 份实时复制）；引导页文案按类型切换 |
| `tests/…`、`e2e/…` | 新增 / 修改 | 见 TASK-5、TASK-7 |
| `docs/TEST_CHECKLIST.md` | 修改 | 新增 `CG-FR-*` 测试项（QA-3） |
| `docs/PRD-content-gaps-v1.md`、`CONTRIBUTING.md` | 修改 | D-2 的文字同步；D-3 的记录 |

---

## 4. 任务清单

> 执行方式：黑灯工厂，按任务红→绿推进，每完成一个任务做一次 checkpoint commit。子 Agent 一律用 `model: "haiku"`，产出都要用脚本复核（M3）。

### TASK-1: 关卡列表数据驱动（D-1 A）
- **优先级**: P0　**类型**: Code　**预估**: 2h
- **涉及文件**: `ModulePage.tsx`、`puzzleConfigs.ts`、i18n、`tests/puzzle-configs.test.ts`
- **验收标准**: m2 显示 L1–L4，m1 显示 L1–L5，其余 6 个模块**仍然恰好是 L1–L3**；geometry 走 tangram 预设，不受影响；契约测试改为逐模块枚举关卡；「各关不雷同」测试推广到 N 关
- **状态**: ⬜ TODO

### TASK-2: 逐轮数据 `rounds`
- **优先级**: P0　**类型**: Code　**预估**: 1.5h
- **涉及文件**: 两个渲染器的 types、utils、组件
- **验收标准**: 有 `rounds` 时第 i 轮用第 i 份数据；没有时和现在一样。**反向验证**：把轮次索引写死为 0，测试必须变红
- **状态**: ⬜ TODO

### TASK-3: FR-1 等值分数（FR-1.1 / 1.3 / 1.4）
- **优先级**: P0　**类型**: Code　**预估**: 6h
- **验收标准**: 3 轮题目 `1/2=?/4`、`1/3=?/6`、`2/4=?/8` 都能通关；涂错时温和提示（不出现 ❌，符合 NFR-2）；答对时播放重叠动画；全程**不出现「约分」「等于」之类的公式用语**；L1–L3 的行为**一个像素都不变**
- **状态**: ⬜ TODO

### TASK-4: FR-2 平移 / 旋转对称（FR-2.1 ~ 2.4）
- **优先级**: P0　**类型**: Code　**预估**: 6h
- **验收标准**: 平移 ≥2 轮、旋转 3 轮（k = 2/3/4）都能通关；旋转模式下孩子画一笔，实时出现 k 份复制（沿用镜像那种「魔法」反馈）；L1–L3 的镜像行为不变
- **状态**: ⬜ TODO

### TASK-5: 单元测试 + 可玩性证明
- **优先级**: P0　**类型**: Test　**预估**: 3h
- **验收标准**: 所有新纯函数都有测试，并标注 `CG-FR-x.y`（QA-1）。**可玩性证明直接跑真实的配置和真实的判定函数**（吸取 PRD A.7 的教训，不另写一份模拟实现）：每一轮都有解；每一轮的初始状态都不是已解状态；各轮数据互不相同（QA-10）。每一条新测试都要做注入 bug 的反向验证
- **状态**: ⬜ TODO

### TASK-6: D-3 绊线 + 文档
- **优先级**: P1　**类型**: Test + Docs　**预估**: 1h
- **验收标准**: 在 `src/` 里 import `content/puzzles` 会让测试变红（注入验证）；CONTRIBUTING 和 PRD A.11 同步更新
- **状态**: ⬜ TODO

### TASK-7: E2E + 真实浏览器验证
- **优先级**: P0　**类型**: Test　**预估**: 2h
- **验收标准**: E2E 覆盖 m2-L4、m1-L4、m1-L5 能加载，并且至少玩通一轮。在真实浏览器中按正确解逐轮点通，**同时准备阴性对照**（错误操作不能通关）；三个关卡的页面错误都为 0
- **状态**: ⬜ TODO

### TASK-8: 测试清单同步
- **优先级**: P0　**类型**: Docs　**预估**: 1h
- **验收标准**: `TEST_CHECKLIST.md` 为每个 `CG-FR` 编号至少登记一项；新增项里 ❌ 的数量为 0（QA-6、QA-7）；🔧 手动项注明原因
- **状态**: ⬜ TODO

### TASK-9: 回归与门禁
- **优先级**: P0（不可跳过）　**类型**: Test　**预估**: 1h
- **验收标准**: 见第 5 节，全部通过；推送后 GitHub CI 全绿
- **状态**: ⬜ TODO

> **不在本迭代范围（记录但不做）**：`ModulePage` 的星级写死为 0，从不反映进度（`ModulePage.tsx:17-19`）；`PizzaCutter` 的界面文字是写死的英文（例如 `PizzaCutter.tsx:241`）。

---

## 5. QA 门禁（GATE-3）

| 检查项 | 命令 | 预期 | 实际 |
|--------|------|------|------|
| 单测 | `npx vitest run` | ≥ 562 + 新增，0 失败 | ⬜ |
| E2E | `npm run test:e2e` | ≥ 79 + 新增，0 失败 | ⬜ |
| 类型 | `npx tsc -b --noEmit` | 0 | ⬜ |
| Lint | `npm run lint` | 0 | ⬜ |
| 构建 | `npm run build` | exit 0 | ⬜ |
| 内容校验 | `npm run validate-content` | exit 0 | ⬜ |
| 测试清单 | `TEST_CHECKLIST.md` 的 CG 项 | ❌ = 0 | ⬜ |
| 旧关卡不变 | 契约测试对 L1–L3 配置做快照 | 与 `1ab196e` 逐字节一致 | ⬜ |
| GitHub CI | push 后查看 run | 4 项 success | ⬜ |
| 无硬编码密钥 | `grep -rE "sk-\|password" src/` | 0 | ⬜ |

> A7（孩子真机验收）**不属于 GATE-3**，它是 GATE-4 的条件，而且目前被部署阻塞（PRD 开放问题 4）。

---

## 6. 回滚方案

1. 所有改动都是**增量**：删掉 `fraction.L4`、`symmetry.L4`、`symmetry.L5` 这三项配置，新卡片就会自动消失（这是 D-1 A 的附带好处）
2. 需要完全回退时，`git revert` 本迭代的 commit 范围，回到基线 `1ab196e`
3. 没有数据库和数据迁移；本地进度的 key 按关卡 id 存储，新增关卡不会影响旧进度

---

## 7. 交付清单（GATE-4）

| 交付物 | 状态 |
|--------|------|
| 代码已合并到 `main`，GitHub CI 全绿 | ⬜ |
| PRD 验收标准 A1–A6 逐项确认 | ⬜ |
| **Vercel 部署，并用 bundle 特征字符串核对线上版本** | ⬜（阻塞于 `vercel login`） |
| A7 孩子真机验收（用户亲自确认） | ⬜ |
| 新建 CHANGELOG；版本号从 `0.0.0` 校正为 `1.1.0` | ⬜ |

---

## 8. 迭代复盘（开发完成后填写）

| 指标 | 计划 | 实际 | 偏差原因 |
|------|------|------|---------|
| 工时 | ~24h | | |
| 任务数 | 9 | | |
| 新增测试 | ≥ 40（推断） | | |
