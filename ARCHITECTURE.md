# Exercise App – Architecture Reference

## Stack
React + Vite, KaTeX for math, plain SVG components. No state management library.
Deployed to GitHub Pages via `.github/workflows/deploy.yml` (push to `master` → build → deploy).

---

## Exercise Definition Format

Each exercise is a plain JS object exported from `src/exercises/exercise<id>.js`.

```js
export const exerciseXX = {
  id: 'exXX',
  title: 'Uppgift XX – ...',

  // Optional: computed fields merged into params before rendering.
  // Keeps all calculations in one place; steps read from p.fieldName.
  derive: (p) => {
    const R_A = ...
    return { R_A, M_Ed, d, mu, ... }
  },

  params: {
    L: 9,          // raw inputs
    ...concrete,   // spread from data files
    ...rebar,
  },

  problem: {
    description: 'String shown at top.',
    figures: [                          // array or function (p) => array
      { type: 'beam',          props: { L, supports, loads, divisions? } },
      { type: 'rect-section',  props: { b, h, rebars?, fillColor? } },
      { type: 'ipe-section',   props: { h, b, tf, tw } },
      { type: 'glulam-section',props: { b, h, laminationThickness? } },
      { type: 'moment-diagram',props: { L, supports?, udl?, pointLoads?, divisions?, showShear? } },
    ],
    givenData: [{ name, symbol, value, unit }],
  },

  steps: [
    {
      id: 'stepId',           // used as key in answers state
      title: 'Step title',
      question: 'Question text.',
      answer: {
        label: 'LaTeX label',
        unit: 'kN',
        getCorrect: (p, answers) => number,   // answers = previously submitted values
        hint: 'Hint string.',
      },
      resultCheck: (p, answers) => ({         // optional, shown after correct answer
        ok: boolean,
        latex: 'LaTeX result string',
      }),
      solution: [
        { text: 'Plain text or (p) => string' },
        { latex: 'LaTeX or (p) => string', latexBlock: true },
        { figure: { type: '...', props: { ... } } },  // any registered figure type
      ],
    },
  ],
}
```

Register in `src/exercises/index.js`:
```js
export const exercises = { '23': exercise23, '26a': exercise26a, ... }
```

---

## Data Files (`src/data/`)

| File | Exports | Key fields |
|---|---|---|
| `materials.js` | `CONCRETE`, `REBAR`, `STEEL`, `GLULAM`, `TIMBER`, `LOAD_FACTORS`, `SAFETY_CLASS` | fck/fcd/fctm/Ecm/gamma_btg/CRdc (concrete); fyk/fyd/Es (rebar/steel); fcd/fvd (glulam) |
| `ipe-sections.js` | `IPE_SECTIONS` | h, b, tf, tw, R, A, Aw, Wy, Zy, Iy, g for IPE80–IPE600 |

Usage: `const concrete = CONCRETE['C30']` then `...concrete` in params.

---

## Component Tree

```
App.jsx                        – index page + hash-based routing (#26a → ExerciseShell)
└── ExerciseShell.jsx          – merges derive(params) into params; holds answers state
    ├── FigureRenderer.jsx     – maps { type, props } to SVG component
    └── StepModule.jsx         – one answer + result badge + solution per step
        ├── AnswerField.jsx    – text input with ±10% tolerance check; calls onCorrect(value)
        └── SolutionPanel.jsx  – collapsible; passes params down
            └── SolutionStep.jsx – renders text/latex/figure; resolves fn(p) if needed
```

---

## Shared SVG Components (`src/components/svg/`)

### `BeamSVG`
Props: `L`, `supports { left, right }`, `loads[]`, `divisions?`

Load types: `{ type:'udl', label, color?, xStart?, xEnd? }` — xStart/xEnd as 0–1 fractions
            `{ type:'point', label, x, color? }` — x as 0–1 fraction

Support types: `'pin'`, `'roller'`, `'fixed'`, `'free'`

### `MomentDiagramSVG`
Props: `L`, `supports?`, `udl[]`, `pointLoads[]`, `divisions?`, `showShear?`

Coordinates: **metres** (not fractions). Handles simply supported and cantilevers.
- `{ left:'pin', right:'roller' }` → simply supported (default)
- `{ left:'fixed', right:'free' }` → left cantilever
- `{ left:'free', right:'fixed' }` → right cantilever

Positive M (sagging) plots downward; negative M (hogging) plots upward. Layout is dynamic.

### `RectSection`
Props: `b`, `h`, `fillColor?`, `rebars?` — rebars as `[{ x, y }]` with 0–1 fractions from bottom-left

### `IPESection`
Props: `h`, `b`, `tf`, `tw` — renders I-beam with dimension labels

### `GlulamSection`
Props: `b`, `h`, `laminationThickness?` (default 45 mm) — alternating lamination bands

---

## Key Patterns

### `derive(p)` — pre-computed params
`ExerciseShell` merges `exercise.derive(exercise.params)` into the params object passed to all components. Use for intermediate values shared across multiple steps (R_A, M_Ed, d, μ, ω, …).

### Answer propagation
`answers` state lives in `ExerciseShell` and is passed to every `StepModule`. `getCorrect(p, answers)` and `resultCheck(p, answers)` can read previously submitted step values via `answers.stepId`.

### Solution lambdas
`text` and `latex` in solution steps accept either a plain string or a function `(p) => string`. `p` is the enriched params (including derived values). Use functions to embed computed numbers:
```js
{ latex: (p) => `R_A = ${p.R_A} \\ \\text{kN}`, latexBlock: true }
```

### Figure in solution
```js
{ figure: { type: 'moment-diagram', props: { L: 9, udl: [...], ... } } }
```
Any registered figure type works inside a solution step.

---

## Exercises Implemented

| ID | Title | Material | Key formula |
|---|---|---|---|
| 26a | Tvärkraft, stål IPE360 | Steel S235 | V_Rd = A_w · f_yd / √3 |
| 26b | Tvärkraft, limträ GL30c | Glulam | V_Rd = b_e · h · f_vd / 1.5 |
| 26c | Tvärkraft, armerad betong C30 | RC | EN 1992 eq 6.2 |
| 23  | Böjmomentsdimensionering, betong C30 | RC | EC2 rectangular stress block |
