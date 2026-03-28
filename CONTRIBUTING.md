# Contributing to EurekaCub 🐻

# 贡献指南

Thank you for helping kids fall in love with math! Whether you're a teacher, a parent, a student, or a developer — there's a way for you to contribute.

感谢你帮助孩子们爱上数学！无论你是老师、家长、学生还是开发者，都有适合你的贡献方式。

---

## Three Ways to Contribute / 三种贡献方式

### L1: Add Puzzles (JSON) — Zero Code Required / 添加题目（JSON）— 零代码

Anyone can contribute puzzles! Each puzzle is a single JSON file. No programming experience needed — just creativity and a love for math.

任何人都可以贡献题目！每道题是一个 JSON 文件。不需要编程经验——只需要创造力和对数学的热爱。

### L2: Add Adventures (YAML) — Creative Storytelling / 添加冒险故事（YAML）— 创意叙事

Adventures chain puzzles into narrative journeys. If you love writing stories that teach, this level is for you. Adventures are defined in YAML with branching paths and narrative elements.

冒险模式将题目串联成叙事旅程。如果你喜欢用故事来教学，这个层级适合你。冒险故事用 YAML 定义，支持分支路径和叙事元素。

### L3: Add Renderers (React Components) — Developers / 添加渲染器（React 组件）— 开发者

Create new interactive puzzle types with custom React components. This requires TypeScript/React experience and adherence to our education principles.

用自定义 React 组件创建新的互动题型。需要 TypeScript/React 经验，并遵循我们的教育原则。

---

## Quick Start: Add Your First Puzzle in 5 Minutes / 5分钟贡献你的第一道题

### Step 1: Fork and clone / Fork 并克隆

```bash
git clone https://github.com/<your-username>/kids-math.git
cd kids-math
npm install
```

### Step 2: Create your puzzle file / 创建题目文件

Create a new JSON file in the appropriate module directory:

在对应模块目录下创建 JSON 文件：

```bash
# Example: a new symmetry puzzle for ages 6+
touch content/puzzles/symmetry/my-butterfly-puzzle.json
```

### Step 3: Write the puzzle JSON / 编写题目 JSON

```json
{
  "id": "sym-butterfly-001",
  "module": "symmetry",
  "level": "L1",
  "ageGroup": "6+",
  "renderer": "mirror-draw",
  "title": {
    "zh": "蝴蝶的翅膀",
    "en": "Butterfly Wings"
  },
  "description": {
    "zh": "帮蝴蝶画出另一半翅膀！",
    "en": "Help the butterfly draw its other wing!"
  },
  "puzzleData": {
    "referenceShape": [[0,0],[2,1],[1,3],[0,4]],
    "axisOfSymmetry": "vertical"
  },
  "hints": [
    {
      "zh": "想一想：如果把纸沿中间折起来，两边会重合吗？",
      "en": "Think: if you fold the paper along the middle, would both sides match?"
    },
    {
      "zh": "试试从最上面的点开始，它在另一边的什么位置？",
      "en": "Try starting from the top point — where would it be on the other side?"
    },
    {
      "zh": "每个点到中线的距离，在另一边是一样的哦！",
      "en": "Each point is the same distance from the center line on both sides!"
    }
  ],
  "solution": {
    "expectedShape": [[0,0],[-2,1],[-1,3],[0,4]]
  },
  "feedback": {
    "success": {
      "zh": "太棒了！你找到了对称的秘密！🦋",
      "en": "Amazing! You discovered the secret of symmetry! 🦋"
    },
    "encouragement": {
      "zh": "好思路！再试一次，注意每个点到中线的距离。",
      "en": "Great thinking! Try again — pay attention to each point's distance from the center line."
    }
  },
  "tags": ["visual", "hands-on", "nature"],
  "realWorldConnection": {
    "zh": "蝴蝶、雪花、建筑……对称在大自然和人类创造中无处不在！",
    "en": "Butterflies, snowflakes, buildings... symmetry is everywhere in nature and human creation!"
  }
}
```

### Step 4: Validate locally / 本地验证

```bash
npm run validate-content
```

### Step 5: Submit a pull request / 提交 PR

```bash
git checkout -b puzzle/sym-butterfly-001
git add content/puzzles/symmetry/my-butterfly-puzzle.json
git commit -m "Add butterfly symmetry puzzle (6+, L1)"
git push origin puzzle/sym-butterfly-001
```

Then open a Pull Request on GitHub using the **Content Contribution** template.

然后在 GitHub 上使用 **Content Contribution** 模板创建 Pull Request。

---

## Education Principles Checklist / 教育原则速查

