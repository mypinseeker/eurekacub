## 🔌 New Renderer Contribution

**Renderer ID**: <!-- e.g., mirror-draw, tangram, fraction-bar -->

**Description**: <!-- What type of puzzle does this renderer support? -->

**Module(s)**: <!-- Which math module(s) will use this renderer? -->

### What it does

<!-- Describe the interaction model. How does a child interact with this renderer? -->

### Screenshots / GIFs

<!-- Add screenshots or GIFs showing the renderer in action. Include both desktop and tablet views if possible. -->

---

### Checklist

#### Registration & Integration
- [ ] Registered via `registry.ts` with unique renderer ID
- [ ] `puzzleSchema` provided — JSON Schema that validates puzzle data for this renderer
- [ ] At least 3 example puzzles in `content/` that use this renderer
- [ ] `README.md` in renderer directory explaining usage and puzzle data format

#### Safety & Compliance
- [ ] No external network requests — renderer is fully self-contained
- [ ] No collection or storage of personal data
- [ ] No timers, rankings, or punishment mechanics
- [ ] Follows education principles (growth mindset language, scaffolded hints)
- [ ] No negative sound effects for incorrect attempts

#### UX & Accessibility
- [ ] Touch-friendly — works on tablets (minimum tap target 44x44px)
- [ ] Responsive — works on screens from 320px to 1024px wide
- [ ] Keyboard accessible — can be used without a mouse
- [ ] Visual feedback is clear and encouraging
- [ ] Animations are smooth and can be reduced (respects `prefers-reduced-motion`)

#### Code Quality
- [ ] TypeScript — no `any` types, proper interfaces defined
- [ ] Unit tests — renderer logic is tested
- [ ] No console.log or debug artifacts
- [ ] Bundle size impact documented (renderer should be code-split / lazy-loaded)

#### Reviews
- [ ] Code review passed — at least one maintainer approved
- [ ] Education review passed — content follows pedagogy principles
