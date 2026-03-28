# CLAUDE.md — EurekaCub 🐻 儿童互动科学探索平台
# 本文件是所有 Agent 的唯一入口。开始任何工作前必须先读这个文件。

---

## ⛔ 开发流程门禁（MANDATORY — 违反即终止）

**本项目遵循 4-Gate 强制开发流程。任何需求变更、新功能、bug fix 都必须走此流程。**
**模板位置**: `~/SecondBrain/templates/PRD_TEMPLATE.md` / `ITERATION_PLAN_TEMPLATE.md`

| Gate | 名称 | 通过条件 | 产出物 |
|------|------|---------|--------|
| GATE-1 | PRD 审批 | 用户说"approved/批准" | `docs/PRD-{name}.md` |
| GATE-2 | ITERATION_PLAN 确认 | 用户说"开始开发/go" | `ITERATION_PLAN_{name}.md` |
| GATE-3 | 开发+QA | QA 门禁全部通过 | 代码+测试 |
| GATE-4 | 交付验收 | PRD 验收标准逐项确认 | CHANGELOG+版本号 |

**违规**: 没有 PRD 就写代码 = 违规。PLAN 未确认就开发 = 违规。自行添加计划外功能 = 违规。
**例外**: 用户说"hotfix/紧急修复"可跳过 GATE-1/2（开发后补）；纯文档变更免流程；"prototype/试一下"不合入主分支。

---

## ⛔ QA 测试铁律（MANDATORY）

**所有测试代码和测试用例必须基于 PRD (`docs/PRD-kids-math-v1.md`) 中的功能需求 (FR) 和非功能需求 (NFR)。**

| 规则 | 说明 |
|------|------|
| **QA-1: 需求可追溯** | 每个测试用例必须标注对应的 FR-xx 或 NFR-xx 编号。无需求来源的测试不应存在 |
| **QA-2: 需求全覆盖** | PRD 中每个 FR/NFR 的验收标准必须有至少一个对应的测试用例 |
| **QA-3: 清单同步** | 功能变动时，`docs/TEST_CHECKLIST.md` 必须同步更新。新增功能→新增测试项；删除功能→删除测试项；修改功能→修改测试项 |
| **QA-4: 清单为准** | `docs/TEST_CHECKLIST.md` 是测试覆盖的唯一可信来源(Single Source of Truth)。写测试前先查清单，写完测试后更新清单覆盖状态 |
| **QA-5: 禁止无源测试** | 不得编写与 PRD 无关的"凑覆盖率"测试。如发现测试无法对应任何 FR/NFR，应评估是否需要补充 PRD |
| **QA-6: QA 通过 ≠ 现有测试通过** | "QA 通过"的唯一标准是 `TEST_CHECKLIST.md` 中 **所有测试项均为 ✅**（❌ 未覆盖项 = 0）。仅仅"已有测试全绿"不得宣称 QA 通过。报告时必须注明：总项数 / ✅ 已自动化 / 🔧 已手动验证 / ❌ 未覆盖 |
| **QA-7: 未覆盖阻断交付** | GATE-3 (开发+QA) 通过的前提：TEST_CHECKLIST 中 ❌ 项为 0。存在 ❌ 项时，必须先补测试或与用户确认降级为 🔧 手动验证，不得跳过 |

**违规**: 写测试代码前没有查阅 PRD 和 TEST_CHECKLIST = 违规。功能变动后没有更新 TEST_CHECKLIST = 违规。❌ 项 > 0 时宣称"QA 通过" = 违规。

---

## 项目概览

**EurekaCub** 🐻 — 开源儿童互动科学探索平台
- **项目名**: EurekaCub（Eureka 发现的惊叹 + Cub 小熊崽 = 小科学家发现世界）
- **目标用户**: 四年级(9岁) + 一年级(6岁) 小朋友；开源面向全球家庭
- **设计理念**: 超越年龄但可理解，不教公式而是玩着理解本质；开源社区共建
- **位置**: `~/Workspace/kids-math/`
- **GitHub**: `mypinseeker/eurekacub`
- **状态**: ✅ **v1.0.0 发布** (2026-03-28) — 4 迭代全部完成，GATE-4 交付
- **PRD**: `docs/PRD-kids-math-v1.md` (v1.1, 8 模块 + 17 冒险 + 7 附录 + 开源架构 + 审核机制)
- **技术栈**: React 19 + Vite + TypeScript 5 + Canvas/SVG + Tailwind + Framer Motion + Supabase
- **架构**: 插件化渲染器 + 标准化内容格式(JSON/YAML) + CI审核管线 + Supabase内容热更新
- **开源模型**: L1出题者(JSON) + L2故事家(YAML) + L3开发者(React组件) — 三层贡献 + 三道审核防线
- **教育理论**: 10 大理论基座 (Piaget/Vygotsky/Bruner/Montessori/Papert/Flow/Dweck/Gardner/探究学习/自我决定)
- **许可证**: MIT