Every contribution must follow these principles. Reviewers will check each one.

每个贡献都必须遵循以下原则。审核者会逐一检查。

### Must Have / 必须有 ✅

- **✅ hints >= 2 (scaffolding)** — At least 2 hints that progress from abstract to concrete. Hints should guide thinking, not give the answer. / 至少 2 个提示，从抽象到具体递进。提示应引导思考，而非直接给出答案。
- **✅ Growth mindset language** — Use phrases like "Great strategy!", "Interesting approach!", "You're getting closer!" instead of "You're smart!" or "Wrong!". / 使用"好策略！""有趣的想法！""越来越接近了！"等表达，而非"你真聪明！"或"错了！"。
- **✅ Bilingual content (zh + en)** — All user-facing text must have both Chinese and English versions. / 所有面向用户的文字必须有中英文版本。
- **✅ Real-world connections** — Each puzzle should connect to something in the real world that kids care about. / 每道题应与孩子们关心的现实事物建立联系。
- **✅ Multiple solution paths welcome** — If a puzzle can be solved different ways, celebrate that. / 如果一道题有多种解法，应该鼓励这一点。

### Must Not Have / 绝对禁止 ❌

- **❌ No timers** — Learning is not a race. / 学习不是竞赛。
- **❌ No rankings or leaderboards** — We don't compare children. / 我们不比较孩子。
- **❌ No punishment for errors** — Errors are learning opportunities. / 错误是学习机会。
- **❌ No negative sound effects** — No buzzer sounds, no "wrong" animations. / 没有蜂鸣器声音，没有"错误"动画。
- **❌ No external links** — All content must be self-contained for child safety. / 所有内容必须自包含，确保儿童安全。
- **❌ No personal data collection** — Never ask for or store personal information from children. / 绝不收集儿童个人信息。

---

## Review Process / 审核流程

Every contribution goes through a 3-tier review process:

每个贡献都经过 3 层审核：

### Tier 1: CI Auto-Validation / 自动化验证

When you submit a PR, GitHub Actions automatically:

提交 PR 时，GitHub Actions 自动执行：

- Validates JSON/YAML schema correctness / 验证 JSON/YAML 格式正确性
- Checks that all required fields are present / 检查所有必填字段
- Verifies i18n completeness (zh + en) / 验证国际化完整性
- Runs content safety checks / 运行内容安全检查
- Validates hint count (>= 2) / 验证提示数量

### Tier 2: Human Review / 人工审核

A maintainer reviews for:

维护者审核以下内容：

- **Math correctness** — Is the math right? Is the difficulty appropriate? / 数学正确性——数学是否正确？难度是否合适？
- **Pedagogy** — Do hints scaffold well? Is the feedback growth-mindset? / 教学法——提示是否循序渐进？反馈是否符合成长型思维？
- **Fun factor** — Would a kid actually enjoy this? / 趣味性——孩子会真正喜欢这道题吗？
- **Age appropriateness** — Is the 6+/9+ label correct? / 年龄适配——6+/9+ 标签是否正确？
- **Safety** — No external links, no personal data, appropriate content. / 安全性——没有外部链接、个人数据，内容适当。

### Tier 3: Runtime Monitoring / 运行时监测

After merge, we monitor:

合并后，我们监测：

- Completion rates — Are kids able to finish the puzzle? / 完成率——孩子们能完成这道题吗？
- Hint usage patterns — Are hints being used effectively? / 提示使用模式——提示是否被有效使用？
- Drop-off points — Where do kids give up? / 放弃点——孩子们在哪里放弃？
- Feedback signals — Emoji reactions, replay rates. / 反馈信号——表情反应、重玩率。

---

## Development Setup / 开发环境

```bash
# Install dependencies / 安装依赖
npm install

# Start dev server / 启动开发服务器
npm run dev

# Run tests / 运行测试
npm test

# Validate content / 验证内容
npm run validate-content

# Lint / 代码检查
npm run lint
```

---

## Commit Message Convention / 提交信息规范

```
puzzle: add butterfly symmetry (6+, L1)
adventure: add fraction-quest chapter 2
renderer: add tangram renderer
fix: correct hint text in geo-circle-001
i18n: add English translation for sequence module
docs: update contributing guide
```

---

## Questions? / 有问题？

- Open a GitHub Discussion / 在 GitHub Discussions 中提问
- Check existing issues for similar ideas / 查看已有 issue 是否有类似想法

We're excited to have you here. Let's make math magical for every child! 🐻

我们很高兴你加入。让我们一起为每个孩子创造数学的魔力！🐻
