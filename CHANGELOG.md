# Changelog

All notable changes to EurekaCub are recorded here. Dates are in America/Panama time.

The project had no changelog before this entry, so it starts at the `v1.0.0` tag (`f3693b9`).

## [Unreleased]

Not yet released or deployed, so no version number yet. Per the project's GATE-4, a version is
cut only after the build is deployed and a child has played it (PRD-content-gaps A7). Both are
currently blocked on Vercel credentials (see `docs/PRD-content-gaps-v1.md` A.9).

### Added — content gaps v1 (`docs/PRD-content-gaps-v1.md`, `ITERATION_PLAN_content-gaps-v1.md`)

- **Fraction L4, "Same Amount" (一样多)** — the left pizza comes cut and shaded; the child cuts the
  right pizza finer and shades the same amount. On success, the child's slices are reassembled and
  slide across to cover the left pizza's shading exactly, so the picture itself proves the amounts
  are equal. There are three rounds, 1/2 = 2/4, 1/3 = 2/6 and 2/4 = 4/8, and no fraction is ever
  written on screen.
- **Symmetry L4, "Slide It" (平移魔法)** — draw a shape where the arrow says it lands. Tracing the
  original in place does not count.
- **Symmetry L5, "Spin It" (旋转风车)** — trace one blade of a pinwheel; the board adds the turned
  copies live. There are three rounds, with 2-, 3- and 4-fold symmetry.
- **Module pages list levels from the level table** instead of three hard-coded cards. A level with
  no title now fails a test instead of silently showing "Challenge Master".

### Fixed

- **The "Aha!" popup swallowed taps.** Its card sat over the middle of the play area for about
  3.4 seconds after the first success and absorbed any tap that landed on it. A child who pressed
  "Next" and started straight away lost cuts or strokes. The E2E suite found it on the second round
  of fraction L4; the mirror game had the same exposure.
- **The Slide It and Spin It boards were only 150 px tall.** The board's wrapper had no definite
  height, so the canvas kept its browser default of 150 px on every screen. Shapes live in a
  centred square, so a child had a 150 × 150 px area to draw in, and on phones the Spin It blade
  covered the instructions. The board is now `min(65vh, 560px)` tall: a 358 px square on a
  390 × 844 phone. Found by measuring the live site. The mirror levels (L1–L3) have the same
  150 px board and were left unchanged; see PRD-content-gaps A.10.
- Earlier fixes on the way to this release, each detailed in PRD-content-gaps Appendix A:
  - all eight renderers white-screened when Start was pressed (a Rules-of-Hooks violation);
  - four modules' level configs were silently ignored, and two crashed;
  - none of the three matrix levels was playable: L1 could not be solved, L2 and L3 were won in one press;
  - the sequence adventures had unwinnable blanks;
  - SpeedController kept the previous theme's backdrop after a theme switch;
  - CI had been red since 2026-03-29: lint errors, plus tests that only passed on Node ≥ 21.

### Changed

- CI now runs on Node 22, the version used for development.
- `CONTRIBUTING.md` no longer advertises two contribution paths that do not reach the game:
  `content/puzzles/` (L1) and `content/adventures/` (L2). Tripwire tests now fail if either
  directory grows or gets imported.
